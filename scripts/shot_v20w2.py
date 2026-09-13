"""V20-W2 截图 — 点击介绍图后直接进 game 的样子（中间无任何列表/中间页）"""
from playwright.sync_api import sync_playwright
from pathlib import Path

out = Path('output/preview/screenshots/v20-w2')
out.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={'width': 480, 'height': 800}, device_scale_factor=2)
    page = ctx.new_page()
    page.add_init_script("""
        localStorage.setItem('lingjing_onboarding_done', 'true');
        localStorage.setItem('lingjing_realname', JSON.stringify({name:'访客', id:'11010119900101001X'}));
        localStorage.setItem('lingjing_v520_wallet', JSON.stringify({crystal: 200, jade: 30}));
    """)
    page.goto('http://127.0.0.1:8767/output/preview/novel-game.html?demo=1', wait_until='domcontentloaded')
    page.wait_for_selector('#ng-stage.active', timeout=4000)
    page.wait_for_timeout(600)
    page.screenshot(path=str(out / 'direct-to-game.png'), full_page=False)
    print('✅ direct-to-game.png')
    browser.close()
print('output:', out)
