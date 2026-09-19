# -*- coding: utf-8 -*-
"""V27 修复：work-editor 引导时序 —— initWorkEditor() 同步执行时
V27 后置脚本块（MONET_JS / AI_JS / PREVIEW_JS）尚未解析，
renderMonetItems 等函数未定义 → 初始化中断（收费列表/AI 候选/图片管理/预览反馈全挂）。
改为 DOMContentLoaded 后执行（所有内联脚本已就绪）。
"""
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

old = '''// 启动：无 ?w= 参数时进入「作品选择」视图
initWorkEditor();'''
new = '''// 启动：无 ?w= 参数时进入「作品选择」视图
// V27 修复：延迟到 DOMContentLoaded —— 后置脚本块（收费/图片管理/AI/预览）内
// 定义的 renderMonetItems 等函数此时才可用；同步执行会 renderMonetItems is not defined
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initWorkEditor); } else { initWorkEditor(); }'''

assert p.count(old) == 1, 'anchor miss or dup: %d' % p.count(old)
p = p.replace(old, new)
pages['work-editor'] = p

out = json.dumps(pages, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
lines[idx] = '<script>var LJ_PAGES = ' + out + ';</script>'
open(SRC, 'w', encoding='utf-8', newline='').write('\n'.join(lines))
print('bootstrap deferred, len =', len(p))

# 复核
_, _, _, pages2 = load()
q = pages2['work-editor']
for probe in ["addEventListener('DOMContentLoaded', initWorkEditor)", 'function renderMonetItems', 'function checkPreviewPending']:
    print(probe[:50], '->', q.count(probe))
