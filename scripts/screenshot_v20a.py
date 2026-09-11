"""
V20-A · 截图脚本（5 张）
"""
import asyncio
from playwright.async_api import async_playwright

BASE = 'http://localhost:8767/output/preview'
OUT = 'output/preview/screenshots'


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = await browser.new_context(viewport={'width': 414, 'height': 1100})
        page = await ctx.new_page()

        # 1. 中国古典（默认完整性排序）
        await page.goto(f'{BASE}/public-domain.html')
        await page.wait_for_function('window.LJPubDom && window.LJPubDom.__mounted', timeout=5000)
        await page.wait_for_timeout(500)
        await page.screenshot(path=f'{OUT}/v20-a-pd-zh.png', full_page=False)
        print('✓ v20-a-pd-zh.png')

        # 2. 外国经典
        await page.click('.pd-tab[data-tab="en"]')
        await page.wait_for_timeout(400)
        await page.screenshot(path=f'{OUT}/v20-a-pd-en.png', full_page=False)
        print('✓ v20-a-pd-en.png')

        # 3. 下载管理（40 本）
        await page.click('.pd-tab[data-tab="all"]')
        await page.wait_for_timeout(400)
        await page.screenshot(path=f'{OUT}/v20-a-pd-all.png', full_page=False)
        print('✓ v20-a-pd-all.png')

        # 4. 详情 modal · 红楼梦
        await page.click('.pd-tab[data-tab="zh"]')
        await page.wait_for_timeout(300)
        await page.click('.pd-card[data-id="hongloumeng"]')
        await page.wait_for_timeout(500)
        await page.screenshot(path=f'{OUT}/v20-a-pd-detail-hongloumeng.png', full_page=False)
        print('✓ v20-a-pd-detail-hongloumeng.png')

        # 5. 详情 modal · 傲慢与偏见
        await page.click('.pd-detail-close')
        await page.wait_for_timeout(300)
        await page.click('.pd-tab[data-tab="en"]')
        await page.wait_for_timeout(300)
        await page.click('.pd-card[data-id="pride-prejudice"]')
        await page.wait_for_timeout(500)
        await page.screenshot(path=f'{OUT}/v20-a-pd-detail-pride.png', full_page=False)
        print('✓ v20-a-pd-detail-pride.png')

        await browser.close()
        print('\n✅ 5 张 V20-A 截图完成')


if __name__ == '__main__':
    asyncio.run(main())