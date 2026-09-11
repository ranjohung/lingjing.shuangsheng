#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
V20-F · 退出登录功能回归测试
我的页 → 账号区（当前登录方式 + 退出登录）→ 确认弹窗 → 清登录态 → 回启动页
"""
from playwright.sync_api import sync_playwright
import os, sys

SHOT_DIR = 'output/preview/screenshots'
ME_URL = 'http://localhost:8767/output/preview/me.html'
HOME_URL = 'http://localhost:8767/product-preview.html'
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
        ctx = b.new_context(viewport={'width': 390, 'height': 844})
        page = ctx.new_page()

        print('\n=== Step 1 · 登录态下进入我的页 ===')
        # 模拟已登录访客
        page.goto(HOME_URL, wait_until='domcontentloaded')
        page.evaluate('''() => {
          localStorage.clear();
          localStorage.setItem('lingjing_onboarding_done', 'true');
          localStorage.setItem('lingjing_account_kind', 'guest');
          localStorage.setItem('lingjing_user_profile', JSON.stringify({name:'小柒', gender:'female', ageRange:'25-34', companionType:'warm'}));
        }''')
        page.goto(ME_URL, wait_until='networkidle')
        page.wait_for_timeout(800)

        check('账号区块存在', page.locator('#v20f-list-account, [data-page-node-id="v20f-list-account"]').count() > 0)
        check('当前登录方式项存在', page.locator('#account-kind-label').count() > 0)
        kind_text = page.locator('#account-kind-label').text_content().strip()
        check('登录方式显示「访客体验」', kind_text == '访客体验', f'got={kind_text}')
        check('退出登录按钮存在', page.locator('#logout-btn').count() > 0)
        check('退出按钮文案', '退出登录' in page.locator('#logout-btn').text_content())
        # profile 显示真实称呼
        pr_name = page.locator('.pr-name').text_content().strip()
        check('profile 显示称呼「小柒」', pr_name == '小柒', f'got={pr_name}')
        page.screenshot(path=f'{SHOT_DIR}/v20-f-1-me-account.png')

        print('\n=== Step 2 · 点退出登录 → 确认弹窗 ===')
        page.click('#logout-btn')
        page.wait_for_timeout(400)
        dlg = page.locator('#logout-dialog')
        check('确认弹窗打开', dlg.is_visible())
        check('弹窗标题「退出当前账号？」', '退出当前账号' in dlg.text_content())
        check('弹窗有 [再想想] 按钮', page.locator('#logout-cancel').is_visible())
        check('弹窗有 [退出登录] 按钮', page.locator('#logout-confirm').is_visible())
        page.screenshot(path=f'{SHOT_DIR}/v20-f-2-dialog.png')

        print('\n=== Step 3 · 点 [再想想] 取消 ===')
        page.click('#logout-cancel')
        page.wait_for_timeout(300)
        check('弹窗关闭', not dlg.is_visible())
        check('仍在我的页', 'me.html' in page.url)
        # 登录态未清
        kind = page.evaluate("localStorage.getItem('lingjing_account_kind')")
        check('取消后登录态保留', kind == 'guest', f'got={kind}')

        print('\n=== Step 4 · 再点退出 → 确认退出 ===')
        page.click('#logout-btn')
        page.wait_for_timeout(300)
        page.click('#logout-confirm')
        # 等待 toast + 600ms 后跳转
        page.wait_for_url('**/product-preview.html', timeout=5000)
        page.wait_for_timeout(800)
        check('跳回 product-preview.html', 'product-preview.html' in page.url)

        # 登录态已清
        onb = page.evaluate("localStorage.getItem('lingjing_onboarding_done')")
        kind = page.evaluate("localStorage.getItem('lingjing_account_kind')")
        profile = page.evaluate("localStorage.getItem('lingjing_user_profile')")
        check('lingjing_onboarding_done 已清', onb is None, f'got={onb}')
        check('lingjing_account_kind 已清', kind is None, f'got={kind}')
        check('lingjing_user_profile 已清', profile is None, f'got={profile}')

        print('\n=== Step 5 · 回到启动页可换账号（splash 重现）===')
        # onb_done 已清 → splash 应该出现
        page.reload(wait_until='domcontentloaded')
        page.wait_for_timeout(600)
        splash_visible = page.is_visible('#splash-overlay')
        check('退出后 splash 重现（可重新登录）', splash_visible)
        page.screenshot(path=f'{SHOT_DIR}/v20-f-3-splash-again.png')

        print('\n=== Step 6 · 换账号登录（wechat）→ 我的页显示微信 ===')
        # 走完整流程：进入灵境 → 勾协议 → 微信
        page.click('#splash-enter')
        page.wait_for_timeout(800)
        for n in ['1', '2', '3']:
            page.click(f'.login-check[data-agree="{n}"]')
            page.wait_for_timeout(80)
        page.click('.login-method[data-method="wechat"]')
        page.wait_for_timeout(500)
        # onb step1
        page.fill('#onb-input', '阿澈')
        page.wait_for_timeout(300)
        page.click('#onb-next')
        page.wait_for_timeout(500)
        page.click('.onb-option[data-v="male"]')
        page.wait_for_timeout(150)
        page.click('#onb-next')
        page.wait_for_timeout(500)
        page.click('.onb-option[data-v="18-24"]')
        page.wait_for_timeout(150)
        page.click('#onb-next')
        page.wait_for_timeout(500)
        page.click('.onb-option[data-v="lively"]')
        page.wait_for_timeout(150)
        page.click('#onb-next')
        page.wait_for_timeout(600)
        check('新账号 onboarding 完成，主页揭示', page.is_visible('.brand-bar'))

        # 进我的页验证微信 + 新称呼
        page.goto(ME_URL, wait_until='networkidle')
        page.wait_for_timeout(800)
        kind_text = page.locator('#account-kind-label').text_content().strip()
        check('登录方式显示「微信」', kind_text == '微信', f'got={kind_text}')
        pr_name = page.locator('.pr-name').text_content().strip()
        check('profile 显示新称呼「阿澈」', pr_name == '阿澈', f'got={pr_name}')
        page.screenshot(path=f'{SHOT_DIR}/v20-f-4-new-account.png')

        b.close()

    print('\n' + '=' * 50)
    print(f'PASS: {len(PASS)}    FAIL: {len(FAIL)}')
    if FAIL:
        for n, d in FAIL:
            print(f'  FAIL  {n}: {d}')
        sys.exit(1)
    print('OK  退出登录 + 换账号流程全过')


if __name__ == '__main__':
    main()
