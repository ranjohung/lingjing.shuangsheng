"""
灵境 · 双生 · 4 角色低多边形 .glb 生成器
Blender headless: 程序化 4 角色（古风/校园/赛博/现代），每个 ~500 面
输出到 assets/models/{slug}.glb
"""
import bpy, sys, os, math

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
out_dir = argv[0] if argv else "F:/开发软件项目文件/灵境 · 双生/assets/models"
os.makedirs(out_dir, exist_ok=True)

def clear():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

def mat(name, rgba):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = rgba
    return m

def make_human(name, skin_rgba, hair_rgba, cloth_rgba, pants_rgba, with_skirt=False, with_sword=False):
    clear()
    parts = {}

    # Head
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.22, location=(0, 0, 1.62))
    parts['head'] = bpy.context.active_object
    parts['head'].name = f'{name}_head'

    # Hair
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.235, location=(0, 0, 1.66))
    parts['hair'] = bpy.context.active_object
    parts['hair'].name = f'{name}_hair'

    # Torso
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 1.15))
    parts['torso'] = bpy.context.active_object
    parts['torso'].scale = (0.42, 0.22, 0.55)
    parts['torso'].name = f'{name}_torso'

    # Sleeves
    bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.28, 0, 1.15))
    parts['sleeveL'] = bpy.context.active_object
    parts['sleeveL'].scale = (0.16, 0.16, 0.5)
    parts['sleeveL'].rotation_euler = (0, 0, 0.05)
    parts['sleeveL'].name = f'{name}_sleeveL'

    bpy.ops.mesh.primitive_cube_add(size=1, location=(0.28, 0, 1.15))
    parts['sleeveR'] = bpy.context.active_object
    parts['sleeveR'].scale = (0.16, 0.16, 0.5)
    parts['sleeveR'].rotation_euler = (0, 0, -0.05)
    parts['sleeveR'].name = f'{name}_sleeveR'

    # Skirt (optional)
    if with_skirt:
        bpy.ops.mesh.primitive_cone_add(radius1=0.55, radius2=0.4, depth=0.55, location=(0, 0, 0.62))
        parts['skirt'] = bpy.context.active_object
        parts['skirt'].name = f'{name}_skirt'

    # Legs
    bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.10, 0, 0.27))
    parts['legL'] = bpy.context.active_object
    parts['legL'].scale = (0.14, 0.14, 0.55)
    parts['legL'].name = f'{name}_legL'

    bpy.ops.mesh.primitive_cube_add(size=1, location=(0.10, 0, 0.27))
    parts['legR'] = bpy.context.active_object
    parts['legR'].scale = (0.14, 0.14, 0.55)
    parts['legR'].name = f'{name}_legR'

    # Sword (optional)
    if with_sword:
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0.42, 0.05, 1.15))
        parts['sword'] = bpy.context.active_object
        parts['sword'].scale = (0.04, 0.08, 1.0)
        parts['sword'].rotation_euler = (-0.3, 0, 0)
        parts['sword'].name = f'{name}_sword'

    # 赋予材质
    skin = mat(f'{name}_skin', skin_rgba)
    hair = mat(f'{name}_hair', hair_rgba)
    cloth = mat(f'{name}_cloth', cloth_rgba)
    pants = mat(f'{name}_pants', pants_rgba)
    if with_sword:
        sword = mat(f'{name}_sword', (0.8, 0.85, 0.9, 1))

    parts['head'].data.materials.append(skin)
    parts['hair'].data.materials.append(hair)
    parts['torso'].data.materials.append(cloth)
    parts['sleeveL'].data.materials.append(cloth)
    parts['sleeveR'].data.materials.append(cloth)
    if with_skirt: parts['skirt'].data.materials.append(cloth)
    parts['legL'].data.materials.append(pants)
    parts['legR'].data.materials.append(pants)
    if with_sword: parts['sword'].data.materials.append(sword)

    # 合并
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts.values():
        p.select_set(True)
    bpy.context.view_layer.objects.active = parts['torso']
    bpy.ops.object.join()
    obj = bpy.context.active_object
    obj.name = name
    # 加简单骨架
    bpy.ops.object.armature_add(location=(0, 0, 0))
    arm = bpy.context.active_object
    arm.name = f'{name}_rig'
    # 平滑着色
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj

# 4 角色配置
configs = [
    { 'name': 'lin_shuangwan', 'skin': (0.94, 0.85, 0.75, 1), 'hair': (0.10, 0.06, 0.08, 1),
      'cloth': (0.55, 0.29, 0.55, 1), 'pants': (0.10, 0.10, 0.15, 1), 'skirt': True, 'sword': True },
    { 'name': 'bai_lusheng',   'skin': (0.99, 0.88, 0.82, 1), 'hair': (0.35, 0.20, 0.12, 1),
      'cloth': (0.91, 0.61, 0.35, 1), 'pants': (0.10, 0.10, 0.15, 1), 'skirt': True, 'sword': False },
    { 'name': 'shen_zhou',     'skin': (0.99, 0.88, 0.82, 1), 'hair': (0.95, 0.95, 0.98, 1),
      'cloth': (0.29, 0.54, 1.0, 1),   'pants': (0.10, 0.10, 0.18, 1), 'skirt': False, 'sword': False },
    { 'name': 'gu_yan',        'skin': (0.94, 0.85, 0.75, 1), 'hair': (0.10, 0.06, 0.08, 1),
      'cloth': (0.55, 0.55, 0.58, 1),  'pants': (0.20, 0.20, 0.25, 1), 'skirt': False, 'sword': False },
]

for cfg in configs:
    obj = make_human(cfg['name'], cfg['skin'], cfg['hair'], cfg['cloth'], cfg['pants'], cfg['skirt'], cfg['sword'])
    out = os.path.join(out_dir, f"{cfg['name']}.glb")
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_apply=True)
    print(f"[OK] {out}")

print("DONE")
