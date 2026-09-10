from pathlib import Path
p=Path('scripts/blender');p.mkdir(parents=True,exist_ok=True)
(p/'build_realistic_character.py').write_text('''"""Build an adult anatomical character prototype from licensed MakeHuman data."""
import bpy,math,json,traceback
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'assets/blender/ling';OUT.mkdir(parents=True,exist_ok=True)
PUBLIC=ROOT/'apps/web/public/assets/characters';PUBLIC.mkdir(parents=True,exist_ok=True)
try:
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 vertices=[];uvs=[];groups={};group='body'
 for line in (ROOT/'assets/source/makehuman/base.obj').read_text().splitlines():
  words=line.split()
  if not words:continue
  if words[0]=='v':vertices.append(Vector(map(float,words[1:4])))
  elif words[0]=='vt':uvs.append(tuple(map(float,words[1:3])))
  elif words[0]=='g':group=words[1]
  elif words[0]=='f':groups.setdefault(group,[]).append([tuple(int(v)-1 for v in x.split('/')[:2]) for x in words[1:]])
 for name in ['asian-female-young.target','universal-female-young-averagemuscle-averageweight.target']:
  for line in (ROOT/'assets/source/makehuman'/name).read_text().splitlines():
   if not line or line.startswith('#'):continue
   words=line.split()
   if len(words)==4:vertices[int(words[0])]+=Vector(map(float,words[1:]))
 body_ids={index for f in groups['body'] for index,_ in f};floor=min(vertices[i].y for i in body_ids)
 points=[Vector((v.x*.1,-v.z*.1,(v.y-floor)*.1)) for v in vertices]
 def center(group):
  ids={i for f in groups[group] for i,_ in f};return sum((points[i] for i in ids),Vector())/len(ids)
 def material(name,color,roughness=.48,metallic=0):
  m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=(*color,1);n.inputs['Roughness'].default_value=roughness;n.inputs['Metallic'].default_value=metallic;return m
 skin=material('Natural skin',(.52,.29,.20));coat=material('Navy woven jacket',(.025,.046,.08),.78);pants=material('Charcoal fabric',(.026,.032,.042),.85);shoes=material('Leather',(.018,.02,.028),.32);hair=material('Dark chestnut hair',(.018,.012,.009),.38);eye=material('Eye sclera',(.72,.69,.63),.2);iris=material('Brown iris',(.065,.033,.017),.25);pupil=material('Pupil',(.002,.002,.002),.15)
 skin.node_tree.nodes.get('Principled BSDF').inputs['Subsurface Weight'].default_value=.06
 def mesh(name,faces,mat):
  ids=sorted({i for f in faces for i,_ in f});remap={n:i for i,n in enumerate(ids)};m=bpy.data.meshes.new(name);m.from_pydata([points[i] for i in ids],[],[[remap[i] for i,_ in f] for f in faces]);m.update();o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o);o.data.materials.append(mat)
  layer=m.uv_layers.new(name='UVMap')
  for poly,face in zip(m.polygons,faces):
   poly.use_smooth=True
   for loop,(_,tex) in zip(poly.loop_indices,face):layer.data[loop].uv=uvs[tex]
  return o
 body=mesh('Ling body and fitted clothing',groups['body'],skin)
 for mat in [coat,pants,shoes]:body.data.materials.append(mat)
 neck=center('joint-neck');head=center('joint-head');mouth=center('joint-mouth')
 for face in body.data.polygons:
  c=sum((body.data.vertices[i].co for i in face.vertices),Vector())/len(face.vertices)
  face.material_index=0 if c.z>neck.z-.025 or abs(c.x)>.57 else 3 if c.z<.13 else 2 if c.z<.86 else 1
 sub=body.modifiers.new('Surface smoothing','SUBSURF');sub.levels=1;sub.render_levels=1
 # A separate opaque garment shell adds modest fabric thickness.
 garment=[]
 for face in groups['helper-tights']:
  c=sum((points[i] for i,_ in face),Vector())/len(face)
  if .84<c.z<neck.z-.035 and abs(c.x)<.56:garment.append(face)
 jacket=mesh('Jacket shell',garment,coat)
 jacket.modifiers.new('Garment smoothing','SUBSURF').levels=1
 solid=jacket.modifiers.new('Fabric thickness','SOLIDIFY');solid.thickness=.006
 def sphere(name,location,scale,mat):
  bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,location=location);o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(mat)
  for f in o.data.polygons:f.use_smooth=True
  return o
 for side in ['l','r']:
  pos=center('joint-'+side+'-eye')
  sphere('Eye '+side,pos,(.0118,.0118,.0118),eye)
  sphere('Iris '+side,pos+Vector((0,-.0107,0)),(.005,.0018,.005),iris)
  sphere('Pupil '+side,pos+Vector((0,-.0122,0)),(.0022,.001,.0022),pupil)
 scalp_faces=[]
 for face in groups['helper-hair']:
  c=sum((points[i] for i,_ in face),Vector())/len(face)
  if c.z>head.z+.025 or c.y>head.y:scalp_faces.append(face)
 scalp=mesh('Hair cap',scalp_faces,hair);scalp.modifiers.new('Scalp smoothing','SUBSURF').levels=2
 solid=scalp.modifiers.new('Hair volume','SOLIDIFY');solid.thickness=.006
 def strand(name,coords,radius,mat):
  curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=8;curve.bevel_depth=radius;curve.bevel_resolution=3;spline=curve.splines.new('BEZIER');spline.bezier_points.add(len(coords)-1)
  for p,co in zip(spline.bezier_points,coords):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
  obj=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(obj);obj.data.materials.append(mat);return obj
 top=max(p.z for p in points if p.z>head.z)
 for side in [-1,1]:
  for i in range(28):
   t=i/27
   strand('Groom strand',[(side*.025,head.y+.015,top-.015),(side*(.07+.025*t),head.y+.03+.06*t,top-.08),(side*(.095+.02*t),head.y+.035+.06*t,head.z-.03),(side*(.09+.035*t),head.y+.07+.045*t,neck.z-.12-.035*math.sin(i))],.0025+.001*math.sin(i)**2,hair)
 # Adult proportion skeletal rig with gentle head movement.
 rigdata=bpy.data.armatures.new('Ling skeleton');rig=bpy.data.objects.new('Ling rig',rigdata);bpy.context.collection.objects.link(rig);bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
 root=rigdata.edit_bones.new('root');root.head=(0,0,0);root.tail=(0,0,.2)
 torso=rigdata.edit_bones.new('torso');torso.head=center('joint-pelvis');torso.tail=neck;torso.parent=root
 hb=rigdata.edit_bones.new('head');hb.head=neck;hb.tail=head+Vector((0,0,.12));hb.parent=torso
 bpy.ops.object.mode_set(mode='OBJECT')
 for obj in [body,jacket,scalp]:
  for bone in ['torso','head']:obj.vertex_groups.new(name=bone)
  for v in obj.data.vertices:obj.vertex_groups['head' if v.co.z>neck.z else 'torso'].add([v.index],1,'REPLACE')
  mod=obj.modifiers.new('Skeleton','ARMATURE');mod.object=rig
 for obj in list(bpy.context.scene.objects):
  if obj.name.startswith(('Eye ','Iris ','Pupil ','Groom strand')):
   world=obj.matrix_world.copy();obj.parent=rig;obj.parent_type='BONE';obj.parent_bone='head';obj.matrix_world=world
 hb=rig.pose.bones['head'];hb.rotation_mode='XYZ'
 for frame,angle in [(1,0),(30,.015),(60,0)]:hb.rotation_euler.z=angle;hb.keyframe_insert(data_path='rotation_euler',frame=frame)
 if rig.animation_data and rig.animation_data.action:rig.animation_data.action.name='idle'
 scene=bpy.context.scene;scene.frame_end=60;scene.render.fps=30;scene.frame_set(1)
 # Export character only, converting hair curves for portable geometry.
 bpy.ops.object.select_all(action='DESELECT')
 for obj in list(scene.objects):
  if obj.type=='CURVE':
   obj.select_set(True);bpy.context.view_layer.objects.active=obj;bpy.ops.object.convert(target='MESH');obj.select_set(False)
 for obj in scene.objects:obj.select_set(True)
 bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'ling-realistic-prototype.blend'))
 bpy.ops.export_scene.gltf(filepath=str(PUBLIC/'ling-realistic-prototype.glb'),export_format='GLB',use_selection=True,export_animations=True)
 def aim(obj,target):obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
 bpy.ops.object.camera_add(location=(2.2,-4.8,2.15));camera=bpy.context.object;aim(camera,(0,0,1.0));camera.data.type='ORTHO';camera.data.ortho_scale=2.0;scene.camera=camera
 for name,pos,power,size in [('Key',(-3,-4,4),500,4),('Fill',(3,-2,3),280,3),('Rim',(1,3,4),600,3)]:
  bpy.ops.object.light_add(type='AREA',location=pos);lamp=bpy.context.object;lamp.name=name;lamp.data.energy=power;lamp.data.shape='DISK';lamp.data.size=size;aim(lamp,(0,0,1))
 scene.world.color=(.18,.20,.25);scene.render.engine='CYCLES';scene.cycles.samples=24;scene.render.resolution_x=600;scene.render.resolution_y=800;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True;scene.render.filepath=str(PUBLIC/'ling-model-preview.png')
 bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'ling-realistic-prototype.blend'));bpy.ops.render.render(write_still=True)
 (OUT/'result.json').write_text(json.dumps({'status':'prototype_generated','style':'adult realistic anatomical base, procedural clothing and groom','source':'MakeHuman CC0','limitations':['not a finished photorealistic digital double','only torso/head rig; limbs and facial blendshapes pending','procedural material detail requires texture baking'], 'glb':str(PUBLIC/'ling-realistic-prototype.glb')},indent=2),encoding='utf-8')
 print('CHARACTER_BUILD_COMPLETE',flush=True)
except Exception:
 (OUT/'error.log').write_text(traceback.format_exc(),encoding='utf-8');raise
''',encoding='utf-8')
