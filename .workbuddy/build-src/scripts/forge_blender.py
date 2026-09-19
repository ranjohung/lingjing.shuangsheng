# -*- coding: utf-8 -*-
"""V25-C · 小说世界 3D 资产生成（Blender 无头）

读世界蓝图 assets.models3d，按场景类型程序化建模 → 渲染静帧 PNG + 导出 GLB。
建模配方由场景类型（mountain/cave/palace/water/forest/town/temple/bridge/street/garden）决定，
剧本层不含任何书名/人名，可复用到任意小说。

用法：
  blender.exe --background --factory-startup --python scripts/forge_blender.py -- <world.json> <out_img_dir> <out_glb_dir>
"""
import bpy, sys, os, json, math, random

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
WORLD_JSON = argv[0]
# 注意：Blender 的 render.filepath 以「启动时 CWD」为基准，但 --background 下
# 相对路径会被解析到 C:\ 根目录。必须转成绝对路径，否则 PNG 会落到 C:\output\...
OUT_IMG = os.path.abspath(argv[1])
OUT_GLB = os.path.abspath(argv[2])
BOOK = os.path.splitext(os.path.basename(WORLD_JSON))[0]

os.makedirs(OUT_IMG, exist_ok=True)
os.makedirs(OUT_GLB, exist_ok=True)

random.seed(20260915)

# ---------------------------------------------------------------- 工具


def clear():
    try:
        MATS.clear()
    except NameError:
        pass
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for blk in (bpy.data.meshes, bpy.data.materials, bpy.data.lights,
                bpy.data.cameras, bpy.data.images, bpy.data.node_groups):
        for b in list(blk):
            try:
                blk.remove(b, do_unlink=True)
            except Exception:
                pass


def mat(name, color, rough=0.7, metal=0.0, emit=None, emit_str=0.0, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (color[0], color[1], color[2], 1.0)
        bsdf.inputs["Roughness"].default_value = rough
        bsdf.inputs["Metallic"].default_value = metal
        for key in ("Emission Color", "Emission"):
            if key in bsdf.inputs and emit:
                try:
                    bsdf.inputs[key].default_value = (emit[0], emit[1], emit[2], 1.0)
                except Exception:
                    pass
        if "Emission Strength" in bsdf.inputs and emit:
            bsdf.inputs["Emission Strength"].default_value = emit_str
        if alpha < 1.0:
            bsdf.inputs["Alpha"].default_value = alpha
            m.blend_method = 'BLEND'
    return m


MATS = {}


def M(key, color, rough=0.7, metal=0.0, emit=None, emit_str=0.0):
    """材质缓存：同一场景内同名材质只建一次（clear() 会清空缓存）"""
    if key not in MATS:
        MATS[key] = mat(key, color, rough, metal, emit, emit_str)
    return MATS[key]


def smooth(o):
    if o.type == 'MESH':
        for p in o.data.polygons:
            p.use_smooth = True
    return o


def box(name, size, loc, rot=(0, 0, 0), scale=(1, 1, 1), material=None):
    bpy.ops.mesh.primitive_cube_add(size=size, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    if material:
        o.data.materials.append(material)
    return o


def cyl(name, r, h, loc, rot=(0, 0, 0), material=None, v=24):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=loc, rotation=rot, vertices=v)
    o = bpy.context.active_object
    o.name = name
    if material:
        o.data.materials.append(material)
    return smooth(o)


def cone(name, r1, r2, h, loc, rot=(0, 0, 0), material=None, v=20):
    bpy.ops.mesh.primitive_cone_add(radius1=r1, radius2=r2, depth=h, location=loc,
                                    rotation=rot, vertices=v)
    o = bpy.context.active_object
    o.name = name
    if material:
        o.data.materials.append(material)
    return smooth(o)


def sphere(name, r, loc, scale=(1, 1, 1), material=None):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=24, ring_count=16)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    if material:
        o.data.materials.append(material)
    return smooth(o)


