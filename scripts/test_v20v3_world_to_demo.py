"""V20-V2-final smoke — 世界 Tab 同人区 → 桃花源记 → 介绍页 → ▶ 游玩 → demo 自动加载"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from playwright.sync_api import sync_playwright

PASS = []
FAIL = []


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
        localStorage.setItem('lingjing_realname', JSON.stringify({name:'访客', id:'11010119900101001X'}));
    """)

    # 1. 打开世界 Tab
    page.goto('http://127.0.0.1:8767/output/preview/library.html', wait_until='domcontentloaded')
    page.wait_for_function("typeof window.LJWorld === 'object'", timeout=4000)
    page.wait_for_timeout(400)
    check('A1 世界 tab 加载', page.locator('#tabbar-mount').count() == 1 or page.locator('.tabbar').count() >= 1)

    # 2. 切到「同人区」子导航
    page.evaluate("window.LJWorld.goSub('tongren')")
    page.wait_for_timeout(500)

    # 3. 找到桃花源记卡片
    page.wait_for_function(
        """Array.from(document.querySelectorAll('a, .ds-wf-card')).some(
            el => el.getAttribute && el.getAttribute('href') && el.getAttribute('href').includes('taohuayuan')
        )""",
        timeout=4000
    )
    found = page.locator('a[href*="taohuayuan"]').count()
    check('A2 桃花源记卡片可见', found >= 1, f'count={found}')

    # 4. 点入桃花源记介绍页
    page.locator('a[href*="taohuayuan"]').first.click()
    page.wait_for_url('**/plot-detail.html?novel=taohuayuan', timeout=4000)
    check('B1 进入 plot-detail?novel=taohuayuan', 'taohuayuan' in page.url, f'url={page.url}')

    # 5. 介绍页可见 title
    page.wait_for_selector('.pl-act-start', timeout=4000)
    title = page.locator('.pl-title, h1, .pl-hero-title').first.text_content() or ''
    # 兜底查 body
    body_text = page.evaluate("document.body.textContent")
    check('B2 介绍页含桃花源', '桃花源' in body_text, f'body 内含「桃花源」')

    # 6. 点「▶ 游玩」按钮 → 路由到 novel-game.html?demo=1
    page.locator('#pl-act-start').click()
    page.wait_for_url('**/novel-game.html?demo=1', timeout=4000)
    check('C1 ▶ 游玩 → novel-game.html?demo=1', 'demo=1' in page.url, f'url={page.url}')

    # 7. demo 自动加载 → 章节列表
    page.wait_for_selector('#ng-chapters-view', state='visible', timeout=4000)
    page.wait_for_function('document.querySelectorAll(".ng-ch-card").length >= 5', timeout=4000)
    book_title = page.locator('#ng-book-title').text_content() or ''
    cards = page.locator('.ng-ch-card').count()
    check('D1 自动加载章节列表 · 书名', '桃花源' in book_title, f'title={book_title}')
    check('D2 自动加载章节列表 · 6 章', cards == 6, f'cards={cards}')

    # 8. 验证第 5 章（免费）能进 stage
    page.locator('.ng-ch-card').nth(4).click()
    page.wait_for_selector('#ng-stage.active', timeout=3000)
    check('D3 免费章进入游戏', page.evaluate("document.getElementById('ng-stage').classList.contains('active')"))

    check('Z1 无 runtime error', not errors, f'errors={errors[:3]}')

    browser.close()

print(f'\n=== {len(PASS)} PASS / {len(FAIL)} FAIL ===')
if FAIL:
    sys.exit(1)
