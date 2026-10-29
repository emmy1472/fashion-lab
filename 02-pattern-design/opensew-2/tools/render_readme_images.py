# Re-render the README outfit stills:
#
#   docs/casual_man.png     the male avatar in Casual, front and three-quarter
#   docs/casual_woman.png   the female avatar in the same
#
#   blender -b --python tools/render_readme_images.py            # both
#   blender -b --python tools/render_readme_images.py -- man     # one figure
#
# Each figure is a separate file so the two can be re-rendered and reviewed
# independently. Everything the picture shows comes from the add-on's own
# workflow: Add Outfit sews and finishes it, and only the fabric colours and
# the studio lighting are set here.
import bpy, os, sys, math
import numpy as np
from mathutils import Vector, Euler

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(REPO, "docs")
PANEL_W, PANEL_H = 700, 1100
PORCELAIN = (0.80, 0.79, 0.78)
TROUSERS = (0.42, 0.48, 0.60)
TOP = (0.89, 0.88, 0.86)
# deep enough to separate from the trousers: a jacket in the same tone as
# the bottoms reads as one garment and hides the layering the picture is for
JACKET = {'MAN': (0.15, 0.18, 0.29), 'WOMAN': (0.78, 0.55, 0.50)}


def plain(name, rgb, rough=0.85):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
    bsdf.inputs["Roughness"].default_value = rough
    if "Sheen Weight" in bsdf.inputs:
        bsdf.inputs["Sheen Weight"].default_value = 0.3
    nt.links.new(bsdf.outputs[0], out.inputs[0])
    return mat


def fresh():
    bpy.ops.wm.read_homefile(use_empty=True)
    bpy.ops.preferences.addon_enable(module="clothing_design")
    scn = bpy.context.scene
    scn.render.engine = 'CYCLES'
    scn.cycles.samples = 96
    scn.cycles.use_denoising = True
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for backend in ("OPTIX", "CUDA", "HIP", "METAL"):
        try:
            prefs.compute_device_type = backend
            prefs.get_devices()
            if any(d.type == backend for d in prefs.devices):
                scn.cycles.device = 'GPU'
                for d in prefs.devices:
                    d.use = d.type != 'CPU'
                break
        except Exception:
            continue
    scn.render.resolution_x = PANEL_W
    scn.render.resolution_y = PANEL_H
    world = bpy.data.worlds.new("W")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (0, 0, 0, 1)
    bg.inputs[1].default_value = 0.0
    scn.world = world


def light(name, loc, rot, energy, size=5.0):
    li = bpy.data.lights.new(name, 'AREA')
    li.energy = energy
    li.size = size
    ob = bpy.data.objects.new(name, li)
    ob.location = loc
    ob.rotation_euler = rot
    bpy.context.scene.collection.objects.link(ob)


def visible_points():
    dg = bpy.context.evaluated_depsgraph_get()
    out = []
    for ob in bpy.context.scene.objects:
        if ob.type != 'MESH' or ob.hide_render:
            continue
        ev = ob.evaluated_get(dg)
        mw = ev.matrix_world
        out += [mw @ v.co for v in ev.data.vertices]
    return out


def render_panel(path, yaw_deg, pts, margin=1.10):
    scn = bpy.context.scene
    cam = scn.objects.get("Cam")
    if cam is None:
        cd = bpy.data.cameras.new("Cam")
        cd.lens = 60
        cam = bpy.data.objects.new("Cam", cd)
        scn.collection.objects.link(cam)
        scn.camera = cam
    ctr = sum(pts, Vector()) / len(pts)
    yaw = math.radians(yaw_deg)
    cam.location = ctr + Vector((math.sin(yaw), -math.cos(yaw), 0.0)) * 5.0
    cam.rotation_euler = Euler((math.pi / 2, 0.0, yaw))
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    loc, _ = cam.camera_fit_coords(dg, [x for p in pts for x in p])
    cam.location = ctr + (loc - ctr) * margin
    bpy.context.view_layer.update()
    scn.render.filepath = path
    bpy.ops.render.render(write_still=True)