def plane(name, size, loc, material=None):
    bpy.ops.mesh.primitive_plane_add(size=size, location=loc)
    o = bpy.context.active_object
    o.name = name
    if material:
        o.data.materials.append(material)
    return o


def torus(name, major, minor, loc, rot=(0, 0, 0), material=None):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, location=loc,
                                     rotation=rot, major_segments=32, minor_segments=12)
    o = bpy.context.active_object
    o.name = name
    if material:
        o.data.materials.append(material)
    return smooth(o)


def set_engine():
    sc = bpy.context.scene
    for eng in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE', 'CYCLES'):
        try:
            sc.render.engine = eng
            return eng
        except Exception:
            continue
    return sc.render.engine


def setup_render(w=1280, h=720, samples=48):
    sc = bpy.context.scene
    eng = set_engine()
    sc.render.resolution_x = w
    sc.render.resolution_y = h
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = False
    sc.render.image_settings.file_format = 'PNG'
    for attr, val in (('taa_render_samples', samples), ('samples', samples)):
        try:
            setattr(sc.eevee, attr, val)
        except Exception:
            pass
    try:
        sc.cycles.samples = 64
    except Exception:
        pass
    try:
        sc.view_settings.view_transform = 'Filmic'
    except Exception:
        pass
    return eng


# ---------------------------------------------------------------- 灯光 / 相机


def world_bg(color, strength=1.0):
    w = bpy.context.scene.world
    if not w:
        w = bpy.data.worlds.new("World")
        bpy.context.scene.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (color[0], color[1], color[2], 1.0)
        bg.inputs[1].default_value = strength


def sun(energy=6.0, rot=(math.radians(55), 0, math.radians(35)), color=(1, 0.96, 0.88), angle=0.12):
    bpy.ops.object.light_add(type='SUN', location=(0, 0, 12))
    o = bpy.context.active_object
    o.rotation_euler = rot
    o.data.energy = energy
    o.data.color = color
    try:
        o.data.angle = angle
    except Exception:
        pass
    return o


def area(loc, rot, energy=400, size=6, color=(1, 0.85, 0.6)):
    bpy.ops.object.light_add(type='AREA', location=loc, rotation=rot)
    o = bpy.context.active_object
    o.data.energy = energy
    o.data.size = size
    o.data.color = color
    return o


def camera(loc, look_at, lens=32):
    bpy.ops.object.camera_add(location=loc)
    cam = bpy.context.active_object
    cam.data.lens = lens
    import mathutils
    d = mathutils.Vector(look_at) - mathutils.Vector(loc)
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.camera = cam
    return cam


# ---------------------------------------------------------------- 场景配方

ROCK = (0.34, 0.31, 0.29)
ROCK_D = (0.16, 0.15, 0.17)
PINE = (0.11, 0.28, 0.18)
CLOUD = (0.92, 0.94, 0.98)
GOLD = (0.83, 0.63, 0.18)
RED = (0.62, 0.13, 0.16)
JADE = (0.15, 0.45, 0.36)
WOOD = (0.35, 0.22, 0.12)
STONE = (0.42, 0.40, 0.37)
WATER = (0.06, 0.22, 0.32)
OCHRE = (0.66, 0.42, 0.15)
PAPER = (0.94, 0.72, 0.35)


