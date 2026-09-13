"""V20-X 截图 · 沉浸式影视小说阅读完整流程"""
from playwright.sync_api import sync_playwright
import sys, os
from pathlib import Path

OUT_DIR = Path("F:/开发软件项目文件/灵境 · 双生/output/preview/screenshots/v20x")
OUT_DIR.mkdir(parents=True, exist_ok=True)


def shot(page, name):
    path = OUT_DIR / f"{name}.png"
    page.screenshot(path=str(path))
    print(f"  📸 {name}.png ({path.stat().st_size // 1024}KB)")


with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_context(viewport={'width': 480, 'height': 800}).new_page()
    page.add_init_script("""
        localStorage.setItem('lingjing_onboarding_done', 'true');
        localStorage.setItem('lingjing_realname', JSON.stringify({name:'冒烟', id:'11010119900101001X'}));
        localStorage.setItem('lingjing_v520_wallet', JSON.stringify({crystal: 200, jade: 20}));
    """)

    # 1. Splash 屏（?demo=1 → entry mask 自动弹，截图 entry mask）
    print('📖 V20-X 流程截图：')
    page.goto('http://127.0.0.1:8767/novel-game.html?demo=1', wait_until='domcontentloaded')
    page.wait_for_timeout(1500)
    shot(page, '01-entry-mask')

    # 2. 选「重新开始」 → 角色 mask（含 traits）
    page.locator('#ng-entry-restart').click()
    page.wait_for_selector('#ng-char-mask.open', timeout=2000)
    page.wait_for_timeout(500)
    shot(page, '02-role-mask-with-traits')

    # 3. 选角色 + traits → 开始游戏
    page.locator('#ng-char-grid .ng-char-card').first.click()
    page.locator('#ng-role-traits label:has-text("仁义")').click()
    page.locator('#ng-role-traits label:has-text("勇武")').click()
    page.locator('#ng-role-traits label:has-text("智慧")').click()
    page.wait_for_timeout(400)
    shot(page, '03-role-selected-with-traits')

    page.locator('#cm-start').click()
    page.wait_for_selector('#ng-reader', state='visible', timeout=3000)
    page.wait_for_timeout(500)
    shot(page, '04-chapter-cover-stage')

    # 4. 点 CTA → 长滚动正文
    page.locator('#ng-r-stage-cta').click()
    page.wait_for_timeout(500)
    shot(page, '05-long-scroll-reader')

    # 5. 滚动到末选项
    page.locator('#ng-r-foot').scroll_into_view_if_needed()
    page.wait_for_timeout(400)
    shot(page, '06-end-actions-foot')

    # 6. 点「人物」→ 扩展
    page.locator('.ng-r-extend-btn:has-text("人物")').click()
    page.wait_for_timeout(400)
    shot(page, '07-extension-characters')

    # 7. 回到 splash（点首页图标）
    page.locator('#ng-btn-home').click()
    page.wait_for_timeout(400)
    shot(page, '08-splash-with-book')

    # 8. 红楼梦路径
    print('📚 4 大名著截图：')
    page.goto('http://127.0.0.1:8767/novel-game.html?book=hongloumeng', wait_until='domcontentloaded')
    page.wait_for_timeout(1500)
    shot(page, '09-hongloumeng-entry')

    page.locator('#ng-entry-restart').click()
    page.wait_for_selector('#ng-char-mask.open', timeout=2000)
    page.wait_for_timeout(500)
    shot(page, '10-hongloumeng-role-picker')

    page.locator('#ng-char-grid .ng-char-card').first.click()
    page.locator('#cm-start').click()
    page.wait_for_selector('#ng-reader', state='visible', timeout=3000)
    page.wait_for_timeout(500)
    shot(page, '11-hongloumeng-cover')

    page.locator('#ng-r-stage-cta').click()
    page.wait_for_timeout(500)
    shot(page, '12-hongloumeng-reader')

    browser.close()

print('\n✅ 截图完成 →', OUT_DIR)