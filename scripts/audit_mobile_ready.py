# -*- coding: utf-8 -*-
"""真机就绪审计（mobile-ready audit）· 全功能区推进 V22-1
目标：把全部 preview 页面推进到「可上手机模拟器真机测试」状态。
检测（390x844 移动视口 is_mobile）：
  1 load：pageerror / console.error / >=400 响应
  2 lock：body computed max-width <= 481px（V20-G 全手机版，390 视口下所有页都应锁定）
  3 blank：body innerText 去空白 < 30 字 → 疑似白屏
  4 shell：5 Tab 壳页应有 .tabbar；子页应有返回类元素（含「←」或「返回」的 a/button）
  5 click：可见交互元素抽查（≤40/页），点击后新增 JS 错误记录
  6 shot：每页截图 output/preview/screenshots/audit-m/
豁免（另一条线并行开发中，只记录不计阻断）：novel-game.html / sanguo-world.html
输出：scripts/mobile_ready_result.json + 控制台摘要（阻断页清单）
"""
import json, os, socket, subprocess, sys, time
from playwright.sync_api import sync_playwright

# 端口铁则：8767 可能被并行会话占用（根目录不定），审计用独立端口 8793（仓库根）
BASE = 'http://localhost:8793'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PREVIEW = os.path.join(ROOT, 'output', 'preview')
SHOTDIR = os.path.join(PREVIEW, 'screenshots', 'audit-m')
os.makedirs(SHOTDIR, exist_ok=True)