def recipe_mountain():
    m_rock = mat("rock", ROCK, 0.9)
    m_pine = mat("pine", PINE, 0.85)
    m_cloud = mat("cloud", CLOUD, 0.9, emit=CLOUD, emit_str=0.35)
    box("ground", 2, (0, 0, -0.4), scale=(40, 40, 0.4), material=m_rock)
    for i in range(7):
        h = random.uniform(5, 13)
        x = random.uniform(-11, 11)
        y = random.uniform(-6, 8)
        cone("peak_%d" % i, random.uniform(3.2, 5.4), random.uniform(0.2, 0.9), h,
             (x, y, h / 2 - 0.3), material=m_rock, v=5)
        if i < 5:
            cone("pine_%d" % i, 1.5, 0.0, 4.6, (x + random.uniform(-4, 4), y + 3.6, 2.1),
                 material=m_pine, v=8)
            cyl("trunk_%d" % i, 0.22, 1.6, (x + random.uniform(-4, 4), y + 3.6, 0.8), material=M("wood_shared", WOOD, 0.8), v=8)
    for i in range(6):
        sphere("cloud_%d" % i, random.uniform(1.6, 3.0),
               (random.uniform(-14, 14), random.uniform(-2, 8), random.uniform(7, 11)),
               scale=(1.6, 1, 0.5), material=m_cloud)
    sun(max(5.0, 6.0), (math.radians(62), 0, math.radians(28)))


def recipe_cave():
    m_rock = mat("cave_rock", (0.20, 0.19, 0.22), 0.9)
    m_glow = mat("glow", (1.0, 0.78, 0.42), 0.3, emit=(1.0, 0.72, 0.35), emit_str=9.0)
    m_water = mat("cave_water", WATER, 0.15, metal=0.6)
    box("ground", 2, (0, 0, -0.3), scale=(30, 30, 0.3), material=m_rock)
    for i in range(14):
        a = i * (math.pi * 2 / 14)
        r = 13
        cone("wall_%d" % i, random.uniform(2.0, 3.4), 0.1, random.uniform(12, 20),
             (math.cos(a) * r, math.sin(a) * r, random.uniform(4, 8)), material=m_rock, v=6)
    for i in range(12):
        h = random.uniform(2.5, 6.0)
        cone("stalac_%d" % i, random.uniform(0.4, 0.9), 0.02, h,
             (random.uniform(-8, 8), random.uniform(-8, 8), 9 - h / 2),
             rot=(math.radians(180), 0, 0), material=m_rock, v=6)
    for i in range(6):
        h = random.uniform(1.2, 3.4)
        cone("stalag_%d" % i, random.uniform(0.4, 0.9), 0.05, h,
             (random.uniform(-8, 8), random.uniform(-8, 8), h / 2 - 0.3), material=m_rock, v=6)
    cone("light_shaft", 3.2, 0.6, 14, (0, 0, 7), material=m_glow, v=18)
    plane("pool", 14, (0, 0, 0.02), material=m_water)
    world_bg((0.05, 0.06, 0.10), 0.5)
    area((0, 0, 6), (0, 0, 0), energy=900, size=7, color=(1.0, 0.78, 0.45))
    sun(max(1.2, 6.0), (math.radians(70), 0, math.radians(20)), color=(0.7, 0.78, 1.0))


def recipe_palace():
    m_gold = mat("gold", GOLD, 0.25, metal=0.9)
    m_red = mat("redpillar", RED, 0.5)
    m_floor = mat("palfloor", (0.30, 0.29, 0.31), 0.35, metal=0.15)
    m_jade = mat("jade", JADE, 0.3, metal=0.2)
    m_paper = mat("lantern", PAPER, 0.4, emit=PAPER, emit_str=6.0)
    box("ground", 2, (0, 0, -0.3), scale=(34, 34, 0.3), material=m_floor)
    box("plinth1", 2, (0, 0, 0.4), scale=(12, 9, 0.4), material=m_floor)
    box("plinth2", 2, (0, 0, 1.0), scale=(10, 7.5, 0.3), material=m_floor)
    for i in range(3):
        w = 9 - i * 2
        box("step_%d" % i, 2, (0, 6.5 + i * 0.8, -0.15 + i * 0.25),
            scale=(w * 0.5, 0.5, 0.25), material=m_floor)
    for i, x in enumerate((-6.5, -3.2, 3.2, 6.5)):
        cyl("pillar_%d" % i, 0.55, 7.0, (x, 0, 4.0), material=m_red, v=20)
        cyl("pbase_%d" % i, 0.85, 0.5, (x, 0, 0.25), material=m_jade, v=20)
    box("roof1", 2, (0, 0, 7.6), scale=(9, 7, 0.35), material=m_gold)
    box("roof2", 2, (0, 0, 8.6), scale=(7.5, 5.6, 0.5), material=m_gold,
        rot=(0, 0, math.radians(45)))
    cone("roof_top", 4.4, 0.0, 3.2, (0, 0, 10.0), material=m_gold, v=4)
    for i, x in enumerate((-4.0, 0.0, 4.0)):
        cyl("lantern_%d" % i, 0.42, 0.9, (x, 5.6, 4.6), material=m_paper, v=14)
    world_bg((0.10, 0.09, 0.16), 0.6)
    sun(max(3.2, 6.0), (math.radians(58), 0, math.radians(40)), color=(1.0, 0.93, 0.78))
    area((0, 12, 8), (math.radians(55), 0, 0), energy=600, size=8, color=(1.0, 0.72, 0.42))


