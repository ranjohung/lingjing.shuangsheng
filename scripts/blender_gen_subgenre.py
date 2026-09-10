# -*- coding: utf-8 -*-
"""Blender headless - v5.11 H1: 4 副题材角色 .glb（穿越阿萝/悬疑温衡/奇幻艾尔薇/科幻NX-07）"""
import bpy, sys, os, math

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else "F:/开发软件项目文件/灵境 · 双生/output/preview/models"
os.makedirs(OUT, exist_ok=True)

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for blk in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras):
        for b in list(blk):
            blk.remove(b, do_unlink=True)

def make_mat(name, color, rough=0.65, metal=0.0, emit_color=None, emit_strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    if b:
        b.inputs["Base Color"].default_value = (color[0], color[1], color[2], 1.0)
        b.inputs["Roughness"].default_value = rough
        b.inputs["Metallic"].default_value = metal
        try:
            if emit_color:
                b.inputs["Emission Color"].default_value = (emit_color[0], emit_color[1], emit_color[2], 1.0)
                b.inputs["Emission Strength"].default_value = emit_strength
        except Exception:
            pass
    return m

def smooth(obj):
    if obj.type == 'MESH':
        for p in obj.data.polygons:
            p.use_smooth = True
    return obj

def add_sphere(name, r, loc, scale=(1, 1, 1), mat=None):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=24, ring_count=16)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    if mat: o.data.materials.append(mat)
    return smooth(o)

def add_cyl(name, r1, r2, h, loc, rot=(0, 0, 0), mat=None, seg=20):
    bpy.ops.mesh.primitive_cone_add(radius1=r1, radius2=r2, depth=h, location=loc, rotation=rot, vertices=seg)
    o = bpy.context.active_object
    o.name = name
    if mat: o.data.materials.append(mat)
    return smooth(o)

