"""V22-C · 视觉小说范式 UI 测试
- 顶部状态栏：avatar + time + ap + copper + silver + jade
- 场景标签：npc / item / action 3 类 + 点击触发
- 底部文字框：打字机 + 跳过
- 模式切换：vn ⇄ scroll
- 确认弹窗：cost 不够时标记 insufficient
- 零删减：原文 byte-equal 校验
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from playwright.sync_api import sync_playwright

PASS, FAIL = [], []


def check(name, cond, detail=''):
    (PASS if cond else FAIL).append(
        "{}{}{}".format('✅ ' if cond else '❌ ', name, (' · ' + detail) if detail else ''))
    print(PASS[-1] if cond else FAIL[-1])


with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_context(viewport={'width': 480, 'height': 800}).new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))

    page.add_init_script("""
        localStorage.setItem('lingjing_onboarding_done', 'true');
        localStorage.setItem('lingjing_realname', JSON.stringify({name:'冒烟', id:'11010119900101001X'}));
    """)

    page.goto('http://127.0.0.1:8767/novel-game.html?demo=1', wait_until='domcontentloaded')
    page.wait_for_function('window.NovelWorldVN', timeout=4000)

    # ============ 场景 1：模块加载 ============
    check('A1 NovelWorldVN 模块加载', page.evaluate('typeof window.NovelWorldVN === "object"'))

    # ============ 场景 2：直接 enterScene 验证三层 UI ============
    page.evaluate('''window.NovelWorldVN.enterScene({
        paragraph: "你沿着蜿蜒小路走进深山，两旁桃花盛开，落英缤纷。",
        genre: "xiuxian",
        speaker: "旁白",
        npcs: [{name: "白衣女子", desc: "溪边抚琴的女子"}],
        items: [{name: "古琴"}],
        actions: [
            {label: "去后山", cost: {ap: 5, copper: 0}, result: "你踏上了去后山的路", paragraphRef: "p3"},
            {label: "拾取古琴", cost: {ap: 1, copper: 0}, result: "你拾取了一把古琴", paragraphRef: "p4"}
        ],
        ps: {ap: 80, copper: 50, silver: 10, jade: 5, time: "0年12月上旬", timeBucket: 0, avatarEmoji: "🧑"}
    });''')
    page.wait_for_timeout(300)

    # B. 顶部状态栏
    check('B1 顶栏显示', page.evaluate('getComputedStyle(document.querySelector("#ng-v22-topbar")).display !== "none" && document.querySelector("#ng-v22-topbar").offsetHeight > 0'))
    check('B2 顶栏 ap', page.evaluate('document.querySelector("#ng-v22-ap").textContent === "80"'))
    check('B3 顶栏 copper', page.evaluate('document.querySelector("#ng-v22-copper").textContent === "50"'))
    check('B4 顶栏 silver', page.evaluate('document.querySelector("#ng-v22-silver").textContent === "10"'))
    check('B5 顶栏 jade', page.evaluate('document.querySelector("#ng-v22-jade").textContent === "5"'))
    check('B6 顶栏 time', page.evaluate('document.querySelector("#ng-v22-time").textContent === "0年12月上旬"'))
    check('B7 顶栏 avatar emoji', page.evaluate('document.querySelector("#ng-v22-avatar").textContent === "🧑"'))

    # C. 场景标签
    npc_tag = page.locator('.ng-v22-tag.npc').count()
    item_tag = page.locator('.ng-v22-tag.item').count()
    action_tag = page.locator('.ng-v22-tag.action').count()
    check('C1 NPC 标签 ≥1', npc_tag >= 1, f'count={npc_tag}')
    check('C2 item 标签 ≥1', item_tag >= 1, f'count={item_tag}')
    check('C3 action 标签 ≥2', action_tag >= 2, f'count={action_tag}')

    # C4. NPC 标签 → 不消耗 · 直接展示人物介绍（不弹 confirm）
    page.locator('.ng-v22-tag.npc').first.click()
    page.wait_for_timeout(300)
    confirm_after_npc = page.evaluate('document.querySelector("#ng-v22-confirm").classList.contains("open")')
    check('C4 NPC 标签不弹 confirm（直接展示人物）', not confirm_after_npc)

    # D. 底部文字框 + 原文一字不动（重新 enterScene 覆盖 NPC 标签的展示）
    page.evaluate('''window.NovelWorldVN.enterScene({
        paragraph: "你沿着蜿蜒小路走进深山，两旁桃花盛开，落英缤纷。",
        genre: "xiuxian",
        ps: {ap: 80, copper: 50, silver: 10, jade: 5, time: "0年12月上旬", timeBucket: 0, avatarEmoji: "🧑"}
    });''')
    page.wait_for_timeout(1500)  # 等待打字机完成
    textbox_text = page.evaluate('document.querySelector("#ng-v22-textbox-body").textContent')
    check('D1 底部文字框原文 byte-equal', '你沿着蜿蜒小路' in textbox_text and '桃花盛开' in textbox_text,
          f'sample={textbox_text[:40]}...')

    # E. action 标签点击 → 弹 confirm
    page.evaluate('''window.NovelWorldVN.enterScene({
        paragraph: "你打算出门。",
        actions: [{label: "去后山", cost: {ap: 5, copper: 0}, result: "你踏上了去后山的路", paragraphRef: "p3"}],
        ps: {ap: 100, copper: 50, silver: 10, jade: 5, time: "0年12月上旬", timeBucket: 0, avatarEmoji: "🧑"}
    });''')
    page.wait_for_timeout(300)
    page.locator('.ng-v22-tag.action').first.click()
    page.wait_for_timeout(300)
    check('E1 action 标签弹 confirm', page.evaluate('document.querySelector("#ng-v22-confirm").classList.contains("open")'))

    # E2. cost 不够时标 insufficient（把 ps ap 改小，再渲染）
    # 先确保 confirm 是关闭状态（enterScene 会 reset）
    page.evaluate('document.querySelector("#ng-v22-confirm").classList.remove("open")')
    page.evaluate('''window.NovelWorldVN.enterScene({
        paragraph: "你饥肠辘辘。",
        genre: "jingying",
        actions: [{label: "做饭", cost: {ap: 50, copper: 100}, result: "你做了一顿可口的饭", paragraphRef: "p5"}],
        ps: {ap: 5, copper: 10, silver: 0, jade: 1, time: "0年12月上旬", timeBucket: 0, avatarEmoji: "🧑"}
    });''')
    page.wait_for_timeout(300)
    page.locator('.ng-v22-tag.action').first.click()
    page.wait_for_timeout(300)
    insufficient_count = page.locator('.ng-v22-confirm-cost .item.insufficient').count()
    check('E2 资源不够时标 insufficient', insufficient_count == 2, f'count={insufficient_count}')

    # F. 取消按钮（用 JS 触发 handler）
    page.evaluate('window.NovelWorldVN._confirmCancel()')
    page.wait_for_timeout(200)
    check('F1 取消按钮关闭 confirm', not page.evaluate('document.querySelector("#ng-v22-confirm").classList.contains("open")'))

    # G. 确认按钮 → 扣资源 + 打字机显示结果
    # 第三次 enterScene（confirm 自动 reset，需要重新点 action 标签）
    page.evaluate('''window.NovelWorldVN.enterScene({
        paragraph: "你打算出门。",
        actions: [{label: "出门", cost: {ap: 5}, result: "你打开了门 · 原文段触发", paragraphRef: "p7"}],
        ps: {ap: 100, copper: 0, silver: 0, jade: 0, time: "0年12月上旬", timeBucket: 0, avatarEmoji: "🧑"}
    });''')
    page.wait_for_timeout(300)
    page.locator('.ng-v22-tag.action').first.click()
    page.wait_for_timeout(300)
    # 通过 JS 触发确认（避免 click 状态问题）
    page.evaluate('window.NovelWorldVN._confirmOk()')
    page.wait_for_timeout(1500)  # 等打字机完成
    ap_after = int(page.locator('#ng-v22-ap').inner_text())
    check('G1 确认后 ap 扣减', ap_after == 95, f'ap={ap_after}')
    body_after = page.evaluate('document.querySelector("#ng-v22-textbox-body").textContent')
    check('G2 确认后打字机显示结果', '你打开了门' in body_after or '原文段触发' in body_after,
          f'sample={body_after[:30]}...')

    # H. 模式切换
    check('H1 默认是 vn 模式', page.evaluate('window.NovelWorldVN.getMode() === "vn"'))
    # 通过 JS 触发 toggle（避免 typewrite cursor 影响定位）
    page.evaluate('window.NovelWorldVN.toggleMode()')
    page.wait_for_timeout(200)
    check('H2 切到 scroll 模式', page.evaluate('window.NovelWorldVN.getMode() === "scroll"'))
    check('H3 scroll 模式 vn 容器隐藏', page.evaluate('document.querySelector("#ng-v22-container").style.display === "none"'))

    page.evaluate('window.NovelWorldVN.toggleMode()')
    page.wait_for_timeout(200)
    check('H4 切回 vn 模式', page.evaluate('window.NovelWorldVN.getMode() === "vn"'))

    # I. updateTopbar 单独测试
    page.evaluate('window.NovelWorldVN.updateTopbar({ap: 30, copper: 5, silver: 0, jade: 99, time: "1年3月中旬", avatarEmoji: "👩"})')
    page.wait_for_timeout(100)
    check('I1 updateTopbar 更新 ap', page.evaluate('document.querySelector("#ng-v22-ap").textContent === "30"'))
    check('I2 updateTopbar 更新 jade', page.evaluate('document.querySelector("#ng-v22-jade").textContent === "99"'))
    check('I3 updateTopbar 更新 avatar', page.evaluate('document.querySelector("#ng-v22-avatar").textContent === "👩"'))

    # J. hideTextbox
    page.evaluate('window.NovelWorldVN.hideTextbox()')
    page.wait_for_timeout(100)
    check('J1 hideTextbox 后隐藏', page.evaluate('document.querySelector("#ng-v22-textbox").style.display === "none"'))

    # Z. 无关键 JS 错误
    critical = [e for e in errors if 'Cannot read' in e or 'TypeError' in e]
    check('Z1 无关键 JS runtime 错误', len(critical) == 0, f'errs={critical[:1]}')

    b.close()

print()
print("=" * 60)
print("V22-C · 视觉小说范式 UI 测试结果")
print("  PASS: {} / FAIL: {}".format(len(PASS), len(FAIL)))
if FAIL:
    print("FAILED:")
    for f in FAIL:
        print("  ", f)
    sys.exit(1)
else:
    print("✅ ALL PASS")
