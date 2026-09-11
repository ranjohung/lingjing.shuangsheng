"""V18-D 世界功能区去橙光化 + 经济体系回归测试"""
import sys, os, re
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright

URL = 'http://127.0.0.1:8771/output/preview/library.html'

with sync_playwright() as p:
    browser = p.chromium.launch(args=['--use-gl=swiftshader'])
    page = browser.new_page(viewport={'width': 480, 'height': 900})
    errors = []
    page.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
    page.on('console', lambda m: errors.append('console.' + m.type + ': ' + m.text) if m.type == 'error' else None)

    page.goto(URL)
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(800)

    # 1. ECONOMY 加载
    has_eco = page.evaluate("typeof window.ECONOMY !== 'undefined'")
    tiers = page.evaluate("window.ECONOMY && window.ECONOMY.RECHARGE_TIERS.length")
    print(f"[1] ECONOMY 加载: {has_eco}, 5 档充值={tiers}  -> {'OK' if has_eco and tiers == 5 else 'FAIL'}")

    # 2. V12.0 名词替换
    purify = page.evaluate("window.ECONOMY.purify('橙心推 + 丸子 + 鲜花 + 橙光')")
    has_replaced = '心屿推' in purify and '灵韵' in purify and '灵花' in purify and '灵境' in purify
    has_no_orange = '橙心推' not in purify and '丸子' not in purify and '橙光' not in purify
    print(f"[2] 名词替换: '{purify}'  -> {'OK' if has_replaced and has_no_orange else 'FAIL'}")

    # 3. 5 档充值金额（V12.0 第三红线）
    amounts = page.evaluate("window.ECONOMY.RECHARGE_TIERS.map(function(t){return t.amount}).join(',')")
    print(f"[3] 充值档位: {amounts}  -> {'OK' if amounts == '6,18,58,128,328' else 'FAIL'}")

    # 4. 切到"心屿推"
    page.click('.ds-sn[data-sn="xinyu"]')
    page.wait_for_timeout(500)
    echo = page.evaluate("document.querySelectorAll('.echo-card').length")
    yl = page.evaluate("document.querySelectorAll('.yl-rank-row').length")
    print(f"[4] 心屿推子区: 每周回响={echo} 张, 引路人榜={yl} 行  -> {'OK' if echo >= 1 and yl == 3 else 'FAIL'}")

    # 5. 切到"创世杯"
    page.click('.ds-sn[data-sn="chuangshibei"]')
    page.wait_for_timeout(500)
    csb_banner = page.evaluate("document.querySelector('.csb-banner') ? document.querySelector('.csb-banner').textContent.includes('2026') : false")
    csb_rank = page.evaluate("document.querySelectorAll('.csb-rank-row').length")
    csb_cheer = page.evaluate("document.querySelectorAll('.csb-cheer-btn').length")
    print(f"[5] 创世杯: Banner含2026={csb_banner}, 榜单={csb_rank}, 助威={csb_cheer}  -> {'OK' if csb_banner and csb_rank >= 3 and csb_cheer >= 3 else 'FAIL'}")

    # 6. 切到"福利"
    page.click('.ds-sn[data-sn="welfare"]')
    page.wait_for_timeout(500)
    wf_banner = page.evaluate("document.querySelector('.wf-banner') ? document.querySelector('.wf-banner').textContent.includes('灵晶') : false")
    wf_tiers = page.evaluate("document.querySelectorAll('.wf-tier-card').length")
    print(f"[6] 福利子区: Banner含灵晶={wf_banner}, 充值卡={wf_tiers} 张  -> {'OK' if wf_banner and wf_tiers == 5 else 'FAIL'}")

    # 7. 5 档充值文案（不能出现"橙光/橙子/丸子"）
    tier_text = page.evaluate("document.querySelector('.wf-tier-list').textContent")
    no_ban = not re.search(r'橙光|橙子|丸子|鲜花|橙心推|橙光殿堂|推荐官|每周最佳|创作比赛|官方交流群|作品徽章', tier_text)
    has_yuan = '元' in tier_text
    has_lj = '灵晶' in tier_text and '灵玉' in tier_text
    print(f"[7] 充值文案合规: 无橙光={no_ban}, 含元={has_yuan}, 含灵晶/灵玉={has_lj}  -> {'OK' if no_ban and has_yuan and has_lj else 'FAIL'}")

    # 8. 切到"排行榜"
    page.click('.ds-sn[data-sn="rank"]')
    page.wait_for_timeout(500)
    rank = page.evaluate("document.querySelectorAll('.rank-row').length")
    rank_top = page.evaluate("document.querySelector('.rank-num-top') ? true : false")
    print(f"[8] 排行榜: {rank} 行, TOP1 标识={rank_top}  -> {'OK' if rank >= 5 and rank_top else 'FAIL'}")

    # 9. 截图心屿推
    page.click('.ds-sn[data-sn="xinyu"]')
    page.wait_for_timeout(400)
    page.screenshot(path='output/preview/screenshots/v18-d-world-xinyu.png', full_page=False)

    # 10. 截图创世杯
    page.click('.ds-sn[data-sn="chuangshibei"]')
    page.wait_for_timeout(400)
    page.screenshot(path='output/preview/screenshots/v18-d-world-csb.png', full_page=False)

    # 11. 截图福利
    page.click('.ds-sn[data-sn="welfare"]')
    page.wait_for_timeout(400)
    page.screenshot(path='output/preview/screenshots/v18-d-world-welfare.png', full_page=False)

    # 12. 全 library.html 文案检索（去橙光化）
    page.click('.ds-sn[data-sn="home"]')
    page.wait_for_timeout(400)
    full_text = page.evaluate("document.body.innerText")
    bad_words = ['橙光', '橙心推', '丸子', '橙子', '鲜花', '推荐官', '每周最佳', '创作比赛', '官方交流群', '橙光殿堂', '作品徽章']
    bad_hits = [w for w in bad_words if w in full_text]
    print(f"[12] 全文案去橙光化: 违规词={bad_hits}  -> {'OK' if not bad_hits else 'FAIL'}")

    print("[9-11] 截图已保存: v18-d-world-{xinyu,csb,welfare}.png")
    print(f"[13] {len(errors)} 个错误/告警")
    for e in errors[:5]:
        print(f"    ! {e[:120]}")
    browser.close()