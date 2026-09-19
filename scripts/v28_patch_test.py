# -*- coding: utf-8 -*-
"""修正 test_v28_desktop.py：step 放到 path query（强制完整导航）"""
import io

p = "scripts/test_v28_desktop.py"
s = io.open(p, encoding="utf-8").read()
s = s.replace(
    "def F(page, sel):",
    'def nav(page, base, route, step):\n'
    '    """query 变化 -> 完整导航 -> LJEnter；route 形如 novel-detail?book=xiyouji"""\n'
    '    page.goto("%s?step=%s#/%s" % (base, step, route))\n\n\n'
    "def F(page, sel):",
)
s = s.replace(
    'page.goto("%s#/novel-detail?book=xiyouji&step=%d" % (base, step))',
    'nav(page, base, "novel-detail?book=xiyouji", step)',
)
s = s.replace(
    'page.goto("%s#/novel-detail?book=xiyouji&step=%d2" % (base, step))',
    'nav(page, base, "novel-detail?book=xiyouji", str(step) + "2")',
)
s = s.replace(
    'page.goto("%s#/world-hub?step=%d3" % (base, step))',
    'nav(page, base, "world-hub", str(step) + "3")',
)
s = s.replace(
    'p2.goto("%s#/novel-detail?book=hongloumeng&step=%d5" % (base, step))',
    'nav(p2, base, "novel-detail?book=hongloumeng", str(step) + "5")',
)
io.open(p, "w", encoding="utf-8", newline="").write(s)
print("patched nav calls:", s.count("nav(page, base,"), s.count("nav(p2, base,"))
