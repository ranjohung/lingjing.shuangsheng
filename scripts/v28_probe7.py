# -*- coding: utf-8 -*-
"""探查7：当前 world-hub featured 渲染与初始化门槛"""
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
wh = pages["world-hub"]
print("len:", len(wh))
j = wh.find("featured-wrap")
print("=== featured-wrap ctx ===")
print(wh[max(0, j-150):j+350])
j4 = wh.find("renderFeatured")
j3 = wh.find("renderWorlds")
print("\nhas renderFeatured:", j4 >= 0, "| has renderWorlds:", j3 >= 0)
if j4 >= 0:
    print(wh[max(0, j4-80):j4+900])
# init / DOMContentLoaded / 直接执行
for needle in ["DOMContentLoaded", "addEventListener('load'", "window.onload", "function init"]:
    idxs = [mm.start() for mm in re.finditer(re.escape(needle), wh)]
    print(f"\n[{needle}] x{len(idxs)}")
    for j5 in idxs[:2]:
        print(wh[max(0, j5-120):j5+300])
