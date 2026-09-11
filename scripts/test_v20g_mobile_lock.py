#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
V20-G · 手机游戏全局锁定回归测试
1. 所有页面 desktop 视口下 body 宽度锁定 480px（手机屏，不是网页版）
2. 0 个 .md / .txt 文档链接（不跳出网页版 markdown）
3. 0 个 404 链接
4. legal-view.html 手机版法律阅读页正常渲染
"""
from playwright.sync_api import sync_playwright
import os, re, glob, sys

SHOT_DIR = 'output/preview/screenshots'
BASE = 'http://localhost:8767'
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

    print('\n=== A. 静态扫描：0 个 .md 链接 / 0 个 404 ===')
    md_links, broken = [], []
    for page in glob.glob('output/preview/*.html') + ['product-preview.html']:
        base = os.path.dirname(page)
        src = open(page, encoding='utf-8').read()
        for m in re.finditer(r'href="([^"#][^"]*)"', src):
            href = m.group(1)
            if href.startswith(('http', 'javascript', 'mailto', 'data:')): continue
            if re.search(r'\.(md|txt|json|log)$', href.split('#')[0].split('?')[0]):
                md_links.append((page, href))
            if 'legal-view.html?doc=' in href:
                doc = href.split('doc=')[1]
                if not os.path.exists(f'docs/legal/{doc}.md'):
                    broken.append((page, href, 'md missing'))
                continue
            path = os.path.normpath(os.path.join(base, href.split('#')[0].split('?')[0]))
            if path and not os.path.exists(path):
                broken.append((page, href, '404'))
    check('0 个 .md/.txt 文档链接', len(md_links) == 0, f'{md_links[:3]}')
    check('0 个 404 破链', len(broken) == 0, f'{broken[:3]}')

    print('\n=== B. 全页面 desktop 视口手机版锁定 ===')
    # 抽查关键页面（全部 31 页太慢，抽 12 个代表页）
    key_pages = [
        ('product-preview.html', '主页'),
        ('output/preview/library.html', '世界'),
        ('output/preview/heart-island.html', '心屿'),
        ('output/preview/creator-center.html', '创作'),
        ('output/preview/me.html', '我的'),
        ('output/preview/settings.html', '设置'),
        ('output/preview/wallet.html', '钱包'),
        ('output/preview/chat.html', '聊天'),
        ('output/preview/plot-runner.html', '剧情'),
        ('output/preview/public-domain.html', '公版库'),
        ('output/preview/legal-view.html?doc=USER_AGREEMENT', '法律阅读'),
        ('output/preview/profile.html', '个人主页'),
    ]
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-gpu'])
        ctx = b.new_context(viewport={'width': 1080, 'height': 720})
        page = ctx.new_page()
        # 主页先设登录态
        page.goto(f'{BASE}/product-preview.html', wait_until='domcontentloaded')
        page.evaluate('''() => {
          localStorage.setItem('lingjing_onboarding_done', 'true');
          localStorage.setItem('lingjing_account_kind', 'guest');
          localStorage.setItem('lingjing_user_profile', JSON.stringify({name:'小柒',gender:'female',ageRange:'25-34',companionType:'warm'}));
        }''')
        for path, name in key_pages:
            page.goto(f'{BASE}/{path}', wait_until='networkidle')
            page.wait_for_timeout(700)
            info = page.evaluate('''() => {
              const b = document.body;
              const r = b.getBoundingClientRect();
              return {x: r.x, w: r.width, vp: window.innerWidth};
            }''')
            centered = abs(info['x'] + info['w']/2 - info['vp']/2) < 6
            locked = info['w'] <= 480
            check(f'{name} · body 锁定 ≤480px', locked, f'w={info["w"]:.0f}')
            check(f'{name} · 居中', centered, f'x={info["x"]:.0f} w={info["w"]:.0f} vp={info["vp"]}')

        # C. 法律阅读页渲染
        print('\n=== C. legal-view.html 手机版渲染 ===')
        page.goto(f'{BASE}/output/preview/legal-view.html?doc=PRIVACY_POLICY', wait_until='networkidle')
        page.wait_for_timeout(800)
        title = page.locator('#lv-title').text_content().strip()
        check('法律页标题「隐私政策」', title == '隐私政策', f'got={title}')
        h_count = page.locator('#lv-body h1, #lv-body h2, #lv-body h3').count()
        p_count = page.locator('#lv-body p, #lv-body li').count()
        check('法律页内容渲染（标题+段落）', h_count >= 3 and p_count >= 10, f'h={h_count} p={p_count}')
        check('法律页无加载失败', page.locator('.lv-error').count() == 0)
        check('法律页返回按钮存在', page.locator('#lv-back').is_visible())
        bw = page.evaluate('document.body.getBoundingClientRect().width')
        check('法律页 body 锁定 ≤480px', bw <= 480, f'w={bw:.0f}')
        page.screenshot(path=f'{SHOT_DIR}/v20-g-legal-view.png')

        # 主页 + 我的页截图（手机版锁定效果）
        page.goto(f'{BASE}/product-preview.html', wait_until='networkidle')
        page.wait_for_timeout(800)
        page.screenshot(path=f'{SHOT_DIR}/v20-g-home-locked.png')
        page.goto(f'{BASE}/output/preview/me.html', wait_until='networkidle')
        page.wait_for_timeout(800)
        page.screenshot(path=f'{SHOT_DIR}/v20-g-me-locked.png')

        # D. 错误文档名兜底
        print('\n=== D. 错误文档名兜底 ===')
        page.goto(f'{BASE}/output/preview/legal-view.html?doc=NOT_EXIST', wait_until='networkidle')
        page.wait_for_timeout(800)
        check('不存在文档显示错误提示', page.locator('.lv-error').count() > 0)

        b.close()

    print('\n' + '=' * 50)
    print(f'PASS: {len(PASS)}    FAIL: {len(FAIL)}')
    if FAIL:
        for n, d in FAIL:
            print(f'  FAIL  {n}: {d}')
        sys.exit(1)
    print('OK  手机游戏全局锁定回归通过')


if __name__ == '__main__':
    main()
