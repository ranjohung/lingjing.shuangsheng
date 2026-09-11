"""V18-B 心屿功能区回归测试"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright

URL = 'http://127.0.0.1:8769/output/preview/heart-island.html'

with sync_playwright() as p:
    browser = p.chromium.launch(args=['--use-gl=swiftshader'])
    page = browser.new_page(viewport={'width': 480, 'height': 900})
    errors = []
    page.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
    page.on('console', lambda m: errors.append('console.' + m.type + ': ' + m.text) if m.type == 'error' else None)

    page.goto(URL)
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(800)

    # 1. LJHeart 加载
    has_heart = page.evaluate("typeof window.LJHeart !== 'undefined' && window.LJHeart.__mounted === true")
    print(f"[1] LJHeart 已挂载: {has_heart}  -> {'OK' if has_heart else 'FAIL'}")

    # 2. HEART_DATA 加载
    has_data = page.evaluate("typeof window.HEART_DATA !== 'undefined'")
    has_chars = page.evaluate("window.HEART_DATA && window.HEART_DATA.CHARACTERS.length")
    print(f"[2] HEART_DATA 加载: {has_data}, 角色数={has_chars}  -> {'OK' if has_data and has_chars >= 10 else 'FAIL'}")

    # 3. 5 子标签
    sn_count = page.evaluate("document.querySelectorAll('.heart-sn').length")
    sn_labels = page.evaluate("Array.from(document.querySelectorAll('.heart-sn')).map(function(n){return n.textContent}).join('|')")
    print(f"[3] 5 子标签: {sn_count} 个, 标签={sn_labels}  -> {'OK' if sn_count == 5 and '陪伴' in sn_labels and '记忆' in sn_labels else 'FAIL'}")

    # 4. 陪伴子筛选（3 项）
    filter_count = page.evaluate("document.querySelectorAll('#heart-subfilter .hf-chip').length")
    filter_labels = page.evaluate("Array.from(document.querySelectorAll('#heart-subfilter .hf-chip')).map(function(n){return n.textContent}).join('|')")
    print(f"[4] 子筛选: {filter_count} 个, 标签={filter_labels}  -> {'OK' if filter_count == 3 else 'FAIL'}")

    # 5. 首次进入弹窗
    dlg_visible = page.evaluate("!!document.querySelector('.heart-dialog')")
    dlg_title = page.evaluate("document.querySelector('.heart-dialog h3') ? document.querySelector('.heart-dialog h3').textContent : ''")
    print(f"[5] 首次进入弹窗: visible={dlg_visible}, title={dlg_title!r}  -> {'OK' if dlg_visible and '心屿' in dlg_title else 'FAIL'}")

    # 6. 弹窗内有"我创建的"和"双生角色"说明
    body_text = page.evaluate("document.querySelector('.hd-body') ? document.querySelector('.hd-body').textContent : ''")
    has_intro = '我创建的' in body_text and '双生角色' in body_text and '职业' in body_text
    print(f"[6] 弹窗内容含两种角色介绍 + 职业问答: {has_intro}  -> {'OK' if has_intro else 'FAIL'}")

    # 7. 关闭弹窗
    page.click('.hd-btn')
    page.wait_for_timeout(300)
    dlg_closed = page.evaluate("!document.querySelector('.heart-dialog')")
    print(f"[7] 关闭弹窗: {dlg_closed}  -> {'OK' if dlg_closed else 'FAIL'}")

    # 8. 角色卡片数（陪伴全部）
    cards = page.evaluate("document.querySelectorAll('.char-card').length")
    print(f"[8] 陪伴全部角色卡: {cards} 张  -> {'OK' if cards >= 8 else 'FAIL'}")

    # 9. [创] 角标数量
    create_badges = page.evaluate("document.querySelectorAll('.src-create').length")
    print(f"[9] [创] 角标: {create_badges} 个  -> {'OK' if create_badges >= 4 else 'FAIL'}")

    # 10. [双] 角标数量
    shuang_badges = page.evaluate("document.querySelectorAll('.src-shuang').length")
    print(f"[10] [双] 角标: {shuang_badges} 个  -> {'OK' if shuang_badges >= 3 else 'FAIL'}")

    # 11. 切到"我创建的"子筛选
    page.click('.hf-chip[data-f="user_created"]')
    page.wait_for_timeout(300)
    filtered = page.evaluate("document.querySelectorAll('.char-card').length")
    only_create = page.evaluate("Array.from(document.querySelectorAll('.src-create')).length === document.querySelectorAll('.char-card').length")
    print(f"[11] 我创建的: {filtered} 张, 全部[创]={only_create}  -> {'OK' if filtered >= 4 and only_create else 'FAIL'}")

    # 12. 切到"双生角色"子筛选
    page.click('.hf-chip[data-f="novel_brought_out"]')
    page.wait_for_timeout(300)
    shuang_cards = page.evaluate("document.querySelectorAll('.char-card').length")
    only_shuang = page.evaluate("Array.from(document.querySelectorAll('.src-shuang')).length === document.querySelectorAll('.char-card').length")
    print(f"[12] 双生角色: {shuang_cards} 张, 全部[双]={only_shuang}  -> {'OK' if shuang_cards >= 3 and only_shuang else 'FAIL'}")

    # 13. 双生角色有"进入 TA 的世界"按钮
    has_world_btn = page.evaluate("Array.from(document.querySelectorAll('.card-btn-world')).length > 0")
    print(f"[13] 双生[进入世界]按钮: {has_world_btn}  -> {'OK' if has_world_btn else 'FAIL'}")

    # 14. 切到精选
    page.click('.heart-sn[data-sn="featured"]')
    page.wait_for_timeout(300)
    feat_cards = page.evaluate("document.querySelectorAll('.feat-card').length")
    print(f"[14] 精选卡片: {feat_cards} 张  -> {'OK' if feat_cards >= 5 else 'FAIL'}")

    # 15. 切到记忆
    page.click('.heart-sn[data-sn="memories"]')
    page.wait_for_timeout(300)
    mem_items = page.evaluate("document.querySelectorAll('.mem-item').length")
    print(f"[15] 记忆条目: {mem_items} 条  -> {'OK' if mem_items >= 3 else 'FAIL'}")

    # 16. 切到故事（仅双生）
    page.click('.heart-sn[data-sn="stories"]')
    page.wait_for_timeout(300)
    story_items = page.evaluate("document.querySelectorAll('.story-item').length")
    print(f"[16] 双生故事: {story_items} 条  -> {'OK' if story_items >= 3 else 'FAIL'}")

    # 17. 切到搜索
    page.click('.heart-sn[data-sn="search"]')
    page.wait_for_timeout(300)
    # 直接通过 evaluate 触发搜索（避免 input 元素重渲染）
    page.evaluate("var i=document.getElementById('heart-search-input'); if(i){i.value='林'; i.dispatchEvent(new Event('input'));}")
    page.wait_for_timeout(400)
    search_results = page.evaluate("document.querySelectorAll('.char-card').length")
    search_visible = page.evaluate("!!document.getElementById('heart-search-input')")
    print("[17] 搜索「林」: " + str(search_results) + " 张, 搜索框=" + str(search_visible) + "  -> " + ('OK' if search_visible and search_results >= 1 else 'FAIL'))

    # 18. 5 Tab 底部
    tab_count = page.evaluate("document.querySelectorAll('.tabbar .tab').length")
    print(f"[18] 5 Tab 渲染: {tab_count} 个  -> {'OK' if tab_count == 5 else 'FAIL'}")

    # 19. 切回陪伴截图
    page.click('.heart-sn[data-sn="accompany"]')
    page.click('.hf-chip[data-f="all"]')
    page.wait_for_timeout(300)
    page.screenshot(path='output/preview/screenshots/v18-b-heart-accompany.png', full_page=False)

    # 20. 弹窗截图
    page.evaluate("localStorage.removeItem('lingjing_v5170_xinyu_intro_seen')")
    page.reload()
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(800)
    page.screenshot(path='output/preview/screenshots/v18-b-heart-intro.png', full_page=False)

    print("[19-20] 截图已保存: v18-b-heart-{accompany,intro}.png")
    print(f"[21] {len(errors)} 个错误/告警")
    for e in errors[:5]:
        print(f"    ! {e[:120]}")
    browser.close()