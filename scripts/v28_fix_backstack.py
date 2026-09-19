# -*- coding: utf-8 -*-
"""V28-B 壳层 back 栈修复：LJBack 触发的 LJ.go 不再压栈（否则返回链在 详情<->游戏 间死循环）"""
import io, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATH = os.path.join(BASE, "index.html")
html = io.open(PATH, encoding="utf-8").read()

# 1) LJ.go 签名加 __noPush
old1 = "LJ.go = function (id, qs, hash) {"
assert html.count(old1) == 1, "anchor1 x%d" % html.count(old1)
html = html.replace(old1, "LJ.go = function (id, qs, hash, __noPush) {")
print("1 LJ.go 签名 OK")

# 2) push 条件排除 back 触发
old2 = "if (CUR && CUR !== id && !LJ_BACK_SKIP.includes(CUR)) {"
assert html.count(old2) == 1, "anchor2 x%d" % html.count(old2)
html = html.replace(old2, "if (CUR && CUR !== id && !LJ_BACK_SKIP.includes(CUR) && !__noPush) {")
print("2 push 条件 OK")

# 3) message back 弹栈路径传入 noPush
old3 = """        LJ.go(prev.id, prev.qs || '');
        return;"""
assert html.count(old3) == 1, "anchor3 x%d" % html.count(old3)
html = html.replace(old3, """        LJ.go(prev.id, prev.qs || '', '', true);
        return;""")
print("3 back 弹栈 noPush OK")

io.open(PATH, "w", encoding="utf-8", newline="").write(html)
print("index.html -> %d chars" % len(html))
