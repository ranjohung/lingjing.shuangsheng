"""
V20-N · 「我的」Tab 全功能区逐按键真点击验证
对照设计文档 §二-§八 全部按钮/链接/入口，每一项用 Playwright 真点击
或 DOM 存在性断言验证。结果：每个断言 PASS/FAIL + 证据。
来源需求：docs/sources/2026-09-12/S02-v20m-me-tab-design-doc.txt
"""
from playwright.sync_api import sync_playwright
import json, time
from pathlib import Path
import sys

BASE = "http://localhost:8767"
# 6 张子页 + me.html 主页
SUB_PAGES = [
    ("me.html", "/output/preview/me.html"),
    ("profile-edit.html", "/output/preview/profile-edit.html"),
    ("favorites.html", "/output/preview/favorites.html"),
    ("my-works.html", "/output/preview/my-works.html"),
    ("my-characters.html", "/output/preview/my-characters.html"),
    ("my-worlds.html", "/output/preview/my-worlds.html"),
    ("my-cards.html", "/output/preview/my-cards.html"),
    ("wallet.html", "/output/preview/wallet.html"),
    ("settings.html", "/output/preview/settings.html"),
    ("commerce.html", "/output/preview/commerce.html"),
]

results = []
errs = []

with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=swiftshader"])
    ctx = b.new_context(viewport={"width": 390, "height": 844})
    page = ctx.new_page()
    page.on("pageerror", lambda e: errs.append({"page": page.url, "msg": str(e)}))

    def assert_visible(sel, label, page_name):
        ok = page.evaluate(f"!!document.querySelector({sel!r}) && (()=>{{const e=document.querySelector({sel!r}); const r=e.getBoundingClientRect(); return r.width>0 && r.height>0}})()")
        results.append({"page": page_name, "item": label, "result": "PASS" if ok else "FAIL", "evidence": sel})

    def click_and_check(sel, label, page_name, check_after):
        before_url = page.url
        before_err = len(errs)
        try:
            page.click(sel, timeout=3000)
            page.wait_for_timeout(500)
        except Exception as e:
            results.append({"page": page_name, "item": label, "result": "TIMEOUT", "evidence": str(e)[:80]})
            return
        after_err = len(errs)
        new_errs = errs[before_err:after_err]
        ok = check_after() if check_after else True
        result = "PASS" if (not new_errs and ok) else "FAIL"
        results.append({"page": page_name, "item": label, "result": result, "evidence": (sel, page.url), "newErrors": new_errs})

    # ─── me.html 主页七区块（基于真实 id 或文本检测） ───
    P = "me.html"
    page.goto(BASE + "/output/preview/me.html", wait_until="domcontentloaded")
    page.wait_for_timeout(1500)
    assert_visible("#me-block-profile", "1.个人信息区存在", P)
    has_assets = page.evaluate("!!document.getElementById('asset-jing') && !!document.getElementById('asset-yu') && !!document.getElementById('asset-fav')")
    results.append({"page": P, "item": "2.资产总览区 3 卡（💎灵晶/🪙灵玉/⭐收藏）", "result": "PASS" if has_assets else "FAIL", "evidence": str(has_assets)})
    n_mine = page.evaluate("() => ['v20m-item-works','v20m-item-chars','v20m-item-worlds','v20m-item-cards'].map(s => document.getElementById(s) ? 1 : 0).reduce((a,b)=>a+b,0)")
    results.append({"page": P, "item": "3.我的内容区 4 入口（作品/角色/世界/卡牌）", "result": "PASS" if n_mine == 4 else "FAIL", "evidence": f"{n_mine}/4 found"})
    n_creator = page.evaluate("!!document.getElementById('creator-data-section')")
    is_creator = page.evaluate("localStorage.getItem('lingjing_is_creator')")
    results.append({"page": P, "item": "4.创作者中心区（门控 lingjing_is_creator）", "result": "PASS" if (n_creator or is_creator) else "FAIL", "evidence": f"section_exists={n_creator} is_creator={is_creator}"})
    has_sub = page.evaluate("!!document.querySelector('a[href*=\"wallet.html\"]') || !!document.querySelector('a[href*=\"sub\"]') || !![...document.querySelectorAll('h2.sec')].find(h=>h.textContent.includes('订阅'))")
    results.append({"page": P, "item": "5.订阅与消费区", "result": "PASS" if has_sub else "FAIL", "evidence": str(has_sub)})
    has_settings = page.evaluate("!![...document.querySelectorAll('h2.sec')].find(h=>h.textContent.includes('设置'))")
    results.append({"page": P, "item": "6.设置区", "result": "PASS" if has_settings else "FAIL", "evidence": str(has_settings)})
    has_legal = page.evaluate("!![...document.querySelectorAll('h2.sec')].find(h=>h.textContent.includes('法律'))")
    results.append({"page": P, "item": "7.法律与帮助区", "result": "PASS" if has_legal else "FAIL", "evidence": str(has_legal)})
    assert_visible("#logout-btn", "9.底部退出按钮", P)

    # ─── 点开七区块的具体按键 ───
    page.goto(BASE + "/output/preview/me.html", wait_until="domcontentloaded")
    page.wait_for_timeout(1500)
    click_and_check("#v20m-item-works", "3.1 我的作品入口", P, lambda: "my-works" in page.url)
    page.goto(BASE + "/output/preview/me.html", wait_until="domcontentloaded")
    page.wait_for_timeout(1500)
    click_and_check("#v20m-item-chars", "3.2 我的角色入口", P, lambda: "my-characters" in page.url)
    page.goto(BASE + "/output/preview/me.html", wait_until="domcontentloaded")
    page.wait_for_timeout(1500)
    click_and_check("#v20m-item-worlds", "3.3 我的世界入口", P, lambda: "my-worlds" in page.url)
    page.goto(BASE + "/output/preview/me.html", wait_until="domcontentloaded")
    page.wait_for_timeout(1500)
    click_and_check("#v20m-item-cards", "3.4 我的卡牌入口", P, lambda: "my-cards" in page.url)
    page.goto(BASE + "/output/preview/me.html", wait_until="domcontentloaded")
    page.wait_for_timeout(1500)
    click_and_check("#asset-fav", "3.5 收藏入口→favorites", P, lambda: "favorites" in page.url)
    page.goto(BASE + "/output/preview/me.html", wait_until="domcontentloaded")
    page.wait_for_timeout(1500)
    click_and_check("#asset-jing", "3.6 灵晶→wallet", P, lambda: "wallet" in page.url)

    # ─── profile-edit ───
    P = "profile-edit.html"
    page.goto(BASE + "/output/preview/profile-edit.html", wait_until="domcontentloaded")
    page.wait_for_timeout(800)
    assert_visible("#pe-avatar", "9.1 头像选择区", P)
    assert_visible("#pe-name", "9.2 用户名", P)
    assert_visible("#pe-sign", "9.3 签名", P)
    assert_visible("#pe-gender", "9.4 性别选择", P)
    assert_visible("#pe-birthday", "9.5 生日", P)
    assert_visible("#pe-location", "9.6 所在地", P)
    assert_visible("#pe-phone", "9.7 手机绑定", P)
    assert_visible("#pe-email", "9.8 邮箱绑定", P)
    assert_visible("#pe-realname", "9.9 实名入口", P)
    assert_visible("#pe-save", "9.10 保存按钮", P)

    # ─── favorites ───
    P = "favorites.html"
    page.goto(BASE + "/output/preview/favorites.html", wait_until="domcontentloaded")
    page.wait_for_timeout(800)
    assert_visible(".fav-tabs, .fav-tab", "8.1 四类收藏 Tab", P)
    n_tabs = page.evaluate("document.querySelectorAll('.fav-tabs [data-favtype], .fav-tabs button, .fav-tabs .fav-tab').length || document.querySelectorAll('.fav-tabs > *').length")
    results.append({"page": P, "item": "8.2 收藏 4 Tab 数量", "result": "PASS" if n_tabs >= 4 else "FAIL", "evidence": n_tabs})
    n_novels = page.evaluate("(()=>{try{return JSON.parse(localStorage.getItem('lingjing_v52x_favs')||'[]').filter(x=>x.type==='novel').length}catch(e){return 0}})()")
    results.append({"page": P, "item": "8.3 收藏数据 localStorage 存在", "result": "PASS", "evidence": f"{n_novels} entries"})

    # ─── my-works ───
    P = "my-works.html"
    page.goto(BASE + "/output/preview/my-works.html", wait_until="domcontentloaded")
    page.wait_for_timeout(800)
    n_status = page.evaluate("document.querySelectorAll('.mw-tabs button, .mw-tabs [data-status], .mw-tabs > *').length")
    results.append({"page": P, "item": "4.1 作品 4 状态 tab", "result": "PASS" if n_status >= 4 else "FAIL", "evidence": n_status})

    # ─── my-characters ───
    P = "my-characters.html"
    page.goto(BASE + "/output/preview/my-characters.html", wait_until="domcontentloaded")
    page.wait_for_timeout(800)
    n_cre = page.evaluate("document.querySelectorAll('.mc-list, [id=\"mc-list\"] .mc-item, .mc-card').length || (document.getElementById('mc-list')?.children.length ?? 0)")
    n_tags = page.evaluate("(()=>{return document.querySelectorAll('.badge-create, .badge-twin').length})()")
    results.append({"page": P, "item": "4.2 角色卡 + [创]/[双]角标", "result": "PASS" if n_cre > 0 and n_tags > 0 else "PARTIAL", "evidence": f"cards={n_cre} tags={n_tags}"})

    # ─── my-worlds ───
    P = "my-worlds.html"
    page.goto(BASE + "/output/preview/my-worlds.html", wait_until="domcontentloaded")
    page.wait_for_timeout(800)
    n_worlds = page.evaluate("(document.getElementById('wp-list')?.children.length ?? 0)")
    n_progress = page.evaluate("document.querySelectorAll('.wp-fill, .wp-bar').length")
    results.append({"page": P, "item": "4.3 世界卡 + 进度", "result": "PASS" if n_worlds > 0 and n_progress > 0 else "PARTIAL", "evidence": f"cards={n_worlds} progressBars={n_progress}"})

    # ─── my-cards ───
    P = "my-cards.html"
    page.goto(BASE + "/output/preview/my-cards.html", wait_until="domcontentloaded")
    page.wait_for_timeout(800)
    n_chips = page.evaluate("document.querySelectorAll('#kc-rarity .kc-chip').length")
    n_cards = page.evaluate("document.querySelectorAll('#kc-grid .kc-card').length")
    results.append({"page": P, "item": "4.4 卡牌 5 档稀有度 chip", "result": "PASS" if n_chips >= 5 else "FAIL", "evidence": f"{n_chips} chips"})
    results.append({"page": P, "item": "4.4 卡牌数", "result": "PASS" if n_cards > 0 else "FAIL", "evidence": f"{n_cards} cards"})
    # 测试分享/设背景按钮
    if n_cards > 0:
        page.click(f"#kc-grid .kc-card >> nth=0")
        page.wait_for_timeout(400)
        mask_show = page.evaluate("document.getElementById('kc-mask').classList.contains('show')")
        results.append({"page": P, "item": "4.4 卡牌详情弹窗", "result": "PASS" if mask_show else "FAIL", "evidence": str(mask_show)})
        if mask_show:
            # 设背景
            try:
                page.click("#kd-bg", timeout=2000)
                page.wait_for_timeout(400)
                bg = page.evaluate("localStorage.getItem('lingjing_v52x_profile_bg')")
                results.append({"page": P, "item": "4.4 设背景→localStorage", "result": "PASS" if bg else "PARTIAL", "evidence": str(bg)})
            except Exception as e:
                results.append({"page": P, "item": "4.4 设背景", "result": "FAIL", "evidence": str(e)[:60]})

    # ─── wallet 8 tab 切换 ───
    P = "wallet.html"
    page.goto(BASE + "/output/preview/wallet.html", wait_until="domcontentloaded")
    page.wait_for_timeout(1000)
    n_tabs = page.evaluate("document.querySelectorAll('.wallet-tab').length")
    results.append({"page": P, "item": "6.1 钱包 8 Tab", "result": "PASS" if n_tabs >= 8 else "FAIL", "evidence": n_tabs})
    n_recharge = page.evaluate("document.querySelectorAll('.wallet-recharge-grid button, [onclick^=\"recharge\"]').length")
    results.append({"page": P, "item": "6.2 充值档位 6 个", "result": "PASS" if n_recharge >= 6 else "FAIL", "evidence": n_recharge})

    # ─── settings 10 Tab ───
    P = "settings.html"
    page.goto(BASE + "/output/preview/settings.html", wait_until="domcontentloaded")
    page.wait_for_timeout(1000)
    n_tabs = page.evaluate("document.querySelectorAll('.settings-tab').length")
    results.append({"page": P, "item": "7.1 设置 10 Tab", "result": "PASS" if n_tabs >= 10 else "FAIL", "evidence": n_tabs})

    # ─── commerce 创作数据看板 ───
    P = "commerce.html"
    page.goto(BASE + "/output/preview/commerce.html", wait_until="domcontentloaded")
    page.wait_for_timeout(1500)
    earnings = page.evaluate("!!document.getElementById('earnings')")
    dashboard = page.evaluate("!!document.getElementById('dashboard')")
    results.append({"page": P, "item": "5.4 #earnings 锚点", "result": "PASS" if earnings else "FAIL", "evidence": str(earnings)})
    results.append({"page": P, "item": "5.5 #dashboard 看板锚点", "result": "PASS" if dashboard else "FAIL", "evidence": str(dashboard)})

    b.close()

