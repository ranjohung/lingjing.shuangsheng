"""
V17.0 严格实施重做后，重截 5 张世界区实景图：
1. v17-b-world-home.png — 主页 3 板块瀑布流
2. v17-b-world-filter.png — §2.6 筛选结果页
3. v17-b-world-calendar.png — §2.3 更新日历
4. v17-b-world-tongren.png — §2.7 同人区侧边栏
5. v17-b-world-drawer.png — §2.5 分类抽屉
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path("F:/开发软件项目文件/灵境 · 双生/output/preview/screenshots")


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=["--no-sandbox"])
        ctx = await browser.new_context(viewport={"width": 390, "height": 844})
        page = await ctx.new_page()

        URL = "http://localhost:8767/output/preview/library.html"
        await page.goto(URL, wait_until="domcontentloaded")
        await page.wait_for_function("window.LJWorld && window.LJWorld.__mounted", timeout=5000)
        await page.wait_for_selector(".ds-waterfall .ds-wf-card", timeout=5000)

        # 1. 主页（3 板块瀑布流）
        await page.evaluate("window.scrollTo(0, 0)")
        await page.wait_for_timeout(500)
        await page.screenshot(path=str(OUT / "v17-b-world-home.png"), full_page=False)
        print("1. home (3 板块) ✓")

        # 4. 分类抽屉
        await page.click('.ds-qg-item[data-action="cat"]')
        await page.wait_for_selector(".ds-drawer.open", timeout=3000)
        await page.wait_for_timeout(500)
        await page.screenshot(path=str(OUT / "v17-b-world-drawer.png"), full_page=False)
        print("2. drawer ✓")
        # 关闭抽屉
        await page.click("#ds-drawer-close")
        await page.wait_for_timeout(300)

        # 2. 筛选结果页
        await page.click('.ds-qg-item[data-action="cat"]')
        await page.wait_for_selector(".ds-drawer.open", timeout=3000)
        await page.click(".ds-d-tag")
        await page.wait_for_selector(".filter-sort-bar", timeout=3000)
        await page.wait_for_timeout(500)
        await page.screenshot(path=str(OUT / "v17-b-world-filter.png"), full_page=False)
        print("3. filter page ✓")

        # 返回主页
        await page.click(".filter-back")
        await page.wait_for_selector(".ds-waterfall .ds-wf-card", timeout=3000)

        # 3. 更新日历
        await page.click('.ds-qg-item[data-action="calendar"]')
        await page.wait_for_selector(".cal-item", timeout=3000)
        await page.wait_for_timeout(500)
        await page.screenshot(path=str(OUT / "v17-b-world-calendar.png"), full_page=False)
        print("4. calendar ✓")

        # 返回主页
        await page.click(".ds-sn[data-sn='home']")
        await page.wait_for_selector(".ds-waterfall .ds-wf-card", timeout=3000)

        # 5. 同人区
        await page.click(".ds-sn[data-sn='tongren']")
        await page.wait_for_selector(".tr-layout", timeout=3000)
        await page.wait_for_timeout(500)
        await page.screenshot(path=str(OUT / "v17-b-world-tongren.png"), full_page=False)
        print("5. tongren ✓")

        await browser.close()
        print("\n5 张世界区实景图保存完毕")


if __name__ == "__main__":
    asyncio.run(main())
