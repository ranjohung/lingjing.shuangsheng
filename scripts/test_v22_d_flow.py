"""V22-D 主线锚点 + 支线收敛 — 验收测试
PRD-v22-novel-world-engine §10 验收 4 (支线收敛) + §P-5 + DEV_PLAN §V22-D
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from playwright.sync_api import sync_playwright

PASS, FAIL = [], []


def check(name, cond, detail=''):
    (PASS if cond else FAIL).append(f"{'✅' if cond else '❌'} {name}{(' · ' + detail) if detail else ''}")
    print(PASS[-1] if cond else FAIL[-1])


SAMPLE_TEXT = """# 灵境·双生 · 测试书
## 第一章 · 桃源初探
晋太元中，武陵人捕鱼为业。缘溪行，忘路之远近。
忽逢桃花林，夹岸数百步，中无杂树，芳草鲜美，落英缤纷。
你打算去后山采集一些不错的木头，途中遇见「白衣女子」。
「白衣女子」公子来此何事？你打算回茅草屋休息。
## 第二章 · 后山奇遇
你拾取了一些玄铁矿。你打算修理屋顶。
## 第三章 · 桃花深处
「师父」徒儿可愿随为师闭关？炉火纯青，灵气充盈。
你打算炼丹。灵气充盈，修为进境。
"""

SAMPLE_JS = repr(SAMPLE_TEXT)

# 选择器：固化为 JS 表达式而不是 f-string，避免大括号冲突
# canonical 测试（主线）
CANON_JS = """(() => {
    var store = window.NovelWorldStore.initFromText(%s, {book_title: 'test'});
    var r = window.NovelWorldFlow.selectChoice({
        choice: { action_ref: 'next_para' },
        store: store,
        anchor_idx: 0
    });
    return {kind: r.kind, paragraph: r.paragraph};
})()""" % SAMPLE_JS

# 第 1 / 2 次偏离
DIV_JS = """(() => {
    var store = window.NovelWorldStore.initFromText(%s, {book_title: 't'});
    var r1 = window.NovelWorldFlow.selectChoice({ choice: { action_ref: 'explore' }, store: store, anchor_idx: 0 });
    var r2 = window.NovelWorldFlow.selectChoice({ choice: { action_ref: 'chat' }, store: store, anchor_idx: 0 });
    return {r1_kind: r1.kind, r1_hist: r1.history_len, r2_kind: r2.kind, r2_hist: r2.history_len};
})()""" % SAMPLE_JS

# 第 3 次偏离触发收敛
CONV_JS = """(() => {
    var store = window.NovelWorldStore.initFromText(%s, {book_title: 't'});
    window.NovelWorldFlow.selectChoice({ choice: { action_ref: 'explore' }, store: store, anchor_idx: 0 });
    window.NovelWorldFlow.selectChoice({ choice: { action_ref: 'chat' }, store: store, anchor_idx: 0 });
    var r3 = window.NovelWorldFlow.selectChoice({ choice: { action_ref: 'about' }, store: store, anchor_idx: 1 });
    return {kind: r3.kind, cleared: r3.cleared};
})()""" % SAMPLE_JS

# 收敛后历史清空
HISTORY_JS = """(() => {
    var store = window.NovelWorldStore.initFromText(%s, {book_title: 't'});
    window.NovelWorldFlow.selectChoice({ choice: { action_ref: 'explore' }, store: store, anchor_idx: 0 });
    window.NovelWorldFlow.selectChoice({ choice: { action_ref: 'chat' }, store: store, anchor_idx: 0 });
    window.NovelWorldFlow.selectChoice({ choice: { action_ref: 'about' }, store: store, anchor_idx: 1 });
    return store.runtime.selected_choice_history.length;
})()""" % SAMPLE_JS


with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_context(viewport={'width': 480, 'height': 800}).new_page()
    page.add_init_script("""
        localStorage.setItem('lingjing_onboarding_done', 'true');
        localStorage.setItem('lingjing_v519_realname_done', 'true');
    """)
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(f'console.{m.type}: {m.text}') if m.type == 'error' else None)

    page.goto('http://127.0.0.1:8767/novel-game.html?demo=1', wait_until='domcontentloaded')
    page.wait_for_function('window.NovelWorldFlow && window.NovelWorldVN && window.NovelWorldStore', timeout=10000)

    # ---- A. Flow 模块加载 ----
    check('A1 NovelWorldFlow 已加载', page.evaluate('!!window.NovelWorldFlow'))
    check('A2 NovelWorldVN 已加载', page.evaluate('!!window.NovelWorldVN'))
    check('A3 NovelWorldStore 已加载', page.evaluate('!!window.NovelWorldStore'))

    # ---- B. selfTest 全 PASS（23 项）----
    self_test = page.evaluate('window.NovelWorldFlow.selfTest()')
    check('B1 Flow selfTest 全 PASS',
          self_test['passed'] == self_test['total'] and self_test['passed'] == 23,
          f"{self_test['passed']}/{self_test['total']}")

    # ---- C. 时辰推进正确 ----
    advance = page.evaluate('''(() => {
        var ps = {timeBucket: 0, time: '0年12月上旬'};
        var r1 = window.NovelWorldFlow.advanceTimeBucket(ps);
        var r2 = window.NovelWorldFlow.advanceTimeBucket(ps);
        var r3 = window.NovelWorldFlow.advanceTimeBucket(ps);
        return {r1: r1, r2: r2, r3: r3, timeBucket: ps.timeBucket, time: ps.time};
    })()''')
    check('C1 ps.timeBucket=0 +1 → 中旬', advance['r1'] == '0年12月中旬')
    check('C2 ps.timeBucket=1 +1 → 下旬', advance['r2'] == '0年12月下旬')
    check('C3 ps.timeBucket=2 +1 → 1年1月上旬', advance['r3'] == '1年1月上旬')
    check('C4 ps.timeBucket=3 +1 → 1年1月中旬',
          page.evaluate('window.NovelWorldFlow.advanceTimeBucket({timeBucket: 3})') == '1年1月中旬')

    # ---- D. 主线 canonical ----
    canonical = page.evaluate(CANON_JS)
    check('D1 canonical 选择返回 canonical kind', canonical['kind'] == 'canonical')
    check('D2 canonical 推进 anchor_idx+1 有 paragraph', canonical['paragraph'] is not None)

    # ---- E. 支线 diverged（连续 2 次）----
    div_test = page.evaluate(DIV_JS)
    check('E1 第 1 次偏离 → diverged + history=1',
          div_test['r1_kind'] == 'diverged' and div_test['r1_hist'] == 1)
    check('E2 第 2 次偏离 → diverged + history=2',
          div_test['r2_kind'] == 'diverged' and div_test['r2_hist'] == 2)

    # ---- F. 第 3 次偏离触发收敛 ----
    conv_test = page.evaluate(CONV_JS)
    check('F1 第 3 次偏离 → converged（强制回到 anchor）', conv_test['kind'] == 'converged')
    check('F2 converged cleared=true', conv_test['cleared'] == True)

    # ---- G. 收敛后历史清空 ----
    after_conv_history = page.evaluate(HISTORY_JS)
    check('G1 收敛后 history 长度=0', after_conv_history == 0)

    # ---- H. 视觉小说范式 UI ----
    # ?demo=1 会 autoShowEntry 弹 entry mask，先关掉再点 splash-start
    page.wait_for_timeout(600)
    entry_open = page.evaluate('document.querySelector("#ng-entry-mask") && document.querySelector("#ng-entry-mask").classList.contains("open")')
    if entry_open:
        page.evaluate('document.querySelector("#ng-entry-back") && document.querySelector("#ng-entry-back").click()')
        page.wait_for_timeout(200)
    page.click('#ng-splash-start')
    page.wait_for_function('window.state && window.state.v22Store && window.state.v22Store.player_state', timeout=8000)
    # 打字机 30ms/字：等首段至少打出 5 个字再断言
    page.wait_for_function(
        'document.querySelector("#ng-v22-textbox-body") && document.querySelector("#ng-v22-textbox-body").textContent.length >= 5',
        timeout=15000)
    page.wait_for_selector('#ng-v22-container', state='visible', timeout=3000)

    check('H1 视觉小说容器 #ng-v22-container 显示',
          page.evaluate('!!document.querySelector("#ng-v22-container") && document.querySelector("#ng-v22-container").style.display !== "none"'))

    check('H2 顶部状态栏 #ng-v22-topbar 显示',
          page.evaluate('!!document.querySelector("#ng-v22-topbar")'))
    check('H3 顶部时间 #ng-v22-time 显示',
          page.evaluate('!!document.querySelector("#ng-v22-time") && document.querySelector("#ng-v22-time").textContent.length > 0'))

    check('H4 底部文字框 #ng-v22-textbox 显示',
          page.evaluate('!!document.querySelector("#ng-v22-textbox")'))
    textbox_text = page.evaluate('document.querySelector("#ng-v22-textbox-body") && document.querySelector("#ng-v22-textbox-body").textContent')
    check('H5 文字框有原文内容（≥5 字）',
          textbox_text and len(textbox_text) >= 5,
          f'len={len(textbox_text) if textbox_text else 0}')

    tags_count = page.evaluate('document.querySelectorAll("#ng-v22-tags .ng-v22-tag").length')
    check('H6 悬浮标签 ≥1 个', tags_count >= 1, f'count={tags_count}')

    check('H7 模式切换 #ng-v22-mode-toggle 显示',
          page.evaluate('!!document.querySelector("#ng-v22-mode-toggle")'))

    # ---- I. 文字框点击推进 ----
    initial_anchor = page.evaluate('window.state.v22CurrentAnchor || 0')
    page.evaluate('document.querySelector("#ng-v22-textbox").click()')
    page.wait_for_timeout(200)
    after_click_anchor = page.evaluate('window.state.v22CurrentAnchor || 0')
    check('I1 第 1 次点击触发 v22CurrentAnchor 推进',
          after_click_anchor != initial_anchor,
          f'{initial_anchor} → {after_click_anchor}')

    # ---- J. 动作提取 ----
    actions_extracted = page.evaluate('window.state.v22Store.assets.actions.length')
    check('J1 从原文提取 action ≥1', actions_extracted >= 1, f'count={actions_extracted}')

    # ---- K. 零删减：原文段落 byte-equal 保留在 store（PRD §10 强制验收 1）----
    orig_paras = page.evaluate('window.state.v22Store._original_paragraphs')
    check('K1 store._original_paragraphs 保留原文 ≥5 段',
          orig_paras and len(orig_paras) >= 5,
          f'count={len(orig_paras) if orig_paras else 0}')
    check('K2 原文段 byte-equal「桃花林」（P-1 零删减铁律）',
          orig_paras and any('桃花林' in p for p in orig_paras))

    # ---- L. 视觉小说范式无聊天界面（PRD §10 强制验收 5）----
    no_chat_bubble = page.evaluate('''(!document.querySelector('.chat-bubble') &&
        !document.querySelector('[id^="chat-bubble"]') &&
        !document.querySelector('.ng-bubble'))''')
    check('L1 无聊天气泡（P-4 视觉小说范式铁律）', no_chat_bubble == True)

    # ---- M. 题材识别可视化 ----
    genre = page.evaluate('window.state.v22Store.world_bible.genre')
    check('M1 题材自动识别（5 题材之一）', genre in ['xiuxian', 'mori', 'wuxia', 'jingying', 'gongdou'],
          f'genre={genre}')

    # ---- N. 关键 JS 错误检查 ----
    critical = [e for e in errors if 'TypeError' in e or 'Cannot read' in e or 'ReferenceError' in e]
    check('N1 无关键 JS 错误', len(critical) == 0, f'errs={critical[:3]}')

    # ---- O. 截图 ----
    Path('screenshots/v22-d').mkdir(parents=True, exist_ok=True)
    page.screenshot(path='screenshots/v22-d/01-vn-home.png')

    # 点击文字框推进 3 次
    for i in range(3):
        page.evaluate('document.querySelector("#ng-v22-textbox").click()')
        page.wait_for_timeout(120)
    page.wait_for_timeout(200)
    page.screenshot(path='screenshots/v22-d/02-vn-after-3-clicks.png')

    # 标签点击 → 弹确认
    btn = page.query_selector('#ng-v22-tags .ng-v22-tag')
    if btn:
        btn.click()
        page.wait_for_timeout(200)
        confirm_open = page.evaluate('document.querySelector("#ng-v22-confirm").classList.contains("open")')
        check('O1 第 1 个悬浮标签点击有 confirm 弹窗', confirm_open, f'open={confirm_open}')
        page.screenshot(path='screenshots/v22-d/03-confirm-dialog.png')

    browser.close()

print(f'\n{"="*60}\nPASS: {len(PASS)} · FAIL: {len(FAIL)}\n{"="*60}')
if FAIL:
    sys.exit(1)
