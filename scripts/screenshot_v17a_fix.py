"""
V17-A 路径修复后的 4 张截图存证
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path("F:/开发软件项目文件/灵境 · 双生/output/preview/screenshots")
OUT.mkdir(parents=True, exist_ok=True)


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=["--no-sandbox"])
        ctx = await browser.new_context(viewport={"width": 390, "height": 844})
        page = await ctx.new_page()

        # 1. 主页打开（根目录 product-preview.html）
        await page.goto("http://localhost:8767/product-preview.html", wait_until="domcontentloaded")
        await page.wait_for_selector(".tabbar a[data-tab]", timeout=5000)
        await page.screenshot(path=str(OUT / "v17-a-fix-home.png"), full_page=False)

        # 2. 主页点心屿跳转到 subdir 后的页面
        await page.locator(".tabbar a[data-tab='xinyu']").click()
        await page.wait_for_load_state("domcontentloaded")
        await page.wait_for_selector(".tabbar a[data-tab]", timeout=5000)
        await page.screenshot(path=str(OUT / "v17-a-fix-xinyu.png"), full_page=False)

        # 3. 心屿点 home 回到根目录
        await page.locator(".tabbar a[data-tab='home']").click()
        await page.wait_for_load_state("domcontentloaded")
        await page.wait_for_selector(".tabbar a[data-tab]", timeout=5000)
        cur = page.url
        await page.screenshot(path=str(OUT / "v17-a-fix-back-to-home.png"), full_page=False)
        print(f"back to: {cur}")

        # 4. 主页点世界
        await page.locator(".tabbar a[data-tab='world']").click()
        await page.wait_for_load_state("domcontentloaded")
        await page.wait_for_selector(".tabbar a[data-tab]", timeout=5000)
        cur = page.url
        await page.screenshot(path=str(OUT / "v17-a-fix-world.png"), full_page=False)
        print(f"world: {cur}")

        await browser.close()
        print("\n4 screenshots saved to output/preview/screenshots/")


if __name__ == "__main__":
    asyncio.run(main())
