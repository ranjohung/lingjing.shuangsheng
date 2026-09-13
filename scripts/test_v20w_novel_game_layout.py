"""V20-W · novel-game.html 布局改造回归
   - 选项不再作为独立下半区
   - 选项嵌在对话框内（inline-choice）
   - 对话框整体可点击推进
   - hotzone 弹场景内中央 modal（不是底部抽屉）
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from playwright.sync_api import sync_playwright

PASS, FAIL = [], []


def check(name, cond, detail=''):
    (PASS if cond else FAIL).append(f"{'✅' if cond else '❌'} {name}{(' · ' + detail) if detail else ''}")
    print(PASS[-1] if cond else FAIL[-1])


with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={'width': 480, 'height': 800})
    page = ctx.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.add_init_script("""
        localStorage.setItem('lingjing_onboarding_done', 'true');
        localStorage.setItem('lingjing_realname', JSON.stringify({name:'冒烟', id:'11010119900101001X'}));
    """)
    page.goto('http://127.0.0.1:8767/output/preview/novel-game.html?demo=1', wait_until='domcontentloaded')
    page.wait_for_selector('#ng-chapters-view', state='visible', timeout=4000)
    page.wait_for_function('document.querySelectorAll(".ng-ch-card").length >= 5', timeout=4000)

    # 1. A. DOM 节点：不存在 .ng-choices 独立区；存在 .ng-inline-choices + .ng-hot-modal
    has_legacy_choices = page.evaluate("document.querySelectorAll('.ng-choices').length")
    check('A1 无 .ng-choices 独立下半区', has_legacy_choices == 0, f'count={has_legacy_choices}')
    has_inline = page.evaluate("document.querySelectorAll('#ng-inline-choices').length")
    check('A2 有 #ng-inline-choices', has_inline == 1)
    has_modal = page.evaluate("document.querySelectorAll('#ng-hot-modal').length")
    check('A3 有 #ng-hot-modal', has_modal == 1)

    # 2. B. 进入第 1 章（场景：山间小路）— 走到 choice 块
    page.locator('.ng-ch-card').first.click()
    page.wait_for_selector('#ng-stage.active', timeout=3000)
    page.wait_for_timeout(400)

    # 3. B. 推进块直到首个 inline-choice 出现（narration→item→narration→choice）
    for _ in range(6):
        inline_n = page.evaluate("document.querySelectorAll('.ng-inline-choice').length")
        if inline_n >= 2: break
        page.locator('#ng-dialog').click()
        page.wait_for_timeout(250)
    choice_count = page.locator('.ng-inline-choice').count()
    check('B1 choice 嵌在 dialog 内（inline-choice）', choice_count == 2, f'inline-choice count={choice_count}')

    # 4. C. 选项是 ng-inline-choice 不是 ng-choice（旧 class）
    choice_classes = page.evaluate("Array.from(document.querySelectorAll('.ng-inline-choice')).map(b=>b.className)")
    no_legacy = all('ng-choice ' not in c for c in choice_classes)
    check('C1 选项用 inline-choice（非旧 ng-choice）', no_legacy)

    # 5. C. dialog-clickable 应在 choice 期间为 false（因为有 inline-choice），但 choice 选完后变成 true
    dlg_clickable_choice = page.evaluate("document.getElementById('ng-dialog').classList.contains('dialog-clickable')")
    check('D1 有选项时 dialog 不可整块推进', not dlg_clickable_choice, f'含 dialog-clickable={dlg_clickable_choice}')

    # 6. C. 点选项「继续前行」→ 推进 → 进入 narration → dialog 变可推进
    inline_btns = page.locator('.ng-inline-choice')
    # 第二个是「继续前行」
    inline_btns.nth(1).click()
    page.wait_for_timeout(400)
    # 现在应进入 narration / next-hint 可见
    hint_visible = page.locator('#ng-next-hint').is_visible()
    check('D2 选项后进入 narration，next-hint 可见', hint_visible)

    # 7. E. 点 dialog 推进 → 走到下一 block
    before_text = page.locator('#ng-dialog .text').text_content() or ''
    page.locator('#ng-dialog').click()
    page.wait_for_timeout(400)
    after_text = page.locator('#ng-dialog .text').text_content() or ''
    check('E1 点 dialog 整体推进 block', before_text != after_text, f'{before_text[:20]}...→{after_text[:20]}...')

    # 8. F. 一直推进直到遇见 hotzone（拿到古琴或白衣女子的 hotzone）
    for _ in range(15):
        hots = page.locator('.ng-hot').count()
        if hots >= 1: break
        page.locator('#ng-dialog').click()
        page.wait_for_timeout(200)
    check('F1 场景中出现 hotzone（道具/人物）', hots >= 1, f'hotzone={hots}')

    # 9. G. 点 hotzone → 弹场景内 modal（不是底部抽屉）
    drawer_open = page.evaluate("document.getElementById('ng-drawer').classList.contains('open')")
    check('G0 初始 drawer 未开', not drawer_open)
    # 用坐标点击（hotzone 位于场景中央区域）
    page.locator('.ng-hot').first.click()
    page.wait_for_selector('#ng-hot-modal.open', timeout=3000)
    modal_open = page.evaluate("document.getElementById('ng-hot-modal').classList.contains('open')")
    drawer_still_closed = not page.evaluate("document.getElementById('ng-drawer').classList.contains('open')")
    check('G1 hotzone 弹场景内 modal', modal_open)
    check('G2 hotzone 不再弹底部 drawer', drawer_still_closed)

    # 10. G. modal 显示对应名字 + 3 个 action 按钮
    modal_name = page.locator('#ng-hot-modal-name').text_content() or ''
    modal_actions = page.locator('#ng-hot-modal-actions .hm-btn').count()
    check('G3 modal 显示 hotzone 名字', len(modal_name) > 0, f'name={modal_name}')
    check('G4 modal ≥2 action 按钮', modal_actions >= 2, f'actions={modal_actions}')

    # 11. G. 关掉 modal
    page.locator('#ng-hot-modal-close').click()
    page.wait_for_timeout(200)
    modal_open2 = page.evaluate("document.getElementById('ng-hot-modal').classList.contains('open')")
    check('G5 ✕ 关闭 modal', not modal_open2)

    # 12. H. 背包 FAB 仍走 drawer（工具按钮）
    page.locator('#ng-fab-backpack').click()
    page.wait_for_selector('#ng-drawer.open', timeout=2000)
    drawer_open2 = page.evaluate("document.getElementById('ng-drawer').classList.contains('open')")
    check('H1 FAB 背包仍走 drawer', drawer_open2)
    page.locator('#ng-drawer-close').click()

    # 13. Z1 无 runtime error
    check('Z1 无 runtime error', not errors, f'errors={errors[:3]}')

    browser.close()

print(f'\n=== {len(PASS)} PASS / {len(FAIL)} FAIL ===')
if FAIL: sys.exit(1)
