# -*- coding: utf-8 -*-
"""探查13：novel-game location.search 全部用法 + world-view showToast bug"""
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
print("=== novel-game location.search 用法 ===")
for mm in re.finditer(r"location\.search", ng):
    j = mm.start()
    print("----\n" + ng[max(0, j-220):j+160].replace("\n", " ")[:400])

wv = pages["world-view"]
print("\n=== world-view showToast 用法 ===")
for mm in re.finditer(r"showToast", wv):
    j = mm.start()
    print("----\n" + wv[max(0, j-160):j+160].replace("\n", " ")[:320])
print("\nshowToast 定义?", "function showToast" in wv, "| 其他 toast 函数:",
      [f for f in ["function toast(", "window.toast", "function showToast"] if f in wv])
