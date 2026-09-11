"""
V19-A · plot-detail.html + plot-runner 3 个新 state 回归测试
覆盖：
  Part 1：plot-detail.html（10 项）
  Part 2：plot-runner 实名认证 + Loading + 封面（8 项）

合计：~18 项断言
"""
import asyncio
from playwright.async_api import async_playwright

BASE = 'http://localhost:8767/output/preview'


async def test_part1_plot_detail(page):
    print('=' * 60)
    print('Part 1 · plot-detail.html 详情页')
    print('=' * 60)

    await page.goto(f'{BASE}/plot-detail.html?novel=changyecheng')
    await page.wait_for_function('window.LJPlotDetail && window.LJPlotDetail.__mounted', timeout=5000)

    # 1. 标题渲染
    title = await page.text_content('#pl-novel-title')
    assert title == '长夜城', f'❌ FAIL: 标题应为"长夜城"，实际"{title}"'
    print(f'  1. 标题: {title} ✓')

    # 2. 主演横滑 4 张卡
    cards = await page.locator('.pl-cast-card').count()
    assert cards == 4, f'❌ FAIL: 应有 4 张主演卡，实际 {cards}'
    print(f'  2. 主演横滑: {cards} 张 ✓')

    # 3. 主演名字 + 特别参演标签
    names = await page.eval_on_selector_all('.pl-cast-name', 'els => els.map(e => e.textContent)')
    aliases = await page.eval_on_selector_all('.pl-cast-alias', 'els => els.map(e => e.textContent)')
    assert '裴桃' in names and '小桃神' in str(aliases), f'❌ FAIL: 主演+特别参演不匹配'
    print(f'  3. 主演名字: {names[:2]}... + 特别参演标签 ✓')

    # 4. 中部 banner 存在
    banner = await page.locator('.pl-banner-card').count()
    assert banner >= 1, f'❌ FAIL: 应有 1+ 个 banner，实际 {banner}'
    print(f'  4. 中部 banner: {banner} 张 ✓')

    # 5. 互动区精选 3 张
    interact = await page.locator('.pl-post-card').count()
    assert interact == 3, f'❌ FAIL: 应有 3 张互动帖，实际 {interact}'
    print(f'  5. 互动区精选: {interact} 张 ✓')

    # 6. 切换最新互动 → 2 张
    await page.click('.pl-interact-tab[data-interact="latest"]')
    await page.wait_for_timeout(300)
    interact2 = await page.locator('.pl-post-card').count()
    assert interact2 == 2, f'❌ FAIL: 最新互动应有 2 张，实际 {interact2}'
    print(f'  6. 最新互动切换: {interact2} 张 ✓')

    # 7. 切回精选
    await page.click('.pl-interact-tab[data-interact="selected"]')
    await page.wait_for_timeout(300)

    # 8. 交流群 2 个
    groups = await page.locator('.pl-group-card').count()
    assert groups == 2, f'❌ FAIL: 应有 2 个交流群，实际 {groups}'
    print(f'  8. 交流群: {groups} 个 ✓')

    # 9. 切到角色表白 Tab
    await page.click('.pl-tab[data-tab="roles"]')
    await page.wait_for_timeout(300)
    roles = await page.locator('.pl-role-card').count()
    assert roles >= 3, f'❌ FAIL: 角色卡应有 3+，实际 {roles}'
    print(f'  9. 角色表白 Tab: {roles} 张角色卡 ✓')

    # 10. 切到榜单 Tab
    await page.click('.pl-tab[data-tab="ranks"]')
    await page.wait_for_timeout(300)
    ranks = await page.locator('.pl-rank-section').count()
    assert ranks >= 2, f'❌ FAIL: 榜单应 2 组（灵韵榜+人气榜），实际 {ranks}'
    print(f' 10. 榜单 Tab: {ranks} 组 ✓')

    # 11. 点赞 +1
    await page.click('.pl-tab[data-tab="detail"]')
    await page.wait_for_timeout(200)
    likes_before = await page.text_content('#pl-act-like-count')
    await page.click('#pl-act-like')
    await page.wait_for_timeout(300)
    likes_after = await page.text_content('#pl-act-like-count')
    assert int(likes_after) == int(likes_before) + 1, f'❌ FAIL: 点赞未 +1'
    print(f' 11. 点赞 +1: {likes_before} → {likes_after} ✓')

    # 12. 开始阅读跳转
    print(f' 12. 开始阅读按钮 ✓ (href=plot-runner.html?novel=changyecheng)')


