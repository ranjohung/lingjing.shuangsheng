"""V20-Z · 功能迁移到主菜单弹窗回归测试"""
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

        # 走完 3 步入口 → 角色 → 进入游戏
        page.goto('http://127.0.0.1:8767/novel-game.html?demo=1', wait_until='domcontentloaded')
        page.wait_for_timeout(1000)
        page.locator('#ng-entry-restart').click()
        page.wait_for_selector('#ng-char-mask.open', timeout=2000)
        page.locator('#ng-char-grid .ng-char-card').first.click()
        page.locator('#ng-role-traits label:has-text("仁义")').click()
        page.locator('#ng-role-traits label:has-text("勇武")').click()
        page.locator('#cm-start').click()
        page.wait_for_selector('#ng-reader', state='visible', timeout=3000)
        page.wait_for_timeout(400)
        page.locator('#ng-r-stage-cta').click()
        page.wait_for_timeout(500)

        # A. V20-Z：删除 ng-r-foot（末选项区）
        foot = page.locator('#ng-r-foot').count()
        check('A1 删除 ng-r-foot 末选项区', foot == 0)
        # 删除 ng-back-top
        back_top = page.locator('#ng-back-top').count()
        check('A2 删除 ng-back-top 回顶按钮', back_top == 0)
        # 删除 ng-r-end-actions / ng-r-extended
        end_actions = page.locator('#ng-r-end-actions').count()
        end_extended = page.locator('#ng-r-extended').count()
        check('A3 删除 ng-r-end-actions / ng-r-extended', end_actions == 0 and end_extended == 0)

        # B. 游戏界面下方无按键遮挡
        # 检查页面底部 50px 内是否有按钮（除右侧浮动按钮外）
        # 通过截图视觉判定（这里简化为检查 foot 元素不在 reader 末尾）
        reader_flex_ok = page.evaluate('document.querySelector("#ng-reader").children.length')
        # 应该有 ng-r-stage + ng-r-body = 2 个子元素
        check('B1 reader 只含 stage + body（无 foot）', reader_flex_ok == 2, f'children={reader_flex_ok}')

        # C. 主菜单弹窗存在且未开启
        menu_mask = page.locator('#ng-menu-mask').count()
        menu_open = page.evaluate('document.querySelector("#ng-menu-mask").classList.contains("open")')
        check('C1 主菜单 ng-menu-mask 存在', menu_mask == 1)
        check('C2 主菜单默认关闭', not menu_open)

        # D. 段落卡片右侧 ✦ 按钮存在 → 点击打开主菜单
        first_card = page.locator('#ng-r-body .ng-r-para').first
        right_btns = first_card.locator('.ng-r-para-img-side .ng-r-para-img-action')
        right_n = right_btns.count()
        check('D1 右侧浮动按钮 5 个（收起/主菜单/收藏/分享/截图）', right_n == 5, f'count={right_n}')

        # 点击主菜单 ✦ 按钮（第 2 个）
        right_btns.nth(1).click()
        page.wait_for_timeout(400)
        menu_now_open = page.evaluate('document.querySelector("#ng-menu-mask").classList.contains("open")')
        check('D2 点 ✦ 按钮打开主菜单', menu_now_open)

        # E. 主菜单内容齐全：人物/章节/存档/段落/返回
        menu_sections = page.locator('#ng-menu-mask .ng-menu-section').count()
        check('E1 主菜单 5 个 section（人物/章节/存档/段落/返回）', menu_sections >= 5, f'sections={menu_sections}')

        # 人物属性已填入（带 traits）
        menu_name = page.locator('#ng-menu-name').inner_text()
        menu_traits_n = page.locator('#ng-menu-traits span').count()
        check('E2 主菜单显示人物名字', len(menu_name) > 1 and menu_name != '未选择', f'name={menu_name}')
        check('E3 主菜单显示 traits（≥ 1）', menu_traits_n >= 1, f'traits={menu_traits_n}')

        # 章节导航按钮
        prev_disabled = page.evaluate('document.querySelector("#ng-menu-prev").disabled')
        next_disabled = page.evaluate('document.querySelector("#ng-menu-next").disabled')
        check('E4 第 1 章时「上一章」disabled', prev_disabled)
        check('E5 第 1 章时「下一章」可用', not next_disabled)

        # F. 点「查看人物关系」→ 触发扩展面板
        page.locator('#ng-menu-show-chars').click()
        page.wait_for_timeout(300)
        ext_visible = page.evaluate('document.querySelector("#ng-menu-extension").style.display !== "none"')
        ext_title = page.locator('#ng-menu-ext-title').inner_text()
        check('F1 主菜单「人物关系」触发扩展', ext_visible and '人物' in ext_title)

        # H. 关闭主菜单（点击 mask 空白区域）
        page.locator('#ng-menu-mask').click(position={'x': 5, 'y': 5})
        page.wait_for_timeout(300)
        menu_closed = page.evaluate('!document.querySelector("#ng-menu-mask").classList.contains("open")')
        check('H1 主菜单可关闭（点击空白区域）', menu_closed)

        # I. 重新打开主菜单 → 点「下一章」→ 切换章节
        first_card.locator('.ng-r-para-img-side .ng-r-para-img-action').nth(1).click()
        page.wait_for_timeout(400)
        # 菜单再次打开
        menu_open2 = page.evaluate('document.querySelector("#ng-menu-mask").classList.contains("open")')
        check('I0 主菜单可重新打开', menu_open2)

        page.locator('#ng-menu-next').click()
        page.wait_for_timeout(500)
        chap2_title = page.locator('#ng-r-stage-title').inner_text()
        check('I1 主菜单「下一章」切换成功', len(chap2_title) > 1, f'chap2={chap2_title}')

        # I2. 切换后菜单自动关闭
        menu_after = page.evaluate('document.querySelector("#ng-menu-mask").classList.contains("open")')
        check('I2 切章后菜单自动关闭', not menu_after)

        # I. 4 大名著接通（红楼梦 fallback 路径）
        page.goto('http://127.0.0.1:8767/novel-game.html?book=hongloumeng', wait_until='domcontentloaded')
        page.wait_for_timeout(1500)
        page.locator('#ng-entry-restart').click()
        page.wait_for_selector('#ng-char-mask.open', timeout=2000)
        page.locator('#ng-char-grid .ng-char-card').first.click()
        page.locator('#cm-start').click()
        page.wait_for_selector('#ng-reader', state='visible', timeout=3000)
        page.wait_for_timeout(400)
        page.locator('#ng-r-stage-cta').click()
        page.wait_for_timeout(500)
        check('I1 红楼梦路径进入长滚动阅读', page.locator('#ng-reader').is_visible())
        check('I2 红楼梦无 ng-r-foot', page.locator('#ng-r-foot').count() == 0)

        # J. 无 runtime 错误
        critical = [e for e in errors if ('Cannot read' in e or 'TypeError' in e) and 'fetch' not in e.lower()]
        check('J1 无关键 JS runtime 错误', len(critical) == 0, f'critical={critical[:1]}')

        browser.close()

    print('\n' + '=' * 50)
    print(f'PASS: {len(PASS)} / FAIL: {len(FAIL)}')
    if FAIL:
        print('\n--- FAIL DETAILS ---')
        for f in FAIL:
            print(f)


if __name__ == '__main__':
    main()