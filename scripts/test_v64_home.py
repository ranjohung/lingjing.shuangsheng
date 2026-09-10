# -*- coding: utf-8 -*-
"""v6.4 首页视觉回归：启动页 + 首页（跳过启动页）· mobile 412x915 + desktop 1280x800"""
import sys, os, time
from playwright.sync_api import sync_playwright

ROOT = "F:/开发软件项目文件/灵境 · 双生"
URL = "http://127.0.0.1:8790/product-preview.html"
OUT = os.path.join(ROOT, "output/preview/screenshots/v64")
os.makedirs(OUT, exist_ok=True)

errors = []

with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
    # ---- mobile ----
    pg = b.new_page(viewport={"width": 412, "height": 915}, device_scale_factor=2)
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(URL, wait_until="networkidle")
    time.sleep(1.0)
    pg.screenshot(path=os.path.join(OUT, "01-splash-mobile.png"))
    # 跳过启动页
    pg.evaluate("enterLingjing()")
    time.sleep(0.9)
    pg.screenshot(path=os.path.join(OUT, "02-home-mobile.png"), full_page=True)
    # 验证关键元素
    checks = {
        "tabbar 5 tab": pg.locator(".tabbar .tab").count() == 5,
        "快捷入口 3 卡": pg.locator(".quick-card").count() == 3,
        "推荐卡 >=3": pg.locator(".rec-card").count() >= 3,
        "心屿动态 >=1": pg.locator(".moment-card").count() >= 1,
        "进度条 45%": pg.evaluate("document.getElementById('cc-fill').style.width") == "45%",
        "问候语非空": pg.evaluate("document.getElementById('greet-hi').textContent.length") > 0,
    }
    pg.close()
    # ---- desktop ----
    pg2 = b.new_page(viewport={"width": 1280, "height": 800})
    pg2.goto(URL, wait_until="networkidle")
    time.sleep(1.0)
    pg2.evaluate("enterLingjing()")
    time.sleep(0.9)
    pg2.screenshot(path=os.path.join(OUT, "03-home-desktop.png"))
    pg2.close()
    b.close()

print("=== 元素检查 ===")
ok = True
for k, v in checks.items():
    print(("PASS" if v else "FAIL"), "-", k)
    if not v: ok = False
print("=== console errors:", len(errors))
for e in errors[:5]: print("  ", e[:150])
print("=== 截图输出:", OUT)
sys.exit(0 if ok and not errors else 1)