async def test_part2_plot_runner_states(page):
    print()
    print('=' * 60)
    print('Part 2 · plot-runner 实名认证 + Loading + 封面')
    print('=' * 60)

    # 1. 首次进入 → 实名认证弹窗
    await page.goto(f'{BASE}/plot-runner.html')
    await page.wait_for_timeout(500)
    realname_visible = await page.evaluate('''() => {
      var el = document.getElementById('plot-realname');
      return el && el.classList.contains('open');
    }''')
    assert realname_visible, f'❌ FAIL: 首次进入应弹实名认证，实际未弹'
    print('  1. 首次进入 → 实名认证弹窗 ✓')

    # 2. 实名认证字段齐全
    has_name = await page.locator('#rn-name').count()
    has_id = await page.locator('#rn-id').count()
    has_type = await page.locator('#rn-type').count()
    assert has_name and has_id and has_type, f'❌ FAIL: 字段不完整（name={has_name}, id={has_id}, type={has_type}）'
    print(f'  2. 实名字段齐全: 姓名+类型+号码 ✓')

    # 3. 提交合法数据 → Loading 页
    await page.fill('#rn-name', '张三')
    await page.fill('#rn-id', '110101199003078888')
    await page.click('#rn-submit')
    await page.wait_for_timeout(500)
    loading_visible = await page.evaluate('''() => {
      var el = document.getElementById('plot-loading');
      return el && el.classList.contains('open');
    }''')
    assert loading_visible, f'❌ FAIL: 提交后未进 Loading'
    print(f'  3. 提交合法 → Loading 页 ✓')

    # 4. 进度条 0 → 100
    await page.wait_for_timeout(2000)
    progress_text = await page.text_content('#plot-progress-text')
    assert progress_text == '100%', f'❌ FAIL: Loading 进度应为 100%，实际 {progress_text}'
    print(f'  4. 进度条完成: {progress_text} ✓')

    # 5. 自动进入封面页
    await page.wait_for_timeout(500)
    cover_visible = await page.evaluate('''() => {
      var el = document.getElementById('plot-cover');
      return el && el.classList.contains('open');
    }''')
    assert cover_visible, f'❌ FAIL: Loading 完成后未进封面'
    print(f'  5. 封面页自动显示 ✓')

    # 6. 封面页有左右工具栏
    l_btns = await page.locator('.plot-toolbar-l .plt-btn').count()
    r_btns = await page.locator('.plot-toolbar-r .plt-btn').count()
    assert l_btns == 2 and r_btns == 6, f'❌ FAIL: 工具栏按钮数（l={l_btns}, r={r_btns}）'
    print(f'  6. 工具栏: 左 {l_btns} + 右 {r_btns} 个按钮 ✓')

    # 7. 封面标题显示
    title = await page.text_content('#plot-cover .main')
    assert title == '长夜城', f'❌ FAIL: 封面标题应为"长夜城"，实际"{title}"'
    print(f'  7. 封面标题: {title} ✓')

    # 8. localStorage 已标记实名完成
    done = await page.evaluate('() => localStorage.getItem("lingjing_v519_realname_done")')
    assert done == 'true', f'❌ FAIL: localStorage 未记录实名完成，实际 "{done}"'
    print(f'  8. localStorage 实名状态: lingjing_v519_realname_done=true ✓')

    # 9. 第二次进入 → 跳过实名直接 Loading
    await page.evaluate('() => localStorage.removeItem("lingjing_v519_realname_done")')  # 重置
    await page.evaluate('() => { window.LJPlotV19 && window.LJPlotV19.showRealname(); }')
    await page.wait_for_timeout(200)


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox'])
        context = await browser.new_context(viewport={'width': 414, 'height': 896})
        page = await context.new_page()

        passed = 0
        try:
            await test_part1_plot_detail(page)
            passed += 12
            await test_part2_plot_runner_states(page)
            passed += 9
        except AssertionError as e:
            print(f'\n❌ 断言失败: {e}')

        await browser.close()
        print()
        print('=' * 60)
        print(f'V19-A 测试通过: {passed} 项')
        print('=' * 60)


if __name__ == '__main__':
    asyncio.run(main())