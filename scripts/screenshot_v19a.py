"""
V19-A · 截图脚本
9 张图：
  plot-detail: detail / roles / ranks / interact
  plot-runner: realname / loading-40 / loading-100 / cover / full-flow
"""
import asyncio
from playwright.async_api import async_playwright

BASE = 'http://localhost:8767/output/preview'
OUT = 'output/preview/screenshots'


async def shoot_detail(page):
    await page.goto(f'{BASE}/plot-detail.html?novel=changyecheng')
    await page.wait_for_function('window.LJPlotDetail && window.LJPlotDetail.__mounted', timeout=5000)
    await page.wait_for_timeout(500)

    # 1. 详情 tab
    await page.screenshot(path=f'{OUT}/v19-a-plot-detail-detail.png', full_page=False)
    print('✓ v19-a-plot-detail-detail.png')

    # 2. 角色表白 tab
    await page.click('.pl-tab[data-tab="roles"]')
    await page.wait_for_timeout(400)
    await page.screenshot(path=f'{OUT}/v19-a-plot-detail-roles.png', full_page=False)
    print('✓ v19-a-plot-detail-roles.png')

    # 3. 榜单 tab
    await page.click('.pl-tab[data-tab="ranks"]')
    await page.wait_for_timeout(400)
    await page.screenshot(path=f'{OUT}/v19-a-plot-detail-ranks.png', full_page=False)
    print('✓ v19-a-plot-detail-ranks.png')

    # 4. 互动区详情
    await page.click('.pl-tab[data-tab="detail"]')
    await page.wait_for_timeout(300)
    # 滚动到互动区
    await page.evaluate('() => document.querySelector(".pl-section-title").scrollIntoView()')
    await page.wait_for_timeout(300)
    await page.screenshot(path=f'{OUT}/v19-a-plot-detail-interact.png', full_page=False)
    print('✓ v19-a-plot-detail-interact.png')


async def shoot_runner(page):
    # 重置 localStorage 以强制首次体验
    await page.goto(f'{BASE}/plot-runner.html')
    await page.evaluate('() => localStorage.clear()')
    await page.goto(f'{BASE}/plot-runner.html')
    await page.wait_for_timeout(500)

    # 5. 实名认证弹窗
    await page.screenshot(path=f'{OUT}/v19-a-realname.png', full_page=False)
    print('✓ v19-a-realname.png')

    # 6. 提交后 Loading 40%
    await page.fill('#rn-name', '张三')
    await page.fill('#rn-id', '110101199003078888')
    await page.click('#rn-submit')
    await page.wait_for_timeout(500)
    # 等待进度到 40-60
    await page.wait_for_function('document.getElementById("plot-progress-text").textContent.match(/^[4-6]\\d%$/)', timeout=3000)
    await page.screenshot(path=f'{OUT}/v19-a-loading-50.png', full_page=False)
    print('✓ v19-a-loading-50.png')

    # 7. Loading 100%
    await page.wait_for_function('document.getElementById("plot-progress-text").textContent === "100%"', timeout=5000)
    await page.wait_for_timeout(200)
    await page.screenshot(path=f'{OUT}/v19-a-loading-100.png', full_page=False)
    print('✓ v19-a-loading-100.png')

    # 8. 封面页
    await page.wait_for_function('document.getElementById("plot-cover").classList.contains("open")', timeout=2000)
    await page.wait_for_timeout(400)
    await page.screenshot(path=f'{OUT}/v19-a-cover.png', full_page=False)
    print('✓ v19-a-cover.png')

    # 9. 点击封面后 → 主线剧情
    # 点击封面中间（非工具栏）
    await page.evaluate('''() => {
      var cv = document.getElementById('plot-cover');
      var evt = new MouseEvent('click', {bubbles: true, clientX: 207, clientY: 448});
      cv.dispatchEvent(evt);
    }''')
    await page.wait_for_timeout(500)
    await page.screenshot(path=f'{OUT}/v19-a-main-stage.png', full_page=False)
    print('✓ v19-a-main-stage.png')


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox'])
        context = await browser.new_context(viewport={'width': 414, 'height': 896})
        page = await context.new_page()

        await shoot_detail(page)
        await shoot_runner(page)

        await browser.close()
        print('\n✅ 9 张 V19-A 截图完成')


if __name__ == '__main__':
    asyncio.run(main())