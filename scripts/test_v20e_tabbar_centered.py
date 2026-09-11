#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
V20-E · tabbar 居中布局回归测试
手机游戏设计：tabbar 必须 mobile-first 居中，禁止跑左边/右边出界
"""
from playwright.sync_api import sync_playwright
import os, sys

URL = 'http://localhost:8767/product-preview.html'
SHOT_DIR = 'output/preview/screenshots'
PAGES = [
    ('product-preview.html', '#app'),
    ('output/preview/library.html', 'main'),
    ('output/preview/heart-island.html', 'main'),
    ('output/preview/creator-center.html', 'main'),
    ('output/preview/me.html', 'main'),
]
PASS = []
FAIL = []

def check(name, cond, detail=''):
    if cond:
        PASS.append(name)
        print(f'  PASS  {name}')
    else:
        FAIL.append((name, detail))
        print(f'  FAIL  {name}  -- {detail}')


def main():
    os.makedirs(SHOT_DIR, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-gpu'])

        # === A. 三视口居中校验（product-preview 主页）===
        print('\n=== A. product-preview.html 多视口居中 ===')
        for w, h, name in [(390, 844, 'mobile'), (768, 1024, 'tablet'), (1080, 580, 'desktop')]:
            ctx = b.new_context(viewport={'width': w, 'height': h})
            page = ctx.new_page()
            page.goto(URL, wait_until='networkidle')
            page.evaluate('''localStorage.setItem('lingjing_onboarding_done','true');
                             localStorage.setItem('lingjing_user_profile', JSON.stringify({name:'小雅',gender:'female',ageRange:'25-34',companionType:'warm'}));''')
            page.reload(wait_until='networkidle')
            page.wait_for_timeout(800)
            info = page.evaluate('''() => {
              const tb = document.querySelector('.tabbar');
              if (!tb) return null;
              const r = tb.getBoundingClientRect();
              return {x:r.x, w:r.width, viewportW:window.innerWidth,
                      center:r.x+r.width/2,
                      fits:r.x>=0 && r.x+r.width<=window.innerWidth};
            }''')
            if not info:
                check(f'{name} ({w}×{h}) tabbar 存在', False, 'not found')
                ctx.close()
                continue
            centered = abs(info['center'] - info['viewportW']/2) < 5
            check(f'{name} ({w}×{h}) 居中', centered, f'center={info["center"]:.0f} vs vp={info["viewportW"]/2:.0f}')
            check(f'{name} ({w}×{h}) 不超界', info['fits'], f'x={info["x"]:.0f} w={info["w"]:.0f}')
            ctx.close()

        # === B. 5 主 Tab 页面 tabbar 全部存在 + 居中 ===
        print('\n=== B. 5 主 Tab 页面 tabbar 校验 ===')
        for path, sel in PAGES:
            full = f'http://localhost:8767/{path}'
            ctx = b.new_context(viewport={'width': 1080, 'height': 720})
            page = ctx.new_page()
            page.goto(full, wait_until='networkidle')
            # product-preview.html 默认走 splash/login/onb，#app 是 hidden
            # tabbar 加到 hidden 父级后 rect=0，所以必须先设 onb_done=true
            if 'product-preview' in path:
                page.evaluate('''localStorage.setItem('lingjing_onboarding_done','true');
                                 localStorage.setItem('lingjing_user_profile', JSON.stringify({name:'小雅',gender:'female',ageRange:'25-34',companionType:'warm'}));''')
                page.reload(wait_until='networkidle')
            page.wait_for_timeout(800)
            info = page.evaluate('''() => {
              const tb = document.querySelector('.tabbar');
              if (!tb) return null;
              const r = tb.getBoundingClientRect();
              return {x:r.x, w:r.width, viewportW:window.innerWidth,
                      tabs: document.querySelectorAll('.tabbar a').length,
                      active: document.querySelector('.tabbar a.active')?.dataset.tab || null};
            }''')
            if not info:
                check(f'{path} · tabbar 存在', False, 'not found')
                ctx.close()
                continue
            centered = abs(info['x'] + info['w']/2 - info['viewportW']/2) < 5
            check(f'{path} · tabbar 存在', True, '')
            check(f'{path} · tabbar 5 Tab', info['tabs'] == 5, f'got={info["tabs"]}')
            check(f'{path} · tabbar 居中', centered, f'center={info["x"]+info["w"]/2:.0f} vp/2={info["viewportW"]/2:.0f}')
            check(f'{path} · 当前 Tab active', info['active'] is not None, f'active={info["active"]}')
            ctx.close()

        b.close()

    print('\n' + '=' * 50)
    print(f'PASS: {len(PASS)}    FAIL: {len(FAIL)}')
    if FAIL:
        for n, d in FAIL:
            print(f'  FAIL  {n}: {d}')
        sys.exit(1)
    print('OK  tabbar 居中回归通过')


if __name__ == '__main__':
    main()
