"""V22-B 题材识别器 — 验收测试
PRD-v22-novel-world-engine §5.2 + §10 验收 2 条
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from playwright.sync_api import sync_playwright

PASS, FAIL = [], []


def check(name, cond, detail=''):
    (PASS if cond else FAIL).append(f"{'✅' if cond else '❌'} {name}{(' · ' + detail) if detail else ''}")
    print(PASS[-1] if cond else FAIL[-1])


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
    page.wait_for_function('window.NovelWorldGenre && window.NovelWorldStore', timeout=8000)

    # ---- A. 模块加载 ----
    has_genre = page.evaluate('!!window.NovelWorldGenre')
    check('A1 NovelWorldGenre 已加载', has_genre)

    genre_list = page.evaluate('window.NovelWorldGenre.getGenreList()')
    check('A2 5 大题材全部注册', len(genre_list) == 5, f'list={genre_list}')

    # ---- B. detect：5 题材各 100 段样本准确率 ----
    for genre in ['xiuxian', 'mori', 'wuxia', 'jingying', 'gongdou']:
        result = page.evaluate(f'''
            (() => {{
                var samples = window.NovelWorldGenre.generateSamples("{genre}", 100);
                return window.NovelWorldGenre.detect(samples);
            }})()
        ''')
        is_correct = result['primary'] == genre
        check(f'B1 {genre} 题材识别 100 段', is_correct,
              f"primary={result['primary']}, weights={result['weights']}")

    # ---- C. combo 叠加识别 ----
    mixed = page.evaluate('''
        (() => {
            var xiuxian = window.NovelWorldGenre.generateSamples("xiuxian", 60);
            var jingying = window.NovelWorldGenre.generateSamples("jingying", 60);
            return window.NovelWorldGenre.detect(xiuxian.concat(jingying));
        })()
    ''')
    check('C1 修仙+经营叠加 combo', len(mixed['combo']) == 2, f"combo={mixed['combo']}")

    only_primary = page.evaluate('''
        (() => {
            var xiuxian = window.NovelWorldGenre.generateSamples("xiuxian", 100);
            return window.NovelWorldGenre.detect(xiuxian);
        })()
    ''')
    check('C2 纯修仙只 1 个题材', len(only_primary['combo']) == 1, f"combo={only_primary['combo']}")

    # ---- D. applyToPlayerState：属性面板装载 ----
    for genre in ['xiuxian', 'mori', 'wuxia', 'jingying', 'gongdou']:
        ps = page.evaluate(f'''
            (() => {{
                var ps = {{ attrs: {{ hp: 100, stamina: 50, copper: 31, silver: 5 }} }};
                return window.NovelWorldGenre.applyToPlayerState(ps, "{genre}");
            }})()
        ''')
        attr_names = page.evaluate(f'window.NovelWorldGenre.getAttrNames("{genre}")')
        has_all = all(k in ps['attrs'] for k in attr_names)
        check(f'D1 {genre} 属性面板全部装载', has_all, f"attrs={list(ps['attrs'].keys())}")

    # D2. 已存在的 hp/stamina 不被覆盖
    ps = page.evaluate('''
        (() => {
            var ps = { attrs: { hp: 100, stamina: 50, copper: 31, silver: 5 } };
            return window.NovelWorldGenre.applyToPlayerState(ps, "xiuxian");
        })()
    ''')
    check('D2 已有 hp/stamina 不被覆盖', ps['attrs']['hp'] == 100 and ps['attrs']['stamina'] == 50)

    # ---- E. getDefaultActions：基础操作列表 ----
    for genre in ['xiuxian', 'mori', 'wuxia', 'jingying', 'gongdou']:
        actions = page.evaluate(f'window.NovelWorldGenre.getDefaultActions("{genre}")')
        check(f'E1 {genre} 基础操作 ≥5 个', len(actions) >= 5, f"actions={actions[:3]}...")

    # ---- F. selfTest：综合自检 ----
    test_result = page.evaluate('window.NovelWorldGenre.selfTest()')
    all_correct = all(test_result.values())
    check('F1 selfTest 5 题材 100% 准确', all_correct, f"result={test_result}")

    # ---- G. 端到端：上传小说 → 题材识别 → 属性装载 ----
    end2end = page.evaluate(r'''
        (() => {
            var txt = "# 修仙记\n## 第一章 灵根\n炼气期修士觉醒灵根，灵气涌入丹田。筑基之后便可御剑飞行。\n## 第二章 飞升\n金丹大成，元婴指日可待。";
            var s = window.NovelWorldStore.initFromText(txt, {});
            return {
                genre: s.world_bible.genre,
                combo: s.world_bible.genre_combo,
                attrs_keys: Object.keys(s.player_state.attrs)
            };
        })()
    ''')
    check('G1 端到端修仙文识别为 xiuxian', end2end['genre'] == 'xiuxian', f"genre={end2end['genre']}")
    check('G2 端到端 player_state 含 修为 字段', '修为' in end2end['attrs_keys'])

    # ---- Z. 无关键 JS 错误 ----
    critical = [e for e in errors if 'TypeError' in e or 'Cannot read' in e]
    check('Z1 无关键 JS 错误', len(critical) == 0, f'errs={critical[:2]}')

    browser.close()

print(f'\n{"="*60}\nPASS: {len(PASS)} · FAIL: {len(FAIL)}\n{"="*60}')
if FAIL:
    print('FAIL DETAILS:')
    for f in FAIL: print(f'  {f}')
    sys.exit(1)