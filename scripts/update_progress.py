"""Rebuild a standalone offline dashboard from the PRD and reviewed evidence."""
from pathlib import Path
import re, json
from datetime import datetime
ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'docs/progress-evidence.json'
evidence=json.loads(source.read_text(encoding='utf-8')) if source.exists() else {}
rows=[]
for line in (ROOT/'docs/PRD.md').read_text(encoding='utf-8').splitlines():
    cells=[x.strip() for x in line.strip('|').split('|')]
    if len(cells)==5 and re.fullmatch(r'[A-Z]+-[0-9]+',cells[0]):
        code,title,phase,acceptance=cells[0],cells[1],cells[2],cells[3]
        # Leading/trailing pipes removed: current PRD has four meaningful columns.
    elif len(cells)==4 and re.fullmatch(r'[A-Z]+-[0-9]+',cells[0]):
        code,title,phase,acceptance=cells
    else: continue
    record=evidence.get(code,{})
    rows.append(dict(id=code,title=title,phase=phase,acceptance=acceptance,status=record.get('status','todo'),evidence=record.get('evidence','尚无完成证据'),next=record.get('next','按PRD实施并验证')))
payload=json.dumps(dict(updated=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),tasks=rows),ensure_ascii=False).replace('<', chr(92)+'u003c')
for dest in [ROOT/'docs/development-progress.json', ROOT/'apps/web/public/development-progress.json']:
    dest.parent.mkdir(parents=True,exist_ok=True); dest.write_text(payload,encoding='utf-8')
html=(ROOT/'scripts/progress-template.html').read_text(encoding='utf-8').replace('__DATA__',payload)
for target in [ROOT/'development-progress.html', ROOT/'docs/development-progress.html', ROOT/'apps/web/public/development-progress.html']:
    target.parent.mkdir(parents=True,exist_ok=True); target.write_text(html,encoding='utf-8')
print(f'Updated standalone progress dashboard: {len(rows)} requirements')
