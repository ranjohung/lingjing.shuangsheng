from pathlib import Path
p=Path('scripts/progress-template.html')
s=p.read_text(encoding='utf-8').replace('<title>MIRAI', '<link rel="icon" href="data:,"><title>MIRAI')
p.write_text(s,encoding='utf-8')
