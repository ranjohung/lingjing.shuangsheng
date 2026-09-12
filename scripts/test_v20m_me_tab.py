#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
V20-M · 「我的」功能区完整设计文档 对照验收测试
七区块结构 + 编辑资料 + 钱包(6档/50条) + 收藏 + 我的内容四子页 + 设置 10 Tab + 注销
设计文档：docs/sources/2026-09-12/S02-v20m-me-tab-design-doc.txt
"""
from playwright.sync_api import sync_playwright
import os, sys

BASE = 'http://localhost:8767/output/preview'
SHOT_DIR = 'output/preview/screenshots'
PASS, FAIL = [], []

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
        b = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-gpu', '--swiftshader'])
        ctx = b.new_context(viewport={'width': 390, 'height': 844})
        page = ctx.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))

        # ================= A. 我的 Tab 七区块 =================
        print('\n== A. 我的 Tab 七区块（设计文档 §一/§11.1）')
        page.goto(f'{BASE}/me.html')
        page.wait_for_timeout(600)
        blocks = page.evaluate("""() => {
          const txt = document.querySelector('main').innerText;
          return ['个人信息','资产总览','我的内容','创作者中心','订阅与消费','设置','法律与帮助','账号']
            .filter(t => txt.includes(t));
        }""")
        check('A1. 七区块齐全（个人信息→账号）', len(blocks) >= 8, str(blocks))

        # §2 个人信息
        profile_ok = page.evaluate("""() => {
          const has = s => !!document.querySelector(s);
          return has('#pr-ava') && has('#pr-name') && has('#pr-id') && has('#pr-sign') && has('#pr-verify');
        }""")
        edit_href = page.evaluate("document.getElementById('pr-edit-btn').getAttribute('href')")
        check('A2. 个人信息区六要素 + 编辑资料按钮', profile_ok and edit_href == 'profile-edit.html', edit_href)
        sign = page.evaluate("document.getElementById('pr-sign').textContent.length > 0")
        check('A3. 个性签名显示', sign)

        # §3 资产总览
        assets = page.evaluate("""[...document.querySelectorAll('.asset')].map(a => ({
          l: a.querySelector('.l').textContent,
          href: a.getAttribute('href') }))""")
        a_map = {a['l']: a['href'] for a in assets}
        check('A4. 资产三卡：灵晶/灵玉→钱包，收藏→收藏页',
              a_map.get('灵晶') == 'wallet.html' and a_map.get('灵玉') == 'wallet.html' and a_map.get('收藏') == 'favorites.html',
              str(a_map))

        # §4 我的内容
        contents = page.evaluate("""() => {
          const m = {};
          ['v20m-item-works','v20m-item-chars','v20m-item-worlds','v20m-item-cards'].forEach(id => {
            const el = document.getElementById(id);
            if (el) m[el.querySelector('.t').textContent] = el.getAttribute('href');
          });
          return m;
        }""")
        expect = {'我的作品': 'my-works.html', '我的角色': 'my-characters.html', '我的世界': 'my-worlds.html', '我的卡牌': 'my-cards.html'}
        check('A5. 我的内容四入口链接正确', contents == expect, str(contents))

        # §5 创作者中心动态显示
        cc_visible = page.evaluate("getComputedStyle(document.getElementById('creator-data-section')).display !== 'none'")
        check('A6. 创作者中心默认可见（mock 创作者）', cc_visible)
        tier_ok = page.evaluate("""() => {
          const t = document.getElementById('cc-tier-name').textContent;
          const s = document.getElementById('cc-tier-share').textContent;
          const cells = document.querySelectorAll('.earn-cell').length;
          return t.includes('L3') && s.includes('70%') && cells === 4;
        }""")
        check('A7. 等级卡 L3 黄金 70% + 收益总览 4 格', tier_ok)
        dash = page.evaluate("!!document.getElementById('v20m-item-dashboard')")
        check('A8. 创作数据看板入口', dash)
        # 非创作者隐藏
        page.evaluate("localStorage.setItem('lingjing_is_creator','0')")
        page.reload(); page.wait_for_timeout(500)
        cc_hidden = page.evaluate("getComputedStyle(document.getElementById('creator-data-section')).display === 'none'")
        works_hidden = page.evaluate("getComputedStyle(document.getElementById('v20m-item-works')).display === 'none'")
        check('A9. 非创作者：创作者中心 + 我的作品均隐藏', cc_hidden and works_hidden)
        page.evaluate("localStorage.removeItem('lingjing_is_creator')")

        # §6 订阅与消费
        subs = page.evaluate("""['v20m-item-sub-up','v20m-item-sub-cancel','v20m-item-sub-history','v20m-item-consume']
          .map(id => document.getElementById(id) ? document.getElementById(id).querySelector('.t').textContent : null)""")
        check('A10. 订阅管理 4 入口（升级/取消/历史/消费记录）', subs == ['升级订阅', '取消订阅', '订阅历史', '消费记录'], str(subs))
        sub_card = page.evaluate("!!document.querySelector('.sub-card') && document.querySelector('.sub-card').textContent.includes('续费')")
        check('A11. 当前订阅卡 + 续费按钮', sub_card)

        # §8 法律与帮助
        legal = page.evaluate("""() => {
          const txt = document.querySelector('main').innerText;
          return ['用户协议','隐私政策','未成年人禁止使用声明','AI 生成内容免责声明','侵权投诉',
                  '常见问题 FAQ','意见反馈','举报入口','客服联系方式','版本号','更新日志','官方社群入口','商务合作']
            .every(t => txt.includes(t));
        }""")
        check('A12. 法律 5 + 帮助 4 + 关于 4 全齐', legal)

        # §九 退出/注销
        duo = page.evaluate("!!document.getElementById('logout-btn') && !!document.getElementById('cancel-acct-btn')")
        check('A13. 底部退出登录 + 注销账号双按钮', duo)
        page.click('#cancel-acct-btn'); page.wait_for_timeout(400)
        dlg = page.evaluate("""() => {
          const d = document.getElementById('cancel-dialog');
          if (!d || !d.open) return false;
          const t = d.textContent;
          return t.includes('30 天后悔期') && t.includes('永久删除') && t.includes('匿名化留存');
        }""")
        check('A14. 注销弹窗：30 天后悔期 + 数据处理说明', dlg)
        page.click('#cancel-acct-no'); page.wait_for_timeout(200)

        # ================= B. 编辑资料 =================
        print('\n== B. 编辑资料（设计文档 §2.2）')
        page.goto(f'{BASE}/profile-edit.html')
        page.wait_for_timeout(500)
        fields = page.evaluate("""() => {
          const has = s => !!document.querySelector(s);
          return has('#pe-name') && has('#pe-sign') && has('#pe-gender') && has('#pe-birthday')
            && has('#pe-location') && has('#pe-phone') && has('#pe-email') && has('#pe-realname');
        }""")
        check('B1. 编辑资料 9 项（头像/用户名/签名/性别/生日/所在地/手机/邮箱/实名）', fields)
        # 修改并保存
        page.fill('#pe-name', '测试旅人')
        page.fill('#pe-sign', '双生测试签名')
        page.click('#pe-save'); page.wait_for_timeout(1000)
        saved = page.evaluate("JSON.parse(localStorage.getItem('lingjing_user_profile')||'{}')")
        check('B2. 保存写入 localStorage', saved.get('name') == '测试旅人' and saved.get('sign') == '双生测试签名', str(saved))
        # me.html 显示新资料
        page.goto(f'{BASE}/me.html'); page.wait_for_timeout(500)
        nm = page.evaluate("document.getElementById('pr-name').textContent")
        sg = page.evaluate("document.getElementById('pr-sign').textContent")
        check('B3. 我的页同步显示新用户名与签名', nm == '测试旅人' and sg == '双生测试签名', f'{nm}/{sg}')
        page.evaluate("localStorage.removeItem('lingjing_user_profile')")

        # ================= C. 钱包 =================
        print('\n== C. 钱包（设计文档 §3.2）')
        page.goto(f'{BASE}/wallet.html')
        page.wait_for_timeout(500)
        tiers = page.evaluate("[...document.querySelectorAll('#tab-1 .ds-card')].map(c => c.innerText.match(/¥(\\d+)/)?.[1])")
        check('C1. 灵晶充值 6 档（6/30/68/128/328/648）', tiers == ['6', '30', '68', '128', '328', '648'], str(tiers))
        page.click("text=消费记录"); page.wait_for_timeout(300)
        n = page.evaluate("document.querySelectorAll('#consume-list .wallet-row').length")
        check('C2. 消费记录 50 条', n == 50, f'got {n}')
        page.click("text=充值记录"); page.wait_for_timeout(200)
        rec = page.evaluate("document.querySelector('#tab-4').innerText.includes('灵晶充值') && document.querySelectorAll('#tab-4 .wallet-row').length >= 3")
        check('C3. 充值记录', rec)
        page.click("text=灵玉获取"); page.wait_for_timeout(200)
        yu = page.evaluate("document.querySelector('#tab-5').innerText.includes('签到') && document.querySelector('#tab-5').innerText.includes('任务')")
        check('C4. 灵玉获取记录（签到/任务/活动）', yu)
        page.click(".wallet-tab >> text=提现"); page.wait_for_timeout(200)
        wd = page.evaluate("""() => {
          const t = document.querySelector('#tab-7').innerText;
          return t.includes('可提现余额') && t.includes('申请提现') && t.includes('提现记录') && t.includes('提现规则');
        }""")
        check('C5. 提现区（余额/申请/记录/规则）', wd)
        # hash 路由
        page.goto(f'{BASE}/wallet.html#tab-3'); page.wait_for_timeout(400)
        h = page.evaluate("getComputedStyle(document.getElementById('tab-3')).display !== 'none'")
        check('C6. #tab-3 hash 直达消费记录', h)

        # ================= D. 收藏 =================
        print('\n== D. 收藏（设计文档 §3.3）')
        page.goto(f'{BASE}/favorites.html')
        page.wait_for_timeout(500)
        tabs = page.evaluate("[...document.querySelectorAll('.fav-tab')].map(t => t.textContent)")
        check('D1. 收藏四 Tab（小说世界/角色/卡牌/动态）', tabs == ['📖 小说世界', '💬 角色', '🃏 卡牌', '🔥 动态'], str(tabs))
        cnt0 = page.evaluate("document.querySelectorAll('#fav-list .fav-item').length")
        check('D2. 默认小说世界列表 4 条', cnt0 == 4, f'got {cnt0}')
        # 筛选
        page.click("#fav-filter >> text=完结"); page.wait_for_timeout(200)
        cnt = page.evaluate("document.querySelectorAll('#fav-list .fav-item').length")
        check('D3. 筛选「完结」→ 2 条', cnt == 2, f'got {cnt}')
        # 切到卡牌 + 取消收藏
        page.click(".fav-tab[data-cat=card]"); page.wait_for_timeout(200)
        n_cards = page.evaluate("document.querySelectorAll('#fav-list .fav-item').length")
        check('D4. 卡牌收藏 2 条', n_cards == 2, f'got {n_cards}')
        page.click("#fav-list .fav-item .del"); page.wait_for_timeout(300)
        page.click('#del-yes'); page.wait_for_timeout(300)
        n_after = page.evaluate("document.querySelectorAll('#fav-list .fav-item').length")
        check('D5. 取消收藏（弹窗确认 → 数量 -1）', n_after == n_cards - 1, f'{n_cards}->{n_after}')
        page.evaluate("localStorage.removeItem('lingjing_v52x_favs')")

        # ================= E. 我的内容四子页 =================
        print('\n== E. 我的内容子页')
        page.goto(f'{BASE}/my-works.html'); page.wait_for_timeout(400)
        wt = page.evaluate("[...document.querySelectorAll('.mw-tab')].map(t => t.textContent)")
        wn = page.evaluate("document.querySelectorAll('#mw-list .mw-item').length")
        check('E1. 我的作品 4 状态 Tab + 已发布 2 部', wt == ['已发布', '草稿箱', '审核中', '已下架'] and wn == 2, f'{wt}/{wn}')

        page.goto(f'{BASE}/my-characters.html'); page.wait_for_timeout(400)
        cn = page.evaluate("document.querySelectorAll('#mc-list .mc-item').length")
        twin = page.evaluate("!!document.querySelector('.badge-twin') && !!document.querySelector('.badge-create')")
        page.click(".mc-chip[data-src=novel_brought_out]"); page.wait_for_timeout(200)
        twins = page.evaluate("document.querySelectorAll('#mc-list .mc-item').length")
        check('E2. 我的角色：全量 + [创]/[双]角标 + 双生筛选', cn >= 5 and twin and twins >= 2, f'all={cn} twin={twins}')

        page.goto(f'{BASE}/my-worlds.html'); page.wait_for_timeout(400)
        wp = page.evaluate("""() => ({
          n: document.querySelectorAll('#wp-list .wp-item').length,
          pct: document.querySelector('.wp-fill')?.style.width,
          play: document.querySelector('.wp-play')?.textContent })""")
        check('E3. 我的世界：正在游玩 2 + 进度条 + 继续游玩', wp['n'] == 2 and wp['pct'] == '42%' and '继续游玩' in wp['play'], str(wp))

        page.goto(f'{BASE}/my-cards.html'); page.wait_for_timeout(400)
        page.click("#kc-rarity >> text=限定"); page.wait_for_timeout(200)
        kn = page.evaluate("document.querySelectorAll('#kc-grid .kc-card').length")
        check('E4. 卡牌稀有度筛选「限定」→ 1 张', kn == 1, f'got {kn}')
        page.click("#kc-grid .kc-card"); page.wait_for_timeout(300)
        kd = page.evaluate("""() => {
          const m = document.getElementById('kc-mask');
          return m.classList.contains('show') && m.textContent.includes('分享') && m.textContent.includes('设为背景');
        }""")
        check('E5. 卡牌详情弹窗（分享 / 设为背景）', kd)
        page.click('#kd-bg'); page.wait_for_timeout(200)
        bg = page.evaluate("localStorage.getItem('lingjing_v52x_profile_bg') !== null")
        check('E6. 设为背景写入 localStorage', bg)
        page.evaluate("localStorage.removeItem('lingjing_v52x_profile_bg')")

        # ================= F. 设置 10 Tab =================
        print('\n== F. 设置（设计文档 §7）')
        page.goto(f'{BASE}/settings.html'); page.wait_for_timeout(500)
        ntabs = page.evaluate("document.querySelectorAll('.settings-tab').length")
        check('F1. 设置 10 Tab', ntabs == 10, f'got {ntabs}')
        page.click("text=🗄️ 数据管理"); page.wait_for_timeout(200)
        dm = page.evaluate("""() => {
          const t = document.querySelector('#tab-7').innerText;
          return t.includes('数据导出') && t.includes('清除缓存') && t.includes('记忆管理') && t.includes('对话历史管理');
        }""")
        check('F2. 数据管理 4 项（导出JSON/清缓存/记忆/对话）', dm)
        page.click("text=通知"); page.wait_for_timeout(200)
        nt = page.evaluate("""() => {
          const t = document.querySelector('#tab-2').innerText;
          return ['系统通知','角色主动消息','世界更新提醒','活动通知','创作者收益通知'].every(x => t.includes(x));
        }""")
        check('F3. 通知 5 开关', nt)
        page.click("text=隐私"); page.wait_for_timeout(200)
        pv = page.evaluate("""() => {
          const t = document.querySelector('#tab-3').innerText;
          return ['个人资料可见性','互动记录可见性','收藏可见性','在线状态可见性','数据授权管理','隐私政策查看'].every(x => t.includes(x));
        }""")
        check('F4. 隐私 6 项', pv)
        page.click("text=偏好"); page.wait_for_timeout(200)
        pf = page.evaluate("""() => {
          const t = document.querySelector('#tab-4').innerText;
          return ['语言设置','主题设置','字号设置','自动播放设置','语音设置'].every(x => t.includes(x));
        }""")
        check('F5. 使用偏好 5 项（语言/主题/字号/自动播放/语音）', pf)
        # hash 路由数据管理
        page.goto(f'{BASE}/settings.html#data'); page.wait_for_timeout(400)
        dh = page.evaluate("getComputedStyle(document.getElementById('tab-7')).display !== 'none'")
        check('F6. #data hash 直达数据管理', dh)

        # ================= G. 创作者中心数据看板（commerce） =================
        print('\n== G. 创作数据看板（设计文档 §5.5）')
        page.goto(f'{BASE}/commerce.html#dashboard')
        page.wait_for_timeout(900)
        dash = page.evaluate("""() => {
          const t = document.body.innerText;
          return ['创作数据看板','作品阅读量','进入世界次数','平均游玩时长','角色受欢迎程度','章节退出率'].every(x => t.includes(x));
        }""")
        check('G1. 数据看板 5 指标', dash)
        earn = page.evaluate("!!document.getElementById('v20m-earn-toolbar')")
        check('G2. 收益明细三视图 + 导出', earn)

        # 全程无 JS 错误
        check('Z. 全程 0 pageerror', len(errors) == 0, '; '.join(errors[:3]))

        b.close()

    print(f'\n========== 结果: {len(PASS)} PASS / {len(FAIL)} FAIL ==========')
    if FAIL:
        for n, d in FAIL: print(f'  ✗ {n}: {d}')
        sys.exit(1)

if __name__ == '__main__':
    main()
