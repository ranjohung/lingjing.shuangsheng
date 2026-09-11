#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
V20-D · 访客登录端到端流程测试
首次访问 -> splash -> 勾 3 协议 -> 访客 -> 4 步 onboarding -> 主页揭示
"""
from playwright.sync_api import sync_playwright
import os, sys

URL = 'http://localhost:8767/product-preview.html'
SHOT_DIR = 'output/preview/screenshots'
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

        # 0. 清空 localStorage，确保首次访问
        page.goto(URL, wait_until='domcontentloaded')
        page.evaluate('localStorage.clear()')
        page.reload(wait_until='domcontentloaded')
        page.wait_for_timeout(500)

        print('\n=== Step 1 · splash 启动页 ===')
        check('splash 可见', page.is_visible('#splash-overlay'))
        check('splash 内 slogan 可见', page.is_visible('.splash-slogan'))
        check('splash 进入按钮可见', page.is_visible('#splash-enter'))
        check('splash 跳过按钮可见', page.is_visible('#splash-skip'))
        page.screenshot(path=f'{SHOT_DIR}/v20-d-guest-1-splash.png')

        print('\n=== Step 2 · 点 [进入灵境] -> 注册登录 ===')
        page.click('#splash-enter')
        page.wait_for_timeout(800)  # 400ms opacity 渐隐
        check('splash 已隐藏', page.is_hidden('#splash-overlay'))
        check('login 弹窗可见', page.is_visible('#login-overlay'))
        check('访客按钮可见', page.is_visible('.login-method[data-method="guest"]'))
        check('4 种登录方式可见', page.locator('.login-method').count() == 4)
        check('3 项协议可见', page.locator('.login-check').count() == 3)
        page.screenshot(path=f'{SHOT_DIR}/v20-d-guest-2-login.png')

        print('\n=== Step 3 · 勾 3 协议 + 点 [访客] -> onboarding ===')
        for n in ['1', '2', '3']:
            page.click(f'.login-check[data-agree="{n}"]')
            page.wait_for_timeout(80)
        page.wait_for_timeout(120)
        check('3 协议均已勾选',
              'checked' in (page.locator('#agree-1').get_attribute('class') or '') and
              'checked' in (page.locator('#agree-2').get_attribute('class') or '') and
              'checked' in (page.locator('#agree-3').get_attribute('class') or ''))
        page.click('.login-method[data-method="guest"]')
        page.wait_for_timeout(500)
        check('login 已隐藏', page.is_hidden('#login-overlay'))
        check('onboarding 弹窗可见', page.is_visible('#onb-overlay'))
        check('onb-body 已渲染 step1', page.locator('#onb-input').is_visible())
        check('4 个进度点', page.locator('.onb-dot').count() == 4)
        page.screenshot(path=f'{SHOT_DIR}/v20-d-guest-3-onb-step1.png')

        print('\n=== Step 4 · step1 输入称呼 -> 下一步 ===')
        page.fill('#onb-input', '小柒')
        page.wait_for_timeout(300)  # 等 onb-input 的 input 事件派发完，禁用状态解除
        next_disabled = page.locator('#onb-next').get_attribute('disabled')
        check('onb 下一步已启用', next_disabled is None)
        page.click('#onb-next')
        page.wait_for_timeout(500)  # 等 renderOnbStep innerHTML 生效
        check('onb step2 渲染（3 个性别选项：女/男/其他）', page.locator('.onb-option').count() == 3)
        check('onb 进度点 1 → done, 2 → active',
              'done' in (page.locator('.onb-dot').nth(0).get_attribute('class') or '') and
              'active' in (page.locator('.onb-dot').nth(1).get_attribute('class') or ''))
        page.screenshot(path=f'{SHOT_DIR}/v20-d-guest-4-onb-step2.png')

        print('\n=== Step 5 · step2 选 [女性] -> 下一步 ===')
        page.click('.onb-option[data-v="female"]')
        page.wait_for_timeout(150)
        check('onb 女性卡 selected',
              'selected' in (page.locator('.onb-option[data-v="female"]').get_attribute('class') or ''))
        page.click('#onb-next')
        page.wait_for_timeout(300)
        check('onb step3 渲染（4 个年龄段）', page.locator('.onb-option').count() == 4)
        page.screenshot(path=f'{SHOT_DIR}/v20-d-guest-5-onb-step3.png')

        print('\n=== Step 6 · step3 选 [25-34] -> 下一步 ===')
        page.click('.onb-option[data-v="25-34"]')
        page.wait_for_timeout(150)
        page.click('#onb-next')
        page.wait_for_timeout(300)
        check('onb step4 渲染（4 个陪伴类型）', page.locator('.onb-option').count() == 4)
        check('onb 下一步文案变 [开始体验]', page.locator('#onb-next').text_content().strip() == '开始体验')
        page.screenshot(path=f'{SHOT_DIR}/v20-d-guest-6-onb-step4.png')

        print('\n=== Step 7 · step4 选 [温柔倾听] -> 完成 ===')
        page.click('.onb-option[data-v="warm"]')
        page.wait_for_timeout(150)
        page.click('#onb-next')  # 最后一步点击触发 onboarding 关闭
        page.wait_for_timeout(500)
        check('onboarding 已隐藏', page.is_hidden('#onb-overlay'))
        check('主页 app 可见', page.is_visible('#app'))
        check('主页品牌条可见', page.is_visible('.brand-bar'))
        check('主页问候卡可见', page.locator('.hs-greet').count() > 0)
        check('主页签到卡可见', page.locator('.signin-card').count() > 0)
        check('主页 4 快捷入口可见', page.locator('.home-quick-item').count() >= 4)
        check('主页 4 推荐板块可见', page.locator('.home-board').count() >= 4)

        # 验证 localStorage 已落盘
        onb_done = page.evaluate("localStorage.getItem('lingjing_onboarding_done')")
        profile = page.evaluate("localStorage.getItem('lingjing_user_profile')")
        kind = page.evaluate("localStorage.getItem('lingjing_account_kind')")
        check('lingjing_onboarding_done=true', onb_done == 'true', f'got={onb_done}')
        check('lingjing_account_kind=guest', kind == 'guest', f'got={kind}')
        check('lingjing_user_profile 已保存',
              profile and '小柒' in profile and 'female' in profile and '25-34' in profile and 'warm' in profile,
              f'got={profile}')
        page.screenshot(path=f'{SHOT_DIR}/v20-d-guest-7-home-after.png')

        print('\n=== Step 8 · 二刷直接进主页（已 onboarding 用户）===')
        # 重要：lingjing_onboarding_done=true 时，JS 启动直接 splash/login/onb 全 hidden（line 581-584）
        page.reload(wait_until='domcontentloaded')
        page.wait_for_timeout(800)
        check('二刷：splash 不弹出（onbDone=true 直接跳过）', page.is_hidden('#splash-overlay'))
        check('二刷：login 不弹出', page.is_hidden('#login-overlay'))
        check('二刷：onboarding 不弹出', page.is_hidden('#onb-overlay'))
        check('二刷：主页直接揭示',
              page.is_visible('.brand-bar') and page.locator('.hs-greet').count() > 0)
        page.screenshot(path=f'{SHOT_DIR}/v20-d-guest-8-home-returning.png')

        b.close()

    print('\n' + '=' * 50)
    print(f'PASS: {len(PASS)}    FAIL: {len(FAIL)}')
    if FAIL:
        for n, d in FAIL:
            print(f'  FAIL  {n}: {d}')
        sys.exit(1)
    print('OK  访客登录端到端流程全过')


if __name__ == '__main__':
    main()
