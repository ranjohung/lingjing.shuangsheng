from pathlib import Path
import httpx
root=Path('assets/source/makehuman')
with httpx.Client(timeout=60) as c:
 for name in ['asian-female-young.target','universal-female-young-averagemuscle-averageweight.target']:
  r=c.get('https://raw.githubusercontent.com/makehumancommunity/makehuman/master/makehuman/data/targets/macrodetails/'+name);r.raise_for_status();(root/name).write_bytes(r.content)
# Switch presentation to the inspected photorealistic candidate without removing the previous source.
for name in ['apps/web/src/app/onboarding/page.tsx']:
 p=Path(name);s=p.read_text(encoding='utf-8').replace('/assets/characters/ling-portrait.png','/assets/characters/ling-realistic-v1.png').replace('灵，身着深蓝外套的黑发角色','灵，写实风格的成年虚构角色');p.write_text(s,encoding='utf-8')
p=Path('scripts/update_progress.py');s=p.read_text(encoding='utf-8').replace("%Y-%m-%d %H:%M'","%Y-%m-%d %H:%M:%S'");p.write_text(s,encoding='utf-8')
