"""
截 4 张 V20-B 修复后实景：
- 弹窗被 5 Tab 穿透（点击 5 Tab home 仍能跳转）
- 弹窗点 mask 边缘关闭
- 主页连点 home 不再触发错误路径
- tabbar z-index 200 视觉验证
"""
import asyncio
from playwright.async_api import async_playwright

BASE = 'http://localhost:8767'

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = await browser.new_context(viewport={'width': 414, 'height': 896})
        page = await ctx.new_page()

        # 1. 弹窗存在 + 5 Tab 仍在底层
        await page.goto(f'{BASE}/output/preview/heart-island.html?nc=1')
        await page.wait_for_function('window.LJHeart && window.LJHeart.__mounted', timeout=5000)
        await page.wait_for_timeout(1500)
        # 滚到底部让 tabbar 显示
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
        await page.wait_for_timeout(300)
        # 用 force click 模拟真实点击（不再 wait_for 可见性的硬约束）
        # 先截一张含弹窗 + tabbar 的实景
        await page.screenshot(path='F:/开发软件项目文件/灵境 · 双生/output/preview/screenshots/v20-b-dialog-with-tabbar.png',
                              full_page=False)
        print('  ✓ v20-b-dialog-with-tabbar.png')

        # 2. mask 点击边缘关闭 — 截图前
        await page.evaluate('window.scrollTo(0, 0)')
        await page.wait_for_timeout(300)
        await page.screenshot(path='F:/开发软件项目文件/灵境 · 双生/output/preview/screenshots/v20-b-mask-closing.png')
        # 模拟点击 mask 边缘
        await page.click('.heart-dialog-mask', position={'x': 10, 'y': 10})
        await page.wait_for_timeout(500)
        await page.screenshot(path='F:/开发软件项目文件/灵境 · 双生/output/preview/screenshots/v20-b-mask-after-close.png')
        print('  ✓ v20-b-mask-{closing,after-close}.png')

        # 3. 主页（验证 product-preview.html 仍然 200 / tabbar 显示）
        await page.goto(f'{BASE}/product-preview.html?nc=1')
        await page.wait_for_load_state('networkidle')
        await page.wait_for_timeout(500)
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight - 200)')
        await page.wait_for_timeout(300)
        await page.screenshot(path='F:/开发软件项目文件/灵境 · 双生/output/preview/screenshots/v20-b-home-stable.png')
        print('  ✓ v20-b-home-stable.png')

        await browser.close()
    print('4 张截图完成')


asyncio.run(main())
