# -*- coding: utf-8 -*-
"""V28 探查4：novel-game 入口链 / ng-btn-home / world-view 按钮 / 壳层 LJ 路由"""
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
shell_head = html[:start]
shell_tail = html[i+1:]

# 1) 谁引用 novel-game（任意形式）
print("=== 引用 novel-game 的页面（不带 .html） ===")
for pid, body in pages.items():
    if "novel-game" in body and pid != "novel-game":
        hits = [mm.start() for mm in re.finditer("novel-game", body)]
        print(f"[{pid}] x{len(hits)}")
        for j in hits[:2]:
            print(f"   {body[max(0,j-130):j+110]}")

# 2) novel-game ng-btn-home 点击 handler
ng = pages["novel-game"]
print("\n=== novel-game ng-btn-home handler ===")
for needle in ["ng-btn-home'", "ng-btn-home\"", "getElementById('ng-btn-home')"]:
    for mm in re.finditer(re.escape(needle), ng):
        j = mm.start()
        print(f"@{j}: {ng[max(0,j-100):j+400]}")

# 3) world-view 主要动作按钮
wv = pages["world-view"]
print("\n=== world-view 按钮/入口 ===")
for needle in ["button", "btn", "剧情", "游玩", "游戏", "plot"]:
    idxs = [mm.start() for mm in re.finditer(re.escape(needle), wv)][:2]
    for j in idxs:
        print(f"[{needle}]@{j}: {wv[max(0,j-100):j+160]}")
        break

# 4) world-hub enterWorld 完整函数 + 公版名著世界 卡片渲染
wh = pages["world-hub"]
j = wh.find("function enterWorld")
print("\n=== world-hub enterWorld ===")
print(wh[j:j+700])
j2 = wh.find("公版名著世界")
print("\n=== world-hub 公版名著世界 上下文 ===")
print(wh[max(0,j2-500):j2+700])

# 5) 壳层 LJ.go / LJ_BACK_STACK / buildDoc
print("\n=== 壳层 LJ 路由核心 ===")
for needle in ["LJ_BACK_STACK", "go: function", "buildDoc", "LJEnter"]:
    j = shell_tail.find(needle)
    src = shell_tail if j >= 0 else shell_head
    j = src.find(needle)
    if j >= 0:
        print(f"--- [{needle}] @{j}:\n{src[max(0,j-60):j+1000]}\n")
