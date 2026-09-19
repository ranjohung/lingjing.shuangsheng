# -*- coding: utf-8 -*-
"""V28 构建后校验：novel-detail JS 语法（node --check）+ 关键锚点存在性"""
import io, json, re, os, subprocess

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATH = os.path.join(BASE, "index.html")
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
pages = json.loads(html[start:i+1])

# 1) novel-detail 存在且含关键元素
nd = pages["novel-detail"]
print("novel-detail len:", len(nd))
for needle in ['window.__LJ_PAGE__ = "novel-detail"', 'nd-read', 'nd-tour', '灵晶', '人气值', '灵晶值',
               'LJBack', 'novel-game.html?book=', 'mobile-lock.css', 'panel-info', 'panel-roles', 'panel-talk']:
    assert needle in nd, "novel-detail missing: " + needle
print("novel-detail key elements OK")
assert "丸子" not in nd, "novel-detail contains 丸子!"
print("no 丸子 OK")

# 2) world-hub 路由
wh = pages["world-hub"]
assert wh.count("LJ.go('novel-detail', 'book=' + bookId)") == 1
assert "LJ.go('world-view', 'book=' + bookId)" not in wh
print("world-hub route OK")

# 3) novel-game 返回改造
ng = pages["novel-game"]
assert ng.count("LJBack();") >= 2
assert ng.count("/[?&]book=/.test(ngQS())") == 2
assert "function ngQS()" in ng
assert "var qs = ngQS();" in ng
print("novel-game back routes OK")

# 4) letterbox CSS（壳层）
assert "V28-A 桌面横屏 letterbox" in html
assert "@media (min-width: 481px)" in html[:start]
print("letterbox CSS OK")

# 5) 提取 novel-detail 所有 <script> 拼 JS 做语法检查
scripts = re.findall(r"<script>(.*?)</script>", nd, re.S)
assert len(scripts) >= 3, "expected >=3 script blocks, got %d" % len(scripts)
js = "\n;\n".join(scripts)
tmp = os.path.join(BASE, ".workbuddy", "tmp")
os.makedirs(tmp, exist_ok=True)
jp = os.path.join(tmp, "v28_novel_detail.js")
io.open(jp, "w", encoding="utf-8").write(js)
node = r"C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2-2\node.exe"
r = subprocess.run([node, "--check", jp], capture_output=True, text=True)
print("node --check exit:", r.returncode)
if r.returncode != 0:
    print(r.stderr[:2000])
    raise SystemExit(1)
print("ALL V28 BUILD CHECKS PASSED")
