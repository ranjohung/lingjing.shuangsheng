from pathlib import Path
import httpx,hashlib,json
root=Path('assets/source/makehuman');root.mkdir(parents=True,exist_ok=True)
base='https://raw.githubusercontent.com/makehumancommunity/makehuman/master/'
with httpx.Client(timeout=90,follow_redirects=True) as client:
 for path,name in [('makehuman/data/3dobjs/base.obj','base.obj'),('LICENSE.ASSETS.md','LICENSE.ASSETS.md')]:
  response=client.get(base+path);response.raise_for_status();(root/name).write_bytes(response.content)
  print(name,len(response.content),hashlib.sha256(response.content).hexdigest())
text=(root/'base.obj').read_text()
groups=[line for line in text.splitlines() if line.startswith('g ')]
print('GROUPS',groups)
verts=[list(map(float,l.split()[1:])) for l in text.splitlines() if l.startswith('v ')]
print('BOUNDS',[(min(v[i] for v in verts),max(v[i] for v in verts)) for i in range(3)])
(root/'provenance.json').write_text(json.dumps({'source':base,'license':'CC0 (see asset header and LICENSE.ASSETS.md)','sha256':hashlib.sha256((root/'base.obj').read_bytes()).hexdigest()},indent=2),encoding='utf-8')