def recipe_water():
    m_water = mat("water", WATER, 0.06, metal=0.75)
    m_rock = mat("island", ROCK, 0.9)
    m_pine = mat("pine2", PINE, 0.85)
    m_boat = mat("boat", WOOD, 0.7)
    plane("sea", 90, (0, 0, 0), material=m_water)
    for i in range(5):
        x = random.uniform(-22, 22)
        y = random.uniform(-16, 4)
        cone("isle_%d" % i, random.uniform(2.4, 4.0), 0.3, random.uniform(3, 6.5),
             (x, y, 1.4), material=m_rock, v=6)
        cone("tree_%d" % i, 1.1, 0.0, 3.0, (x, y + 1.6, 4.4), material=m_pine, v=8)
    hb = box("boat_hull", 2, (2.5, 6.0, 0.35), scale=(0.6, 2.2, 0.35), material=m_boat)
    box("boat_canopy", 2, (2.5, 6.0, 1.0), scale=(0.5, 0.9, 0.25), material=m_boat)
    world_bg((0.30, 0.40, 0.52), 1.0)
    sun(max(4.6, 6.0), (math.radians(66), 0, math.radians(15)), color=(1.0, 0.95, 0.85))


def recipe_forest():
    m_ground = mat("forest_floor", (0.14, 0.20, 0.10), 0.95)
    m_trunk = mat("trunk", WOOD, 0.85)
    m_leaf = mat("leaf", (0.12, 0.32, 0.16), 0.8)
    box("ground", 2, (0, 0, -0.3), scale=(36, 36, 0.3), material=m_ground)
    for i in range(26):
        x = random.uniform(-14, 14)
        y = random.uniform(-14, 14)
        if abs(x) < 2.5 and y < 2:
            continue
        h = random.uniform(5, 11)
        cyl("t%d" % i, random.uniform(0.25, 0.5), h, (x, y, h / 2), material=m_trunk, v=10)
        sphere("c%d" % i, random.uniform(2.0, 3.4), (x, y, h + 0.8),
               scale=(1.3, 1.3, 0.75), material=m_leaf)
    world_bg((0.34, 0.44, 0.40), 0.9)
    sun(max(3.0, 6.0), (math.radians(70), 0, math.radians(30)), color=(0.98, 1.0, 0.85))


