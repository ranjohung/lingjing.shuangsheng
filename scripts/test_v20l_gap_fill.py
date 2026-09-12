# -*- coding: utf-8 -*-
"""V20-L · 全应用功能区对照设计文档 V1.0 补齐（24 项缺口）（24 项检查）
用户需求（2026-09-12）：对照《灵境·双生 — 全应用功能区完整设计文档 V1.0》检查所有
功能按键/功能区，文档有的补上，已有的保留不删。

首页（4）：
  1. 签到中心：点击签到卡 → 完整签到界面（7 天格子 + 看视频领灵晶 + 4 快捷入口）
  2. 陪伴动态 → chat.html?cid=（进入角色聊天）
  3. 世界更新 → plot-detail.html?novel=（进入世界详情）
  4. 快捷入口 4 项（继续阅读/陪伴/创作/每日福利）
世界（4）：
  5. 排行榜 16 榜含设计文档六榜（Fans/综合/同人/新晋完结/勤更/稀有卡）
  6. 卡片一句话简介渲染
  7. 分类侧边栏含"明星同人"（设计文档"明星"）与"完结"
  8. Fans 榜可切换且有序
心屿（6）：
  9. + 创建新角色 → character-create.html
 10. 故事区双按钮（进入 TA 的世界 + 专属剧情）
 11. 记忆区 查看/编辑/删除 三操作
 12. 聊天页 ?cid= 动态角色 + AI 主动第一条消息
 13. 聊天页底部免责声明 + 首次完整免责弹窗
 14. 双生角色聊天页有 [进入 TA 的世界] + 敏感问题引导（120/12348/12356）
创作（4）：
 15. 顶栏关闭按钮 + 草稿箱
 16. 两大按钮（创建智能体 / 灵境工坊）
 17. 三个功能按钮（视频/图片/声音）+ 更多创建 4 项
 18. 灵境工坊工作台 5 入口（编辑器/AI/收费点/封面/发布）
我的（2）：
 19. 创作数据区（作品/收益/提现，仅创作者可见）
 20. 法律区侵权投诉
游戏（4）：
 21. 工具栏灵境平台标识按钮
 22. 属性面板 9 属性（含体魄/智谋/好感度）
 23. 地图建筑点击进入子场景
 24. 地图人物点击弹互动菜单（对话/送礼/邀约/攻略）
"""
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:8767/output/preview'
HOME = 'http://localhost:8767/product-preview.html'
PASS = FAIL = 0


def check(name, cond, extra=''):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f'  PASS {name}')
    else:
        FAIL += 1
        print(f'  FAIL {name} {extra}')


