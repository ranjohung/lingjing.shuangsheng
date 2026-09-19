# -*- coding: utf-8 -*-
"""从根 index.html 的 LJ_PAGES 提取指定页面源码到 .workbuddy/tmp/ 便于分析。"""
import json, sys, io, os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

SRC = 'index.html'
OUT_DIR = '.workbuddy/tmp'

def load_pages():
    s = open(SRC, encoding='utf-8').read()
    lines = s.split('\n')
    idx = next(i for i, l in enumerate(lines) if l.startswith('<script>var LJ_PAGES = '))
    l = lines[idx]
    start = l.find('= ') + 2
    end = l.rfind('</script>')
    raw = l[start:end].rstrip().rstrip(';')
    return json.loads(raw), lines, idx

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    pages, _, _ = load_pages()
    for name in sys.argv[1:]:
        p = pages[name]
        out = os.path.join(OUT_DIR, name + '.html')
        open(out, 'w', encoding='utf-8').write(p)
        print(name, len(p), '->', out)

if __name__ == '__main__':
    main()
