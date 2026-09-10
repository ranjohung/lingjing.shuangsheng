from pathlib import Path
p=Path('scripts/update_progress.py');s=p.read_text(encoding='utf-8');s=s.replace(".replace('<','\\u003c')", ".replace('<', chr(92)+'u003c')")
s=s.replace("html=(ROOT/'scripts/progress-template.html')", "for dest in [ROOT/'docs/development-progress.json', ROOT/'apps/web/public/development-progress.json']:\n    dest.parent.mkdir(parents=True,exist_ok=True); dest.write_text(payload,encoding='utf-8')\nhtml=(ROOT/'scripts/progress-template.html')")
s=s.replace("[ROOT/'docs/development-progress.html', ROOT/'apps/web/public/development-progress.html']", "[ROOT/'development-progress.html', ROOT/'docs/development-progress.html', ROOT/'apps/web/public/development-progress.html']")
p.write_text(s,encoding='utf-8')
p=Path('scripts/progress-template.html');s=p.read_text(encoding='utf-8').replace("const data=JSON.parse", "let data=JSON.parse")
s=s.replace('此HTML是最近一次生成的进度快照，刷新可读取更新。','网页每15秒检查更新；离线文件每60秒重新读取。筛选条件会保留。')
s=s.replace("for(const [key,label] of", "function stats(){document.getElementById('stats').replaceChildren();for(const [key,label] of")
s=s.replace("document.getElementById('stats').append(box)}", "document.getElementById('stats').append(box)}}stats();")
s=s.replace("render();\n</script>", """render();
try{const saved=JSON.parse(sessionStorage.getItem('mirai-progress-filter')||'{}');document.getElementById('search').value=saved.query||'';document.getElementById('filter').value=saved.filter||'all';render()}catch{}
setInterval(async()=>{try{sessionStorage.setItem('mirai-progress-filter',JSON.stringify({query:document.getElementById('search').value,filter:document.getElementById('filter').value}));if(location.protocol==='file:')return;const r=await fetch('development-progress.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)return;const next=await r.json();if(next.updated!==data.updated){data=next;document.getElementById('updated').textContent='更新于 '+data.updated;stats();render()}}catch{}},15000);
if(location.protocol==='file:')setTimeout(()=>location.reload(),60000);
</script>""")
p.write_text(s,encoding='utf-8')
Path('scripts/watch_progress.py').write_text('''from pathlib import Path
import subprocess,sys,time
root=Path(__file__).resolve().parents[1]
watched=[root/'docs/PRD.md',root/'docs/progress-evidence.json',root/'docs/IMPLEMENTATION_STATUS.md']
previous=None
while True:
    current=tuple(p.stat().st_mtime_ns for p in watched)
    if current!=previous:
        subprocess.run([sys.executable,str(root/'scripts/update_progress.py')],check=True)
        previous=current
    time.sleep(3)
''',encoding='utf-8')
