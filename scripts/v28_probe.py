# -*- coding: utf-8 -*-
"""V28 探查：定位书目选择页与小说世界游戏页的 page id + 关键实现"""
import io, re, sys, json

BASE = r"F:\开发软件项目文件\灵境 · 双生"
html = io.open(BASE + r"\index.html", encoding="utf-8").read()

m = re.search(r"var LJ_PAGES\s*=\s*", html)
assert m, "LJ_PAGES not found"
start = html.index("{", m.end())
# 逐步配对找到 JSON 结束（简单起见用解码器逐字符）
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
pages_raw = html[start:i+1]
pages = json.loads(pages_raw)
print("total pages:", len(pages))
print("page ids:", ", ".join(sorted(pages.keys())))

# 定位包含关键文案的页面
for key, needle in [("书目选择", "公版名著世界"), ("游戏页1", "点击下一句"), ("游戏页2", "世界进度")]:
    hits = [pid for pid, body in pages.items() if needle in body]
    print(f"\n[{key}] '{needle}' -> {hits}")

# 打印每个命中页面的关键片段
def ctx(pid, needle, span=260, maxn=6):
    body = pages[pid]
    out = []
    pos = 0
    for _ in range(maxn):
        j = body.find(needle, pos)
        if j < 0: break
        out.append(body[max(0, j-span):j+span])
        pos = j + 1
    return out

for pid in ["world-hub", "plot-runner"]:
    if pid in pages:
        print(f"\n===== {pid} len={len(pages[pid])} =====")
        body = pages[pid]
        print(body[:600])
        print("......")
        print(body[-800:])
