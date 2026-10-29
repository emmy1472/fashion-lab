# Does the drafting hold up on bodies it was not tuned against?
#
#   blender -b --python tools/make_test_bodies.py     # once, needs MPFB
#   blender -b --python tests/test_bodies.py
#
# The add-on's whole claim is that it measures a body and drafts to it, so the
# thing worth testing is the spread: short and full, tall and slim, heavy,
# muscular. Everything checked here is relative to the body's own landmarks -
# no absolute sizes - because that is what "fits any body" has to mean.
import bpy, os, sys, glob, math
from mathutils import Vector

bpy.ops.preferences.addon_enable(module="clothing_design")
from clothing_design import avatar, build, sim

BODIES = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bodies")
PRESETS = [('TANK', 0.08), ('TSHIRT', 0.10), ('TROUSERS', 0.12), ('JACKET', 0.12)]
fails = []


def check(cond, msg):
    print(("    ok   " if cond else "    FAIL ") + msg)
    if not cond:
        fails.append(msg)


def load(path):
    bpy.ops.wm.read_homefile(use_empty=True)
    bpy.ops.preferences.addon_enable(module="clothing_design")
    with bpy.data.libraries.load(path, link=False) as (src, dst):
        dst.objects = list(src.objects)
    for ob in dst.objects:
        if ob is not None:
            bpy.context.scene.collection.objects.link(ob)
    body = max((o for o in bpy.context.scene.objects if o.type == 'MESH'),
               key=lambda o: len(o.data.vertices))
    ctx = bpy.context
    ctx.scene.cd.avatar = body
    ctx.scene.cd.facing = avatar.auto_facing(ctx, body)
    sim.ensure_collider(ctx, body)
    return ctx, body


def sleeve_reach(m, verts):
    a, f = m["limbs"].get("arm_l"), m["limbs"].get("farm_l")
    if not a or not f:
        return None
    p0, p1 = Vector(a["p0"]), Vector(f["p1"])
    ax = p1 - p0
    L = ax.length
    u = ax / L
    ts = sorted(((v - p0).dot(u) / L) for v in verts
                if -0.3 < (v - p0).dot(u) / L < 1.7
                and ((v - p0) - u * ((v - p0).dot(u))).length < 0.10)
    return ts[int(0.98 * (len(ts) - 1))] if len(ts) > 10 else None


files = sorted(glob.glob(os.path.join(BODIES, "*.blend")))
if not files:
    print("no test bodies in %s - run tools/make_test_bodies.py first" % BODIES)
    sys.exit(0)

for path in files:
    name = os.path.splitext(os.path.basename(path))[0]
    ctx, body = load(path)
    m = avatar.measure(ctx, force=True)
    if m is None:
        check(False, "%s: could not be measured" % name)
        continue
    z = {k: avatar.z_of(m, k) for k in ("shoulder", "chest", "waist", "hip", "knee", "ankle")}
    g = {k: avatar.girth_at(m, z[k]) for k in ("chest", "waist", "hip")}
    print("== %-14s %.0f cm  chest %.0f waist %.0f hip %.0f  figure %s"
          % (name, m["height"] * 100, g["chest"] * 100, g["waist"] * 100,
             g["hip"] * 100, m["figure_auto"]))

    # the landmarks have to be in anatomical order and sanely spaced, or every
    # block drafted from them is wrong however good the drafting code is
    check(z["shoulder"] > z["chest"] > z["waist"] > z["hip"] > z["knee"] > z["ankle"],
          "%s landmarks in order" % name)
    # sanity, not a spec: the shoulder joint sits above the fullest chest
    # section, but how far depends on the build - a full bust rides higher
    # than a flat chest, and the joint is below the acromion. Measured
    # across this set it runs 3-8 % of stature.
    check(0.015 < (z["shoulder"] - z["chest"]) / m["height"] < 0.20,
          "%s shoulder-to-chest %.1f%% of height"
          % (name, 100 * (z["shoulder"] - z["chest"]) / m["height"]))
    check(g["chest"] > g["waist"], "%s chest fuller than waist" % name)
    check(0.25 < avatar.neck_girth(m) / g["chest"] < 0.55,
          "%s neck/chest ratio %.2f" % (name, avatar.neck_girth(m) / g["chest"]))

    for preset, fit in PRESETS:
        ctx, body = load(path)
        m = avatar.measure(ctx, force=True)
        try:
            bpy.ops.cd.add_garment(preset=preset, fit=fit)
            bpy.ops.cd.sew()
        except Exception as e:
            check(False, "%s %s raised %s" % (name, preset, e))
            continue
        gob = build.garment_object(ctx, create=False)
        dg = ctx.evaluated_depsgraph_get()
        ev = gob.evaluated_get(dg)
        mw = ev.matrix_world
        vs = [mw @ v.co for v in ev.data.vertices]
        loose = sum(1 for e in gob.data.edges if e.is_loose)
        check(loose == 0, "%s %s all seams closed (%d open)" % (name, preset, loose))

        bvh = avatar.body_bvh(ctx)
        inside = 0
        for p in vs:
            hit = bvh.find_nearest(p)
            if hit and hit[0] is not None and (p - hit[0]).dot(hit[1]) < -0.004:
                inside += 1
        check(inside < len(vs) * 0.03,
              "%s %s %.1f%% inside the body" % (name, preset, 100.0 * inside / len(vs)))

        zs = avatar.z_of(m, "shoulder")
        if preset in ('TANK', 'TSHIRT', 'JACKET'):
            names = {vg.index: vg.name for vg in gob.vertex_groups}
            gi = [i for i, n in names.items() if "Sleeve" not in n]
            torso = [(mw @ v.co).z for v in ev.data.vertices
                     if any(gr.group in gi and gr.weight > 0.5 for gr in v.groups)]
            check(torso and max(torso) > zs,
                  "%s %s stays on the shoulders (top %+.0f mm)"
                  % (name, preset, (max(torso) - zs) * 1000 if torso else -999))
        if preset in ('TSHIRT', 'JACKET'):
            r = sleeve_reach(m, vs)
            check(r is not None and 0.25 < r < 1.25,
                  "%s %s sleeve reaches %.2f of the arm" % (name, preset, -1 if r is None else r))
        if preset == 'TROUSERS':
            check(min(p.z for p in vs) < avatar.z_of(m, "knee"),
                  "%s trousers reach past the knee" % name)

print("\n%d failure(s)" % len(fails))
for f in fails:
    print("  -", f)
sys.exit(1 if fails else 0)
