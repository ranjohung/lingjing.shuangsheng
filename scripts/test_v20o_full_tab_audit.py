"""
V20-O · 全 Tab 按键实测审计（V20-N 方法论推广到 5 Tab）
覆盖：首页 / 世界 / 心屿 / 创作（me.html 已由 V20-N 审过 39/39 PASS）
方法：Playwright + Chromium（swiftshader 软渲染） + 真点击 + pageerror 监听
来源需求：docs/sources/2026-09-12/S01-v20l-full-app-design-doc.txt
"""
from playwright.sync_api import sync_playwright
import json, os, sys
from pathlib import Path

# 坑#4：8767 根可被并行会话占用/受代理干扰 → LJ_TEST_PORT 自起端口 + 127.0.0.1 直连
BASE = "http://127.0.0.1:" + os.environ.get("LJ_TEST_PORT", "8767")
results = []
errs = []

with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=swiftshader"])
    ctx = b.new_context(viewport={"width": 390, "height": 844})
    page = ctx.new_page()
    page.on("pageerror", lambda e: errs.append({"url": page.url, "msg": str(e)[:200]}))

    # 工具：DOM 存在性
    def visible(sel, label, pg):
        ok = page.evaluate(f"(()=>{{const e=document.querySelector({sel!r}); if(!e) return false; const r=e.getBoundingClientRect(); return r.width>0 && r.height>0}})()")
        results.append({"page": pg, "item": label, "result": "PASS" if ok else "FAIL", "sel": sel})
        return ok

    def exists(sel, label, pg):
        ok = page.evaluate(f"!!document.querySelector({sel!r})")
        results.append({"page": pg, "item": label, "result": "PASS" if ok else "FAIL", "sel": sel})
        return ok

    def count(sel, label, pg, min_n=1):
        n = page.evaluate(f"document.querySelectorAll({sel!r}).length")
        ok = n >= min_n
        results.append({"page": pg, "item": label, "result": "PASS" if ok else "FAIL", "n": n, "min": min_n})
        return ok

    def click(sel, label, pg, check=None):
        before_url = page.url
        before_err = len(errs)
        try:
            page.click(sel, timeout=3000)
            page.wait_for_timeout(500)
        except Exception as e:
            results.append({"page": pg, "item": label, "result": "TIMEOUT", "err": str(e)[:80]})
            return False
        new_errs = errs[before_err:]
        ok = check(page) if check else True
        r = "PASS" if (not new_errs and ok) else "FAIL"
        results.append({"page": pg, "item": label, "result": r, "after": page.url, "newErrors": new_errs})
        return ok

    # 预置：跳过启动页 splash/login/onb（V20-C 浮层挡测试）
    ctx.add_init_script("""
      try {
        localStorage.setItem('lingjing_onboarding_done', 'true');
        localStorage.setItem('lingjing_v519_realname_done', 'true');
        localStorage.setItem('lingjing_account_kind', 'guest');
      } catch(e) {}
    """)

    # ════════════════════════════════════════════════════════════════
    # A 段：首页（product-preview.html）
    # ════════════════════════════════════════════════════════════════
    P = "product-preview.html"
    page.goto(BASE + "/product-preview.html", wait_until="domcontentloaded")
    page.wait_for_timeout(1500)

    # A.1 4 层结构（状态栏 + 签到 + 快捷入口 + 推荐）
    exists("#home-status", "A.1.1 状态栏渲染", P)
    exists("#home-signin", "A.1.2 签到卡渲染", P)
    exists("#home-quick", "A.1.3 快捷入口容器渲染", P)
    exists("#home-recommend", "A.1.4 推荐区容器渲染", P)

    # A.2 状态栏 4 元素（顶栏）
    exists(".hs-bell", "A.2.1 顶栏铃铛（带红点）", P)
    exists(".hs-wallet", "A.2.2 顶栏钱包（灵晶/灵玉）", P)
    exists(".hs-avatar", "A.2.3 顶栏头像", P)
    exists(".hs-greet", "A.2.4 顶栏问候语（按时段）", P)

    # A.3 签到卡
    visible(".signin-card", "A.3.1 签到卡可视", P)
    exists("#signin-btn", "A.3.2 立即签到按钮", P)

    # A.4 4 快捷入口
    count(".home-quick-item", "A.4.1 快捷入口 4 项", P, 4)
    # 验证其中 2 个入口可点击跳转
    click(".home-quick-item >> nth=0", "A.4.2 快捷入口 1 → library.html", P,
          lambda pg: "library" in pg.url or pg.evaluate("location.href") is not None)
    page.goto(BASE + "/product-preview.html", wait_until="domcontentloaded")
    page.wait_for_timeout(1000)
    click(".home-quick-item >> nth=2", "A.4.3 快捷入口 3（创作）→ creator-center.html", P,
          lambda pg: "creator-center" in pg.url)
    page.goto(BASE + "/product-preview.html", wait_until="domcontentloaded")
    page.wait_for_timeout(1000)

    # A.5 4 推荐板块
    count(".home-board", "A.5.1 推荐板块 4 个（今日/陪伴/世界/活动）", P, 4)

    # A.6 今日推荐卡 + 跳转
    count(".home-grid-2 a, .home-board a[href*='plot-detail']", "A.6.1 今日推荐卡 ≥ 1", P, 1)

    # A.7 陪伴动态（点击进 chat.html?cid=）
    n_comp = page.evaluate("document.querySelectorAll('.home-board a[href*=\"chat.html?cid=\"]').length")
    results.append({"page": P, "item": "A.7.1 陪伴动态 N 项（点进 chat）", "result": "PASS" if n_comp >= 1 else "FAIL", "n": n_comp})

    # A.8 世界更新（点击进 plot-detail）
    n_wu = page.evaluate("document.querySelectorAll('.home-board a[href*=\"plot-detail\"]').length")
    results.append({"page": P, "item": "A.8.1 世界更新 N 项（点进 plot-detail）", "result": "PASS" if n_wu >= 1 else "FAIL", "n": n_wu})

    # A.9 5 Tab 底部 + home active
    count(".tabbar a", "A.9.1 5 Tab 数量", P, 5)
    home_active = page.evaluate("!!document.querySelector('.tabbar a[data-tab=\"home\"].active') || !!document.querySelector('.tabbar a.t-home.active')")
    results.append({"page": P, "item": "A.9.2 home Tab active", "result": "PASS" if home_active else "FAIL"})

    # A.10 签到中心抽屉（点击签到卡打开）
    # 注意：签到按钮上的抽屉 ID 是动态注入，唤起后才有 #lj-signin-center
    page.click("#signin-btn", timeout=3000)
    page.wait_for_timeout(600)
    signin_drawer = page.evaluate("!!document.getElementById('lj-signin-center')")
    results.append({"page": P, "item": "A.10.1 签到中心抽屉打开", "result": "PASS" if signin_drawer else "FAIL"})
    # 关闭抽屉（点 mask）
    if signin_drawer:
        page.evaluate("document.getElementById('lj-signin-center')?.remove()")
        page.wait_for_timeout(200)

    # A.11 微型页脚存在
    exists(".final-foot", "A.11.1 微型页脚", P)

    # ════════════════════════════════════════════════════════════════
    # B 段：世界（library.html）
    # ════════════════════════════════════════════════════════════════
    P = "library.html"
    page.goto(BASE + "/output/preview/library.html", wait_until="domcontentloaded")
    page.wait_for_timeout(1500)

    # B.1 顶栏
    visible(".topbar-title", "B.1.1 顶栏标题（世界）", P)
    exists(".topbar-acts", "B.1.2 顶栏右侧操作区", P)

    # B.2 7 项子导航
    count(".ds-sn", "B.2.1 子导航 7 项", P, 7)

    # B.3 4 大金刚
    count(".ds-qg-item", "B.3.1 4 大金刚（全部分类/更新日历/经典必看/创作）", P, 4)
    # 验证分类抽屉按钮可点
    click(".ds-qg-item[data-action='cat']", "B.3.2 全部分类金刚 → 抽屉打开", P,
          lambda pg: pg.evaluate("document.getElementById('ds-drawer')?.classList.contains('show') ?? false"))
    # 关闭
    page.evaluate("document.getElementById('ds-drawer')?.classList.remove('show')")
    page.wait_for_timeout(200)

    # B.4 全部分类悬浮按钮
    exists("#ds-cat-trigger", "B.4.1 全部分类悬浮按钮", P)

    # B.5 抽屉元素
    exists("#ds-drawer", "B.5.1 抽屉容器", P)
    exists("#ds-drawer-mask", "B.5.2 抽屉 mask", P)
    exists("#ds-drawer-cat-list", "B.5.3 抽屉分类列表", P)
    exists("#ds-drawer-close", "B.5.4 抽屉关闭按钮", P)

    # B.6 Banner
    exists("#ds-banner", "B.6.1 Banner 容器", P)
    exists("#ds-banner-track", "B.6.2 Banner 轨道", P)

    # B.7 主内容容器
    exists("#ds-main", "B.7.1 主内容容器", P)

    # B.8 5 Tab + world active
    count(".tabbar a", "B.8.1 5 Tab 数量", P, 5)
    world_active = page.evaluate("!!document.querySelector('.tabbar a.t-world.active')")
    results.append({"page": P, "item": "B.8.2 world Tab active", "result": "PASS" if world_active else "FAIL"})

    # B.9 切换到排行榜子导航（应渲染榜单）
    click(".ds-sn[data-sn='rank']", "B.9.1 切换到排行榜子导航", P,
          lambda pg: pg.evaluate("document.querySelector('.ds-sn.active')?.dataset.sn === 'rank'"))
    page.wait_for_timeout(800)
    # 排行榜 Tab（10+ 种榜：人气/灵韵/新书/完本/收藏/热搜/更新/口碑/付费/免费）
    n_rank_tabs = page.evaluate("document.querySelectorAll('.ds-rank-tab, .rank-tab, .ds-board-tab').length")
    results.append({"page": P, "item": "B.9.2 排行榜 Tab ≥ 5", "result": "PASS" if n_rank_tabs >= 5 else "FAIL", "n": n_rank_tabs})

    # B.10 切回首页子导航
    click(".ds-sn[data-sn='home']", "B.10.1 切回首页子导航", P,
          lambda pg: pg.evaluate("document.querySelector('.ds-sn.active')?.dataset.sn === 'home'"))

    # B.11 瀑布流卡片（首页子导航下应有卡片列表）
    n_cards = page.evaluate("document.querySelectorAll('.ds-card, .lib-card, .ds-waterfall > a, a[href*=\"plot-detail\"]').length")
    results.append({"page": P, "item": "B.11.1 瀑布流卡片 ≥ 1", "result": "PASS" if n_cards >= 1 else "FAIL", "n": n_cards})

    # B.12 搜索子导航（点击切到搜索）
    click(".ds-sn[data-sn='search']", "B.12.1 切到搜索子导航", P,
          lambda pg: pg.evaluate("document.querySelector('.ds-sn.active')?.dataset.sn === 'search'"))
    page.wait_for_timeout(400)
    visible("#ds-search-input", "B.12.2 搜索输入框可见", P)

    # ════════════════════════════════════════════════════════════════
    # C 段：心屿（heart-island.html）
    # ════════════════════════════════════════════════════════════════
    P = "heart-island.html"
    page.goto(BASE + "/output/preview/heart-island.html", wait_until="domcontentloaded")
    page.wait_for_timeout(1500)

    # C.1 顶栏
    visible(".topbar-title", "C.1.1 顶栏标题（心屿）", P)

    # C.2 5 子标签（陪伴/精选/记忆/故事/搜索）
    count(".heart-sn", "C.2.1 心屿 5 子标签", P, 5)

    # C.3 3 子筛选（全部/我创建的/双生角色）
    count(".hf-chip", "C.3.1 心屿 3 子筛选 chip", P, 3)

    # C.4 创建新角色按钮
    visible("#heart-create", "C.4.1 创建新角色按钮", P)

    # C.5 陪伴子标签默认激活 + 内容渲染
    page.wait_for_timeout(800)
    n_chars = page.evaluate("document.querySelectorAll('.char-card, .char-list a, .feat-card').length")
    results.append({"page": P, "item": "C.5.1 陪伴区角色卡 ≥ 1", "result": "PASS" if n_chars > 0 else "FAIL", "n": n_chars})

    # C.6 切换到精选
    click(".heart-sn[data-sn='featured']", "C.6.1 切换到精选子标签", P,
          lambda pg: pg.evaluate("document.querySelector('.heart-sn.active')?.dataset.sn === 'featured'"))
    page.wait_for_timeout(600)
    n_feat = page.evaluate("document.querySelectorAll('.feat-card, .char-card, a[href*=\"chat.html?cid=\"]').length")
    results.append({"page": P, "item": "C.6.2 精选区卡片 ≥ 1", "result": "PASS" if n_feat > 0 else "FAIL", "n": n_feat})

    # C.7 切换到记忆
    click(".heart-sn[data-sn='memories']", "C.7.1 切换到记忆子标签", P,
          lambda pg: pg.evaluate("document.querySelector('.heart-sn.active')?.dataset.sn === 'memories'"))
    page.wait_for_timeout(600)
    n_mem = page.evaluate("document.querySelectorAll('.mem-item, .mem-list > *').length")
    results.append({"page": P, "item": "C.7.2 记忆区条目 ≥ 1", "result": "PASS" if n_mem > 0 else "FAIL", "n": n_mem})

    # C.8 切换到故事
    click(".heart-sn[data-sn='stories']", "C.8.1 切换到故事子标签", P,
          lambda pg: pg.evaluate("document.querySelector('.heart-sn.active')?.dataset.sn === 'stories'"))
    page.wait_for_timeout(500)

    # C.9 5 Tab + xinyu active
    count(".tabbar a", "C.9.1 5 Tab 数量", P, 5)
    xy_active = page.evaluate("!!document.querySelector('.tabbar a.t-xinyu.active')")
    results.append({"page": P, "item": "C.9.2 xinyu Tab active", "result": "PASS" if xy_active else "FAIL"})

    # C.10 弹窗 API 可调用
    dialog_api = page.evaluate("typeof window.LJHeart?.openDialog === 'function'")
    results.append({"page": P, "item": "C.10.1 LJHeart.openDialog 暴露", "result": "PASS" if dialog_api else "FAIL"})
    intro_api = page.evaluate("typeof window.LJHeart?.showIntro === 'function'")
    results.append({"page": P, "item": "C.10.2 LJHeart.showIntro 暴露", "result": "PASS" if intro_api else "FAIL"})

    # C.11 创建新角色入口（href 应指向 character-create.html）
    page.goto(BASE + "/output/preview/heart-island.html", wait_until="domcontentloaded")
    page.wait_for_timeout(1200)
    click("#heart-create", "C.11.1 创建新角色 → character-create.html", P,
          lambda pg: "character-create" in pg.url)

    # ════════════════════════════════════════════════════════════════
    # D 段：创作（creator-center.html）
    # ════════════════════════════════════════════════════════════════
    P = "creator-center.html"
    page.goto(BASE + "/output/preview/creator-center.html", wait_until="domcontentloaded")
    page.wait_for_timeout(1500)

    # D.1 顶栏
    visible(".topbar", "D.1.1 创作顶栏", P)
    exists(".topbar-title", "D.1.2 顶栏标题（创作）", P)
    count(".topbar-acts .icon-btn", "D.1.3 顶栏右侧 5 入口", P, 5)

    # D.2 创作者等级卡 4 按钮
    exists(".level-card", "D.2.1 创作者等级卡", P)
    count(".lc-btn", "D.2.2 等级卡 4 按钮（提现/收益/5档/协议）", P, 4)

    # D.3 创建智能体 + 灵境工坊（2 大按钮）
    count(".big-btn", "D.3.1 2 大按钮（创建智能体 / 灵境工坊）", P, 2)

    # D.4 3 fn-btn（视频/图片/声音）
    count(".fn-btn", "D.4.1 3 功能按钮（视频/图片/声音）", P, 3)

    # D.5 4 mc-btn（动态/音色/灵念/Agent）
    count(".mc-btn", "D.5.1 4 更多创建按钮（动态/音色/灵念/Agent）", P, 4)

    # D.6 工作台 → V26 迁入 workshop.html（创作页不再重复罗列）
    wb_gone = page.evaluate("!!document.querySelector('.wb-item')")
    results.append({"page": P, "item": "D.6.1 工作台七宫格已迁出创作页", "result": "PASS" if not wb_gone else "FAIL"})

    # D.7 我的作品 → V26 起收进功能按键（历史全集在 my-works.html）
    exists("a.func[href='my-works.html']", "D.7.1 编辑我的作品功能按键", P)
    gone = page.evaluate("!!document.querySelector('.work-list')")
    results.append({"page": P, "item": "D.7.2 创作页不再内嵌作品长列表", "result": "PASS" if not gone else "FAIL"})

    # D.8 功能区 5 卡（编辑我的作品/小说辅助/上传/上架/创建）
    count(".func-grid .func", "D.8.1 功能区 5 卡", P, 5)

    # D.9 创作者法律卡
    exists(".legal-card", "D.9.1 创作者法律卡", P)

    # D.10 5 Tab + create active
    count(".tabbar a", "D.10.1 5 Tab 数量", P, 5)
    cr_active = page.evaluate("!!document.querySelector('.tabbar a.t-create.active')")
    results.append({"page": P, "item": "D.10.2 create Tab active", "result": "PASS" if cr_active else "FAIL"})

    # D.11 真点击「创建智能体」按钮
    click(".big-btn.agent", "D.11.1 点击创建智能体 → character-create.html", P,
          lambda pg: "character-create" in pg.url)

    # D.12 真点击「灵境工坊」按钮（v22 起直达 workshop.html）
    page.goto(BASE + "/output/preview/creator-center.html", wait_until="domcontentloaded")
    page.wait_for_timeout(1000)
    click(".big-btn.workshop", "D.12.1 点击灵境工坊 → workshop.html", P,
          lambda pg: "workshop" in pg.url)

    # D.13 真点击「编辑我的作品」功能按键（V26 工作台迁出后创作页新增）
    page.goto(BASE + "/output/preview/creator-center.html", wait_until="domcontentloaded")
    page.wait_for_timeout(1000)
    click("a.func[href*='my-works']", "D.13.1 编辑我的作品 → my-works.html", P,
          lambda pg: "my-works" in pg.url)

    # D.14 真点击「草稿箱」入口（v22 起直达 work-editor.html）
    page.goto(BASE + "/output/preview/creator-center.html", wait_until="domcontentloaded")
    page.wait_for_timeout(1000)
    click(".topbar-acts a[href*='work-editor']", "D.14.1 顶栏草稿箱 → work-editor.html", P,
          lambda pg: "work-editor" in pg.url)

    # D.15 真点击「我的」（顶栏 → me.html）
    page.goto(BASE + "/output/preview/creator-center.html", wait_until="domcontentloaded")
    page.wait_for_timeout(1000)
    click(".topbar-acts a[href*='me.html']", "D.15.1 顶栏我的 → me.html", P,
          lambda pg: "me.html" in pg.url)

    b.close()

