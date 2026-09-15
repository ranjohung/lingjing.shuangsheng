"""首页功能区恢复 — 验收测试
对照《灵境 · 双生 — 首页功能区布局修复文档》§四「验收标准」7 条
"""
from playwright.sync_api import sync_playwright

PASS, FAIL = [], []


def check(name, cond, detail=''):
    (PASS if cond else FAIL).append(name)
    print(f"{'✅' if cond else '❌'} {name}{(' · ' + detail) if detail else ''}")


with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_context(viewport={'width': 480, 'height': 900}).new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(f'console.{m.type}: {m.text}') if m.type == 'error' else None)
    page.add_init_script("""
        localStorage.setItem('lingjing_onboarding_done', 'true');
        localStorage.setItem('lingjing_v519_realname_done', 'true');
    """)
    page.goto('http://127.0.0.1:8793/index.html', wait_until='domcontentloaded')
    page.wait_for_timeout(900)

    # ---- 验收 2：顶部状态栏 ----
    status_html = page.evaluate('(document.querySelector("#home-status") || {}).innerHTML || ""')
    check('验收2 · 状态栏存在', 'hs-left' in status_html)
    check('验收2 · 状态栏有头像', 'hs-avatar' in status_html)
    check('验收2 · 状态栏有问候语', 'hs-greet' in status_html)
    check('验收2 · 状态栏有通知铃铛', 'hs-bell' in status_html and '3' in status_html)
    check('验收2 · 状态栏有灵晶余额', 'hs-lj' in status_html and '💎' in status_html)

    # ---- 验收 3：签到入口 ----
    signin_html = page.evaluate('(document.querySelector("#home-signin") || {}).innerHTML || ""')
    check('验收3 · 签到卡片存在', 'signin-card' in signin_html)
    check('验收3 · 有「立即签到」按钮', '立即签到' in signin_html)
    check('验收3 · 文案含续签规则', '灵晶' in signin_html)

    # ---- 验收 4：4 个快捷入口 ----
    quick = page.evaluate('''(() => {
        var items = Array.from(document.querySelectorAll('#home-quick .home-quick-item'));
        return {count: items.length, labels: items.map(function (a) {
            var l = a.querySelector('.hq-label'); return l ? l.textContent.trim() : '';
        })};
    })()''')
    check('验收4 · 快捷入口数量=4', quick['count'] == 4, f"count={quick['count']}")
    check('验收4 · 入口含 继续阅读/陪伴/创作/每日福利',
          all(x in quick['labels'] for x in ['继续阅读', '陪伴', '创作', '每日福利']),
          ','.join(quick['labels']))

    # ---- 验收 5：4 个推荐板块 ----
    boards = page.evaluate('''(() => Array.from(document.querySelectorAll('#home-recommend .home-board h3'))
        .map(function (h) { return h.textContent.trim(); }))()''')
    check('验收5 · 推荐板块数量=4', len(boards) == 4, f"count={len(boards)}")
    check('验收5 · 板块含 今日推荐/陪伴动态/世界更新/热门活动',
          all(x in boards for x in ['今日推荐', '陪伴动态', '世界更新', '热门活动']),
          ','.join(boards))
    more = page.evaluate('document.querySelectorAll("#home-recommend .home-board-more").length')
    check('验收5 · 每板块都有「全部 ›」入口', more == 4, f"count={more}")

    # ---- 验收 6：今日推荐双列 + 无游玩人数 ----
    grid = page.evaluate('''(() => {
        var g = document.querySelector('#home-recommend .home-grid-2');
        if (!g) return null;
        var cs = getComputedStyle(g);
        return {cols: cs.gridTemplateColumns, cards: g.querySelectorAll('.home-rec-card').length};
    })()''')
    check('验收6 · 今日推荐为双列网格', bool(grid) and len(grid['cols'].split(' ')) == 2,
          f"columns={grid['cols'] if grid else None}")
    check('验收6 · 推荐卡数量≥2', bool(grid) and grid['cards'] >= 2, f"cards={grid['cards'] if grid else 0}")
    rec_text = page.evaluate('(document.querySelector("#home-recommend") || {}).textContent || ""')
    check('验收6 · 推荐卡不显示游玩人数',
          not any(k in rec_text for k in ['游玩人数', '人游玩', '人正在玩', '人在玩']))
    check('验收6 · 推荐卡显示评分', '⭐' in rec_text or '分' in rec_text)

    # ---- 验收 7：底部 5 Tab ----
    tabs = page.evaluate('''(() => {
        var bar = document.querySelector('.tabbar, #tabbar, nav[class*=tab]');
        if (!bar) return [];
        return Array.from(bar.querySelectorAll('a,button')).map(function (a) { return a.textContent.replace(/\\s/g, ''); });
    })()''')
    check('验收7 · 底部导航 5 个 Tab', len(tabs) >= 5, f"count={len(tabs)}")
    check('验收7 · Tab 含 首页/世界/心屿/创作/我的',
          all(x in ''.join(tabs) for x in ['首页', '世界', '心屿', '创作', '我的']),
          '|'.join(tabs))

    # ---- 无关：无关键 JS 错误 ----
    critical = [e for e in errors if 'TypeError' in e or 'Cannot read' in e or 'ReferenceError' in e]
    check('附加 · 无关键 JS 错误', len(critical) == 0, f"errs={critical[:2]}")

    page.screenshot(path='screenshots/home-restore-1.png', full_page=False)
    page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
    page.wait_for_timeout(400)
    page.screenshot(path='screenshots/home-restore-2-bottom.png', full_page=False)
    browser.close()

print('\n' + '=' * 60)
print(f'PASS: {len(PASS)} · FAIL: {len(FAIL)}')
print('=' * 60)
if FAIL:
    print('FAILED: ' + ', '.join(FAIL))
    raise SystemExit(1)
print('✅ 首页功能区全部验收通过')
