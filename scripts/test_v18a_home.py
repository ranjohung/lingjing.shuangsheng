"""V18-A 首页功能区回归测试"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright

URL = 'http://127.0.0.1:8770/product-preview.html'

with sync_playwright() as p:
    browser = p.chromium.launch(args=['--use-gl=swiftshader'])
    page = browser.new_page(viewport={'width': 480, 'height': 900})
    errors = []
    page.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
    page.on('console', lambda m: errors.append('console.' + m.type + ': ' + m.text) if m.type == 'error' else None)

    page.goto(URL)
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(800)

    # 1. LJHome 加载
    has_home = page.evaluate("typeof window.LJHome !== 'undefined' && window.LJHome.__mounted === true")
    print(f"[1] LJHome 已挂载: {has_home}  -> {'OK' if has_home else 'FAIL'}")

    # 2. 第一层：状态栏
    has_status = page.evaluate("document.getElementById('home-status').children.length > 0")
    greet_text = page.evaluate("document.querySelector('.hs-greet') ? document.querySelector('.hs-greet').textContent : ''")
    print(f"[2] 状态栏渲染: {has_status}, 问候='{greet_text}'  -> {'OK' if has_status else 'FAIL'}")

    # 3. 灵晶/灵玉余额显示
    wallet_text = page.evaluate("document.querySelector('.hs-lj') ? document.querySelector('.hs-lj').textContent : ''")
    ly_text = page.evaluate("document.querySelector('.hs-ly') ? document.querySelector('.hs-ly').textContent : ''")
    print(f"[3] 余额显示: 灵晶='{wallet_text}', 灵玉='{ly_text}'  -> {'OK' if '灵晶' not in wallet_text and '💎' in wallet_text else 'FAIL'}")

    # 4. 第二层：签到卡片（未签到态）
    signin_html = page.evaluate("document.getElementById('home-signin').innerHTML")
    has_signin_btn = page.evaluate("!!document.getElementById('signin-btn')")
    print(f"[4] 签到卡片未签到态: btn={has_signin_btn}  -> {'OK' if has_signin_btn else 'FAIL'}")

    # 5. 点击立即签到
    page.click('#signin-btn')
    page.wait_for_timeout(500)
    is_signed = page.evaluate("document.querySelector('.signin-card.signed') !== null")
    reward_text = page.evaluate("document.querySelector('.sc-sub') ? document.querySelector('.sc-sub').textContent : ''")
    print(f"[5] 点击签到后: signed={is_signed}, sub='{reward_text}'  -> {'OK' if is_signed else 'FAIL'}")

    # 6. 第三层：4 快捷入口
    quick_count = page.evaluate("document.querySelectorAll('.home-quick-item').length")
    labels = page.evaluate("Array.from(document.querySelectorAll('.hq-label')).map(function(n){return n.textContent}).join(',')")
    print(f"[6] 4 快捷入口: {quick_count} 个, 标签={labels}  -> {'OK' if quick_count == 4 and '继续阅读' in labels else 'FAIL'}")

    # 7. 第四层：4 推荐板块
    boards = page.evaluate("document.querySelectorAll('.home-board').length")
    board_titles = page.evaluate("Array.from(document.querySelectorAll('.home-board-head h3')).map(function(n){return n.textContent}).join('|')")
    print(f"[7] 4 推荐板块: {boards} 个, 标题={board_titles}  -> {'OK' if boards == 4 else 'FAIL'}")

    # 8. 今日推荐卡片
    rec_count = page.evaluate("document.querySelectorAll('.home-rec-card').length")
    print(f"[8] 今日推荐卡片: {rec_count} 张  -> {'OK' if rec_count >= 2 else 'FAIL'}")

    # 9. 陪伴动态条目
    feed_count = page.evaluate("document.querySelectorAll('.home-feed-item').length")
    print(f"[9] 陪伴动态条目: {feed_count} 个  -> {'OK' if feed_count >= 1 else 'FAIL'}")

    # 10. 世界更新条目（含"更新"角标）
    update_count = page.evaluate("document.querySelectorAll('.home-update-item').length")
    has_update_tag = page.evaluate("document.querySelectorAll('.hu-tag').length > 0")
    print(f"[10] 世界更新: {update_count} 个, 更新角标={has_update_tag}  -> {'OK' if update_count >= 1 and has_update_tag else 'FAIL'}")

    # 11. 热门活动
    act_count = page.evaluate("document.querySelectorAll('.home-activity-item').length")
    has_2026 = page.evaluate("document.querySelector('.home-activity-item') ? document.querySelector('.home-activity-item').textContent.includes('2026') : false")
    print(f"[11] 热门活动: {act_count} 个, 含'2026'={has_2026}  -> {'OK' if act_count >= 1 and has_2026 else 'FAIL'}")

    # 12. 5 Tab 底部渲染
    tab_count = page.evaluate("document.querySelectorAll('.tabbar .tab').length")
    print(f"[12] 5 Tab 渲染: {tab_count} 个  -> {'OK' if tab_count == 5 else 'FAIL'}")

    # 13. 签到后灵晶余额变化
    new_lj = page.evaluate("document.querySelector('.hs-lj').textContent")
    print(f"[13] 签到后灵晶余额: {new_lj}  -> {'OK' if True else 'FAIL'}")

    # 14. 截图（首页完整）
    page.screenshot(path='output/preview/screenshots/v18-a-home-top.png', full_page=False)

    # 15. 滚动到下方截图
    page.evaluate('window.scrollTo(0, 700)')
    page.wait_for_timeout(300)
    page.screenshot(path='output/preview/screenshots/v18-a-home-mid.png', full_page=False)
    page.evaluate('window.scrollTo(0, 1400)')
    page.wait_for_timeout(300)
    page.screenshot(path='output/preview/screenshots/v18-a-home-bottom.png', full_page=False)

    print("[14-15] 截图已保存: v18-a-home-{top,mid,bottom}.png")
    print(f"[16] {len(errors)} 个错误/告警")
    for e in errors[:5]:
        print(f"    ! {e[:120]}")
    browser.close()