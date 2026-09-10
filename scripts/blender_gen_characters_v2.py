# -*- coding: utf-8 -*-
"""Blender headless - 5 个精细化角色 .glb（多部件身体 + PBR 材质 + 发型 + 武器）"""
import bpy, sys, os, math

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else "F:/开发软件项目文件/灵境 · 双生/output/preview/models"
os.makedirs(OUT, exist_ok=True)
print("OUT =", OUT, flush=True)

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
    # Blender 5.2: cylinder 仅支持统一 radius，锥形用 cone_add(radius1/radius2)
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

def add_torso(name, loc, top_r, bot_r, h, mat):
    return add_cyl(name, top_r, bot_r, h, loc, mat=mat, seg=24)

def build_base(cfg):
    """通用人体：头/眼/颈/躯干/手臂/腿/脚。角色朝 -Y（glTF 导出后面向 +Z）"""
    skin_m  = make_mat("Skin",  cfg["skin"], rough=0.55)
    cloth_m = make_mat("Cloth", cfg["cloth"], rough=0.75)
    hair_m  = make_mat("Hair",  cfg["hair"], rough=0.45)
    pants_m = make_mat("Pants", cfg.get("pants", (0.1, 0.1, 0.14)), rough=0.8)
    dark_m  = make_mat("Dark",  (0.04, 0.04, 0.06), rough=0.6)

    # 头 + 眼睛
    head = add_sphere("Head", 0.105, (0, 0, 1.58), scale=(0.95, 1.0, 1.1), mat=skin_m)
    add_sphere("EyeL", 0.013, (-0.038, -0.092, 1.60), mat=dark_m)
    add_sphere("EyeR", 0.013, ( 0.038, -0.092, 1.60), mat=dark_m)
    # 眉/腮红省略；颈
    add_cyl("Neck", 0.038, 0.045, 0.10, (0, 0, 1.44), mat=skin_m)

    # 躯干（上衣略收腰）
    add_torso("Torso", (0, 0, 1.22), 0.135, 0.105, 0.42, cloth_m)
    # 肩
    add_sphere("ShoulderL", 0.052, (-0.135, 0, 1.38), mat=cloth_m)
    add_sphere("ShoulderR", 0.052, ( 0.135, 0, 1.38), mat=cloth_m)
    # 腰带
    add_cyl("Belt", 0.115, 0.115, 0.05, (0, 0, 1.02), mat=make_mat("Belt", cfg.get("belt", (0.15, 0.1, 0.08)), rough=0.5))

    # 手臂（微 A-pose）：上臂 + 前臂 + 手
    for side, sx in (("L", -1), ("R", 1)):
        add_cyl(f"UpperArm{side}", 0.036, 0.032, 0.26,
                (sx * 0.16, 0, 1.28), rot=(0, 0, sx * 0.12), mat=cloth_m)
        add_cyl(f"ForeArm{side}", 0.030, 0.026, 0.24,
                (sx * 0.215, -0.01, 1.05), rot=(0, 0, sx * 0.06), mat=skin_m)
        add_sphere(f"Hand{side}", 0.032, (sx * 0.235, -0.02, 0.92), scale=(0.8, 1.1, 1.0), mat=skin_m)

    # 下身：裙 or 裤
    if cfg.get("skirt"):
        skirt_m = make_mat("Skirt", cfg["skirt"], rough=0.8)
        add_cyl("Skirt", 0.115, 0.24, 0.42, (0, 0, 0.78), mat=skirt_m, seg=24)
    for side, sx in (("L", -1), ("R", 1)):
        add_cyl(f"Thigh{side}", 0.055, 0.048, 0.34, (sx * 0.065, 0, 0.58), mat=cloth_m)
        add_cyl(f"Shin{side}", 0.045, 0.036, 0.34, (sx * 0.065, 0, 0.23), mat=pants_m if not cfg.get("skirt") else skin_m)
        add_box(f"Foot{side}", 0.1, (sx * 0.065, -0.03, 0.03), scale=(0.9, 1.6, 0.5), mat=make_mat("Shoe", (0.08, 0.08, 0.1), rough=0.4))

    return skin_m, cloth_m, hair_m

