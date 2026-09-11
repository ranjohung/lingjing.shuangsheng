"""V17-G 创作者分成阶梯验证（Playwright）"""
import sys, os
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8770/output/preview"
SHOTS = "output/preview/screenshots"
os.makedirs(SHOTS, exist_ok=True)

with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader'])

    # ============ Test 1-7: commerce.html 分成阶梯 ============
    pg = b.new_page(viewport={'width': 1280, 'height': 900})
    errs = []
    pg.on('pageerror', lambda e: errs.append('PAGEERROR:' + str(e)))
    pg.on('console', lambda m: errs.append('CONSOLE.' + m.type + ':' + m.text) if m.type == 'error' else None)

    pg.goto(f'{BASE}/commerce.html')
    pg.wait_for_load_state('networkidle')
    pg.wait_for_timeout(1500)

    # 1. tier.js 加载
    has_ljtier = pg.evaluate("typeof window.LJTier !== 'undefined'")
    print(f"[1] LJTier 挂载: {has_ljtier}  -> {'OK' if has_ljtier else 'FAIL'}")

    # 2. DB.creator_tiers 写入种子
    tiers_in_db = pg.evaluate("(window.DB && window.DB.tiers ? window.DB.tiers.list().length : 0)")
    print(f"[2] DB.creator_tiers 种子: {tiers_in_db} 条  -> {'OK' if tiers_in_db == 5 else 'FAIL'}")

    # 3. 5 档阶梯渲染
    ladder_count = pg.evaluate("document.querySelectorAll('.v17g-lt').length")
    print(f"[3] 5 档阶梯渲染: {ladder_count} 张  -> {'OK' if ladder_count == 5 else 'FAIL'}")

    # 4. 当前档位卡存在
    has_current = pg.evaluate("!!document.getElementById('v17g-current-card') && document.getElementById('v17g-current-card').children.length > 0")
    print(f"[4] 当前档位卡存在: {has_current}  -> {'OK' if has_current else 'FAIL'}")

    # 5. 当前档位计算正确（基于 mock 数据 totalRevenue=320000，应该 L3）
    current_name = pg.evaluate("(function(){var el=document.querySelector('.v17g-lt.current .name'); return el ? el.textContent : ''})()")
    print(f"[5] 当前档位: {current_name}  -> {'OK' if 'L3' in current_name or '黄金' in current_name else 'FAIL'}")

    # 6. 升级进度条
    has_progress = pg.evaluate("!!document.querySelector('.v17g-progress > div')")
    print(f"[6] 升级进度条: {has_progress}  -> {'OK' if has_progress else 'FAIL'}")

    # 7. LJTier.calcShare 正确（黄金 70%）
    share = pg.evaluate("window.LJTier.calcShare(10000, 'L3')")
    print(f"[7] L3 黄金 calcShare(10000): {share['ratio']} / creator={share['creator']} / platform={share['platform']}  -> {'OK' if share['creator'] == 7000 and share['platform'] == 3000 else 'FAIL'}")

    # 8. 5 档名字正确（青铜/白银/黄金/钻石/传奇）
    names = pg.evaluate("(function(){var arr=[]; document.querySelectorAll('.v17g-lt .name').forEach(function(n){arr.push(n.textContent)}); return arr.join(',')})()")
    expected_all = all(x in names for x in ['青铜', '白银', '黄金', '钻石', '传奇'])
    print(f"[8] 5 档名字齐全: {expected_all} ({names})  -> {'OK' if expected_all else 'FAIL'}")

    # 截图 commerce 阶梯区
    pg.evaluate("document.getElementById('v17g-tier-section').scrollIntoView()")
    pg.wait_for_timeout(400)
    pg.screenshot(path=f'{SHOTS}/v17-g-commerce-tier.png', full_page=False)

    # ============ Test 9-14: creator-legal.html 协议页 ============
    pg2 = b.new_page(viewport={'width': 1280, 'height': 900})
    pg2.goto(f'{BASE}/creator-legal.html')
    pg2.wait_for_load_state('networkidle')
    pg2.wait_for_timeout(1500)

    # 9. 协议页 5 档摘要
    summary_count = pg2.evaluate("document.querySelectorAll('.cl-ts').length")
    print(f"[9] 协议页 5 档摘要: {summary_count} 张  -> {'OK' if summary_count == 5 else 'FAIL'}")

    # 10. 8 大章节标题
    sections = pg2.evaluate("document.querySelectorAll('.cl-section h3').length")
    print(f"[10] 协议页章节: {sections} 节  -> {'OK' if sections >= 7 else 'FAIL'}")

    # 11. 协议 5 档义务都有
    ob_count = pg2.evaluate("(document.body.innerHTML.match(/义务：/g) || []).length")
    print(f"[11] 协议 5 档义务标注: {ob_count} 处  -> {'OK' if ob_count >= 5 else 'FAIL'}")

    # 12. 协议确认按钮
    has_ack = pg2.evaluate("!!document.getElementById('cl-ack-btn')")
    print(f"[12] 协议确认按钮: {has_ack}  -> {'OK' if has_ack else 'FAIL'}")

    # 13. 点击确认按钮写入 localStorage
    pg2.click('#cl-ack-btn')
    pg2.wait_for_timeout(500)
    ack_saved = pg2.evaluate("localStorage.getItem('lingjing_v5170_creator_legal_ack')")
    print(f"[13] 协议确认写入 localStorage: {ack_saved}  -> {'OK' if ack_saved else 'FAIL'}")

    # 14. 协议无第三方平台名（橙光/星野/B站/BTS/HP/EXO 等）
    illegal_text = pg2.evaluate("(function(){var t=document.body.innerText; var bad=['橙光','星野','B站','bilibili','BTS','HP','EXO','丸子','橙心推','橙子','鲜花','推荐官']; var hits=[]; bad.forEach(function(b){if(t.indexOf(b)>=0)hits.push(b)}); return hits.join(',')})()")
    print(f"[14] 协议无橙光词: '{illegal_text}'  -> {'OK' if not illegal_text else 'FAIL'}")

    pg2.screenshot(path=f'{SHOTS}/v17-g-creator-legal.png', full_page=False)

    # ============ Test 15-16: creator-center.html 档位卡片入口 ============
    pg3 = b.new_page(viewport={'width': 480, 'height': 900})
    pg3.goto(f'{BASE}/creator-center.html')
    pg3.wait_for_load_state('networkidle')
    pg3.wait_for_timeout(800)

    # 15. creator-center 5 档分成入口
    has_v17g_btn = pg3.evaluate("Array.from(document.querySelectorAll('.lc-btn')).some(function(b){return /5\\s*档\\s*分成/.test(b.textContent)})")
    print(f"[15] creator-center 5档分成入口: {has_v17g_btn}  -> {'OK' if has_v17g_btn else 'FAIL'}")

    # 16. creator-center 协议入口
    has_legal_btn = pg3.evaluate("Array.from(document.querySelectorAll('.lc-btn')).some(function(b){return /协议/.test(b.textContent)})")
    print(f"[16] creator-center 协议入口: {has_legal_btn}  -> {'OK' if has_legal_btn else 'FAIL'}")

    pg3.screenshot(path=f'{SHOTS}/v17-g-creator-center.png', full_page=False)

    print('---')
    if errs:
        print('ERRORS:', errs[:5])
    else:
        print('NO_ERRORS')
    b.close()