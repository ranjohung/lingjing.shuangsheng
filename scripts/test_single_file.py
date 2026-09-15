# -*- coding: utf-8 -*-
"""
test_single_file.py — 单文件 index.html 双模式验收

用法：
  python scripts/test_single_file.py file          # 双击（file://）
  python scripts/test_single_file.py http          # 本地服务（需先起 8899）
  python scripts/test_single_file.py file all      # 全量遍历所有内联页面
"""
import asyncio
import json
import pathlib
import sys

from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
MODE = sys.argv[1] if len(sys.argv) > 1 else 'file'
SCOPE = sys.argv[2] if len(sys.argv) > 2 else 'quick'

URL = (ROOT / 'index.html').as_uri() if MODE == 'file' else 'http://127.0.0.1:8899/index.html'
SHOT = ROOT / 'output' / 'preview' / 'screenshots' / 'single'
SHOT.mkdir(parents=True, exist_ok=True)

STAT = {'pass': 0, 'fail': 0}


def check(name, ok, extra=''):
    if ok:
        STAT['pass'] += 1
        print('  PASS  ' + name)
    else:
        STAT['fail'] += 1
        msg = '  FAIL  ' + name
        if extra != '':
            msg += '   [' + str(extra)[:160] + ']'
        print(msg)


async def page_ids(pg):
    return await pg.evaluate("Object.keys(LJ_PAGES)")


async def run_flow(pg, url):
    """首启流程：启动页 → 登录 → 新手引导 → 首页 → 底栏跨页路由"""
    print('-- 首启流程 --')
    await pg.goto(url, wait_until='load')
    await pg.evaluate("localStorage.clear()")
    await pg.goto(url, wait_until='load')
    await pg.wait_for_timeout(700)
    check('1 启动页可见', (await pg.locator('#splash-overlay:not(.hidden)').count()) == 1)
    await pg.locator('#splash-enter').click()
    await pg.wait_for_timeout(900)
    check('2 登录页可见', (await pg.locator('#login-overlay:not(.hidden)').count()) == 1)

    for i in (1, 2, 3):
        await pg.locator('.login-check[data-agree="%d"]' % i).click()
    await pg.locator('.login-method[data-method="guest"]').click()
    await pg.wait_for_timeout(700)
    check('3 新手引导可见', (await pg.locator('#onb-overlay:not(.hidden)').count()) == 1)

    await pg.locator('#onb-input').fill('旅人')
    await pg.locator('#onb-next').click()
    for _ in range(3):
        await pg.wait_for_timeout(260)
        await pg.locator('.onb-option').first.click()
        await pg.locator('#onb-next').click()
    await pg.wait_for_timeout(1600)
    check('4 引导完成进入首页', (await pg.locator('#stage.on').count()) == 1)
    await pg.screenshot(path=str(SHOT / ('single-' + MODE + '-home.png')))

    frames = [x for x in pg.frames if x != pg.main_frame]
    check('5 首页 iframe 已挂载', len(frames) >= 1, len(frames))
    hit = False
    if frames:
        tab = frames[0].locator('a[data-tab="world"]')
        if (await tab.count()) == 0:
            tab = frames[0].locator('.tabbar a').nth(1)
        if (await tab.count()) > 0:
            await tab.first.click()
            hit = True
    await pg.wait_for_timeout(1400)
    cur = await pg.evaluate("location.hash || ''")
    check('6 底栏点击跨页路由', hit and ('library' in cur), cur)
    await pg.screenshot(path=str(SHOT / ('single-' + MODE + '-world.png')))

    frames = [x for x in pg.frames if x != pg.main_frame]
    if frames:
        t = await frames[-1].locator('body').inner_text()
        check('7 世界页内容渲染', len(t.strip()) > 60, t[:50].replace('\n', ' '))