def add_hair(cfg, hair_m):
    style = cfg.get("hair_style", "short")
    if style == "ponytail":      # 林霜晚：高马尾 + 银簪
        add_sphere("HairCap", 0.112, (0, 0.005, 1.63), scale=(0.98, 1.02, 1.05), mat=hair_m)
        add_cyl("Ponytail", 0.028, 0.012, 0.55, (0, 0.12, 1.42), rot=(0.5, 0, 0), mat=hair_m)
        add_sphere("HairPin", 0.012, (0.06, -0.09, 1.70), scale=(1, 1, 0.3), mat=make_mat("Silver", (0.85, 0.87, 0.92), rough=0.2, metal=0.9))
    elif style == "bob":          # 白鹿笙：齐肩短发 + 发夹
        add_sphere("HairCap", 0.115, (0, 0.008, 1.635), scale=(1.0, 1.05, 1.08), mat=hair_m)
        add_cyl("BobL", 0.05, 0.035, 0.28, (-0.095, -0.02, 1.52), rot=(0.06, 0, 0.05), mat=hair_m)
        add_cyl("BobR", 0.05, 0.035, 0.28, ( 0.095, -0.02, 1.52), rot=(0.06, 0, -0.05), mat=hair_m)
        add_box("Clip", 0.03, (0.08, -0.1, 1.66), scale=(1, 0.4, 0.5), mat=make_mat("ClipM", (0.95, 0.45, 0.5), rough=0.3))
    elif style == "spiky":        # 沈昼：碎发 + 发光护目镜
        add_sphere("HairCap", 0.113, (0, 0.006, 1.635), scale=(0.98, 1.0, 1.06), mat=hair_m)
        for i in range(5):
            a = -0.6 + i * 0.3
            add_cyl(f"Spike{i}", 0.014, 0.002, 0.09, (math.sin(a) * 0.09, -0.06, 1.71), rot=(0.6, 0, a), mat=hair_m)
        add_box("Visor", 0.16, (0, -0.095, 1.63), scale=(1, 0.35, 0.22),
                mat=make_mat("VisorM", (0.0, 0.25, 0.3), rough=0.2, emit_color=(0.1, 0.9, 1.0), emit_strength=3.0))
    elif style == "flow":         # 姜吟雪：长直银发 + 发带
        add_sphere("HairCap", 0.115, (0, 0.008, 1.635), scale=(1.0, 1.04, 1.08), mat=hair_m)
        add_cyl("LongHairL", 0.045, 0.02, 0.85, (-0.085, 0.03, 1.22), mat=hair_m)
        add_cyl("LongHairR", 0.045, 0.02, 0.85, ( 0.085, 0.03, 1.22), mat=hair_m)
        add_cyl("LongHairB", 0.06, 0.03, 0.9, (0, 0.09, 1.20), mat=hair_m)
        ribbon = make_mat("Ribbon", (0.3, 0.85, 0.95), rough=0.4, emit_color=(0.3, 0.8, 0.9), emit_strength=0.6)
        add_box("RibbonL", 0.1, (-0.1, -0.02, 1.68), rot=(0, 0.3, 0.4), scale=(1, 0.15, 0.4), mat=ribbon)
        add_box("RibbonR", 0.1, ( 0.1, -0.02, 1.68), rot=(0, -0.3, -0.4), scale=(1, 0.15, 0.4), mat=ribbon)
    else:                         # 顾衍：清爽短发
        add_sphere("HairCap", 0.111, (0, 0.006, 1.632), scale=(0.98, 1.0, 1.02), mat=hair_m)
        add_cyl("Fringe", 0.1, 0.095, 0.06, (0, -0.055, 1.66), rot=(0.3, 0, 0), mat=hair_m)

def add_props(cfg):
    if cfg.get("weapon") == "sword":    # 林霜晚：银剑
        blade = make_mat("Blade", (0.82, 0.85, 0.92), rough=0.15, metal=0.95)
        grip  = make_mat("Grip", (0.1, 0.08, 0.06), rough=0.7)
        add_box("SwordBlade", 0.03, (0.30, -0.13, 1.05), scale=(0.25, 6.5, 1.1), mat=blade)
        add_box("SwordGuard", 0.11, (0.30, -0.12, 1.22), scale=(1, 0.25, 0.35), mat=blade)
        add_cyl("SwordGrip", 0.014, 0.014, 0.16, (0.30, -0.10, 1.13), rot=(0.35, 0, 0), mat=grip)
    if cfg.get("weapon") == "holo":     # 沈昼：悬浮全息屏
        holo = make_mat("Holo", (0.0, 0.3, 0.35), rough=0.1, emit_color=(0.1, 0.95, 1.0), emit_strength=2.5)
        add_box("HoloScreen", 0.16, (0.30, -0.14, 1.15), rot=(0.2, 0.4, 0), scale=(1.1, 0.06, 0.8), mat=holo)
        add_sphere("HoloNode", 0.015, (0.26, -0.06, 1.06), mat=holo)
    if cfg.get("weapon") == "fan":      # 姜吟雪：飘带
        silk = make_mat("Silk", (0.75, 0.92, 0.95), rough=0.35, emit_color=(0.4, 0.7, 0.8), emit_strength=0.3)
        add_box("SashA", 0.5, (0.12, -0.06, 1.05), rot=(0.9, 0, 0.5), scale=(0.06, 1, 1), mat=silk)

CHARS = [
    dict(file="lin_shuangwan.glb", skin=(0.93, 0.82, 0.74), cloth=(0.09, 0.07, 0.15),
         pants=(0.06, 0.05, 0.09), hair=(0.05, 0.04, 0.05), hair_style="ponytail",
         skirt=(0.08, 0.06, 0.13), belt=(0.35, 0.25, 0.15), weapon="sword"),
    dict(file="bai_lusheng.glb", skin=(0.95, 0.85, 0.78), cloth=(0.92, 0.93, 0.96),
         pants=(0.13, 0.16, 0.28), hair=(0.22, 0.14, 0.09), hair_style="bob",
         skirt=(0.2, 0.25, 0.4), belt=(0.13, 0.16, 0.28)),
    dict(file="shen_zhou.glb", skin=(0.9, 0.78, 0.7), cloth=(0.05, 0.05, 0.08),
         pants=(0.04, 0.04, 0.06), hair=(0.06, 0.05, 0.06), hair_style="spiky",
         belt=(0.0, 0.5, 0.6), weapon="holo"),
    dict(file="gu_yan.glb", skin=(0.92, 0.8, 0.72), cloth=(0.82, 0.72, 0.58),
         pants=(0.16, 0.17, 0.2), hair=(0.06, 0.05, 0.05), hair_style="short",
         belt=(0.3, 0.24, 0.18)),
    dict(file="jiang_yinxue.glb", skin=(0.95, 0.88, 0.82), cloth=(0.93, 0.95, 0.97),
         pants=(0.85, 0.9, 0.95), hair=(0.82, 0.85, 0.93), hair_style="flow",
         skirt=(0.88, 0.92, 0.96), belt=(0.45, 0.75, 0.8), weapon="fan"),
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

print("ALL MODELS DONE", flush=True)