def add_box(name, size, loc, rot=(0, 0, 0), scale=(1, 1, 1), mat=None):
    bpy.ops.mesh.primitive_cube_add(size=size, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    if mat: o.data.materials.append(mat)
    return o

def build_base(cfg):
    skin_m  = make_mat("Skin",  cfg["skin"], rough=0.55)
    cloth_m = make_mat("Cloth", cfg["cloth"], rough=0.75)
    hair_m  = make_mat("Hair",  cfg["hair"], rough=0.45)
    pants_m = make_mat("Pants", cfg.get("pants", (0.1, 0.1, 0.14)), rough=0.8)
    dark_m  = make_mat("Dark",  (0.04, 0.04, 0.06), rough=0.6)

    head = add_sphere("Head", 0.105, (0, 0, 1.58), scale=(0.95, 1.0, 1.1), mat=skin_m)
    add_sphere("EyeL", 0.013, (-0.038, -0.092, 1.60), mat=dark_m)
    add_sphere("EyeR", 0.013, ( 0.038, -0.092, 1.60), mat=dark_m)
    add_cyl("Neck", 0.038, 0.045, 0.10, (0, 0, 1.44), mat=skin_m)

    add_cyl("Torso", 0.135, 0.105, 0.42, (0, 0, 1.22), mat=cloth_m, seg=24)
    add_sphere("ShoulderL", 0.052, (-0.135, 0, 1.38), mat=cloth_m)
    add_sphere("ShoulderR", 0.052, ( 0.135, 0, 1.38), mat=cloth_m)
    add_cyl("Belt", 0.115, 0.115, 0.05, (0, 0, 1.02), mat=make_mat("Belt", cfg.get("belt", (0.15, 0.1, 0.08)), rough=0.5))

    for side, sx in (("L", -1), ("R", 1)):
        add_cyl(f"UpperArm{side}", 0.036, 0.032, 0.26, (sx * 0.16, 0, 1.28), rot=(0, 0, sx * 0.12), mat=cloth_m)
        add_cyl(f"ForeArm{side}", 0.030, 0.026, 0.24, (sx * 0.215, -0.01, 1.05), rot=(0, 0, sx * 0.06), mat=skin_m)
        add_sphere(f"Hand{side}", 0.032, (sx * 0.235, -0.02, 0.92), scale=(0.8, 1.1, 1.0), mat=skin_m)

    if cfg.get("skirt"):
        skirt_m = make_mat("Skirt", cfg["skirt"], rough=0.8)
        add_cyl("Skirt", 0.115, 0.24, 0.42, (0, 0, 0.78), mat=skirt_m, seg=24)
    for side, sx in (("L", -1), ("R", 1)):
        add_cyl(f"Thigh{side}", 0.055, 0.048, 0.34, (sx * 0.065, 0, 0.58), mat=cloth_m)
        add_cyl(f"Shin{side}", 0.045, 0.036, 0.34, (sx * 0.065, 0, 0.23), mat=pants_m if not cfg.get("skirt") else skin_m)
        add_box(f"Foot{side}", 0.1, (sx * 0.065, -0.03, 0.03), scale=(0.9, 1.6, 0.5), mat=make_mat("Shoe", cfg.get("shoe", (0.08, 0.08, 0.1)), rough=0.4))

    return skin_m, cloth_m, hair_m

def add_hair(cfg, hair_m):
    style = cfg.get("hair_style", "short")
    if style == "tangbuns":       # 阿萝：双丫髻 + 金饰
        add_sphere("HairCap", 0.113, (0, 0.006, 1.635), scale=(0.98, 1.02, 1.05), mat=hair_m)
        add_sphere("BunL", 0.05, (-0.095, -0.01, 1.70), mat=hair_m)
        add_sphere("BunR", 0.05, ( 0.095, -0.01, 1.70), mat=hair_m)
        gold = make_mat("Gold", (0.9, 0.75, 0.35), rough=0.25, metal=0.9)
        add_box("HairOrnL", 0.04, (-0.095, -0.05, 1.72), rot=(0, 0, 0.4), scale=(1, 0.3, 0.5), mat=gold)
        add_box("HairOrnR", 0.04, ( 0.095, -0.05, 1.72), rot=(0, 0, -0.4), scale=(1, 0.3, 0.5), mat=gold)
        add_cyl("FringeC", 0.1, 0.095, 0.06, (0, -0.055, 1.66), rot=(0.3, 0, 0), mat=hair_m)
    elif style == "republic":     # 温衡：三七分短发 + 圆框眼镜
        add_sphere("HairCap", 0.112, (0, 0.006, 1.634), scale=(0.99, 1.02, 1.05), mat=hair_m)
        add_cyl("SidePartL", 0.055, 0.03, 0.16, (-0.07, -0.03, 1.60), rot=(0.1, 0, 0.25), mat=hair_m)
        add_cyl("FringeW", 0.1, 0.092, 0.07, (0, -0.058, 1.655), rot=(0.35, 0, 0), mat=hair_m)
        glass = make_mat("Glass", (0.7, 0.72, 0.75), rough=0.1, metal=0.6)
        add_cyl("LensL", 0.03, 0.03, 0.008, (-0.04, -0.102, 1.60), rot=(1.5708, 0, 0), mat=glass, seg=16)
        add_cyl("LensR", 0.03, 0.03, 0.008, ( 0.04, -0.102, 1.60), rot=(1.5708, 0, 0), mat=glass, seg=16)
        add_cyl("Bridge", 0.004, 0.004, 0.045, (0, -0.102, 1.60), rot=(0, 1.5708, 0), mat=glass, seg=8)
    elif style == "elflong":      # 艾尔薇：银绿长发 + 精灵尖耳 + 叶冠
        add_sphere("HairCap", 0.115, (0, 0.008, 1.635), scale=(1.0, 1.04, 1.08), mat=hair_m)
        add_cyl("ElfHairL", 0.045, 0.018, 0.80, (-0.085, 0.03, 1.24), mat=hair_m)
        add_cyl("ElfHairR", 0.045, 0.018, 0.80, ( 0.085, 0.03, 1.24), mat=hair_m)
        add_cyl("ElfHairB", 0.06, 0.025, 0.9, (0, 0.09, 1.22), mat=hair_m)
        skin = make_mat("EarSkin", cfg["skin"], rough=0.55)
        add_cyl("EarL", 0.008, 0.028, 0.09, (-0.105, -0.02, 1.62), rot=(0, 0, -0.9), mat=skin, seg=10)
        add_cyl("EarR", 0.008, 0.028, 0.09, ( 0.105, -0.02, 1.62), rot=(0, 0, 0.9), mat=skin, seg=10)
        leaf = make_mat("Leaf", (0.2, 0.6, 0.3), rough=0.5, emit_color=(0.2, 0.8, 0.4), emit_strength=0.4)
        for i in range(3):
            a = -0.5 + i * 0.5
            add_box(f"Leaf{i}", 0.05, (math.sin(a) * 0.1, -0.04, 1.70 + i * 0.008), rot=(0, 0, a), scale=(1, 0.25, 0.4), mat=leaf)
    elif style == "android":      # NX-07：银白齐颌发 + 颈部光环路
        add_sphere("HairCap", 0.115, (0, 0.008, 1.635), scale=(1.0, 1.05, 1.06), mat=hair_m)
        add_cyl("BobL", 0.05, 0.032, 0.24, (-0.095, -0.02, 1.53), rot=(0.06, 0, 0.05), mat=hair_m)
        add_cyl("BobR", 0.05, 0.032, 0.24, ( 0.095, -0.02, 1.53), rot=(0.06, 0, -0.05), mat=hair_m)
        add_cyl("FringeN", 0.1, 0.094, 0.06, (0, -0.056, 1.66), rot=(0.32, 0, 0), mat=hair_m)
        circ = make_mat("Circuit", (0.05, 0.25, 0.35), rough=0.2, emit_color=(0.2, 0.85, 1.0), emit_strength=2.5)
        add_cyl("NeckCirc", 0.046, 0.046, 0.012, (0, -0.02, 1.44), mat=circ, seg=16)
        add_box("Badge", 0.03, (0.10, -0.13, 1.32), scale=(1, 0.3, 0.6), mat=circ)
    else:
        add_sphere("HairCap", 0.111, (0, 0.006, 1.632), scale=(0.98, 1.0, 1.02), mat=hair_m)
        add_cyl("Fringe", 0.1, 0.095, 0.06, (0, -0.055, 1.66), rot=(0.3, 0, 0), mat=hair_m)

def add_props(cfg):
    if cfg.get("weapon") == "roundfan":   # 阿萝：团扇
        silk = make_mat("FanSilk", (0.85, 0.55, 0.6), rough=0.6)
        add_cyl("FanFace", 0.11, 0.11, 0.008, (0.28, -0.14, 1.10), rot=(1.2, 0.3, 0), mat=silk, seg=24)
        add_cyl("FanHandle", 0.008, 0.008, 0.22, (0.30, -0.10, 0.98), rot=(0.3, 0, 0.35), mat=make_mat("FanGrip", (0.35, 0.2, 0.12), rough=0.6), seg=10)
    if cfg.get("weapon") == "pocketwatch": # 温衡：怀表
        brass = make_mat("Brass", (0.78, 0.62, 0.28), rough=0.25, metal=0.9)
        add_cyl("WatchBody", 0.028, 0.028, 0.012, (0.29, -0.13, 1.02), rot=(0.4, 0.2, 0), mat=brass, seg=16)
        add_cyl("WatchChain", 0.004, 0.004, 0.16, (0.27, -0.09, 1.09), rot=(0, 0, 0.8), mat=brass, seg=8)
    if cfg.get("weapon") == "staff":      # 艾尔薇：法杖 + 发光晶石
        wood = make_mat("Wood", (0.3, 0.2, 0.1), rough=0.8)
        add_cyl("StaffRod", 0.012, 0.012, 1.25, (0.30, -0.10, 0.85), rot=(0.12, 0, 0.06), mat=wood, seg=10)
        crystal = make_mat("Crystal", (0.2, 0.9, 0.6), rough=0.1, emit_color=(0.3, 1.0, 0.7), emit_strength=4.0)
        add_sphere("StaffGem", 0.035, (0.30, -0.12, 1.50), scale=(0.8, 0.8, 1.3), mat=crystal)
    if cfg.get("weapon") == "datapad":    # NX-07：全息数据板
        holo = make_mat("PadHolo", (0.0, 0.3, 0.4), rough=0.1, emit_color=(0.15, 0.9, 1.0), emit_strength=2.8)
        add_box("PadBody", 0.12, (0.29, -0.13, 1.10), rot=(0.2, 0.3, 0), scale=(0.8, 0.05, 1.1), mat=holo)
        add_sphere("PadNode", 0.012, (0.26, -0.07, 1.02), mat=holo)

CHARS = [
    dict(file="a_luo.glb", skin=(0.94, 0.84, 0.76), cloth=(0.65, 0.12, 0.12),
         pants=(0.6, 0.1, 0.1), hair=(0.06, 0.05, 0.05), hair_style="tangbuns",
         skirt=(0.68, 0.14, 0.14), belt=(0.85, 0.65, 0.25), weapon="roundfan",
         shoe=(0.35, 0.06, 0.06)),
    dict(file="wen_heng.glb", skin=(0.91, 0.79, 0.71), cloth=(0.16, 0.17, 0.20),
         pants=(0.13, 0.14, 0.17), hair=(0.07, 0.06, 0.06), hair_style="republic",
         belt=(0.08, 0.08, 0.1), weapon="pocketwatch", shoe=(0.06, 0.05, 0.05)),
    dict(file="ai_erwei.glb", skin=(0.95, 0.89, 0.82), cloth=(0.08, 0.4, 0.22),
         pants=(0.1, 0.12, 0.1), hair=(0.65, 0.78, 0.62), hair_style="elflong",
         skirt=(0.1, 0.35, 0.2), belt=(0.7, 0.55, 0.25), weapon="staff",
         shoe=(0.15, 0.25, 0.18)),
    dict(file="nx07.glb", skin=(0.93, 0.9, 0.88), cloth=(0.92, 0.94, 0.97),
         pants=(0.1, 0.14, 0.24), hair=(0.82, 0.86, 0.92), hair_style="android",
         belt=(0.15, 0.2, 0.3), weapon="datapad", shoe=(0.2, 0.22, 0.26)),
]

for cfg in CHARS:
    clear_scene()
    build_base(cfg)
    hair_m = make_mat("HairM2", cfg["hair"], rough=0.45)
    add_hair(cfg, hair_m)
    add_props(cfg)
    path = os.path.join(OUT, cfg["file"])
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB',
                              export_apply=True, export_yup=True)
    print("EXPORTED", path, os.path.getsize(path), "bytes", flush=True)

print("ALL SUBGENRE MODELS DONE", flush=True)
