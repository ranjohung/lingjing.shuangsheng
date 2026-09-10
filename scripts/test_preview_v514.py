"""Quick smoke test of product-preview.html after rewrite."""
from playwright.sync_api import sync_playwright
import os, sys

ROOT = "F:/开发软件项目文件/灵境 · 双生"
URL = f"file://{ROOT}/product-preview.html"
OUT = f"{ROOT}/output/preview/screenshots/preview"

os.makedirs(OUT, exist_ok=True)

errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    page.on("console", lambda msg: errors.append(f"{msg.type}: {msg.text}") if msg.type == "error" else None)
    page.on("pageerror", lambda err: errors.append(f"pageerror: {err}"))

    page.goto(URL, wait_until="domcontentloaded", timeout=30000)
    page.wait_for_timeout(2500)

    page.screenshot(path=f"{OUT}/01-hero.png", full_page=False)
    print("OK 01-hero.png")

    page.screenshot(path=f"{OUT}/02-full.png", full_page=True)
    print("OK 02-full.png")

    page.evaluate("document.getElementById('v513-orange').scrollIntoView()")
    page.wait_for_timeout(800)
    page.screenshot(path=f"{OUT}/03-v513.png", full_page=False)
    print("OK 03-v513.png")

    page.evaluate("document.getElementById('v514-commerce').scrollIntoView()")
    page.wait_for_timeout(800)
    page.screenshot(path=f"{OUT}/04-v514.png", full_page=False)
    print("OK 04-v514.png")

    page.evaluate("document.getElementById('catalog').scrollIntoView()")
    page.wait_for_timeout(800)
    page.screenshot(path=f"{OUT}/05-catalog.png", full_page=False)
    print("OK 05-catalog.png")

    genre_count = page.evaluate("document.querySelectorAll('#genreGrid .genrecard').length")
    print(f"Genre cards: {genre_count}")

    mobile_ctx = browser.new_context(viewport={"width": 390, "height": 844})
    mobile_page = mobile_ctx.new_page()
    mobile_page.goto(URL, wait_until="networkidle", timeout=15000)
    mobile_page.wait_for_timeout(1500)
    mobile_page.screenshot(path=f"{OUT}/06-mobile.png", full_page=False)
    print("OK 06-mobile.png")

    browser.close()

if errors:
    print(f"\nERRORS ({len(errors)}):")
    for e in errors[:10]:
        print(f"  - {e}")
    sys.exit(1)
else:
    print("\nNo console errors")
