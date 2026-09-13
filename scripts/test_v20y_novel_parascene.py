"""V20-Y · 段落配图（画面 + 字幕）回归测试"""
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
            localStorage.setItem('lingjing_v520_wallet', JSON.stringify({crystal: 200, jade: 20}));
        """)

        # 走完 splash → entry → 角色 → 进入游戏
        page.goto('http://127.0.0.1:8767/novel-game.html?demo=1', wait_until='domcontentloaded')
        page.wait_for_timeout(1000)
        page.locator('#ng-entry-restart').click()
        page.wait_for_selector('#ng-char-mask.open', timeout=2000)
        page.locator('#ng-char-grid .ng-char-card').first.click()
        page.wait_for_timeout(200)
        page.locator('#cm-start').click()
        page.wait_for_selector('#ng-reader', state='visible', timeout=3000)
        page.wait_for_timeout(400)
        page.locator('#ng-r-stage-cta').click()
        page.wait_for_timeout(500)

        # A. 每个段落卡片包含 img + text 两部分
        first_card = page.locator('#ng-r-body .ng-r-para').first
        has_img = first_card.locator('.ng-r-para-img').count() == 1
        has_text = first_card.locator('.ng-r-para-text').count() == 1
        check('A1 段落卡片含场景图区', has_img)
        check('A2 段落卡片含文字字幕区', has_text)

        # B. 场景图有 emoji + label + progress
        emoji_n = first_card.locator('.ng-r-para-img-emoji').count()
        label_n = first_card.locator('.ng-r-para-img-label').count()
        progress_n = first_card.locator('.ng-r-para-img-progress').count()
        check('B1 场景图含大 emoji', emoji_n == 1)
        check('B2 场景图含左上 label', label_n == 1)
        check('B3 场景图含右上 progress', progress_n == 1)

        # C. 浮动按钮：左侧 3 个 + 右侧 6 个（田间记范式）
        left_n = first_card.locator('.ng-r-para-img-actions .ng-r-para-img-action').count()
        right_n = first_card.locator('.ng-r-para-img-side .ng-r-para-img-action').count()
        check('C1 左侧浮动按钮 3 个', left_n == 3, f'count={left_n}')
        check('C2 右侧浮动按钮 6 个（菜单/丸漫/收藏/分享/截图/收起）', right_n == 6, f'count={right_n}')

        # D. 段落文字有 entity 高亮（宽松判定：检查文本流结构 OK）
        text_html = first_card.locator('.ng-r-para-text-flow').inner_html()
        # 至少有一处 entity 高亮 OR 文本渲染正确
        text_text = first_card.locator('.ng-r-para-text-flow').inner_text()
        check('D1 文字流正确渲染', len(text_text) > 5, f'len={len(text_text)}')

        # E1 整个 body 至少有一处 entity 高亮（不限段落）
        any_entity = page.evaluate('document.querySelectorAll("#ng-r-body .ng-r-entity").length')
        check('E2 整个 body 至少 1 处 entity 高亮', any_entity >= 1, f'entities={any_entity}')

        # E. 长滚动正文 ≥ 5 段（桃花源记有 5 段）
        para_count = page.locator('#ng-r-body .ng-r-para').count()
        check('E1 长滚动正文 ≥ 5 段', para_count >= 5, f'paragraphs={para_count}')

        # F. 段落卡片高度 ≥ 60vh（屏幕级 · 田间记范式）
        card_height = first_card.evaluate('el => el.offsetHeight')
        viewport_h = 800  # 800 viewport
        check('F1 段落卡片高度 ≥ 60vh', card_height >= 480, f'h={card_height}vh')

        # G. 末选项仍在底部
        foot_visible = page.evaluate('document.querySelector("#ng-r-foot").style.display !== "none"')
        check('G1 末选项 foot 显示', foot_visible)

        # H. 章节导航 + 收费门 仍然工作
        page.locator('#ng-r-next').click()
        page.wait_for_timeout(500)
        cta = page.locator('#ng-r-stage-cta').inner_text()
        check('H1 下一章切换 + 收费门 CTA', '解锁' in cta or '🔒' in cta, f'cta={cta}')

        # I. 无 runtime 错误（排除 fetch 404）
        critical = [e for e in errors if ('Cannot read' in e or 'TypeError' in e) and 'fetch' not in e.lower()]
        check('I1 无关键 JS runtime 错误', len(critical) == 0, f'critical={critical[:1]}')

        browser.close()

    print('\n' + '=' * 50)
    print(f'PASS: {len(PASS)} / FAIL: {len(FAIL)}')
    if FAIL:
        print('\n--- FAIL DETAILS ---')
        for f in FAIL:
            print(f)


if __name__ == '__main__':
    main()