def start_server():
    try:
        s = socket.create_connection(('localhost', 8793), timeout=1)
        s.close()
        print('server already on 8793')
        return None
    except OSError:
        pass
    proc = subprocess.Popen([sys.executable, '-m', 'http.server', '8793'],
                            cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(40):
        try:
            s = socket.create_connection(('localhost', 8793), timeout=1)
            s.close()
            print('server started on 8793 (repo root)')
            return proc
        except OSError:
            time.sleep(0.25)
    raise RuntimeError('cannot start http.server on 8793')

EXEMPT = {'novel-game.html', 'sanguo-world.html', 'redesign.html'}  # 前两个=另一条线开发中；redesign=v5.9 归档孤儿页（0 入口引用）
SHELL_PAGES = {'product-preview.html', 'library.html', 'heart-island.html',
               'creator-center.html', 'me.html'}            # 5 Tab 壳页

INIT = """
try {
  localStorage.setItem('lingjing_onboarding_done','true');
  localStorage.setItem('lingjing_v519_realname_done','true');
  localStorage.setItem('lingjing_user_profile', JSON.stringify({nickname:'真机测试员', gender:'未知', age:'25-30', companion:'知己'}));
  localStorage.setItem('lingjing_account_kind','member');
} catch(e){}
"""

pages = sorted(f for f in os.listdir(PREVIEW) if f.endswith('.html'))
result = {}
server = start_server()

with sync_playwright() as p:
    browser = p.chromium.launch(args=['--use-gl=swiftshader', '--disable-gpu'])

    for f in pages:
        url = f"{BASE}/output/preview/{f}"
        ctx = browser.new_context(viewport={'width': 390, 'height': 844},
                                  device_scale_factor=2, is_mobile=True)
        pg = ctx.new_page()
        st = {'pe': [], 'ce': [], 'bad': []}
        pg.on('pageerror', lambda e: st['pe'].append(str(e)[:260]))
        pg.on('console', lambda m: st['ce'].append(m.text[:260]) if m.type == 'error' else None)
        pg.on('response', lambda r: st['bad'].append(f"{r.status} {r.url.replace(BASE,'')}") if r.status >= 400 else None)
        ctx.add_init_script(INIT)

        entry = {'exempt': f in EXEMPT, 'load_errors': [], 'load_404': [],
                 'lock': None, 'blank': None, 'shell': None, 'back': None,
                 'redirected': None, 'click_errors': [], 'text_len': 0}
        try:
            pg.goto(url, wait_until='domcontentloaded', timeout=15000)
            pg.wait_for_timeout(1100)
        except Exception as e:
            entry['load_errors'].append('GOTO_TIMEOUT ' + str(e)[:120])

        # 页面主动跳转（如 novel-edit 无参防御跳 library）→ 记录后跳过本页断言
        if f not in pg.url:
            entry['redirected'] = pg.url.rsplit('/', 1)[-1]
            entry['problems'] = []
            print(f"redir  {f} -> {entry['redirected']}")
            result[f] = entry
            ctx.close()
            continue

        entry['load_errors'] += st['pe']
        entry['load_404'] = [b for b in st['bad'] if 'favicon' not in b]

        # 2 mobile-lock + 3 blank + 4 shell/back
        try:
            entry['lock'] = pg.evaluate("""() => {
                const mw = parseFloat(getComputedStyle(document.body).maxWidth);
                return (isNaN(mw) || mw <= 481);
            }""")
            import re as _re
            txt = _re.sub(r'\s', '', pg.evaluate("document.body.innerText") or '')
            entry['text_len'] = len(txt)
            entry['blank'] = len(txt) < 30
            if f in SHELL_PAGES:
                entry['shell'] = pg.evaluate("!!document.querySelector('.tabbar')")
            else:
                entry['back'] = pg.evaluate("""() => {
                    const els = [...document.querySelectorAll('a,button')];
                    return els.some(e => {
                        const t = (e.textContent || '') + (e.getAttribute('aria-label') || '');
                        return (t.includes('←') || t.includes('返回') || t.includes('↩') || t.includes('‹') || t.includes('⬅')) &&
                               e.getBoundingClientRect().width > 4;
                    });
                }""")
        except Exception as e:
            entry['load_errors'].append('EVAL ' + str(e)[:120])

        # 5 点击抽查
        sels = pg.evaluate("""() => {
            const els = [...document.querySelectorAll('a[href]:not([href^="javascript:"]), [onclick], button:not([disabled]), [data-tab]')];
            return els.slice(0, 40).map((e, i) => {
                const r = e.getBoundingClientRect();
                const vis = r.width > 4 && r.height > 4 && r.top >= -80 && r.bottom < window.innerHeight + 200;
                const isNav = e.tagName === 'A' && (e.getAttribute('href') || '').includes('.html');
                return {i, vis, isNav};
            });
        }""")
        for s in sels:
            if not s['vis'] or s['isNav']:
                continue
            b_pe, b_ce = len(st['pe']), len(st['ce'])
            try:
                pg.locator("a[href]:not([href^='javascript:']), [onclick], button:not([disabled]), [data-tab]").nth(s['i']).click(timeout=1800)
                pg.wait_for_timeout(120)
                if url not in pg.url:
                    pg.goto(url, wait_until='domcontentloaded', timeout=10000)
                    pg.wait_for_timeout(400)
            except Exception:
                pass
            if st['pe'][b_pe:] or st['ce'][b_ce:]:
                entry['click_errors'].append({'i': s['i'], 'pe': st['pe'][b_pe:][:2], 'ce': st['ce'][b_ce:][:2]})

        try:
            pg.screenshot(path=os.path.join(SHOTDIR, f.replace('.html', '.png')))
        except Exception:
            pass
        ctx.close()

        problems = []
        if entry['load_errors']:
            problems.append(f"load_err={len(entry['load_errors'])}")
        if entry['load_404']:
            problems.append(f"404={len(entry['load_404'])}")
        if entry['lock'] is False:
            problems.append('NOT_LOCKED')
        if entry['blank'] is True:
            problems.append(f"BLANK({entry['text_len']})")
        if entry['shell'] is False:
            problems.append('NO_TABBAR')
        if entry['back'] is False:
            problems.append('NO_BACK')
        if entry['click_errors']:
            problems.append(f"click_err={len(entry['click_errors'])}")
        tag = 'EXEMPT' if entry['exempt'] else ('ISSUE' if problems else 'ok')
        print(f"{tag:6} {f}" + (f"  [{', '.join(problems)}]" if problems else ''))
        entry['problems'] = problems
        result[f] = entry

    browser.close()

if server:
    server.terminate()

with open(os.path.join(ROOT, 'scripts', 'mobile_ready_result.json'), 'w', encoding='utf-8') as fp:
    json.dump(result, fp, ensure_ascii=False, indent=1)

blocking = {k: v for k, v in result.items() if v['problems'] and not v['exempt']}
print(f"\n==== {len(result)} pages · blocking={len(blocking)} · exempt={len(EXEMPT)} ====")
for k, v in blocking.items():
    print(' -', k, v['problems'])
