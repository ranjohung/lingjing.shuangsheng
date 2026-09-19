# -*- coding: utf-8 -*-
"""探查11：shell LJ.go / LJEnter / buildDoc 路由核心 + novel-game 别名"""
import io, re

BASE = r"F:\开发软件项目文件\灵境 · 双生"
html = io.open(BASE + r"\index.html", encoding="utf-8").read()

for needle in ["LJEnter", "buildDoc", "LJ_BACK_STACK", "novel-game"]:
    idxs = [mm.start() for mm in re.finditer(re.escape(needle), html)]
    print(f"[{needle}] x{len(idxs)}")
    if needle in ("LJEnter", "buildDoc"):
        j = idxs[0] if idxs else -1
        if j >= 0:
            print(html[max(0, j-200):j+1600])
            print("~~~~~")
