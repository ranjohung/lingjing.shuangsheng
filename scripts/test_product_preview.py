"""product-preview.html 项目状态镜像完整性验证"""
import os
from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8771/product-preview.html"
SHOTS = "output/preview/screenshots"
os.makedirs(SHOTS, exist_ok=True)

with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader'])
    pg = b.new_page(viewport={'width': 480, 'height': 900})
    errs = []
    pg.on('pageerror', lambda e: errs.append('PAGEERROR:' + str(e)))
    pg.on('console', lambda m: errs.append('CONSOLE.' + m.type + ':' + m.text) if m.type == 'error' else None)

    pg.goto(URL)
    pg.wait_for_load_state('networkidle')
    pg.wait_for_timeout(2000)

    # 1. LJHome 挂载（动态填充状态栏/签到/快捷/推荐）
    has_home = pg.evaluate("typeof window.LJHome !== 'undefined'")
    print(f"[1] LJHome 挂载: {has_home}  -> {'OK' if has_home else 'FAIL'}")

    # 2. LJTabbar 挂载（5 Tab 全局状态管理）
    has_tab = pg.evaluate("typeof window.LJTabbar !== 'undefined'")
    print(f"[2] LJTabbar 挂载: {has_tab}  -> {'OK' if has_tab else 'FAIL'}")

    # 3. 品牌条
    brand = pg.evaluate("!!document.querySelector('.brand-bar')")
    print(f"[3] 品牌条存在: {brand}  -> {'OK' if brand else 'FAIL'}")

    # 4. 数据看板 3 张
    dash = pg.evaluate("document.querySelectorAll('.dash-card').length")
    print(f"[4] 数据看板: {dash} 张  -> {'OK' if dash == 3 else 'FAIL'}")

    # 5. 第一层状态栏（动态渲染）
    status = pg.evaluate("document.querySelectorAll('.home-status').length")
    print(f"[5] 第一层状态栏: {status} 个  -> {'OK' if status >= 1 else 'FAIL'}")

    # 6. 第二层签到卡片
    signin = pg.evaluate("document.querySelectorAll('.signin-card').length")
    print(f"[6] 第二层签到卡片: {signin} 个  -> {'OK' if signin >= 1 else 'FAIL'}")

    # 7. 第三层4快捷入口
    quick = pg.evaluate("document.querySelectorAll('.home-quick-item').length")
    print(f"[7] 第三层4快捷入口: {quick} 个  -> {'OK' if quick == 4 else 'FAIL'}")

    # 8. 第四层4推荐板块（今日推荐/陪伴动态/世界更新/热门活动）
    boards = pg.evaluate("document.querySelectorAll('.home-board').length")
    print(f"[8] 第四层4推荐板块: {boards} 个  -> {'OK' if boards == 4 else 'FAIL'}")

    # 9. 全部 img 引用
    img_count = pg.evaluate("document.querySelectorAll('img').length")
    print(f"[9] img 截图引用总数: {img_count} 张  -> {'OK' if img_count >= 14 else 'FAIL'}")

    # 10. 截图加载成功（无 404）
    broken = pg.evaluate("""(function(){
      var imgs = Array.from(document.querySelectorAll('img'));
      var bad = imgs.filter(function(i){ return !i.complete || i.naturalWidth === 0; });
      return bad.length;
    })()""")
    print(f"[10] 截图加载失败: {broken} 张  -> {'OK' if broken == 0 else 'FAIL'}")

    # 11. V17-A 5 Tab 演示截图
    has_v17a = pg.evaluate("Array.from(document.querySelectorAll('img')).some(function(i){return /v17-a-tabbar/.test(i.src)})")
    print(f"[11] V17-A 5 Tab 截图: {has_v17a}  -> {'OK' if has_v17a else 'FAIL'}")

    # 12. V17-B 世界 4 张截图
    v17b = pg.evaluate("Array.from(document.querySelectorAll('img')).filter(function(i){return /v17-b-world/.test(i.src)}).length")
    print(f"[12] V17-B 世界截图: {v17b} 张  -> {'OK' if v17b == 4 else 'FAIL'}")

    # 13. V18-A 首页 3 张截图
    v18a = pg.evaluate("Array.from(document.querySelectorAll('img')).filter(function(i){return /v18-a-home/.test(i.src)}).length")
    print(f"[13] V18-A 首页截图: {v18a} 张  -> {'OK' if v18a == 3 else 'FAIL'}")

    # 14. V18-B 心屿 2 张截图
    v18b = pg.evaluate("Array.from(document.querySelectorAll('img')).filter(function(i){return /v18-b-heart/.test(i.src)}).length")
    print(f"[14] V18-B 心屿截图: {v18b} 张  -> {'OK' if v18b == 2 else 'FAIL'}")

    # 15. V18-C plot-runner 4 张截图
    v18c = pg.evaluate("Array.from(document.querySelectorAll('img')).filter(function(i){return /v18-c-plot/.test(i.src)}).length")
    print(f"[15] V18-C plot截图: {v18c} 张  -> {'OK' if v18c == 4 else 'FAIL'}")

    # 16. V18-D 经济体系 3 张截图
    v18d = pg.evaluate("Array.from(document.querySelectorAll('img')).filter(function(i){return /v18-d-world/.test(i.src)}).length")
    print(f"[16] V18-D 经济截图: {v18d} 张  -> {'OK' if v18d == 3 else 'FAIL'}")

    # 17. V17-G 创作者分成 3 张截图
    v17g = pg.evaluate("Array.from(document.querySelectorAll('img')).filter(function(i){return /v17-g/.test(i.src)}).length")
    print(f"[17] V17-G 创作者截图: {v17g} 张  -> {'OK' if v17g >= 3 else 'FAIL'}")

    # 18. 5 档迷你阶梯（mock）
    ladder = pg.evaluate("document.querySelectorAll('.ml-card').length")
    print(f"[18] V17-G 5 档迷你阶梯: {ladder} 张  -> {'OK' if ladder == 5 else 'FAIL'}")

    # 19. 累计回归数据 8 张（7 工作包 + 合计）
    kvs = pg.evaluate("document.querySelectorAll('.kv').length")
    print(f"[19] 累计回归数据卡: {kvs} 张  -> {'OK' if kvs == 8 else 'FAIL'}")

    # 20. 文档链接（PRD/PLAN）
    doc_links = pg.evaluate("Array.from(document.querySelectorAll('a[href*=docs]')).length")
    print(f"[20] 文档链接: {doc_links} 个  -> {'OK' if doc_links >= 5 else 'FAIL'}")

    # 21. 第三方平台名 0 出现
    bad = pg.evaluate("(function(){var t=document.body.innerText; var words=['橙光','星野','B站','bilibili','BTS','HP','EXO','丸子','橙心推','橙子','鲜花','推荐官','每周最佳','创作比赛']; var hits=[]; words.forEach(function(w){if(t.indexOf(w)>=0)hits.push(w)}); return hits.join(',')})()")
    print(f"[21] 第三方平台名: '{bad}'  -> {'OK' if not bad else 'FAIL'}")

    # 22. 5 Tab 渲染
    tabs = pg.evaluate("document.querySelectorAll('.tabbar .tab').length")
    print(f"[22] 5 Tab 渲染: {tabs} 个  -> {'OK' if tabs == 5 else 'FAIL'}")

    # 截图顶部/中/底
    pg.screenshot(path=f'{SHOTS}/product-preview-top.png', full_page=False)
    pg.evaluate("window.scrollTo(0, document.body.scrollHeight / 3)")
    pg.wait_for_timeout(300)
    pg.screenshot(path=f'{SHOTS}/product-preview-mid.png', full_page=False)
    pg.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    pg.wait_for_timeout(300)
    pg.screenshot(path=f'{SHOTS}/product-preview-bottom.png', full_page=False)

    # 全页截图
    pg.evaluate("window.scrollTo(0, 0)")
    pg.wait_for_timeout(300)
    pg.screenshot(path=f'{SHOTS}/product-preview-full.png', full_page=True)

    print('---')
    if errs:
        real_errs = [e for e in errs if 'ERR_CONNECTION' not in e]
        if real_errs:
            print('ERRORS:', real_errs[:5])
        else:
            print('NO_REAL_ERRORS（仅外部资源超时）')
    else:
        print('NO_ERRORS')
    b.close()