def recipe_town():
    m_wall = mat("citywall", (0.40, 0.36, 0.32), 0.9)
    m_tile = mat("tile", (0.19, 0.21, 0.26), 0.8)
    m_wood = mat("woodshop", WOOD, 0.8)
    m_road = mat("road", (0.32, 0.31, 0.30), 0.9)
    m_lamp = mat("townlantern", PAPER, 0.4, emit=PAPER, emit_str=7.0)
    box("ground", 2, (0, 0, -0.3), scale=(40, 40, 0.3), material=m_road)
    box("wall_l", 2, (-12, 0, 3.0), scale=(0.8, 16, 3.0), material=m_wall)
    box("wall_r", 2, (12, 0, 3.0), scale=(0.8, 16, 3.0), material=m_wall)
    box("gate_top", 2, (0, 12, 6.4), scale=(13, 1.2, 0.6), material=m_tile)
    for i in range(6):
        x = -8 + i * 3.2
        box("house_%d" % i, 2, (x, random.uniform(-8, 4), 1.6),
            scale=(1.4, 1.6, 1.6), material=m_wood)
        box("roof_%d" % i, 2, (x, 0, 3.6), scale=(1.8, 2.0, 0.22), material=m_tile)
    for i, x in enumerate((-6.4, -3.2, 0, 3.2, 6.4)):
        cyl("lantern_%d" % i, 0.32, 0.7, (x, 5.2, 4.4), material=m_lamp, v=12)
        cyl("post_%d" % i, 0.09, 4.4, (x, 5.2, 2.2), material=m_wood, v=8)
    world_bg((0.09, 0.11, 0.20), 0.7)
    sun(max(2.4, 6.0), (math.radians(64), 0, math.radians(50)), color=(1.0, 0.90, 0.72))
    area((0, 10, 5), (math.radians(60), 0, 0), energy=500, size=7, color=(1.0, 0.74, 0.42))


def recipe_temple():
    m_wall = mat("temple_wall", (0.72, 0.62, 0.46), 0.85)
    m_roof = mat("temple_roof", (0.44, 0.16, 0.14), 0.6)
    m_stone = mat("temple_stone", STONE, 0.9)
    m_gold = mat("temple_gold", GOLD, 0.25, metal=0.9)
    m_inc = mat("incense", (0.9, 0.75, 0.5), 0.6, emit=(1.0, 0.55, 0.25), emit_str=5.0)
    box("ground", 2, (0, 0, -0.3), scale=(34, 34, 0.3), material=m_stone)
    box("hall", 2, (0, -3, 2.6), scale=(7, 4.4, 2.6), material=m_wall)
    box("hall_roof", 2, (0, -3, 5.6), scale=(8.6, 6.0, 0.4), material=m_roof)
    cone("hall_top", 4.6, 0.0, 2.6, (0, -3, 7.1), material=m_roof, v=4)
    for i in range(3):
        box("step_%d" % i, 2, (0, 2.0 + i * 0.9, -0.1 + i * 0.22),
            scale=(4.4 - i * 0.5, 0.5, 0.22), material=m_stone)
    cyl("burner", 1.0, 1.5, (0, 4.4, 0.75), material=m_gold, v=20)
    cone("smoke", 0.5, 0.05, 3.4, (0, 4.4, 3.2), material=m_inc, v=14)
    for i, x in enumerate((-5.2, 5.2)):
        cyl("flagpole_%d" % i, 0.12, 7.0, (x, 2.0, 3.5), material=M("wood_shared", WOOD, 0.8), v=8)
        box("flag_%d" % i, 2, (x + 0.9, 2.0, 6.0), scale=(0.9, 0.06, 0.6),
            material=mat("flagc_%d" % i, (0.75, 0.60, 0.14), 0.8))
    world_bg((0.42, 0.50, 0.58), 1.0)
    sun(max(4.2, 6.0), (math.radians(58), 0, math.radians(35)), color=(1.0, 0.94, 0.82))


