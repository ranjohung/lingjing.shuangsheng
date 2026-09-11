"""
测试：连续多次点击 5 Tab 是否会出现 URL 跳到 output/product-preview.html
模拟用户：「多点击几次主页功能区就变成这样看不到内容了」
"""
import asyncio
from playwright.async_api import async_playwright

BASE = 'http://localhost:8767'

async def click_5_tabs_repeatedly(page, repeat=8):
    urls = []
    for r in range(repeat):
        for sel in ['.tabbar a[data-tab="xinyu"]',
                    '.tabbar a[data-tab="home"]',
                    '.tabbar a[data-tab="world"]',
                    '.tabbar a[data-tab="create"]',
                    '.tabbar a[data-tab="me"]',
                    '.tabbar a[data-tab="home"]']:
            try:
                el = await page.query_selector(sel)
                if el:
                    await el.click()
                    await page.wait_for_load_state('domcontentloaded')
                    await page.wait_for_timeout(150)
                    u = page.url.replace(BASE, '')
                    urls.append(u)
            except Exception as e:
                urls.append(f'ERR: {e}')
        # 测一次
        if 'output/product-preview.html' in page.url:
            print(f'!!! 第 {r+1} 轮命中错误 URL: {page.url}')
    return urls


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = await browser.new_context(viewport={'width': 414, 'height': 896})
        page = await ctx.new_page()

        # 直接进 product-preview.html（根）
        print('=' * 60)
        print('场景 1：根目录进 product-preview.html → 多点击 5 Tab')
        print('=' * 60)
        await page.goto(f'{BASE}/product-preview.html')
        await page.wait_for_load_state('networkidle')
        await page.wait_for_timeout(800)
        urls = await click_5_tabs_repeatedly(page, 6)
        for u in urls[-12:]:
            print(f'  {u}')

        # 不通过 server，直接 file:// 路径点击（最接近用户截图场景）
        print()
        print('=' * 60)
        print('场景 2：从 output/preview/heart-island.html → 多次点首页')
        print('=' * 60)
        await page.goto(f'{BASE}/output/preview/heart-island.html')
        await page.wait_for_load_state('networkidle')
        await page.wait_for_timeout(800)
        # 连续点 10 次首页 Tab
        home_urls = []
        for i in range(10):
            try:
                el = await page.query_selector('.tabbar a[data-tab="home"]')
                if el:
                    href = await el.get_attribute('href')
                    home_urls.append(f'点 home{i+1} → href={href} → 现在={page.url}')
                    await el.click()
                    await page.wait_for_load_state('domcontentloaded')
                    await page.wait_for_timeout(150)
            except Exception as e:
                home_urls.append(f'点 home{i+1} → ERR: {e}')
        for u in home_urls:
            print(f'  {u}')
        print(f'最终 URL: {page.url}')

        await browser.close()


asyncio.run(main())
