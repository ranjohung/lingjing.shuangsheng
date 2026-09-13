"""V20-V3 链路截图 — 世界 Tab 同人区看到桃花源记卡"""
from playwright.sync_api import sync_playwright
from pathlib import Path

out = Path('output/preview/screenshots/v20-v3')
out.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={'width': 480, 'height': 800}, device_scale_factor=2)
    page = ctx.new_page()
    page.add_init_script("""
        localStorage.setItem('lingjing_onboarding_done', 'true');
        localStorage.setItem('lingjing_realname', JSON.stringify({name:'访客', id:'11010119900101001X'}));
    """)
    page.goto('http://127.0.0.1:8767/output/preview/library.html', wait_until='domcontentloaded')
    page.wait_for_function("typeof window.LJWorld === 'object'")
    page.wait_for_timeout(400)
    # 切到同人区
    page.evaluate("window.LJWorld.goSub('tongren')")
    page.wait_for_timeout(400)
    # 滚到能看到桃花源记卡
    page.evaluate("""
        var cards = document.querySelectorAll('a[href*="taohuayuan"]');
        if (cards[0]) cards[0].scrollIntoView({block:'center'});
    """)
    page.wait_for_timeout(300)
    page.screenshot(path=str(out / 'world-tongren-taohuayuan.png'), full_page=False)
    print('✅ world-tongren-taohuayuan.png')

    browser.close()
print('output:', out)