def recipe_bridge():
    m_stone = mat("bridge_stone", (0.46, 0.44, 0.41), 0.9)
    m_water = mat("br_water", WATER, 0.08, metal=0.7)
    m_willow = mat("willow", (0.22, 0.42, 0.20), 0.85)
    box("ground_l", 2, (-14, 0, -0.4), scale=(10, 12, 0.4), material=m_stone)
    box("ground_r", 2, (14, 0, -0.4), scale=(10, 12, 0.4), material=m_stone)
    plane("river", 60, (0, 0, -0.5), material=m_water)
    for i in range(9):
        a = math.pi * (i / 8.0)
        x = -10.4 + i * 2.6
        z = 1.9 + math.sin(a) * 1.9
        box("deck_%d" % i, 2, (x, 0, z), scale=(1.4, 2.6, 0.2), material=m_stone,
            rot=(0, -math.cos(a) * 0.35, 0))
        if i % 2 == 0:
            cyl("rail_%d" % i, 0.16, 1.3, (x, 2.4, z + 0.7), material=m_stone, v=8)
            cyl("rail2_%d" % i, 0.16, 1.3, (x, -2.4, z + 0.7), material=m_stone, v=8)
    for i in range(4):
        x = -16 - i * 3
        cyl("wt_%d" % i, 0.35, 5.5, (x, -6 + i * 1.2, 2.7), material=M("wood_shared", WOOD, 0.8), v=10)
        sphere("wc_%d" % i, 2.4, (x, -6 + i * 1.2, 5.8), scale=(1.0, 1.4, 0.7), material=m_willow)
    world_bg((0.30, 0.38, 0.48), 0.95)
    sun(max(4.0, 6.0), (math.radians(62), 0, math.radians(38)), color=(1.0, 0.96, 0.86))


def recipe_garden():
    m_rock = mat("rockery", ROCK, 0.9)
    m_pond = mat("pond", (0.10, 0.30, 0.34), 0.08, metal=0.6)
    m_wall = mat("gwall", (0.78, 0.72, 0.62), 0.85)
    m_wood = mat("gwood", WOOD, 0.75)
    m_leaf = mat("gleaf", (0.18, 0.38, 0.18), 0.8)
    box("ground", 2, (0, 0, -0.3), scale=(34, 34, 0.3), material=m_wall)
    plane("pond", 13, (0, 1.5, -0.18), material=m_pond)
    for i in range(6):
        cone("rk_%d" % i, random.uniform(1.0, 2.2), random.uniform(0.1, 0.6),
             random.uniform(1.6, 4.2), (random.uniform(-8, 8), random.uniform(-7, -3), 1.6),
             material=m_rock, v=6)
    for i in range(5):
        x = -6.5 + i * 3.2
        cyl("post_%d" % i, 0.18, 3.0, (x, -9.0, 1.5), material=m_wood, v=10)
        box("corr_roof_%d" % i, 2, (x, -9.0, 3.2), scale=(1.7, 0.9, 0.16), material=m_wood)
    for i in range(4):
        x = 7.5 + random.uniform(-1, 1)
        cyl("bt_%d" % i, 0.22, 4.0, (x, -4 + i * 3.0, 2.0), material=m_wood, v=8)
        sphere("bc_%d" % i, 1.9, (x, -4 + i * 3.0, 4.4), scale=(1.2, 1.2, 0.6), material=m_leaf)
    world_bg((0.48, 0.54, 0.58), 1.0)
    sun(max(3.6, 6.0), (math.radians(64), 0, math.radians(32)), color=(1.0, 0.96, 0.88))


