# -*- coding: utf-8 -*-
"""V22-1 · 子页 5 Tab 统一（tabbar-embed）
把 8 个功能子页的自绘 ds-bottom-tabs 底栏替换为规范 tabbar.js 挂载：
  1 删 <nav class="ds-bottom-tabs">…</nav>（旧自绘底栏，fixed 失效会被内容顶出视口）
  2 </head> 前插 <link rel="stylesheet" href="css/tabbar-embed.css">
  3 </body> 前插 <script src="js/tabbar.js"></script>（自动挂载 + active 推断）
catalog.html 为沉浸页豁免（铁律 #4）：只删旧底栏、不挂 tabbar（已加返回按钮）。
幂等：已含 tabbar.js 的页跳过。
"""
import re
from pathlib import Path

PV = Path(__file__).resolve().parents[1] / 'output' / 'preview'
LINK = '<link rel="stylesheet" href="css/tabbar-embed.css" />\n'
SCRIPT = '<script src="js/tabbar.js"></script>\n'

REPLACE = ['character-create.html', 'character-detail.html', 'chat.html',
           'discover.html', 'memory.html', 'profile.html', 'settings.html',
           'wallet.html']
NAV_ONLY = ['catalog.html']

NAV_RE = re.compile(r'[ \t]*<nav class="ds-bottom-tabs">.*?</nav>\s*', re.S)


def process(fname, with_tabbar):
    p = PV / fname
    t = p.read_text(encoding='utf-8')
    changed = []
    if 'js/tabbar.js' in t and with_tabbar:
        print(f'skip   {fname} (already has tabbar.js)')
        return
    t2, n = NAV_RE.subn('', t)
    if n:
        changed.append(f'removed ds-bottom-tabs x{n}')
    t = t2
    if with_tabbar:
        if 'tabbar-embed.css' not in t:
            t = t.replace('</head>', LINK + '</head>', 1)
            changed.append('link+')
        if 'js/tabbar.js' not in t:
            t = t.replace('</body>', SCRIPT + '</body>', 1)
            changed.append('script+')
    if changed:
        p.write_text(t, encoding='utf-8')
        print(f'ok     {fname}  [{", ".join(changed)}]')
    else:
        print(f'noop   {fname}')


for f in REPLACE:
    process(f, with_tabbar=True)
for f in NAV_ONLY:
    process(f, with_tabbar=False)
print('done')
