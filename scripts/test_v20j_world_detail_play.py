# -*- coding: utf-8 -*-
"""V20-J · 世界功能区 小说世界「卡片 → 详情 → 游玩」链路（10 项）
用户需求（2026-09-12）：
  世界功能区的小说世界点击介绍页图片 → 跳转详细介绍界面；
  点击游玩 → 正式游戏。
静态（5）：
  1. world.js 瀑布流卡片 href → plot-detail.html?novel=
  2. world-data.js banner b2/b5 → plot-detail
  3. home.js 推荐卡默认 href → plot-detail + sanguo 卡走详情页
  4. plot-detail.html hero 区 + ▶ 游玩按钮 + world-data.js 引用
  5. plot-detail.js WORLD_ROUTES / renderHero / 点赞初始化
端到端（5）：
  6. 世界页点卡片 → 详情页 hero 渲染真实标题
  7. pd2（灵境解读三国）游玩 → sanguo-world.html
  8. sanguoyanyi 游玩 → sanguo-world.html；changyecheng 游玩 → plot-runner
  9. 未知 id → 占位详情（不显示长夜城错误内容）+ 点赞 0
 10. 全程 0 pageerror
"""
import re
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:8767/output/preview'
ROOT = 'http://localhost:8767'
PASS = FAIL = 0

def check(name, cond, extra=''):
    global PASS, FAIL
    if cond:
        PASS += 1; print(f'  PASS {name}')
    else:
        FAIL += 1; print(f'  FAIL {name} {extra}')

# ---------- 静态 ----------
print('== A. 静态检查')

w = open('output/preview/js/world.js', encoding='utf-8').read()
check('1. world.js 卡片 href → plot-detail',
      "href: 'plot-detail.html?novel='" in w and "href: 'discover.html?id=' + c.id" not in w)

wd = open('output/preview/js/world-data.js', encoding='utf-8').read()
check('2. banner b2/b5 → plot-detail',
      "href: 'plot-detail.html?novel=changyecheng'" in wd and "href: 'plot-detail.html?novel=pd1'" in wd
      and 'discover.html?id=banner2' not in wd and 'discover.html?id=hongloumeng' not in wd)

h = open('output/preview/js/home.js', encoding='utf-8').read()
check('3. 首页推荐卡 → plot-detail',
      "'output/preview/plot-detail.html?novel=' + w.id" in h
      and "href: 'output/preview/plot-detail.html?novel=sanguoyanyi'" in h
      and "href: 'output/preview/sanguo-world.html'" not in h)

pd_html = open('output/preview/plot-detail.html', encoding='utf-8').read()
check('4. plot-detail hero + 游玩按钮 + world-data 引用',
      all(k in pd_html for k in ['id="pl-hero"', 'id="pl-hero-title"', 'id="pl-hero-stats"',
                                 'id="pl-hero-summary"', '▶ 游玩', 'js/world-data.js']))

pd_js = open('output/preview/js/plot-detail.js', encoding='utf-8').read()
check('5. plot-detail.js 路由 + hero + 点赞初始化',
      all(k in pd_js for k in ['WORLD_ROUTES', 'sanguo-world.html', 'renderHero(novel)',
                               'likeCount.textContent = String(novel.stats.likes)']))

# ---------- 端到端 ----------
print('== B. 端到端（Playwright）')
with sync_playwright() as p:
    browser = p.chromium.launch(args=['--use-gl=swiftshader', '--disable-gpu'])
    ctx = browser.new_context(viewport={'width': 375, 'height': 812})
    pg = ctx.new_page()
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))

    # 6. 世界页卡片点击 → 详情
    pg.goto(f'{BASE}/library.html', wait_until='networkidle'); pg.wait_for_timeout(700)
    hrefs = pg.evaluate("Array.from(document.querySelectorAll('.ds-wf-card')).map(a=>a.getAttribute('href'))")
    check('6a. 卡片 href 全部指向详情页', len(hrefs) > 0 and all(x and x.startswith('plot-detail.html?novel=') for x in hrefs), str(hrefs[:3]))
    pg.click('.ds-wf-card'); pg.wait_for_timeout(900)
    hero_title = pg.evaluate("document.getElementById('pl-hero-title')?.textContent || ''")
    check('6b. 点击卡片 → 详情页 hero 渲染真实标题',
          '/plot-detail.html?novel=' in pg.url and hero_title and hero_title != '作品详情',
          f'url={pg.url} title={hero_title}')

    # 7. pd2 → sanguo-world
    pg.goto(f'{BASE}/plot-detail.html?novel=pd2', wait_until='networkidle'); pg.wait_for_timeout(500)
    t = pg.evaluate("document.getElementById('pl-hero-title')?.textContent || ''")
    check('7a. pd2 详情标题 = 灵境解读三国', t == '灵境解读三国', t)
    pg.click('#pl-act-start'); pg.wait_for_timeout(1200)
    check('7b. pd2 游玩 → sanguo-world.html', pg.url.endswith('sanguo-world.html'), pg.url)

    # 8. sanguoyanyi / changyecheng 游玩路由
    pg.goto(f'{BASE}/plot-detail.html?novel=sanguoyanyi', wait_until='networkidle'); pg.wait_for_timeout(500)
    t = pg.evaluate("document.getElementById('pl-hero-title')?.textContent || ''")
    like = pg.evaluate("document.getElementById('pl-act-like-count')?.textContent || ''")
    check('8a. sanguoyanyi hero + 点赞初始化(1286)', t == '三国演义 · 小说世界' and like == '1286', f'{t}/{like}')
    pg.click('#pl-act-start'); pg.wait_for_timeout(1200)
    check('8b. sanguoyanyi 游玩 → sanguo-world.html', pg.url.endswith('sanguo-world.html'), pg.url)

    pg.goto(f'{BASE}/plot-detail.html?novel=changyecheng', wait_until='networkidle'); pg.wait_for_timeout(500)
    pg.click('#pl-act-start'); pg.wait_for_timeout(1500)
    check('8c. 长夜城游玩 → plot-runner', 'plot-runner.html?novel=changyecheng' in pg.url, pg.url)

    # 9. 未知 id 占位
    pg.goto(f'{BASE}/plot-detail.html?novel=nonexistent999', wait_until='networkidle'); pg.wait_for_timeout(500)
    t = pg.evaluate("document.getElementById('pl-hero-title')?.textContent || ''")
    like = pg.evaluate("document.getElementById('pl-act-like-count')?.textContent || ''")
    check('9. 未知 id → 占位详情（非长夜城 / 点赞 0）', t != '长夜城' and like == '0', f'{t}/{like}')

    # 10. 首页推荐卡
    pg.goto(f'{ROOT}/product-preview.html', wait_until='networkidle')
    pg.evaluate("localStorage.setItem('lingjing_onboarding_done','true')")
    pg.reload(wait_until='networkidle'); pg.wait_for_timeout(700)
    hrefs = pg.evaluate("Array.from(document.querySelectorAll('a.home-rec-card')).map(a=>a.getAttribute('href'))")
    check('10. 首页推荐卡全部指向详情页',
          len(hrefs) == 4 and all(x and 'plot-detail.html?novel=' in x for x in hrefs), str(hrefs))

    check('11. 全程 0 pageerror', not errs, str(errs[:2]))
    ctx.close(); browser.close()

print()
print(f'V20-J 结果: {PASS} PASS / {FAIL} FAIL')
exit(0 if FAIL == 0 else 1)
