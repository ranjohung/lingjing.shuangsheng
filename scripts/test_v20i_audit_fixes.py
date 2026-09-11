# -*- coding: utf-8 -*-
"""V20-I · 审查修复验证（5 项冒烟）
1. commerce.html 加载无 pageerror，#current-novel 有内容，renderAll 正常
2. plot-detail 购买按钮 → toast，无 404 导航
3. plot-runner.html?novel=changyecheng（原参数名不匹配）→ 正确加载长夜城
4. plot-runner.html?novelId=n_unknown → 未支持提示页（不再静默加载长夜城）
5. public-domain enterPlot('hongloumeng') → toast 提示，不跳转
"""
import sys, time
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:8767'
PASS = FAIL = 0

def check(name, cond, extra=''):
    global PASS, FAIL
    if cond:
        PASS += 1; print(f'  PASS {name}')
    else:
        FAIL += 1; print(f'  FAIL {name} {extra}')

with sync_playwright() as p:
    browser = p.chromium.launch(args=['--use-gl=swiftshader', '--disable-gpu'])

    # 1. commerce.html
    print('== 1. commerce.html 修复验证')
    ctx = browser.new_context(viewport={'width': 375, 'height': 812})
    pg = ctx.new_page()
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    bad = []
    pg.on('response', lambda r: bad.append(r.url) if r.status >= 400 else None)
    pg.goto(BASE + '/output/preview/commerce.html', wait_until='networkidle')
    pg.wait_for_timeout(800)
    check('加载无 pageerror', len(errs) == 0, str(errs[:2]))
    cur = pg.evaluate("document.getElementById('current-novel')?.textContent || ''")
    check('#current-novel 已渲染书名', cur.strip() not in ('', '—', 'None'), repr(cur))
    tier = pg.evaluate("document.getElementById('tier-grid')?.innerHTML.length || 0")
    check('版权分层已渲染(renderAll 未中断)', tier > 50, str(tier))
    ctx.close()

    # 2. plot-detail 购买按钮
    print('== 2. plot-detail 购买按钮')
    ctx = browser.new_context(viewport={'width': 375, 'height': 812})
    pg = ctx.new_page()
    bad = []
    pg.on('response', lambda r: bad.append(f'{r.status} {r.url}') if r.status >= 400 else None)
    pg.goto(BASE + '/output/preview/plot-detail.html?novel=changyecheng', wait_until='networkidle')
    pg.wait_for_timeout(500)
    pg.click('#pl-act-buy')
    pg.wait_for_timeout(700)
    check('购买按钮无 404', not [b for b in bad if 'creator-center' in b or '404' in b], str(bad[:2]))
    check('购买按钮无导航(留在详情页)', 'plot-detail' in pg.url, pg.url)
    toast = pg.evaluate("document.getElementById('lj-toast')?.classList.contains('show')")
    check('购买 toast 提示已弹', toast is True, str(toast))
    ctx.close()

    # 3. plot-runner ?novel= 参数
    print('== 3. plot-runner ?novel= 参数兼容')
    ctx = browser.new_context(viewport={'width': 375, 'height': 812})
    pg = ctx.new_page()
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(BASE + '/output/preview/plot-runner.html?novel=shenhuihuisheng', wait_until='networkidle')
    pg.wait_for_timeout(900)
    title = pg.evaluate("document.title")
    stage = pg.evaluate("document.querySelector('#plot-stage .plot-dialog')?.textContent.slice(0,30) || document.querySelector('#plot-stage')?.textContent.slice(0,40) || ''")
    unsupported = pg.evaluate("document.getElementById('plot-stage')?.textContent.includes('暂未接入此运行器')")
    check('?novel=shenhuihuisheng 正常加载(非未支持页)', not unsupported)
    check('加载无 pageerror', len(errs) == 0, str(errs[:2]))
    ctx.close()

    # 4. plot-runner 未知 ID
    print('== 4. plot-runner 未知 ID 提示页')
    ctx = browser.new_context(viewport={'width': 375, 'height': 812})
    pg = ctx.new_page()
    pg.goto(BASE + '/output/preview/plot-runner.html?novelId=n_999888', wait_until='networkidle')
    pg.wait_for_timeout(600)
    unsupported = pg.evaluate("document.getElementById('plot-stage')?.textContent.includes('暂未接入此运行器')")
    back = pg.evaluate("!!document.querySelector('#plot-stage a[href=\"library.html\"]')")
    check('显示「暂未接入此运行器」提示', unsupported is True)
    check('提供返回题材库按钮', back is True)
    ctx.close()

    # 5. public-domain enterPlot
    print('== 5. public-domain 未建世界提示')
    ctx = browser.new_context(viewport={'width': 375, 'height': 812})
    pg = ctx.new_page()
    pg.goto(BASE + '/output/preview/public-domain.html', wait_until='networkidle')
    pg.wait_for_timeout(600)
    pg.evaluate("window.LJPubDom.enterPlot('hongloumeng')")
    pg.wait_for_timeout(400)
    toast = pg.evaluate("document.getElementById('pd-world-toast')?.textContent || ''")
    check('弹「制作中」toast', '制作中' in toast and '红楼梦' in toast, repr(toast))
    check('未跳转 plot-runner', 'plot-runner' not in pg.url, pg.url)
    # 三国仍正常路由
    pg.evaluate("window.LJPubDom.enterPlot('sanguoyanyi')")
    pg.wait_for_timeout(800)
    check('三国演义仍路由 sanguo-world', 'sanguo-world' in pg.url, pg.url)
    ctx.close()

    browser.close()

print(f'\nV20-I 修复验证: {PASS} PASS / {FAIL} FAIL')
sys.exit(1 if FAIL else 0)
