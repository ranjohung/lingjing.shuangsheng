"""数据看板截图（v4 — element_handle.screenshot，最稳健）"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path("F:/开发软件项目文件/灵境 · 双生/output/preview/screenshots")


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=["--no-sandbox"])
        ctx = await browser.new_context(viewport={"width": 480, "height": 900})
        page = await ctx.new_page()
        await page.goto("http://localhost:8767/product-preview.html", wait_until="domcontentloaded")
        await page.wait_for_timeout(800)
        # 取 section header + kv-list 一起
        section = page.locator(".section-h:has-text('累计回归')").first
        await section.scroll_into_view_if_needed()
        await page.wait_for_timeout(300)
        # 直接对 element screenshot
        await section.screenshot(path=str(OUT / "data-board-section.png"))
        # 整个数据看板（包括 section + kv-list）
        # 找 .section-h 之后第一个 .kv-list
        kvs = page.locator(".kv-list").first
        await kvs.scroll_into_view_if_needed()
        await page.wait_for_timeout(200)
        await kvs.screenshot(path=str(OUT / "data-board-list.png"))
        print("✓ data-board-section.png + data-board-list.png saved")
        await browser.close()


asyncio.run(main())
