"""v5.16 补充测试：game-3d 进入游戏后的返回箭头"""
from playwright.sync_api import sync_playwright
import os

ROOT = "F:/开发软件项目文件/灵境 · 双生"
OUT = f"{ROOT}/output/preview/screenshots/v516"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    page = ctx.new_page()
    page.goto(f"file://{ROOT}/output/preview/game-3d.html", wait_until="domcontentloaded", timeout=15000)
    page.wait_for_timeout(2500)
    # 点击"重新开始"进入游戏
    page.click("#pickerRestart")
    page.wait_for_timeout(2500)
    # 隐藏 picker
    page.evaluate("() => document.getElementById('picker').classList.add('hidden')")
    page.wait_for_timeout(800)
    page.screenshot(path=f"{OUT}/12-game3d-in-game.png")
    print(f"  游戏中 back-arrow: {page.evaluate('() => !!document.querySelector(\".back-arrow\")')}")
    print(f"  游戏中切换按钮: {page.evaluate('() => document.getElementById(\"hud-scene\")?.innerText')}")
    print(f"  切换按钮 href: {page.evaluate('() => document.getElementById(\"hud-scene\")?.querySelector(\"a\")?.href')}")

    browser.close()
print("done")