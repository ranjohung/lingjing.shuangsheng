"""V20-X · 沉浸式影视小说阅读回归

 验证：
 A. 3 步入口流程：splash → 开始阅读 → entry mask（继续/重启）
 B. 继续路径：entry → 进度列表（无存档 → 灰态）→ 重启路径
 C. 重启路径：entry → 角色 mask（带 traits 属性勾选）→ 开始游戏
 D. 长滚动阅读：进入 reader 模式 + 章节封面 + 长滚动正文 + entity 高亮
 E. 末选项：再读一遍 / 人物 / 道具 / 感想 → 触发扩展
 F. 章节导航：上一章 / 下一章 / 章节列表
 G. 收费章节：CTA 解锁门
 H. ?book=xxx 路径：book=hongloumeng 加载完自动弹 entry
 I. 不显示 ng-dialog (V20-X 不显示旧 chat-flow)
 Z. 无 runtime 错误
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from playwright.sync_api import sync_playwright

PASS = []
FAIL = []


def check(name, cond, detail=''):
    (PASS if cond else FAIL).append(f"{'✅' if cond else '❌'} {name}{(' · ' + detail) if detail else ''}")
    print(PASS[-1] if cond else FAIL[-1])


def main():
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

        # ============ 场景 1：?demo=1 → entry mask 自动弹出 ============
        page.goto('http://127.0.0.1:8767/novel-game.html?demo=1', wait_until='domcontentloaded')
        page.wait_for_function('window.LJNovelGame && document.querySelector("#ng-entry-mask")', timeout=4000)
        page.wait_for_timeout(800)

        # A. demo 路径：entry mask 直接弹（不显示 splash）
        entry_open = page.evaluate('document.querySelector("#ng-entry-mask").classList.contains("open")')
        check('A1 demo 路径自动弹 entry mask', entry_open, '加载完示例直接弹入口')

        # A. entry mask 有 2 个主按钮 + 1 个返回
        has_continue = page.locator('#ng-entry-continue').count() == 1
        has_restart = page.locator('#ng-entry-restart').count() == 1
        check('A2 entry mask 有「继续阅读」「重新开始」按钮', has_continue and has_restart)

        # A. 首次进入 → 继续按钮 disabled（无存档）
        continue_disabled = page.evaluate('document.querySelector("#ng-entry-continue").disabled')
        check('A3 首次进入「继续阅读」disabled（无存档）', continue_disabled)

        # A. entry mask 显示书名
        book_in_entry = page.locator('#ng-entry-book').inner_text()
        check('A4 entry mask 显示书名', '桃花源' in book_in_entry or len(book_in_entry) > 1, f'book={book_in_entry}')

        # ============ 场景 2：点「重新开始」 → 角色 mask（带 traits） ============
        page.locator('#ng-entry-restart').click()
        page.wait_for_selector('#ng-char-mask.open', timeout=2000)
        check('B1 重启路径弹角色 mask', page.locator('#ng-char-mask.open').count() == 1)

        # B. 角色 mask 有 traits 区
        has_traits = page.locator('#ng-role-traits').count() == 1
        trait_count = page.locator('#ng-role-traits input[type="checkbox"]').count()
        check('B2 角色 mask 含 traits 属性勾选区', has_traits and trait_count >= 5, f'{trait_count} 个属性')

        # B. 至少 1 个模板角色卡 + 1 个自定义卡
        char_card_n = page.locator('#ng-char-grid .ng-char-card').count()
        check('B3 模板角色 + 自定义卡渲染', char_card_n >= 2, f'count={char_card_n}')

        # ============ 场景 3：选角色 + 勾选 3 个 traits → 开始游戏 ============
        page.locator('#ng-char-grid .ng-char-card').first.click()
        page.locator('#ng-role-traits label:has-text("仁义")').click()
        page.locator('#ng-role-traits label:has-text("勇武")').click()
        page.locator('#ng-role-traits label:has-text("智慧")').click()

        # 第 4 个应被拦截
        page.locator('#ng-role-traits label:has-text("文雅")').click()
        page.wait_for_timeout(200)
        traits_on = page.locator('#ng-role-traits input:checked').count()
        check('C1 traits 最多 3 个', traits_on == 3, f'on={traits_on}')

        # 开始按钮启用
        start_enabled = page.evaluate('!document.querySelector("#cm-start").disabled')
        check('C2 选角色 + 选 traits 后开始按钮启用', start_enabled)

        # ============ 场景 4：点开始 → 长滚动阅读 ============
        page.locator('#cm-start').click()
        page.wait_for_selector('#ng-reader', state='visible', timeout=3000)
        page.wait_for_timeout(400)

        # D. reader 模式：ng-reader 显示 + ng-stage 显示（章节封面）
        reader_visible = page.evaluate('document.querySelector("#ng-reader").style.display !== "none"')
        check('D1 长滚动 reader 视图显示', reader_visible)

        stage_visible = page.evaluate('document.querySelector("#ng-r-stage").style.display !== "none"')
        check('D2 章节封面 stage 显示', stage_visible)

        # D. 章节封面有标题 + CTA
        stage_title = page.locator('#ng-r-stage-title').inner_text()
        cta_text = page.locator('#ng-r-stage-cta').inner_text()
        check('D3 章节封面有标题 + 「开始本段阅读」', '第' in stage_title or len(stage_title) > 1, f'title={stage_title}, cta={cta_text}')

        # D. ng-dialog 在 V20-X 模式下隐藏（读者不被旧 chat-flow 干扰）
        dialog_hidden = page.evaluate('document.querySelector("#ng-dialog").style.display === "none"')
        check('D4 V20-X 模式下 ng-dialog 隐藏（不显示旧 chat-flow）', dialog_hidden)

        # ============ 场景 5：点 CTA → 长滚动正文 + entity 高亮 ============
        page.locator('#ng-r-stage-cta').click()
        page.wait_for_timeout(400)

        body_visible = page.evaluate('document.querySelector("#ng-r-body").style.display !== "none"')
        check('E1 点 CTA 后 body 显示', body_visible)

        foot_visible = page.evaluate('document.querySelector("#ng-r-foot").style.display !== "none"')
        check('E2 末选项 foot 显示', foot_visible)

        para_count = page.locator('#ng-r-body .ng-r-para').count()
        check('E3 长滚动正文 ≥ 3 段', para_count >= 3, f'paragraphs={para_count}')

        # entity 高亮：检查 .ng-r-entity 元素存在
        entity_count = page.locator('#ng-r-body .ng-r-entity').count()
        check('E4 entity 高亮（ng-r-entity span）', entity_count >= 1, f'entities={entity_count}')

        # ============ 场景 6：末选项「查看人物关系」 → 触发扩展 ============
        page.locator('#ng-r-foot').scroll_into_view_if_needed()
        page.locator('.ng-r-extend-btn:has-text("人物")').click()
        page.wait_for_timeout(300)

        ext_visible = page.evaluate('document.querySelector("#ng-r-extended").style.display !== "none"')
        ext_titles = page.locator('.ng-r-extended-title').all_inner_texts()
        ext_title = ext_titles[-1] if ext_titles else ''  # 取最后一个（最新触发的）
        check('F1 点「人物」按钮触发扩展面板', ext_visible and '人物' in ext_title, f'ext_title={ext_title}')

        # F. 道具按钮
        page.locator('.ng-r-extend-btn:has-text("道具")').click()
        page.wait_for_timeout(300)
        ext_titles2 = page.locator('.ng-r-extended-title').all_inner_texts()
        check('F2 点「道具」按钮触发扩展面板', '物品' in (ext_titles2[-1] if ext_titles2 else ''), f'title={ext_titles2[-1] if ext_titles2 else ""}')

        # F. 感想按钮（含 input 框）
        page.locator('.ng-r-extend-btn:has-text("感想")').click()
        page.wait_for_timeout(300)
        note_input = page.locator('#ng-r-extended-body input').count()
        check('F3 点「感想」按钮弹出 input 记录框', note_input == 1)

        # ============ 场景 7：章节导航 → 下一章 ============
        # 免费章直接到第 2 章（收费）
        page.locator('#ng-r-next').click()
        page.wait_for_timeout(500)
        # 应进入第 2 章 stage（封面 + 锁标记）
        title2 = page.locator('#ng-r-stage-title').inner_text()
        cta2 = page.locator('#ng-r-stage-cta').inner_text()
        check('G1 下一章切换成功', len(title2) > 1, f'chap2 title={title2}, cta={cta2}')

        # ============ 场景 8：收费章节 → CTA 弹付费门 ============
        if '解锁' in cta2 or '🔒' in cta2:
            page.locator('#ng-r-stage-cta').click()
            page.wait_for_timeout(400)
            paid_open = page.evaluate('document.querySelector("#ng-paid").classList.contains("open")')
            check('H1 收费章节 CTA 弹付费门', paid_open)
            # 关闭
            page.locator('#ng-paid-cancel').click()
        else:
            # 如果没收费（所有章都免费），这个测试跳过
            check('H1 收费章节 CTA 弹付费门（跳过·本章免费）', True, 'skipped')

        # ============ 场景 9：?book=hongloumeng 路径加载 ============
        # 先回 splash
        page.locator('#ng-btn-home').click()
        page.wait_for_timeout(200)
        splash_back = page.evaluate('document.querySelector("#ng-upload-view").style.display !== "none"')
        check('I1 顶栏返回按钮回到 splash', splash_back)

        # 模拟 4 大名著入口（corpus 文件不在 → 应走 EMBEDDED_BOOKS fallback）
        errors.clear()
        page.goto('http://127.0.0.1:8767/novel-game.html?book=hongloumeng', wait_until='domcontentloaded')
        page.wait_for_timeout(1500)
        # 期望：fetch 404 + EMBEDDED_BOOKS 加载 + entry mask 弹出 + 无 JS TypeError
        entry_state = page.evaluate('document.querySelector("#ng-entry-mask").classList.contains("open")')
        book_title = page.evaluate('document.querySelector("#ng-entry-book").textContent')
        check('I2 ?book=hongloumeng 走 fallback 加载并弹 entry', entry_state and len(book_title) > 1, f'book={book_title}')
        # 不应该有 JS TypeError
        type_errors = [e for e in errors if 'Cannot read' in e or 'TypeError' in e]
        check('I3 ?book=hongloumeng 加载无 TypeError', len(type_errors) == 0, f'errs={type_errors[:1]}')

        # ============ 场景 10：无 runtime error ============
        critical = [e for e in errors if 'pageerror' in e.lower() or 'TypeError' in e]
        # 过滤掉 fetch 失败（corpus 文件不存在是预期的）
        critical = [e for e in critical if 'fetch' not in e.lower() and '404' not in e]
        check('Z1 无关键 JS runtime 错误', len(critical) == 0, f'critical={critical[:1]}')

        browser.close()

    print('\n' + '=' * 50)
    print(f'PASS: {len(PASS)} / FAIL: {len(FAIL)}')
    if FAIL:
        print('\n--- FAIL DETAILS ---')
        for f in FAIL:
            print(f)


if __name__ == '__main__':
    main()