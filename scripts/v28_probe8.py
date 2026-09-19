# -*- coding: utf-8 -*-
"""探查8：当前 world-hub 全部 script 内容"""
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
scripts = re.findall(r"<script>(.*?)</script>", wh, re.S)
print("script blocks:", len(scripts))
for k, s in enumerate(scripts):
    print(f"\n===== block {k} ({len(s)} chars) =====")
    print(s[:2600])
    if len(s) > 2600:
        print("...(tail)...")
        print(s[-600:])
