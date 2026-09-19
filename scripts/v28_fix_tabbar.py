# -*- coding: utf-8 -*-
"""定位硬编码 tabbar-embed 路径的页面并修复为相对 base 路径"""
import io, re, json

BASE = r"F:\开发软件项目文件\灵境 · 双生"
PATH = BASE + r"\index.html"
html = io.open(PATH, encoding="utf-8").read()
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
pages = json.loads(html[start:end])
for pid, body in pages.items():
    n = body.count("output/preview/css/tabbar-embed.css")
    if n:
        print(pid, "x", n)
shell_n = html[:start].count("output/preview/css/tabbar-embed.css") + html[end:].count("output/preview/css/tabbar-embed.css")
print("shell x", shell_n)

# 修复：LJ_PAGES 内 'output/preview/css/tabbar-embed.css' -> 'css/tabbar-embed.css'
changed = []
for pid, body in pages.items():
    if "output/preview/css/tabbar-embed.css" in body:
        pages[pid] = body.replace("output/preview/css/tabbar-embed.css", "css/tabbar-embed.css")
        changed.append(pid)
if changed:
    new_json = json.dumps(pages, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    html_new = html[:start] + new_json + html[end:]
    io.open(PATH, "w", encoding="utf-8", newline="").write(html_new)
    print("fixed pages:", changed)
else:
    print("no in-page occurrences")
