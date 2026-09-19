# -*- coding: utf-8 -*-
"""探查10：novel-game 外部脚本依赖 + LJNovelParser 来源 + EMBEDDED fallback 全文"""
import io, re, json

BASE = r"F:\开发软件项目文件\灵境 · 双生"
html = io.open(BASE + r"\index.html", encoding="utf-8").read()
m = re.search(r"var LJ_PAGES\s*=\s*", html)
start = html.index("{", m.end())
depth = 0; i = start; instr = False; esc = False
while i < len(html):
    c = html[i]
    if instr:
        if esc: esc = False
        elif c == "\\": esc = True
        elif c == '"': instr = False
    else:
        if c == '"': instr = True
        elif c == "{": depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                break
    i += 1
pages = json.loads(html[start:i+1])
ng = pages["novel-game"]

print("=== 外部 script src ===")
for mm in re.finditer(r'<script[^>]*src="([^"]+)"', ng):
    print(mm.group(1))

print("\n=== LJNovelParser 出现次数 ===", ng.count("LJNovelParser"))
j = ng.find("LJNovelParser")
if j >= 0:
    print(ng[max(0, j-100):j+200])

print("\n=== EMBEDDED fallback catch 段 ===")
j = ng.find("corpus 文件不存在")
print(ng[j-100:j+900])

# 外部 js 是否存在
import os
for cand in ["output/preview/js/novel-parser.js", "output/preview/js/novel-parser.min.js"]:
    print(cand, os.path.exists(os.path.join(BASE, cand)))
