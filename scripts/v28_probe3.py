# -*- coding: utf-8 -*-
"""V28 探查3：world-view 结构 / novel-game 返回与入口 / 链接关系"""
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

# 1) 谁链接到 novel-game.html / world-view.html
print("=== 链接到 novel-game 的页面 ===")
for pid, body in pages.items():
    if "novel-game.html" in body:
        for mm in re.finditer(r".{80}novel-game\.html.{60}", body):
            print(f"[{pid}] {mm.group(0)[:220]}")
            break

print("\n=== 链接到 world-view 的页面 ===")
for pid, body in pages.items():
    if "world-view.html" in body and pid != "world-view":
        for mm in re.finditer(r".{60}world-view\.html.{80}", body):
            print(f"[{pid}] {mm.group(0)[:220]}")
            break

# 2) world-view 页面概览：标题、主要按钮、返回逻辑
wv = pages["world-view"]
print(f"\n===== world-view len={len(wv)} =====")
print("TITLE:", re.search(r"<title>(.*?)</title>", wv).group(1) if re.search(r"<title>(.*?)</title>", wv) else "?")
for needle in ["LJBack(", "开始阅读", "进入世界", "startReading", "onclick"]:
    idxs = [mm.start() for mm in re.finditer(re.escape(needle), wv)][:3]
    for j in idxs:
        print(f"--- [{needle}] @{j}: {wv[max(0,j-120):j+160]}")
        break

# 3) novel-game 的返回按钮实现
ng = pages["novel-game"]
print(f"\n===== novel-game len={len(ng)} 返回相关 =====")
for needle in ["LJBack", "btn-back", "返回"]:
    idxs = [mm.start() for mm in re.finditer(re.escape(needle), ng)][:4]
    for j in idxs:
        print(f"--- [{needle}] @{j}: {ng[max(0,j-150):j+200]}")

# 4) novel-game 接收什么参数（book?）
for needle in ["?book=", "get('book')", "searchParams", "bookId"]:
    idxs = [mm.start() for mm in re.finditer(re.escape(needle), ng)][:2]
    for j in idxs:
        print(f"--- ng[{needle}] @{j}: {ng[max(0,j-150):j+200]}")

# 5) 壳层 LJ go/back 实现（LJ_BACK_STACK）
j = shell_head.find("LJ_BACK_STACK")
if j < 0:
    j = shell_tail.find("LJ_BACK_STACK")
seg = (shell_tail if shell_head.find("LJ_BACK_STACK") < 0 else shell_head)
j = seg.find("LJ_BACK_STACK")
print(f"\n===== shell LJ_BACK_STACK @{j} =====")
print(seg[max(0,j-100):j+2200])
