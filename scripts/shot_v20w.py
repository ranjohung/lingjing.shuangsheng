"""V20-W 截图：novel-game 改造后布局
   - dialog 文字 + next-hint 在底部
   - 场景中央 hotzone modal（不是底部抽屉）
   - 背景显示 hotzone 道具/人物（古琴 / 白衣女子）
"""
from playwright.sync_api import sync_playwright
from pathlib import Path

out = Path('output/preview/screenshots/v20-w')
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
    page.wait_for_selector('#ng-chapters-view', state='visible', timeout=4000)
    page.wait_for_function('document.querySelectorAll(".ng-ch-card").length >= 5')
    page.locator('.ng-ch-card').first.click()
    page.wait_for_selector('#ng-stage.active', timeout=3000)
    page.wait_for_timeout(300)

    # 推进 6 块 → 拿到古琴 + 白衣女子 → 都成为 hotzone
    for _ in range(6):
        page.locator('#ng-dialog').click()
        page.wait_for_timeout(180)
    page.wait_for_selector('.ng-hot', timeout=3000)

    # 点第一个 hotzone（古琴）→ 弹场景中央 modal
    page.locator('.ng-hot').first.click()
    page.wait_for_selector('#ng-hot-modal.open', timeout=2000)
    page.wait_for_timeout(400)
    page.screenshot(path=str(out / 'novel-game-hot-modal.png'), full_page=False)
    print('✅ novel-game-hot-modal.png')
    browser.close()
print('output:', out)
