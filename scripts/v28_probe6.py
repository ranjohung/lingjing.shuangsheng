# -*- coding: utf-8 -*-
"""V28 探查6：plot-detail WORLD_ROUTES 全表 + 游玩 handler"""
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
pd = pages["plot-detail"]
j = pd.find("WORLD_ROUTES")
print(pd[j-60:j+700])
print("\n====== 游玩入口 handler ======")
for needle in ["WORLD_ROUTES[", "游玩", "goPlay", "startPlay"]:
    for mm in re.finditer(re.escape(needle), pd):
        jj = mm.start()
        frag = pd[max(0, jj-150):jj+280]
        print(f"[{needle}]@{jj}:\n{frag}\n---")
