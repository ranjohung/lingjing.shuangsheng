"""V20-W2 · 端到端回归 — 点击介绍页 ▶ 游玩 → 直接进 stage（无中间页）"""
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

    # 1. ▶ 游玩按钮 → 直接进 stage，无中间页
    page.goto('http://127.0.0.1:8767/output/preview/novel-game.html?demo=1', wait_until='domcontentloaded')
    page.wait_for_timeout(1500)
    # 验证：stage 是 active（不是 setup / chapters / upload）
    active = page.evaluate("document.getElementById('ng-stage').classList.contains('active')")
    upload_visible = page.evaluate("document.getElementById('ng-upload-view').style.display !== 'none'")
    chapters_visible = page.evaluate("document.getElementById('ng-chapters-view').style.display !== 'none'")
    setup_present = page.evaluate("!!document.getElementById('ng-setup-view')")
    check('A1 ▶ 游玩 后 stage active', active)
    check('A2 上传页不可见', not upload_visible, f'upload.style.display={"block" if upload_visible else "none"}')
    check('A3 章节列表不可见（首屏非章节列表）', not chapters_visible)
    check('A4 没有 setup-view DOM', not setup_present, '扮演界面 HTML 已移除')

    # 2. 顶栏章节标题（ng-title）显示书名「桃花源记 · 通用示例」
    title = page.locator('#ng-title').text_content() or ''
    check('B1 顶栏书名 = 桃花源记', '桃花源' in title, f'title={title}')

    # 3. scene 显示「山间小路」开场场景
    scene_name = page.evaluate("document.getElementById('ng-scene-name') && document.getElementById('ng-scene-name').textContent")
    check('B2 scene = 山间小路（demo-txt 第一场景）', scene_name == '山间小路', f'scene={scene_name}')

    # 4. 验证 ng-btn-chapters 不显示（无存档）
    chapters_btn = page.evaluate("document.getElementById('ng-btn-chapters').style.display")
    check('C1 顶栏读档按钮隐藏（无存档）', chapters_btn == 'none', f'display={chapters_btn}')

    # 5. 默认主角 = BOOK_CHARACTERS.taohuayuan[0] = 渔人
    player_in_state = page.evaluate("JSON.stringify(window.LJNovelGame.state())")
    has_yuren = '"name":"渔人"' in player_in_state
    check('D1 默认主角 = 渔人', has_yuren, f'state has "渔人"')

    # 6. 推进 narration → narration → item（古琴入场景）
    for _ in range(5):
        page.locator('#ng-dialog').click()
        page.wait_for_timeout(180)
    hots = page.locator('.ng-hot').count()
    check('E1 推进后场景中出现 hotzone', hots >= 1, f'hotzone={hots}')

    # 7. ng-hot-modal 已能正常弹出
    if hots >= 1:
        page.locator('.ng-hot').first.click()
        page.wait_for_selector('#ng-hot-modal.open', timeout=2000)
        modal_open = page.evaluate("document.getElementById('ng-hot-modal').classList.contains('open')")
        check('F1 hotzone 弹场景中央 modal', modal_open)

    # 8. ng-btn-home 行为：stage → upload（无存档时）
    # 关闭 modal
    page.locator('#ng-hot-modal-close').click()
    page.wait_for_timeout(200)
    page.locator('#ng-btn-home').click()
    page.wait_for_timeout(400)
    upload_after_back = page.evaluate("document.getElementById('ng-upload-view').style.display !== 'none'")
    check('G1 stage 主页 → 上传页（无存档）', upload_after_back)

    # 9. 点 demo 按钮 → 重新进入 stage（直跳不再经过中间页）
    page.locator('#ng-demo').click()
    page.wait_for_timeout(800)
    stage_again = page.evaluate("document.getElementById('ng-stage').classList.contains('active')")
    check('G2 再点 demo 仍直接进 stage（直跳）', stage_again)

    # 10. 无 runtime error
    check('Z1 无 runtime error', not errors, f'errors={errors[:3]}')

    browser.close()

print(f'\n=== {len(PASS)} PASS / {len(FAIL)} FAIL ===')
if FAIL: sys.exit(1)
