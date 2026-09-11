"""V17-B 世界功能区回归测试（Playwright）"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright

URL = 'http://127.0.0.1:8771/output/preview/library.html'

with sync_playwright() as p:
    browser = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-webgl'])
    page = browser.new_page(viewport={'width': 480, 'height': 900})
    errors = []
    page.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
    page.on('console', lambda m: errors.append('console.' + m.type + ': ' + m.text) if m.type in ('error',) else None)

    page.goto(URL)
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(800)

    # 1. LJWorld 加载
    has_world = page.evaluate("typeof window.LJWorld !== 'undefined' && window.LJWorld.__mounted === true")
    print(f"[1] LJWorld 已挂载: {has_world}  -> {'OK' if has_world else 'FAIL'}")

    # 2. WORLD_DATA 加载
    has_data = page.evaluate("typeof window.WORLD_DATA !== 'undefined'")
    print(f"[2] WORLD_DATA 加载: {has_data}  -> {'OK' if has_data else 'FAIL'}")

    # 3. 5 Tab 渲染
    tabbar_tabs = page.evaluate("document.querySelectorAll('.tabbar .tab').length")
    print(f"[3] 5 Tab 渲染: {tabbar_tabs} 个  -> {'OK' if tabbar_tabs == 5 else 'FAIL'}")

    # 4. 子导航 7 项
    sn_count = page.evaluate("document.querySelectorAll('.ds-sub-nav .ds-sn').length")
    print(f"[4] 子导航 7 项: {sn_count} 个  -> {'OK' if sn_count == 7 else 'FAIL'}")

    # 5. Banner 5 张
    banner_count = page.evaluate("document.querySelectorAll('.ds-banner-slide').length")
    print(f"[5] Banner 5 张: {banner_count} 张  -> {'OK' if banner_count == 5 else 'FAIL'}")

    # 6. 四大金刚 4 项
    qg_count = page.evaluate("document.querySelectorAll('.ds-qg-item').length")
    print(f"[6] 四大金刚 4 项: {qg_count} 个  -> {'OK' if qg_count == 4 else 'FAIL'}")

    # 7. 瀑布流卡片（首页默认）
    wf_count = page.evaluate("document.querySelectorAll('.ds-wf-card').length")
    print(f"[7] 瀑布流卡片(首页): {wf_count} 张  -> {'OK' if wf_count > 0 else 'FAIL'}")

    # 8. 切到排行榜
    page.click('.ds-sn[data-sn="rank"]')
    page.wait_for_timeout(300)
    rank_active = page.evaluate("document.querySelector('.ds-sn[data-sn=rank]').classList.contains('active')")
    print(f"[8] 切到排行榜: active={rank_active}  -> {'OK' if rank_active else 'FAIL'}")

    # 9. 切到同人区
    page.click('.ds-sn[data-sn="tongren"]')
    page.wait_for_timeout(300)
    pd_cards = page.evaluate("document.querySelectorAll('.ds-wf-card').length")
    pd_tags = page.evaluate("document.querySelectorAll('.ds-tag-pd').length")
    print(f"[9] 同人区: {pd_cards} 张卡片 · 公版角标 {pd_tags} 个  -> {'OK' if pd_cards >= 10 and pd_tags > 0 else 'FAIL'}")

    # 10. 切到搜索
    page.click('.ds-sn[data-sn="search"]')
    page.wait_for_timeout(300)
    search_visible = page.evaluate("document.getElementById('ds-search-box').style.display === 'flex'")
    print(f"[10] 搜索框可见: {search_visible}  -> {'OK' if search_visible else 'FAIL'}")

    # 11. 搜索过滤
    page.fill('#ds-search-input', '红楼梦')
    page.wait_for_timeout(400)
    search_results = page.evaluate("document.querySelectorAll('.ds-wf-card').length")
    print(f"[11] 搜「红楼梦」结果: {search_results} 张  -> {'OK' if search_results >= 1 else 'FAIL'}")

    # 12. 打开分类侧边栏
    page.click('.ds-sn[data-sn="home"]')
    page.wait_for_timeout(200)
    page.click('.ds-cat-trigger')
    page.wait_for_timeout(500)
    drawer_open = page.evaluate("document.getElementById('ds-drawer').classList.contains('open')")
    cat_count = page.evaluate("document.querySelectorAll('.ds-d-cat').length")
    tag_count = page.evaluate("document.querySelectorAll('.ds-d-tag').length")
    print(f"[12] 侧边栏 open={drawer_open} · 一级 {cat_count} · 二级 {tag_count}  -> {'OK' if drawer_open and cat_count == 10 and tag_count > 0 else 'FAIL'}")

    # 13. 切换一级分类（切到同人专区）
    page.click('.ds-d-cat[data-id="mingxing"]')
    page.wait_for_timeout(300)
    tongren_tags = page.evaluate("Array.from(document.querySelectorAll('.ds-d-tag')).map(function(n){return n.textContent}).join(',')")
    print(f"[13] 同人专区二级标签: {tongren_tags!r}  -> {'OK' if '韩流同人' in tongren_tags and '欧美同人' in tongren_tags else 'FAIL'}")

    # 14. 关闭侧边栏
    page.click('#ds-drawer-close')
    page.wait_for_timeout(400)
    drawer_closed = page.evaluate("!document.getElementById('ds-drawer').classList.contains('open')")
    print(f"[14] 关闭侧边栏: {drawer_closed}  -> {'OK' if drawer_closed else 'FAIL'}")

    # 15. 创作 Tab 跳转（验证退出世界 -> 跳转路径）
    # 这个通过点击 tab 触发，不需等待跳转完成

    # 16. 截首页 + 同人区 + 侧边栏 + 搜索
    # 先回首页（恢复 trigger 显示）
    page.click('.ds-sn[data-sn="home"]')
    page.wait_for_timeout(400)
    page.screenshot(path='output/preview/screenshots/v17-b-world-home.png', full_page=False)

    page.click('.ds-sn[data-sn="tongren"]')
    page.wait_for_timeout(400)
    page.screenshot(path='output/preview/screenshots/v17-b-world-tongren.png', full_page=False)

    # 切回 home 再开抽屉
    page.click('.ds-sn[data-sn="home"]')
    page.wait_for_timeout(300)
    page.click('.ds-cat-trigger')
    page.wait_for_timeout(500)
    page.screenshot(path='output/preview/screenshots/v17-b-world-drawer.png', full_page=False)

    page.click('#ds-drawer-close')
    page.wait_for_timeout(300)
    page.click('.ds-sn[data-sn="search"]')
    page.fill('#ds-search-input', '长夜')
    page.wait_for_timeout(400)
    page.screenshot(path='output/preview/screenshots/v17-b-world-search.png', full_page=False)

    # 错误统计
    print("[16] 截图已保存: v17-b-world-home/tongren/drawer/search.png")
    print(f"[17] {len(errors)} 个错误/告警")
    for e in errors[:5]:
        print(f"    ! {e[:100]}")

    browser.close()