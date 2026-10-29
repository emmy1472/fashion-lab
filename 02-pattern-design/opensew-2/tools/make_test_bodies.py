# Generate a spread of test bodies for tests/test_bodies.py.
#
#   blender -b --python tools/make_test_bodies.py        (needs the MPFB extension)
#
# The add-on's promise is that it drafts to whatever body it is given, so the
# test set deliberately spans the range that breaks drafting assumptions:
# short and full, tall and slim, heavy, muscular, young and old. They are
# written to tests/bodies/ and are not committed - regenerate them locally.
import bpy, os, sys, importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
OUT = os.path.join(REPO, "tests", "bodies")
os.makedirs(OUT, exist_ok=True)

# reuse the shipping avatar builder so test bodies go through the same pipeline
spec = importlib.util.spec_from_file_location(
    "mkav", os.path.join(HERE, "make_default_avatars.py"))

BODIES = {
    # name              gender  weight  height  muscle  props  cup
    "f_short_full":    (0.0,    0.72,   0.30,   0.45,   0.45,  0.70),
    "f_tall_slim":     (0.0,    0.28,   0.80,   0.50,   0.70,  0.35),
    "f_mid":           (0.0,    0.50,   0.52,   0.50,   0.55,  0.55),
    "m_short_heavy":   (1.0,    0.78,   0.28,   0.45,   0.45,  0.50),
    "m_tall_lean":     (1.0,    0.30,   0.82,   0.55,   0.70,  0.50),
    "m_muscular":      (1.0,    0.55,   0.55,   0.85,   0.60,  0.50),
}


def build_one(name, gender, weight, height, muscle, props, cup, mod):
    bpy.ops.wm.read_homefile(use_empty=True)
    macro = {"gender": gender, "age": 0.5, "muscle": muscle, "weight": weight,
             "proportions": props, "height": height, "cupsize": cup,
             "firmness": 0.5,
             "race": {"asian": 0.33, "caucasian": 0.33, "african": 0.33}}
    body = mod.HumanService.create_human(
        mask_helpers=False, detailed_helpers=True, extra_vertex_groups=True,
        feet_on_ground=True, scale=0.1, macro_detail_dict=macro)
    rig = mod.HumanService.add_builtin_rig(body, "mixamo", import_weights=True)
    mod.bake_shape_keys(body)
    mod.delete_helpers(body)
    mod.prune_groups(body)
    mod.pose_arms_out(body, rig)
    mod.feet_on_floor(body, rig)
    body.data.materials.clear()
    body.data.materials.append(mod.plain("CD_Avatar_Skin", (0.62, 0.47, 0.38)))
    body.name = body.data.name = "CD_Body_" + name
    rig.name = rig.data.name = "CD_Rig_" + name
    for holder in (body, body.data, rig, rig.data):
        for k in list(holder.keys()):
            del holder[k]
    body["cd_figure"] = 'MAN' if gender > 0.5 else 'WOMAN'
    mod.clean_scene({body, rig})
    path = os.path.join(OUT, name + ".blend")
    bpy.ops.wm.save_as_mainfile(filepath=path, compress=True, copy=True)
    print("body %-14s %d KB" % (name, os.path.getsize(path) // 1024))


mod = importlib.util.module_from_spec(spec)
sys.modules["mkav"] = mod
spec.loader.exec_module(mod)          # builds the two shipping avatars too
for name, args in BODIES.items():
    build_one(name, *args, mod=mod)
print("test bodies written to", OUT)
