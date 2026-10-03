import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source = (ROOT / '.workbuddy' / 'tmp' / 'my-characters.html').read_text(encoding='utf-8')
for name in ('index.html', 'product-preview.html'):
    path = ROOT / name
    text = path.read_text(encoding='utf-8-sig')
    marker = 'var LJ_PAGES = '
    start = text.index(marker) + len(marker)
    pages, length = json.JSONDecoder().raw_decode(text[start:])
    pages['my-characters'] = source
    path.write_text(text[:start] + json.dumps(pages, ensure_ascii=False).replace('</', '<\\/') + text[start + length:], encoding='utf-8')
    print('synced', name)