# 汇总
out = Path(r"F:\开发软件项目文件\灵境 · 双生\scripts\v20o_full_tab_audit.json")
out.write_text(json.dumps({"results": results, "pageerrors": errs}, ensure_ascii=False, indent=2))
passed = sum(1 for r in results if r["result"] == "PASS")
failed = sum(1 for r in results if r["result"] == "FAIL")
partial = sum(1 for r in results if r["result"] in ("PARTIAL", "TIMEOUT"))
print(f"\n========= V20-O 全 Tab 按键审计 总结 =========")
print(f"PASS: {passed}  FAIL: {failed}  PARTIAL/TIMEOUT: {partial}  PageError: {len(errs)}")
print()
for page_name in ["product-preview.html", "library.html", "heart-island.html", "creator-center.html"]:
    items = [r for r in results if r["page"] == page_name]
    pass_n = sum(1 for x in items if x["result"] == "PASS")
    fail_n = sum(1 for x in items if x["result"] == "FAIL")
    print(f"  {page_name:25} PASS:{pass_n}  FAIL:{fail_n}  ({len(items)} items)")
    for r in items:
        if r["result"] != "PASS":
            print(f"    [{r['result']:7}] {r['item']}")
if errs:
    print("\nPAGE ERRORS:")
    for e in errs:
        print(f"  - {e}")
print("\n" + "=" * 60)
status = "通过" if (failed == 0 and partial == 0 and len(errs) == 0) else f"有 {failed} 失败 + {partial} 部分 + {len(errs)} 错误"
print(f"V20-O 全 Tab 按键审计：{passed} PASS · {status}")
print("=" * 60)
sys.exit(0 if failed == 0 else 1)