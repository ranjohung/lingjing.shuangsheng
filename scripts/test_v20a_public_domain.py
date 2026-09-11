"""
V20-A · public-domain.html 公版库回归测试（12 项）
覆盖：加载 / 概览卡 / 3 Tab / 双列瀑布流 / 4 种排序 / 详情 modal
"""
import asyncio
from playwright.async_api import async_playwright

BASE = 'http://localhost:8767/output/preview'


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = await browser.new_context(viewport={'width': 414, 'height': 896})
        page = await ctx.new_page()

        passed = 0
        try:
            await page.goto(f'{BASE}/public-domain.html')
            await page.wait_for_function('window.LJPubDom && window.LJPubDom.__mounted', timeout=5000)

            # 1. 加载成功
            title = await page.text_content('.topbar-title span')
            assert title == '公版名著库', f'❌ FAIL: 标题错误 {title}'
            print(f'  1. 标题渲染: {title} ✓')
            passed += 1

            # 2. 概览卡 4 维
            stat_items = await page.locator('.pd-stat-item').count()
            assert stat_items == 4, f'❌ FAIL: 概览卡 4 项，实际 {stat_items}'
            stats_label = await page.eval_on_selector_all('.pd-stat-label', 'els => els.map(e => e.textContent)')
            assert '总计' in stats_label and '平均保留率' in stats_label, f'❌ FAIL: 概览卡 label 不全'
            print(f'  2. 概览卡 4 维: {stats_label} ✓')
            passed += 1

            # 3. 中国古典默认 25 本
            zh_cards = await page.locator('.pd-card').count()
            assert zh_cards == 25, f'❌ FAIL: 中国古典应有 25 本，实际 {zh_cards}'
            print(f'  3. 中国古典 25 本 ✓')
            passed += 1

            # 4. 切到外国经典 → 15 本
            await page.click('.pd-tab[data-tab="en"]')
            await page.wait_for_timeout(300)
            en_cards = await page.locator('.pd-card').count()
            assert en_cards == 15, f'❌ FAIL: 外国经典应有 15 本，实际 {en_cards}'
            print(f'  4. 外国经典 15 本 ✓')
            passed += 1

            # 5. 切回中国古典 + 字数排序
            await page.click('.pd-tab[data-tab="zh"]')
            await page.wait_for_timeout(200)
            await page.click('.pd-sort-btn[data-sort="words"]')
            await page.wait_for_timeout(300)
            # 字数降序：第一本应是字数最高的（资治通鉴 300 万字）
            first_title = await page.text_content('.pd-card:nth-child(1) .pd-card-title')
            assert first_title == '资治通鉴', f'❌ FAIL: 字数降序首位应为资治通鉴，实际 {first_title}'
            print(f'  5. 字数降序首位: {first_title} (300 万字) ✓')
            passed += 1

            # 6. 章节数排序
            await page.click('.pd-sort-btn[data-sort="chapters"]')
            await page.wait_for_timeout(300)
            first_title = await page.text_content('.pd-card:nth-child(1) .pd-card-title')
            assert first_title == '世说新语', f'❌ FAIL: 章节降序首位应为世说新语(1130)，实际 {first_title}'
            print(f'  6. 章节数降序首位: {first_title} (1130 篇) ✓')
            passed += 1

            # 7. 价格升序（道德经 / 孙子兵法 5 灵晶）
            await page.click('.pd-sort-btn[data-sort="price"]')
            await page.wait_for_timeout(300)
            first_price = await page.text_content('.pd-card:nth-child(1) .pd-mon-info')
            assert '5' in first_price, f'❌ FAIL: 价格升序首位应为 5 灵晶，实际 {first_price}'
            print(f'  7. 价格升序首位: {first_price} ✓')
            passed += 1

            # 8. 完整性排序（红楼梦 98.7% 排前）
            await page.click('.pd-sort-btn[data-sort="integrity"]')
            await page.wait_for_timeout(300)
            # 第一本应是道德经或孙子（99.8% / 99.7%）
            first_badge = await page.text_content('.pd-card:nth-child(1) .pd-card-badge')
            pct_val = int(first_badge.replace('%', '').replace('✅', '').replace('⚠️', '').replace('✗', '').strip())
            assert pct_val >= 99, f'❌ FAIL: 完整性首位应 ≥ 99%，实际 {pct_val}%'
            print(f'  8. 完整性降序首位: {first_badge} ✓')
            passed += 1

            # 9. 切到下载管理 → 40 本
            await page.click('.pd-tab[data-tab="all"]')
            await page.wait_for_timeout(300)
            all_cards = await page.locator('.pd-card').count()
            assert all_cards == 40, f'❌ FAIL: 下载管理应有 40 本，实际 {all_cards}'
            print(f'  9. 下载管理 40 本 ✓')
            passed += 1

            # 10. 详情 modal 打开
            await page.click('.pd-tab[data-tab="zh"]')
            await page.wait_for_timeout(200)
            await page.click('.pd-card[data-id="hongloumeng"]')
            await page.wait_for_timeout(400)
            modal_open = await page.evaluate('document.getElementById("pd-detail-modal").classList.contains("open")')
            assert modal_open, '❌ FAIL: 详情 modal 未打开'
            detail_title = await page.text_content('.pd-detail-card h3')
            assert detail_title == '红楼梦', f'❌ FAIL: 详情标题应为红楼梦，实际 {detail_title}'
            print(f' 10. 详情 modal 打开: {detail_title} ✓')
            passed += 1

            # 11. 4 维完整性报告
            i_rows = await page.locator('.pd-i-row').count()
            assert i_rows == 4, f'❌ FAIL: 完整性 4 行，实际 {i_rows}'
            i_labels = await page.eval_on_selector_all('.pd-i-label', 'els => els.map(e => e.textContent)')
            assert '文件大小' in i_labels and '章节数' in i_labels and '总字数' in i_labels and '原文保留率' in i_labels
            print(f' 11. 4 维完整性报告 ✓')
            passed += 1

            # 12. 关闭 modal + 点击切到外国经典 + 全部集成测试
            await page.click('.pd-detail-close')
            await page.wait_for_timeout(200)
            modal_closed = await page.evaluate('!document.getElementById("pd-detail-modal").classList.contains("open")')
            assert modal_closed, '❌ FAIL: modal 未关闭'
            await page.click('.pd-tab[data-tab="en"]')
            await page.wait_for_timeout(300)
            await page.click('.pd-card[data-id="pride-prejudice"]')
            await page.wait_for_timeout(400)
            detail_title = await page.text_content('.pd-detail-card h3')
            assert detail_title == '傲慢与偏见', f'❌ FAIL: 外国经典详情标题错误 {detail_title}'
            print(f' 12. 外国书详情 modal ✓')
            passed += 1

        except AssertionError as e:
            print(f'\n❌ 断言失败: {e}')

        await browser.close()
        print()
        print('=' * 60)
        print(f'V20-A 测试通过: {passed} 项')
        print('=' * 60)


if __name__ == '__main__':
    asyncio.run(main())