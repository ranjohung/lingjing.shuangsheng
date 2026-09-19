# -*- coding: utf-8 -*-
"""V27 修复：预览反馈面板默认"不满意"态应显示跳转按钮（.fb-fix 缺 show 类）。"""
import json, io, sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
SRC = 'index.html'

def load():
    s = open(SRC, encoding='utf-8').read()
    lines = s.split('\n')
    idx = next(i for i, l in enumerate(lines) if l.startswith('<script>var LJ_PAGES = '))
    l = lines[idx]
    start = l.find('= ') + 2
    end = l.rfind('</script>')
    return s, lines, idx, json.loads(l[start:end].rstrip().rstrip(';'))

s, lines, idx, pages = load()
p = pages['work-editor']

old = "'<div class=\"fb-fix\" data-fix=\"'"
new = "'<div class=\"fb-fix show\" data-fix=\"'"
assert p.count(old) == 1, 'anchor miss or dup: %d' % p.count(old)
p = p.replace(old, new)
pages['work-editor'] = p

out = json.dumps(pages, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
lines[idx] = '<script>var LJ_PAGES = ' + out + ';</script>'
open(SRC, 'w', encoding='utf-8', newline='').write('\n'.join(lines))
print('fb-fix default show, len =', len(p))

_, _, _, pages2 = load()
print('probe:', pages2['work-editor'].count('fb-fix show'))