def recipe_street():
    m_road = mat("s_road", (0.30, 0.29, 0.31), 0.9)
    m_wood = mat("s_wood", WOOD, 0.8)
    m_tile = mat("s_tile", (0.17, 0.19, 0.24), 0.8)
    m_lamp = mat("s_lamp", PAPER, 0.4, emit=PAPER, emit_str=8.0)
    m_cloth = mat("s_cloth", (0.70, 0.28, 0.26), 0.85)
    box("ground", 2, (0, 0, -0.3), scale=(40, 40, 0.3), material=m_road)
    for i in range(10):
        side = -1 if i % 2 == 0 else 1
        z = 1.8
        y = -12 + (i // 2) * 6.0
        box("shop_%d" % i, 2, (side * 4.6, y, z), scale=(1.6, 2.6, z), material=m_wood)
        box("sroof_%d" % i, 2, (side * 4.6, y, 4.0), scale=(2.0, 3.0, 0.22), material=m_tile)
        if i % 3 == 0:
            box("banner_%d" % i, 2, (side * 3.4, y + 1.2, 2.8), scale=(0.08, 0.35, 0.9),
                material=m_cloth)
    for i in range(5):
        y = -10 + i * 5
        cyl("lpost_%d" % i, 0.1, 4.6, (0, 8.6, 2.3), material=m_wood, v=8)
        cyl("lamp_%d" % i, 0.38, 0.8, (0, 8.6 - 0.0, 4.6), material=m_lamp, v=14)
        cyl("lpost2_%d" % i, 0.1, 4.6, (0, -8.6, 2.3), material=m_wood, v=8)
        cyl("lamp2_%d" % i, 0.38, 0.8, (0, -8.6, 4.6), material=m_lamp, v=14)
    world_bg((0.07, 0.09, 0.17), 0.6)
    sun(max(2.0, 6.0), (math.radians(66), 0, math.radians(46)), color=(0.85, 0.88, 1.0))
    area((0, 4, 6), (math.radians(70), 0, 0), energy=700, size=8, color=(1.0, 0.72, 0.40))


RECIPES = {
    'mountain': recipe_mountain, 'cave': recipe_cave, 'palace': recipe_palace,
    'water': recipe_water, 'forest': recipe_forest, 'town': recipe_town,
    'temple': recipe_temple, 'bridge': recipe_bridge, 'garden': recipe_garden,
    'street': recipe_street,
}

CAMS = {
    'mountain': ((22, -26, 13), (0, 2, 5), 34),
    'cave': ((0, -15, 7), (0, -1, 3.4), 28),
    'palace': ((18, -22, 12), (0, -1, 5.2), 32),
    'water': ((18, -24, 12), (0, 2, 2.4), 34),
    'forest': ((16, -20, 10), (0, 0, 4.6), 32),
    'town': ((18, -24, 12), (0, 0, 3.4), 32),
    'temple': ((18, -22, 12), (0, -2, 3.2), 32),
    'bridge': ((20, -22, 11), (0, 0, 2.6), 34),
    'garden': ((16, -22, 11), (0, -2, 2.4), 32),
    'street': ((0, -22, 11), (0, 0, 3.0), 32),
}


def main():
    world = json.load(open(WORLD_JSON, encoding='utf-8'))
    models = world['assets']['models3d']
    print('[blender] world=%s models=%d' % (BOOK, len(models)), flush=True)

    ok, fail = 0, 0
    for rec in models:
        kind = rec['kind']
        recipe = RECIPES.get(kind)
        if not recipe:
            print('  [skip] no recipe for kind=%s' % kind, flush=True)
            continue
        print('  [build] %s (%s)' % (rec['asset_id'], kind), flush=True)
        clear()
        try:
            recipe()
        except Exception as e:
            fail += 1
            print('    FAIL build: %s' % e, flush=True)
            continue

        eng = setup_render()
        loc, look, lens = CAMS.get(kind, ((14, -18, 8), (0, 0, 4), 30))
        camera(loc, look, lens)

        img = os.path.join(OUT_IMG, rec['render'])
        glb = os.path.join(OUT_GLB, rec['glb'])
        try:
            bpy.context.scene.render.filepath = img
            bpy.ops.render.render(write_still=True)
            print('    render ok (%s) -> %s' % (eng, os.path.basename(img)), flush=True)
        except Exception as e:
            print('    render FAIL: %s' % e, flush=True)

        try:
            bpy.ops.object.select_all(action='SELECT')
            bpy.ops.export_scene.gltf(filepath=glb, export_format='GLB',
                                      use_selection=True, export_apply=True)
            print('    glb ok -> %s' % os.path.basename(glb), flush=True)
            ok += 1
        except Exception as e:
            print('    glb FAIL: %s' % e, flush=True)

    print('[blender] done ok=%d fail=%d' % (ok, fail), flush=True)


main()
