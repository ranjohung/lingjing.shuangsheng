"""
V20-B 回归：多次点击 5 Tab 不会再被 dialog 拦截
- 修复 1：tabbar z-index 200 永远在最顶层
- 修复 2：mask 点击空白关闭
"""
import asyncio
from playwright.async_api import async_playwright

BASE = 'http://localhost:8767'


async def main():
    fail = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = await browser.new_context(viewport={'width': 414, 'height': 896})
        page = await ctx.new_page()

        # 进入心屿，触发首次弹窗（V18-B intro dialog）
        print('[1] 进心屿 → 触发首次弹窗')
        await page.goto(f'{BASE}/output/preview/heart-island.html')
        await page.wait_for_function('window.LJHeart && window.LJHeart.__mounted', timeout=5000)
        await page.wait_for_timeout(1200)

        # 检查弹窗存在
        has_dlg = await page.query_selector('.heart-dialog-mask')
        if not has_dlg:
            print('  WARN: 弹窗未自动弹出（已 seen 过？），手动打开一个')
            # 用 JS 强行触发（heart.js 是 IIFE，openDialog 是闭包私有，需用 window.LJHeart 公开方法）
            await page.evaluate('window.LJHeart && window.LJHeart.openIntroDialog && window.LJHeart.openIntroDialog()')
            await page.wait_for_timeout(400)

        dlg_count = await page.eval_on_selector_all('.heart-dialog-mask', 'els => els.length')
        print(f'  当前弹窗数：{dlg_count}')

        # 关键测试：弹窗存在时，点击 5 Tab 首页 Tab 应该能跳转（不被 mask 拦截）
        print('\n[2] 弹窗存在时 → 点 5 Tab 首页 Tab')
        el = await page.query_selector('.tabbar a[data-tab="home"]')
        if not el:
            fail.append('tabbar 渲染失败')
        else:
            href = await el.get_attribute('href')
            z = await el.evaluate('el => el.closest("nav.tabbar").style.zIndex')
            print(f'  href={href}, tabbar z-index={z}')
            await el.click()
            try:
                await page.wait_for_url('**/product-preview.html', timeout=5000)
                print(f'  ✅ 跳转成功：{page.url}')
            except Exception as e:
                u = page.url
                fail.append(f'❌ 弹窗存在时点首页没跳：URL={u}')

        # 测试 2：mask 点击空白关闭
        print('\n[3] 重进心屿 → 弹窗显示后点 mask 空白关闭')
        await page.goto(f'{BASE}/output/preview/heart-island.html')
        await page.wait_for_function('window.LJHeart && window.LJHeart.__mounted', timeout=5000)
        await page.wait_for_timeout(1200)
        # 强行触发一次弹窗
        await page.evaluate('window.LJHeart && window.LJHeart.openIntroDialog && window.LJHeart.openIntroDialog()')
        await page.wait_for_timeout(300)
        before = await page.eval_on_selector_all('.heart-dialog-mask', 'els => els.length')
        print(f'  当前弹窗：{before}')
        if before > 0:
            # 点 mask 边缘（不在 dialog 内）
            await page.click('.heart-dialog-mask', position={'x': 10, 'y': 10})
            await page.wait_for_timeout(300)
            after = await page.eval_on_selector_all('.heart-dialog-mask', 'els => els.length')
            print(f'  点 mask 边缘后弹窗数：{after}')
            if after >= before:
                fail.append('❌ 点 mask 空白处未关闭弹窗')

        # 测试 3：连击 5 Tab home 多次
        print('\n[4] 主页连点 5 Tab home 多次（不应跳到错误路径）')
        await page.goto(f'{BASE}/product-preview.html')
        await page.wait_for_load_state('networkidle')
        await page.wait_for_timeout(500)
        bad_url = []
        for i in range(6):
            try:
                el = await page.query_selector('.tabbar a[data-tab="home"]')
                if el:
                    await el.click()
                    await page.wait_for_load_state('domcontentloaded')
                    await page.wait_for_timeout(120)
                    u = page.url
                    if 'output/product-preview.html' in u or '%20' in u or 'output/preview/product-preview' in u:
                        bad_url.append(f'  第{i+1}次命中错误 URL：{u}')
            except Exception:
                pass
        if bad_url:
            fail.append('❌ 主页连点 home → 命中错误 URL：\n' + '\n'.join(bad_url))
        else:
            print(f'  ✅ 6 次连击 home，最终 URL：{page.url}')

        await browser.close()

    print('\n' + '=' * 60)
    if fail:
        print('FAIL:')
        for f in fail:
            print('  ' + f)
    else:
        print('✅ V20-B 回归 4 项全 PASS')


asyncio.run(main())