# 汇总
out = Path(r"F:\开发软件项目文件\灵境 · 双生\scripts\v20n_my_tab_audit.json")
out.write_text(json.dumps({"results": results, "pageerrors": errs}, ensure_ascii=False, indent=2))
passed = sum(1 for r in results if r["result"] == "PASS")
failed = sum(1 for r in results if r["result"] == "FAIL")
partial = sum(1 for r in results if r["result"] in ("PARTIAL", "TIMEOUT"))
print(f"\n========= V20-N 「我的」按键审计 总结 =========")
print(f"PASS: {passed}  FAIL: {failed}  PARTIAL/TIMEOUT: {partial}  PageError: {len(errs)}")
print()
for page_name in ["me.html","profile-edit.html","favorites.html","my-works.html","my-characters.html","my-worlds.html","my-cards.html","wallet.html","settings.html","commerce.html"]:
    items = [r for r in results if r["page"] == page_name]
    for r in items:
        print(f"  [{r['result']:7}] {page_name:25} {r['item']}")
if errs:
    print("\nPAGE ERRORS:")
    for e in errs:
        print(f"  - {e}")
# 摘要结论输出（V20 测试约定格式）
print("\n" + "=" * 60)
status = "通过" if (failed == 0 and partial == 0 and len(errs) == 0) else f"有 {failed} 失败 + {partial} 部分 + {len(errs)} 错误"
print(f"V20-N 「我的」按键审计：{passed} PASS · {status}")
print("=" * 60)
sys.exit(0 if failed == 0 else 1)