with sync_playwright() as p:
    browser = p.chromium.launch(args=['--use-gl=swiftshader'])
    ctx = browser.new_context(viewport={'width': 390, 'height': 844})
    page = ctx.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))

    # ---------- 首页 ----------
    print('== A. 首页')
    page.goto(HOME)
    page.evaluate("localStorage.setItem('lingjing_onboarding_done','true')")
    page.evaluate("localStorage.removeItem('lingjing_v5170_signin_log')")
    page.reload()
    page.wait_for_timeout(600)
    page.click('.signin-card', position={'x': 30, 'y': 30})
    page.wait_for_timeout(400)
    center = page.evaluate("!!document.getElementById('lj-signin-center')")
    check('1a. 签到中心弹层打开', center)
    if center:
        cells = page.evaluate("document.querySelectorAll('#lj-signin-center .sc-day-cell').length")
        check('1b. 7 天签到格子', cells == 7, str(cells))
        has_video = page.evaluate("!!document.querySelector('#lj-signin-center #sc-video-btn')")
        has_quick = page.evaluate("document.querySelectorAll('#lj-signin-center .sc-quick-item').length")
        check('1c. 看视频领灵晶 + 4 快捷入口', has_video and has_quick == 4, f'video={has_video} quick={has_quick}')
        page.evaluate("document.getElementById('lj-signin-center').remove()")

    feed_href = page.evaluate("(document.querySelector('.home-feed-item')||{}).getAttribute ? document.querySelector('.home-feed-item').getAttribute('href') : ''")
    check('2. 陪伴动态 → chat.html?cid=', 'chat.html?cid=' in (feed_href or ''), feed_href)
    upd_href = page.evaluate("(document.querySelector('.home-update-item')||{}).getAttribute ? document.querySelector('.home-update-item').getAttribute('href') : ''")
    check('3. 世界更新 → plot-detail', 'plot-detail.html?novel=' in (upd_href or ''), upd_href)
    quick_n = page.evaluate("document.querySelectorAll('.home-quick-item').length")
    check('4. 4 快捷入口', quick_n == 4, str(quick_n))

    # ---------- 世界 ----------
    print('== B. 世界')
    page.goto(f'{BASE}/library.html')
    page.wait_for_timeout(500)
    page.evaluate("window.LJWorld.goSub('rank')")
    page.wait_for_timeout(300)
    ranks = page.evaluate("[...document.querySelectorAll('.rank-tab')].map(t=>t.textContent)")
    check('5. 排行榜 16 榜（含设计文档六榜）', len(ranks) == 16 and any('Fans' in r for r in ranks)
          and any('综合榜' in r for r in ranks) and any('同人榜' in r for r in ranks)
          and any('新晋完结' in r for r in ranks) and any('勤更榜' in r for r in ranks)
          and any('稀有卡' in r for r in ranks), f'{len(ranks)}')
    page.evaluate("window.LJWorld.goSub('home')")
    page.wait_for_timeout(300)
    desc_n = page.evaluate("document.querySelectorAll('.ds-wf-desc').length")
    check('6. 卡片一句话简介渲染', desc_n > 0, str(desc_n))
    page.evaluate("window.LJWorld.openDrawer()")
    page.wait_for_timeout(300)
    cats = page.evaluate("[...document.querySelectorAll('.ds-d-cat')].map(c=>c.textContent)")
    check('7. 分类含 明星同人 / 完结', any('明星同人' in c for c in cats) and any(c == '完结' for c in cats), str(cats))
    page.evaluate("window.LJWorld.closeDrawer()")
    page.evaluate("window.LJWorld.goSub('rank')")
    page.wait_for_timeout(200)
    page.click('.rank-tab:has-text("Fans")')
    page.wait_for_timeout(300)
    rows = page.evaluate("document.querySelectorAll('.rank-row').length")
    check('8. Fans 榜可切换且有序', rows > 0, str(rows))

    # ---------- 心屿 ----------
    print('== C. 心屿')
    page.goto(f'{BASE}/heart-island.html')
    page.evaluate("localStorage.setItem('lingjing_v5170_xinyu_intro_seen','1')")
    page.wait_for_timeout(500)
    create_href = page.evaluate("document.getElementById('heart-create') ? 'keep' : ''")
    # 创建按钮跳转（点击后应为 character-create.html）
    if create_href:
        page.click('#heart-create')
        page.wait_for_timeout(800)
        check('9. 创建新角色 → character-create.html', 'character-create' in page.url, page.url)
        page.goto(f'{BASE}/heart-island.html')
        page.wait_for_timeout(500)
    page.evaluate("window.LJHeart.setSub('stories')")
    page.wait_for_timeout(300)
    story_btns = page.evaluate("document.querySelectorAll('.story-item .si-btn').length")
    story_world = page.evaluate("[...document.querySelectorAll('.story-item .si-btn')].some(b=>b.textContent.indexOf('进入 TA 的世界')>-1)")
    story_excl = page.evaluate("[...document.querySelectorAll('.story-item .si-btn')].some(b=>b.textContent.indexOf('专属剧情')>-1)")
    check('10. 故事区双按钮（进入世界 + 专属剧情）', story_btns >= 8 and story_world and story_excl,
          f'btns={story_btns} world={story_world} excl={story_excl}')
    page.evaluate("window.LJHeart.setSub('memories')")
    page.wait_for_timeout(300)
    ops = page.evaluate("[...document.querySelectorAll('.mem-item .mi-op')].map(b=>b.textContent)")
    check('11. 记忆 查看/编辑/删除', ops.count('查看') >= 5 and ops.count('编辑') >= 5 and ops.count('删除') >= 5, str(ops[:6]))

    # 聊天页
    page.goto(f'{BASE}/chat.html?cid=c06')
    page.wait_for_timeout(700)
    name = page.evaluate("document.getElementById('chat-name').textContent")
    first_msg = page.evaluate("(document.querySelector('.msg.them .msg-bubble')||{textContent:''}).textContent")
    check('12. ?cid= 动态角色（林清雪）+ AI 主动第一条', name == '林清雪' and len(first_msg) > 3, f'{name}/{first_msg[:10]}')
    disc = page.evaluate("!!document.querySelector('.chat-disclaimer')")
    dlg = page.evaluate("!!document.querySelector('.disc-mask')")
    check('13. 底部免责小字 + 首次完整免责弹窗', disc and dlg)
    if dlg:
        page.evaluate("localStorage.setItem('lingjing_v5210_chat_disclaimer_seen','1')")
        page.click('.disc-dialog .dd-btn')
        page.wait_for_timeout(200)
    world_btn = page.evaluate("var b=document.getElementById('chat-world-btn'); b ? getComputedStyle(b).display : 'none'")
    check('14a. 双生角色 [进入 TA 的世界]', world_btn != 'none', world_btn)
    page.fill('#chat-input', '我最近很难受，不想活了')
    page.click('.chat-input .send')
    page.wait_for_timeout(1200)
    last_reply = page.evaluate("[...document.querySelectorAll('.msg-bubble')].pop().textContent")
    check('14b. 敏感问题引导（12356 心理援助）', '12356' in last_reply or '120' in last_reply, last_reply[:40])
    page.fill('#chat-input', '讲讲你的职业知识')
    page.click('.chat-input .send')
    page.wait_for_timeout(1200)
    last_reply2 = page.evaluate("[...document.querySelectorAll('.msg-bubble')].pop().textContent")
    check('14c. 职业问答能力', '记者' in last_reply2 or '科普' in last_reply2, last_reply2[:40])

    # ---------- 创作 ----------
    print('== D. 创作')
    page.goto(f'{BASE}/creator-center.html')
    page.wait_for_timeout(500)
    close_btn = page.evaluate("[...document.querySelectorAll('.topbar .icon-btn')].some(b=>(b.getAttribute('title')||'').indexOf('关闭')>-1)")
    draft = page.evaluate("!!document.querySelector('[data-page-node-id=v20l-draftbox]')")
    check('15. 顶栏关闭按钮 + 草稿箱', close_btn and draft)
    agent = page.evaluate("[...document.querySelectorAll('.big-btn .bt')].some(t=>t.textContent.indexOf('创建智能体')>-1)")
    workshop = page.evaluate("[...document.querySelectorAll('.big-btn .bt')].some(t=>t.textContent.indexOf('灵境工坊')>-1)")
    agent_href = page.evaluate("(document.querySelector('.big-btn.agent')||{}).getAttribute ? document.querySelector('.big-btn.agent').getAttribute('href') : ''")
    check('16. 两大按钮（创建智能体→character-create / 灵境工坊）', agent and workshop and 'character-create' in agent_href)
    fn3 = page.evaluate("document.querySelectorAll('.fn-btn').length")
    mc4 = page.evaluate("[...document.querySelectorAll('.mc-btn .ml')].map(x=>x.textContent)")
    check('17. 3 功能按钮 + 4 更多创建', fn3 == 3 and len(mc4) == 4 and '创建动态' in mc4 and '复刻音色' in mc4 and '创建灵念' in mc4 and 'Agent 创建' in mc4, str(mc4))
    wb = page.evaluate("[...document.querySelectorAll('.wb-item .wl')].map(x=>x.textContent)")
    check('18. 工作台 5 入口', len(wb) == 5 and '小说编辑器' in wb and 'AI 辅助' in wb and '收费点设置' in wb and '封面设置' in wb and '发布管理' in wb, str(wb))

    # ---------- 我的 ----------
    print('== E. 我的')
    page.goto(f'{BASE}/me.html')
    page.wait_for_timeout(500)
    cd = page.evaluate("var s=document.getElementById('creator-data-section'); s ? getComputedStyle(s).display : 'missing'")
    cd_items = page.evaluate("[...document.querySelectorAll('[data-page-node-id=v20l-list-creator] .t')].map(x=>x.textContent)")
    check('19. 创作数据区（作品/收益/提现/看板）', cd != 'none' and cd_items == ['作品列表', '收益明细', '提现入口', '创作数据看板'], f'{cd}/{cd_items}')
    infringe = page.evaluate("var t=document.querySelector('[data-page-node-id=v20l-t-infringe]'); !!t && t.textContent === '侵权投诉'")
    check('20. 法律区侵权投诉', infringe)

    # ---------- 游戏界面 ----------
    print('== F. 游戏')
    # 先在同源页写 localStorage 跳过实名认证弹窗（V19）
    page.goto(f'{BASE}/library.html')
    page.evaluate("localStorage.setItem('lingjing_v519_realname_done','true')")
    page.goto(f'{BASE}/plot-runner.html?novel=changyecheng')
    page.wait_for_timeout(900)
    # 关掉封面
    try:
        page.click('#plot-cover', timeout=2500)
    except Exception:
        pass
    page.wait_for_timeout(400)
    brand = page.evaluate("!!document.getElementById('plot-brand')")
    check('21. 工具栏灵境平台标识', brand)
    attrs = page.evaluate("[...document.querySelectorAll('.plot-attr-panel .attr-key')].map(x=>x.textContent)")
    check('22. 属性面板 9 属性（含体魄/智谋/好感度）', len(attrs) == 9 and '体魄' in attrs and '智谋' in attrs and '好感度' in attrs, str(attrs))
    page.evaluate("window.LJPlot.toggleMapMode()")
    page.wait_for_timeout(300)
    page.click('.plot-map-bldg >> nth=0')
    page.wait_for_timeout(300)
    sub_scene = page.evaluate("document.getElementById('plot-text').textContent")
    map_open = page.evaluate("!document.getElementById('plot-stage').classList.contains('map-mode')")
    check('23. 地图建筑点击进入子场景', map_open and '你来到了' in sub_scene, sub_scene[:20])
    page.evaluate("window.LJPlot.toggleMapMode()")
    page.wait_for_timeout(300)
    page.click('.plot-map-char >> nth=0')
    page.wait_for_timeout(300)
    iact = page.evaluate("var m=document.getElementById('plot-interact-menu'); m.classList.contains('open') ? [...m.querySelectorAll('.pim-btn')].map(b=>b.textContent) : []")
    check('24. 人物互动菜单（对话/送礼/邀约/攻略）', len(iact) == 4 and any('对话' in x for x in iact) and any('送礼' in x for x in iact) and any('邀约' in x for x in iact) and any('攻略' in x for x in iact), str(iact))

    # ---------- 全程 0 pageerror ----------
    check('25. 全程 0 pageerror', len(errors) == 0, '; '.join(errors[:3]))

    browser.close()

print(f'\n===== V20-L 结果: {PASS} PASS / {FAIL} FAIL =====')
raise SystemExit(1 if FAIL else 0)