def stitch(paths, out_path):
    """Lay the panels side by side. Blender ships numpy, so no PIL needed."""
    tiles = []
    for p in paths:
        img = bpy.data.images.load(p)
        w, h = img.size
        buf = np.empty(w * h * 4, dtype=np.float32)
        img.pixels.foreach_get(buf)
        tiles.append(buf.reshape(h, w, 4))
        bpy.data.images.remove(img)
    h = max(t.shape[0] for t in tiles)
    total_w = sum(t.shape[1] for t in tiles)
    canvas = np.zeros((h, total_w, 4), dtype=np.float32)
    canvas[:, :, 3] = 1.0
    x = 0
    for t in tiles:
        canvas[:t.shape[0], x:x + t.shape[1]] = t
        x += t.shape[1]
    out = bpy.data.images.new("stitched", total_w, h, alpha=False)
    out.pixels.foreach_set(canvas.reshape(-1))
    out.filepath_raw = out_path
    out.file_format = 'PNG'
    out.save()
    bpy.data.images.remove(out)
    print("wrote %s (%dx%d)" % (out_path, total_w, h))


def casual(figure, tag):
    fresh()
    bpy.ops.cd.import_character(figure=figure)
    bpy.ops.cd.add_outfit('EXEC_DEFAULT',
                          outfit=('M_CASUAL' if figure == 'MAN' else 'W_CASUAL'),
                          sew_now=True)
    scn = bpy.context.scene
    for ob in scn.objects:
        if ob.type == 'MESH' and ob.cd.is_pattern:
            ob.hide_render = True

    skin = bpy.data.materials.get("CD_Avatar_Skin")
    if skin and skin.use_nodes:
        for n in skin.node_tree.nodes:
            if n.type == 'BSDF_PRINCIPLED':
                n.inputs["Base Color"].default_value = (*PORCELAIN, 1.0)
                n.inputs["Roughness"].default_value = 0.55

    for ob in scn.objects:
        if not (ob.type == 'MESH' and ob.cd.is_garment):
            continue
        name = ob.cd.garment.lower()
        if "jacket" in name or "hoodie" in name:
            mat = plain("Doc_Outer_" + figure, JACKET[figure])
        elif "trouser" in name or "skirt" in name:
            mat = plain("Doc_Bottom", TROUSERS)
        else:
            mat = plain("Doc_Top", TOP)
        ob.data.materials.clear()
        ob.data.materials.append(mat)

    pts = visible_points()
    c = sum(pts, Vector()) / len(pts)
    light("Key", (c.x - 2.5, c.y - 3.5, c.z + 1.6),
          Euler((math.radians(65), 0, math.radians(-35))), 900)
    light("Fill", (c.x + 3.0, c.y - 2.5, c.z + 0.6),
          Euler((math.radians(78), 0, math.radians(50))), 550)
    light("Front", (c.x, c.y - 4.0, c.z), Euler((math.radians(90), 0, 0)), 250, 8.0)
    light("Rim", (c.x, c.y + 3.5, c.z + 2.0),
          Euler((math.radians(-60), 0, math.pi)), 500)

    tmp = [os.path.join(DOCS, "_%s_front.png" % tag),
           os.path.join(DOCS, "_%s_quarter.png" % tag)]
    render_panel(tmp[0], 0, pts)
    render_panel(tmp[1], 30, visible_points())
    stitch(tmp, os.path.join(DOCS, "casual_%s.png" % tag))
    for p in tmp:
        try:
            os.remove(p)
        except OSError:
            pass


which = sys.argv[sys.argv.index("--") + 1].lower() if "--" in sys.argv else "all"
if which in ("all", "man"):
    casual('MAN', "man")
if which in ("all", "woman"):
    casual('WOMAN', "woman")
print("done")
