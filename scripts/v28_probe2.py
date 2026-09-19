# -*- coding: utf-8 -*-
"""V28 探查2：world-hub 书卡路由 / novel-game 结构 / shell #stage CSS / 游戏页文案"""
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

# 1) 游戏页文案搜索
for needle in ["下一句", "继续", "world-progress", "剧情进度", "进度", "next-line", "tap-to"]:
    hits = {pid: body.count(needle) for pid, body in pages.items() if needle in body}
    if hits:
        print(f"[{needle}] -> {hits}")

# 2) novel-game / novel-runtime / catalog 页面开头（含标题栏与返回）
for pid in ["novel-game", "novel-runtime", "catalog", "novel-shelf"]:
    body = pages[pid]
    print(f"\n===== {pid} len={len(body)} head 1200 =====")
    print(body[:1200])

# 3) world-hub 中 书卡点击/进入世界 相关片段
wh = pages["world-hub"]
print("\n===== world-hub 书卡点击相关 =====")
for needle in ["LJNav", "onclick", "book", "enter", "start"]:
    for mm in re.finditer(needle, wh):
        j = mm.start()
        frag = wh[max(0, j-100):j+140]
        print(f"--- {needle} @{j}: {frag}")
        break  # 每类只看第一处

# 4) shell #stage CSS（index.html 非 LJ_PAGES 部分 = shell 本体）
shell_head = html[:start]
for mm in re.finditer(r"#stage", shell_head):
    j = mm.start()
    print(f"\n--- shell #stage @{j}:\n{shell_head[max(0,j-300):j+500]}")
