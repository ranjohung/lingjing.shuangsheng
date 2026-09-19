# -*- coding: utf-8 -*-
"""探查12：壳层 LJ_BACK_STACK 上下文 + 壳层对 novel-game 的 17 处引用"""
import io, re

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
end = i + 1
shell = html[:start] + html[end:]  # 壳层（前后两段）

print("=== LJ_BACK_STACK 上下文（壳层） ===")
for mm in re.finditer("LJ_BACK_STACK", shell):
    j = mm.start()
    print("----\n" + shell[max(0, j-260):j+420].replace("\n", " ")[:660])

print("\n=== 壳层 novel-game 引用 ===")
for mm in re.finditer("novel-game", shell):
    j = mm.start()
    frag = shell[max(0, j-160):j+200].replace("\n", " ")
    print("----\n" + frag[:360])
