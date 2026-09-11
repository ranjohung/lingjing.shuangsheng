"""截图 product-preview.html 数据看板（更新到 100/100）"""
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
        # 截数据看板区
        loc = page.locator(".section-h").nth(6)
        try:
            await loc.scroll_into_view_if_needed(timeout=3000)
            await page.wait_for_timeout(300)
            box = await loc.bounding_box()
            if box:
                # 截从 section-h 上方 100 到下方 350 的整片区域
                await page.screenshot(
                    path=str(OUT / "v17a-fix-data-board.png"),
                    clip={"x": 0, "y": max(0, box["y"] - 20), "width": 480, "height": 350}
                )
        except Exception as e:
            print(f"fallback: {e}")
            await page.screenshot(path=str(OUT / "v17a-fix-data-board.png"), full_page=True)
        print("data board screenshot saved")
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
