"""V20-Z 截图 · 主菜单弹窗"""
from playwright.sync_api import sync_playwright
from pathlib import Path

OUT = Path("F:/开发软件项目文件/灵境 · 双生/output/preview/screenshots/v20z")
OUT.mkdir(parents=True, exist_ok=True)


def shot(page, name):
    page.screenshot(path=str(OUT / f"{name}.png"))
    print(f"  📸 {name}.png")


with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_context(viewport={'width': 480, 'height': 800}).new_page()
    page.add_init_script("""
        localStorage.setItem('lingjing_onboarding_done', 'true');
        localStorage.setItem('lingjing_realname', JSON.stringify({name:'冒烟', id:'11010119900101001X'}));
        localStorage.setItem('lingjing_v520_wallet', JSON.stringify({crystal: 200, jade: 20}));
    """)
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

    # 1. 长滚动阅读（无底部按钮，画面+字幕）
    page.screenshot(path=str(OUT / "01-reader-clean.png"))
    print("  📸 01-reader-clean.png")

    # 滚动到第 2 段
    page.evaluate('document.querySelector("#ng-reader").scrollTop = 800')
    page.wait_for_timeout(400)
    shot(page, '02-scrolled-to-para2')

    # 滚动到第 3 段（场景不同）
    page.evaluate('document.querySelector("#ng-reader").scrollTop = 1600')
    page.wait_for_timeout(400)
    shot(page, '03-scrolled-to-para3')

    # 打开主菜单（点 ✦）
    first_card = page.locator('#ng-r-body .ng-r-para').first
    page.evaluate('document.querySelector("#ng-reader").scrollTop = 0')
    page.wait_for_timeout(300)
    first_card.locator('.ng-r-para-img-side .ng-r-para-img-action').nth(1).click()
    page.wait_for_timeout(400)
    shot(page, '04-main-menu-open')

    # 点「人物关系」
    page.locator('#ng-menu-show-chars').click()
    page.wait_for_timeout(400)
    shot(page, '05-menu-show-characters')

    # 点「写下感想」
    page.locator('#ng-menu-add-note').click()
    page.wait_for_timeout(400)
    shot(page, '06-menu-add-note')

    # 红楼梦路径
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
    shot(page, '07-hongloumeng-reader-clean')

    browser.close()

print('\n✅ 截图完成 →', OUT)