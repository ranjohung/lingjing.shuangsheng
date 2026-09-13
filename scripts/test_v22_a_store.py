"""V22-A 数据中枢 + parser 强化 — 验收测试
PRD-v22-novel-world-engine §10 验收 1-5 条 + 数据中枢字段完整性
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from playwright.sync_api import sync_playwright

PASS, FAIL = [], []


def check(name, cond, detail=''):
    (PASS if cond else FAIL).append(f"{'✅' if cond else '❌'} {name}{(' · ' + detail) if detail else ''}")
    print(PASS[-1] if cond else FAIL[-1])


SAMPLE_TEXT = """# 灵境·双生 · 示例小说
## 第一章 · 初醒
太元中，武陵人捕鱼为业。缘溪行，忘路之远近。忽逢桃花林，夹岸数百步，中无杂树。
你打算去后山采集一些不错的木头。夜半时分，月黑风高，林中传来奇异的声响。
## 第二章 · 后山奇遇
【收费章节：15灵晶】
你拾取了一些玄铁矿。「白衣女子」公子来此何事？你打算去城镇。
你打算修理屋顶，需要3木头。
## 第三章 · 桃花深处
你打算炼丹。炉火纯青，灵气充盈。「师父」徒儿可愿随为师闭关？
"""

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
    page.wait_for_function('window.LJNovelParser && window.NovelWorldParser && window.NovelWorldStore', timeout=8000)

    # ---- A. parser 加载 ----
    has_parser = page.evaluate('!!window.NovelWorldParser')
    check('A1 NovelWorldParser 已加载', has_parser)

    has_store = page.evaluate('!!window.NovelWorldStore')
    check('A2 NovelWorldStore 已加载', has_store)

    # ---- B. 5 步流水线字段完整性 ----
    pipeline = page.evaluate(f'''(() => {{
        var t = {repr(SAMPLE_TEXT)};
        return window.NovelWorldParser.runPipeline(t);
    }})()''')

    check('B1 world_bible 字段齐全',
          all(k in pipeline['world_bible'] for k in ['genre', 'era', 'power_system', 'factions', 'forbidden_rules']),
          f"keys={list(pipeline['world_bible'].keys())}")

    check('B2 scenes 字段齐全', len(pipeline['scenes']) >= 3,
          f"count={len(pipeline['scenes'])}")

    check('B3 npcs 字段齐全', isinstance(pipeline['npcs'], list))

    check('B4 items 字段齐全', isinstance(pipeline['items'], list))

    check('B5 actions 字段齐全（>=2）', len(pipeline['actions']) >= 2,
          f"count={len(pipeline['actions'])}")

    # ---- C. 零删减（byte-equal 原文保留）----
    paras_in_pipeline = pipeline.get('original_paragraphs', [])
    sample_lines = ['太元中，武陵人捕鱼为业。', '你打算去后山采集一些不错的木头。', '你拾取了一些玄铁矿。']
    paras_text = '\n'.join(paras_in_pipeline)
    preserved = all(s in paras_text for s in sample_lines)
    check('C1 原文关键句 byte-equal 保留', preserved,
          f"missing={[s for s in sample_lines if s not in paras_text]}")

    # ---- D. 题材识别 ----
    genre = pipeline['world_bible']['genre']
    check('D1 题材自动识别成功', genre in ['xiuxian', 'mori', 'wuxia', 'jingying', 'gongdou'],
          f"genre={genre}")

    # ---- E. 悬浮标签 actions ----
    actions = pipeline['actions']
    action_types = [a['action_type'] for a in actions]
    check('E1 actions 含 travel 类型', 'travel' in action_types, f"types={action_types}")
    check('E2 actions 含 pick 类型', 'pick' in action_types)
    check('E3 actions 含 position 字段', all('position' in a for a in actions))

    # ---- F. Store 初始化 ----
    store = page.evaluate(f'''(() => {{
        var t = {repr(SAMPLE_TEXT)};
        return window.NovelWorldStore.initFromText(t, {{book_title: '测试', book_author: '自动'}});
    }})()''')

    check('F1 Store meta 含 book_title', store.get('meta', {}).get('book_title') == '测试')
    check('F2 Store world_bible 已注入', 'genre' in store.get('world_bible', {}))
    check('F3 Store assets.scenes 已注入', len(store.get('assets', {}).get('scenes', [])) >= 3)
    check('F4 Store player_state 已建立', 'attrs' in store.get('player_state', {}))
    check('F5 Store _original_text 保留原文', '太元中' in store.get('_original_text', ''))
    check('F6 Store _original_paragraphs 保留',
          len(store.get('_original_paragraphs', [])) >= 5)

    # ---- G. Store CRUD ----
    page.evaluate('''
        window.__test_store = window.NovelWorldStore.initFromText(
            "# 测试书\\n## 第一章\\n你打算去后山采集一些不错的木头。\\n夜半时分，月黑风高，林中传来奇异的声响。\\n## 第二章\\n你拾取了一些玄铁矿。「白衣女子」公子来此何事？\\n你打算修理屋顶，需要3木头。",
            {book_title: 'crud-test', traits: ['勇武']}
        );
    ''')

    # G1. setAttr
    page.evaluate('window.NovelWorldStore.setAttr(window.__test_store, "hp", 50)')
    new_hp = page.evaluate('window.__test_store.player_state.attrs.hp')
    check('G1 setAttr 修改 hp=50', new_hp == 50, f'hp={new_hp}')

    # G2. addItem
    page.evaluate('window.NovelWorldStore.addItem(window.__test_store, "wood_01", 3)')
    bp = page.evaluate('window.__test_store.player_state.backpack')
    check('G2 addItem 加入 wood_01 x3', any(x.get('item_id') == 'wood_01' and x.get('quantity') == 3 for x in bp))

    # G3. consumeItem 成功
    ok = page.evaluate('window.NovelWorldStore.consumeItem(window.__test_store, "wood_01", 1)')
    bp_after = page.evaluate('window.__test_store.player_state.backpack')
    check('G3 consumeItem 扣 1 成功', ok and bp_after[0]['quantity'] == 2)

    # G4. consumeItem 失败（超量）
    fail = page.evaluate('window.NovelWorldStore.consumeItem(window.__test_store, "wood_01", 99)')
    check('G4 consumeItem 超量返回 false', not fail)

    # G5. setAffinity
    page.evaluate('window.NovelWorldStore.setAffinity(window.__test_store, "npc_1", 5)')
    af = page.evaluate('window.__test_store.player_state.affinity_log.npc_1')
    check('G5 setAffinity +5', af == 5)

    # G6. recordChoice
    page.evaluate('window.NovelWorldStore.recordChoice(window.__test_store, "偏离选项")')
    page.evaluate('window.NovelWorldStore.recordChoice(window.__test_store, "偏离选项2")')
    page.evaluate('window.NovelWorldStore.recordChoice(window.__test_store, "偏离选项3")')
    should_conv = page.evaluate('window.NovelWorldStore.shouldConverge(window.__test_store)')
    check('G6 3 次偏离后 shouldConverge=true', should_conv)

    # G7. clearDivergence
    page.evaluate('window.NovelWorldStore.clearDivergence(window.__test_store)')
    hist = page.evaluate('window.__test_store.runtime.selected_choice_history')
    check('G7 clearDivergence 清空历史', len(hist) == 0)

    # G8. hasOriginalParagraph（零删减校验）
    in_orig = page.evaluate('window.NovelWorldStore.hasOriginalParagraph(window.__test_store, "你打算去后山采集一些不错的木头。")')
    check('G8 hasOriginalParagraph 正确', in_orig)

    not_in_orig = page.evaluate('window.NovelWorldStore.hasOriginalParagraph(window.__test_store, "凭空捏造的内容XYZ")')
    check('G9 凭空捏造内容不在原文', not not_in_orig)

    # ---- H. localStorage 读写 ----
    save_ok = page.evaluate('window.NovelWorldStore.save("test_book", window.__test_store)')
    check('H1 save 成功', save_ok)

    loaded = page.evaluate('window.NovelWorldStore.load("test_book")')
    check('H2 load 成功', loaded.get('meta', {}).get('book_title') == 'crud-test')

    page.evaluate('window.NovelWorldStore.reset("test_book")')
    after_reset = page.evaluate('window.NovelWorldStore.load("test_book")')
    check('H3 reset 后 load 返回默认', after_reset.get('meta', {}).get('book_title') is None or after_reset.get('meta', {}).get('book_title') == '')

    # ---- I. 题材属性面板装载 ----
    for genre_id in ['xiuxian', 'mori', 'wuxia', 'jingying', 'gongdou']:
        attrs = page.evaluate(f'window.NovelWorldStore.defaultAttrs("{genre_id}")')
        check(f'I1 题材 {genre_id} 属性面板 ≥4 个字段', len(attrs) >= 4, f"keys={list(attrs.keys())}")

    # ---- Z. 无关键 JS 错误 ----
    critical = [e for e in errors if 'TypeError' in e or 'Cannot read' in e]
    check('Z1 无关键 JS 错误', len(critical) == 0, f'errs={critical[:2]}')

    browser.close()

print(f'\n{"="*60}\nPASS: {len(PASS)} · FAIL: {len(FAIL)}\n{"="*60}')
if FAIL:
    print('FAIL DETAILS:')
    for f in FAIL: print(f'  {f}')
    sys.exit(1)