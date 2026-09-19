# -*- coding: utf-8 -*-
"""V28 探查5：WORLDS 全表 / novel-game entry-back / world-hub 渲染 / plot-detail 路由全表"""
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
# WORLDS 数组全表
j = wh.find("const WORLDS")
k = wh.find("];", j)
print("=== world-hub WORLDS 全表 ===")
print(wh[j:k+2])

# featured + world-grid 渲染
print("\n=== world-hub 渲染函数 ===")
j2 = wh.find("featured-wrap")
j3 = wh.find("renderWorlds")
if j3 < 0:
    j3 = wh.find("world-grid")
for jj in [j2, j3]:
    if jj > 0:
        print(f"--- @{jj}:\n{wh[jj-50:jj+900]}\n")

ng = pages["novel-game"]
print("=== novel-game entry mask handlers ===")
for needle in ["ng-entry-back", "ng-entry-continue", "ng-entry-restart", "autoShowEntry"]:
    idxs = [mm.start() for mm in re.finditer(re.escape(needle), ng)]
    for j in idxs[:3]:
        print(f"[{needle}]@{j}: {ng[max(0,j-80):j+300]}\n")

pd = pages["plot-detail"]
print("=== plot-detail WORLD_ROUTES 全表 ===")
j = pd.find("WORLD_ROUTES")
print(pd[j-100:j+800])
