"""V22-C 视觉小说范式截图"""
from playwright.sync_api import sync_playwright
from pathlib import Path

OUT = Path('output/preview/screenshots/v22-c')
OUT.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_context(viewport={'width': 480, 'height': 800}).new_page()
    page.add_init_script("""
        localStorage.setItem('lingjing_onboarding_done', 'true');
        localStorage.setItem('lingjing_realname', JSON.stringify({name:'冒烟', id:'11010119900101001X'}));
    """)
    page.goto('http://127.0.0.1:8767/novel-game.html?demo=1', wait_until='domcontentloaded')
    page.wait_for_function('window.NovelWorldVN', timeout=4000)

    # 1. 顶部状态栏 + 场景标签 + 底部文字框 完整视图
    page.evaluate('''window.NovelWorldVN.enterScene({
        paragraph: "你沿着蜿蜒小路走进深山，两旁桃花盛开，落英缤纷。一位白衣女子正在溪边抚琴，神情淡然，似在等待有缘人。",
        speaker: "旁白",
        genre: "xiuxian",
        npcs: [{name: "白衣女子"}, {name: "山中老翁"}],
        items: [{name: "古琴"}, {name: "玉佩"}],
        actions: [
            {label: "去后山", cost: {ap: 5}},
            {label: "拾取古琴", cost: {ap: 1}},
            {label: "下棋", cost: {ap: 3, copper: 5}}
        ],
        ps: {ap: 95, copper: 50, silver: 10, jade: 5, time: "0年12月上旬", avatarEmoji: "🧑"}
    });''')
    page.wait_for_timeout(2000)  # 等打字机完成
    page.screenshot(path=str(OUT / '01-vn-full.png'))

    # 2. NPC 标签点击 → 人物介绍
    page.evaluate('''window.NovelWorldVN.enterScene({
        paragraph: "你沿着蜿蜒小路走进深山，两旁桃花盛开，落英缤纷。",
        genre: "xiuxian",
        npcs: [{name: "白衣女子", desc: "溪边抚琴的女子 · 战乱流落至此"}, {name: "山中老翁", desc: "白发长者 · 修行之人"}],
        items: [{name: "古琴"}],
        actions: [{label: "去后山", cost: {ap: 5}}, {label: "拾取古琴", cost: {ap: 1}}],
        ps: {ap: 95, copper: 50, silver: 10, jade: 5, time: "0年12月上旬", avatarEmoji: "🧑"}
    });''')
    page.wait_for_timeout(2000)
    page.locator('.ng-v22-tag.npc').first.click()
    page.wait_for_timeout(800)
    page.screenshot(path=str(OUT / '02-npc-click.png'))

    # 3. 资源不够 → 标 insufficient
    page.evaluate('''window.NovelWorldVN.enterScene({
        paragraph: "你饥肠辘辘。",
        genre: "jingying",
        actions: [{label: "做饭", cost: {ap: 50, copper: 100}}],
        ps: {ap: 5, copper: 10, silver: 0, jade: 1, time: "0年12月上旬", avatarEmoji: "🧑"}
    });''')
    page.wait_for_timeout(2000)
    page.locator('.ng-v22-tag.action').first.click()
    page.wait_for_timeout(800)
    page.screenshot(path=str(OUT / '03-confirm-insufficient.png'))

    # 4. 模式切换：长滚动模式
    page.evaluate('''window.NovelWorldVN.enterScene({
        paragraph: "你沿着蜿蜒小路走进深山，两旁桃花盛开，落英缤纷。",
        genre: "xiuxian",
        npcs: [{name: "白衣女子"}],
        actions: [{label: "去后山", cost: {ap: 5}}],
        ps: {ap: 95, copper: 50, silver: 10, jade: 5, time: "0年12月上旬", avatarEmoji: "🧑"}
    });''')
    page.wait_for_timeout(2000)
    page.evaluate('window.NovelWorldVN.toggleMode()')
    page.wait_for_timeout(300)
    page.screenshot(path=str(OUT / '04-mode-scroll.png'))

    # 5. 5 题材分别截一张
    genres = [
        ('xiuxian', '玄幻', '{ap:100,copper:50,silver:10,jade:5,time:"0年12月上旬",avatarEmoji:"🧑",xiuxian_cultivation:50,linggen:"single",shenshi:30,shouyuan:200,lingqi:80}'),
        ('mori', '末日', '{ap:100,copper:0,silver:0,jade:5,time:"0年12月上旬",avatarEmoji:"🧑",hp:80,spirit:60,hunger:30,radiation:10}'),
        ('wuxia', '武侠', '{ap:100,copper:50,silver:10,jade:5,time:"0年12月上旬",avatarEmoji:"🧑",blood:90,neili:70,wugong_rank:"third",reputation:50}'),
        ('jingying', '经营', '{ap:100,copper:500,silver:10,jade:5,time:"0年12月上旬",avatarEmoji:"🧑",stamina:80,prestige:200,land_level:1}'),
        ('gongdou', '宫斗', '{ap:100,copper:0,silver:0,jade:5,time:"0年12月上旬",avatarEmoji:"👩",rank:"imperial_concubine",favor:70,scheming:60,etiquette:80}')
    ]
    for i, (g, label, ps_json) in enumerate(genres):
        page.evaluate('window.NovelWorldVN.enterScene({\n            paragraph: "你沿着蜿蜒小路走进深山，两旁桃花盛开，落英缤纷。",\n            genre: "' + g + '",\n            npcs: [{name: "白衣女子"}],\n            actions: [{label: "去后山", cost: {ap: 5}}, {label: "拾取", cost: {ap: 1}}],\n            ps: ' + ps_json + '\n        });')
        page.wait_for_timeout(1500)
        page.screenshot(path=str(OUT / '05-genre-{}-{}.png'.format(i + 1, g)))

    b.close()

print("✅ V22-C 截图完成：", OUT)