async def run():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        ctx = await browser.new_context(viewport={'width': 390, 'height': 844},
                                        device_scale_factor=2)
        pg = await ctx.new_page()
        errors = []
        pg.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
        pg.on('console', lambda m: errors.append('console: ' + m.text) if m.type == 'error' else None)

        print('== 模式：{}  {} =='.format(MODE, URL))

        if SCOPE == 'flow':
            await run_flow(pg, URL)
            await browser.close()
            print('\n结果：{} PASS / {} FAIL'.format(STAT['pass'], STAT['fail']))
            return 0 if STAT['fail'] == 0 else 1

        await pg.goto(URL, wait_until='load')
        await pg.evaluate("localStorage.setItem('lingjing_onboarding_done','true')")
        await pg.goto(URL, wait_until='load')
        await pg.wait_for_timeout(1800)

        check('1 外壳已加载', await pg.locator('#stage').count() == 1)
        check('2 舞台已激活', await pg.locator('#stage.on').count() == 1)
        check('3 覆盖层已隐藏', await pg.locator('#splash-overlay.hidden').count() == 1)

        ids = await page_ids(pg)
        print('     内联页面 {} 个: {}'.format(len(ids), ', '.join(sorted(ids)[:8]) + (' ...' if len(ids) > 8 else '')))
        check('4 PAGES 已注入', len(ids) >= 2, len(ids))

        srcdoc = await pg.evaluate("document.getElementById('stage').srcdoc")
        check('5 srcdoc 非空', len(srcdoc) > 800, len(srcdoc))
        check('6 base 已替换', '__LJ_BASE__' not in srcdoc)
        bi = srcdoc.find('<base')
        check('7 base 指向 preview', '<base href="' in srcdoc and 'output/preview/"' in srcdoc,
              (srcdoc[bi:bi + 120] if bi >= 0 else 'no base tag'))
        check('8 占位符已清空', '__LJ_QS__' not in srcdoc and '__LJ_HASH__' not in srcdoc)

        frames = [f for f in pg.frames if f != pg.main_frame]
        check('9 内容 iframe 已挂载', len(frames) >= 1, len(frames))
        if frames:
            f = frames[0]
            txt = await f.locator('body').inner_text()
            check('10 首页内容渲染', len(txt) > 30, txt[:60].replace('\n', ' '))
            check('11 底栏存在', await f.locator('.tabbar, .tab-bar, nav').count() >= 1,
                  await f.locator('.tabbar, .tab-bar, nav').count())

        if SCOPE == 'all':
            print('-- 遍历所有内联页面 --')
            bad = []
            noisy = []
            need = {'world-view': '?book=xiyouji', 'world-assets': '?book=xiyouji',
                    'plot-runner': '?novel=xiyouji', 'plot-detail': '?novel=xiyouji'}
            for pid in sorted(ids):
                del errors[:]
                qs = need.get(pid, '')
                await pg.evaluate('LJ.go(' + json.dumps(pid) + ', ' + json.dumps(qs) + ', "")')
                await pg.wait_for_timeout(430)
                fr = [x for x in pg.frames if x != pg.main_frame]
                ok = False
                detail = ''
                if fr:
                    try:
                        t = await fr[-1].locator('body').inner_text()
                        ok = len(t.strip()) > 5
                        detail = t[:36].replace('\n', ' ')
                    except Exception as e:
                        detail = str(e)[:60]
                if not ok:
                    bad.append(pid)
                if errors:
                    noisy.append(pid)
                    print('     {:<22} {}   <== {}'.format(pid, 'ok' if ok else 'EMPTY', errors[0][:110]))
                else:
                    print('     {:<22} {}'.format(pid, 'ok' if ok else 'EMPTY ' + detail))
            check('12 全部页面可渲染', not bad, ','.join(bad))
            check('13 全部页面零报错', not noisy, ','.join(noisy))

        real_errors = [e for e in errors if 'favicon' not in e]
        check('14 无 JS 报错', not real_errors, ' | '.join(real_errors[:3]))

        await pg.screenshot(path=str(SHOT / ('single-' + MODE + '.png')))
        await browser.close()

    print('\n结果：{} PASS / {} FAIL'.format(STAT['pass'], STAT['fail']))
    return 0 if STAT['fail'] == 0 else 1


if __name__ == '__main__':
    sys.exit(asyncio.run(run()))
