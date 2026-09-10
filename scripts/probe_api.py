import bpy
for op in ("primitive_cylinder_add", "primitive_cone_add", "primitive_uv_sphere_add", "primitive_cube_add"):
    full = getattr(bpy.ops.mesh, op)
    try:
        print(op, "->", [p.identifier for p in full.get_rna_type().properties if p.identifier not in ("rna_type",)])
    except Exception as e:
        print(op, "ERR", e)
