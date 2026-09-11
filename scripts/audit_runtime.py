# -*- coding: utf-8 -*-
"""V20-I · 全项目动态运行时审计
1. 逐页加载 32 个页面（mobile 375x812），收集 pageerror / console.error / 404+请求
2. 逐页点击所有可交互元素（a[href] / [onclick] / button / [data-tab]），点击后捕获新增错误
3. 导出 scripts/audit_runtime_result.json
"""
import json, os, re, sys, time
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:8767'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PREVIEW = os.path.join(ROOT, 'output', 'preview')

# (路径, 需要的 query 参数)
PAGES = []
for f in sorted(os.listdir(PREVIEW)):
    if f.endswith('.html'):
        PAGES.append(('/output/preview/' + f, None))
PAGES.insert(0, ('/product-preview.html', None))
# 带参数的代表性入口
PAGES += [
    ('/output/preview/plot-runner.html', '?novel=demo'),
    ('/output/preview/legal-view.html', '?doc=TERMS_OF_SERVICE'),
    ('/output/preview/plot-detail.html', '?id=demo'),
]

result = {}
errors_all = []

with sync_playwright() as p:
    browser = p.chromium.launch(args=['--use-gl=swiftshader', '--disable-gpu'])

    def new_page():
        ctx = browser.new_context(viewport={'width': 375, 'height': 812},
                                  device_scale_factor=2, is_mobile=True)
        pg = ctx.new_page()
        state = {'pageerrors': [], 'console': [], 'badreq': []}
        pg.on('pageerror', lambda e: state['pageerrors'].append(str(e)[:300]))
        pg.on('console', lambda m: state['console'].append(m.text[:300]) if m.type == 'error' else None)
        pg.on('response', lambda r: state['badreq'].append(f"{r.status} {r.url.replace(BASE,'')}") if r.status >= 400 else None)
        return ctx, pg, state

    for path, qs in PAGES:
        url = BASE + path + (qs or '')
        key = path + (qs or '')
        ctx, pg, state = new_page()
        entry = {'load_errors': [], 'load_404': [], 'click_errors': [], 'click_total': 0, 'nav_links': 0}
        try:
            pg.goto(url, wait_until='networkidle', timeout=15000)
        except Exception as e:
            entry['load_errors'].append('GOTO_TIMEOUT ' + str(e)[:120])
        pg.wait_for_timeout(400)
        # 只保留本页相关（过滤 favicon 等）
        entry['load_errors'] = state['pageerrors'][:]
        entry['load_404'] = [b for b in state['badreq'] if 'favicon' not in b]

        # 收集可点击元素（前 60 个，防超长列表页）
        sels = pg.evaluate("""() => {
            const els = [...document.querySelectorAll('a[href]:not([href^="javascript:"]), [onclick], button:not([disabled]), [data-tab]')];
            return els.slice(0, 60).map((e, i) => {
                const r = e.getBoundingClientRect();
                const vis = r.width > 4 && r.height > 4 && r.top >= -80 && r.bottom < window.innerHeight + 200;
                const label = (e.getAttribute('data-tab') || e.textContent || e.getAttribute('href') || '').trim().slice(0, 24);
                const isNav = e.tagName === 'A' && e.getAttribute('href') && e.getAttribute('href').includes('.html');
                return {i, vis, label, isNav};
            });
        }""")
        entry['click_total'] = len(sels)

        # 点击所有可见非导航交互元素（导航跳转用静态审查已覆盖，这里只验证不跳转的按钮不报错）
        for s in sels:
            if not s['vis'] or s['isNav']:
                continue
            before_pe = len(state['pageerrors'])
            before_ce = len(state['console'])
            try:
                pg.on('dialog', lambda d: d.dismiss())
                pg.locator(f"a[href]:not([href^='javascript:']), [onclick], button:not([disabled]), [data-tab]").nth(s['i']).click(timeout=2000)
                pg.wait_for_timeout(150)
                # 若发生跳转则回退
                if BASE + path not in pg.url:
                    pg.goto(url, wait_until='domcontentloaded', timeout=10000)
            except Exception:
                pass  # 点击失败（遮挡等）不算错误，只记录 JS 异常
            new_pe = state['pageerrors'][before_pe:]
            new_ce = state['console'][before_ce:]
            if new_pe or new_ce:
                entry['click_errors'].append({'label': s['label'], 'pageerrors': new_pe[:2], 'console': new_ce[:2]})

        if entry['load_errors'] or entry['load_404'] or entry['click_errors']:
            print(f"!! {key}: load_err={len(entry['load_errors'])} 404={len(entry['load_404'])} click_err={len(entry['click_errors'])}")
            for e in entry['load_errors'][:3]:
                print(f"     PE: {e}")
            for e in entry['load_404'][:3]:
                print(f"     404: {e}")
            for e in entry['click_errors'][:5]:
                print(f"     CLICK[{e['label']}]: {e['pageerrors'] or e['console']}")
        else:
            print(f"ok {key} (clicked {sum(1 for s in sels if s['vis'] and not s['isNav'])})")
        result[key] = entry
        ctx.close()

    browser.close()

with open(os.path.join(ROOT, 'scripts', 'audit_runtime_result.json'), 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=1)

bad = {k: v for k, v in result.items() if v['load_errors'] or v['load_404'] or v['click_errors']}
print(f"\n==== SUMMARY: {len(result)} pages audited, {len(bad)} with issues ====")
for k, v in bad.items():
    print(' -', k)
