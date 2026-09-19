# -*- coding: utf-8 -*-
"""探查9：novel-game BOOK_FILES fetch 路径与 loadBook 失败路径"""
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

for mm in re.finditer(r"corpus", ng):
    j = mm.start()
    print("---", ng[max(0, j-120):j+120].replace("\n", " ")[:240])

print("\n=== loadBook 函数 ===")
j = ng.find("function loadBook")
print(ng[j:j+1500])
