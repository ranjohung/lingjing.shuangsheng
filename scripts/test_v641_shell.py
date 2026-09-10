# -*- coding: utf-8 -*-
"""v6.4.1 — 5 Tab 主功能区视觉回归（共享壳 v6.4）"""
import os, time, sys
from playwright.sync_api import sync_playwright

ROOT = "F:/开发软件项目文件/灵境 · 双生"
BASE = "http://127.0.0.1:8792"
OUT = os.path.join(ROOT, "output/preview/screenshots/v641")
os.makedirs(OUT, exist_ok=True)

PAGES = [
    ("product-preview.html", "01-home"),
    ("output/preview/library.html", "02-world"),
    ("output/preview/heart-island.html", "03-xinyu"),
    ("output/preview/creator-center.html", "04-create"),
    ("output/preview/me.html", "05-me"),
]

errors = []
results = {}

with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
    for path, name in PAGES:
        pg = b.new_page(viewport={"width": 412, "height": 915}, device_scale_factor=2)
        pg.on("pageerror", lambda e: errors.append((name, str(e))))
        pg.on("console", lambda m, n=name: errors.append((n, m.text)) if m.type == "error" else None)
        pg.goto(f"{BASE}/{path}", wait_until="domcontentloaded")
        time.sleep(0.7)
        # 验证壳
        checks = {
            "topbar 存在": pg.locator(".topbar").count() == 1,
            "5 Tab 底部": pg.locator(".tabbar .tab").count() == 5,
            "active tab 唯一": pg.locator(".tabbar .tab.active").count() == 1,
            "title 有点+文字": "首页" in pg.locator(".topbar-title").first.text_content() or "世界" in pg.locator(".topbar-title").first.text_content() or "心屿" in pg.locator(".topbar-title").first.text_content() or "创作" in pg.locator(".topbar-title").first.text_content() or "我的" in pg.locator(".topbar-title").first.text_content(),
        }
        results[name] = checks
        pg.screenshot(path=os.path.join(OUT, f"{name}.png"), full_page=True)
        pg.close()
    b.close()

print("=== 5 Tab 主功能区视觉回归 ===")
total_pass = total_fail = 0
for name, checks in results.items():
    print(f"\n[{name}]")
    for k, v in checks.items():
        tag = "PASS" if v else "FAIL"
        if v: total_pass += 1
        else: total_fail += 1
        print(f"  {tag} - {k}")

print(f"\n=== 总计: {total_pass} PASS / {total_fail} FAIL ===")
print(f"=== console errors: {len(errors)}")
for n, e in errors[:8]: print(f"  [{n}] {e[:140]}")
print(f"=== 截图: {OUT}")
sys.exit(0 if total_fail == 0 and not errors else 1)
