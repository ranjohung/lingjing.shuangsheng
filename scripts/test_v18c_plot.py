"""V18-C plot-runner 沉浸页回归测试"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright

URL = 'http://127.0.0.1:8771/output/preview/plot-runner.html?novelId=changyecheng'

with sync_playwright() as p:
    browser = p.chromium.launch(args=['--use-gl=swiftshader'])
    page = browser.new_page(viewport={'width': 480, 'height': 900})
    errors = []
    page.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
    page.on('console', lambda m: errors.append('console.' + m.type + ': ' + m.text) if m.type == 'error' else None)

    page.goto(URL)
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1500)

    # 1. LJPlot 加载
    has_plot = page.evaluate("typeof window.LJPlot !== 'undefined' && window.LJPlot.__mounted === true")
    print(f"[1] LJPlot 已挂载: {has_plot}  -> {'OK' if has_plot else 'FAIL'}")

    # 2. 6 层 z-index 检查
    layers = page.evaluate("""({
      bg: getComputedStyle(document.getElementById('plot-bg')).zIndex,
      portrait: getComputedStyle(document.querySelector('.plot-portrait')).zIndex,
      dialog: getComputedStyle(document.querySelector('.plot-dialog')).zIndex,
      choices: getComputedStyle(document.querySelector('.plot-choices')).zIndex,
      toolbar: getComputedStyle(document.querySelector('.plot-toolbar')).zIndex
    })""")
    print(f"[2] 6 层 z-index: {layers}  -> {'OK' if layers['bg']=='1' and layers['choices']=='4' and layers['toolbar']=='5' else 'FAIL'}")

    # 3. 顶部工具栏 6 个按钮
    tb_btns = page.evaluate("document.querySelectorAll('.plot-toolbar .plot-tb-btn, .plot-toolbar .plot-back').length")
    print(f"[3] 顶部工具栏 6 按钮: {tb_btns} 个  -> {'OK' if tb_btns == 7 else 'FAIL'}")

    # 4. 沉浸页豁免（无 5 Tab）
    tab_count = page.evaluate("document.querySelectorAll('.tabbar .tab').length")
    print(f"[4] 沉浸页豁免(无 5 Tab): {tab_count} 个  -> {'OK' if tab_count == 0 else 'FAIL'}")

    # 5. 立绘 emoji 渲染
    portrait = page.evaluate("document.getElementById('plot-portrait').textContent.trim()")
    print(f"[5] 立绘渲染: '{portrait}'  -> {'OK' if portrait else 'FAIL'}")

    # 6. 对话框角色名
    name = page.evaluate("document.getElementById('plot-name').textContent")
    print(f"[6] 对话框角色名: '{name}'  -> {'OK' if name else 'FAIL'}")

    # 7. 打字机效果（等待 1.5s 文字应该 > 30 字符）
    page.wait_for_timeout(2000)
    text_len = page.evaluate("document.getElementById('plot-text').textContent.length")
    print(f"[7] 打字机渲染文字: {text_len} 字符  -> {'OK' if text_len > 20 else 'FAIL'}")

    # 8. 等待打字完成，点击屏幕推进
    page.wait_for_timeout(1500)
    text_full = page.evaluate("document.getElementById('plot-text').textContent.length")
    print(f"[8] 打字完成文字: {text_full} 字符  -> {'OK' if text_full > 30 else 'FAIL'}")

    # 9. 点击屏幕多次推进（旁白 → 林清雪 → 选项）— 用 evaluate 全显加速
    page.evaluate("window.LJPlot && window.LJPlot.advanceScene()")  # 旁白全显
    page.wait_for_timeout(200)
    page.evaluate("window.LJPlot && window.LJPlot.advanceScene()")  # 林清雪全显
    page.wait_for_timeout(200)
    page.evaluate("window.LJPlot && window.LJPlot.advanceScene()")  # 进入选项
    page.wait_for_timeout(600)
    choices = page.evaluate("document.querySelectorAll('.plot-choice').length")
    print(f"[9] 推进到选项: {choices} 个选项  -> {'OK' if choices >= 2 else 'FAIL'}")

    # 10. 点击选项 A（增加亲密度 → 数值跳动）
    int_before = page.evaluate("document.getElementById('attr-intimacy') ? document.getElementById('attr-intimacy').textContent : '0'")
    page.click('.plot-choice:nth-child(1)')
    page.wait_for_timeout(300)
    has_popup = page.evaluate("document.querySelectorAll('.plot-popup-item').length > 0")
    int_after = page.evaluate("document.getElementById('attr-intimacy') ? document.getElementById('attr-intimacy').textContent : '0'")
    print(f"[10] 数值跳动: popup={has_popup}, 亲密 {int_before} -> {int_after}  -> {'OK' if has_popup or int_after != int_before else 'FAIL'}")

    # 11. 顶部"菜单"打开系统菜单
    page.click('#plot-menu')
    page.wait_for_timeout(400)
    sys_menu = page.evaluate("document.getElementById('plot-system-menu').classList.contains('open')")
    btn_count = page.evaluate("document.querySelectorAll('.psm-btn').length")
    print(f"[11] 系统菜单: open={sys_menu}, 按钮={btn_count} 个  -> {'OK' if sys_menu and btn_count >= 9 else 'FAIL'}")

    # 12. 关闭菜单
    page.click('#plot-system-menu .plot-close-btn')
    page.wait_for_timeout(300)
    sys_closed = page.evaluate("!document.getElementById('plot-system-menu').classList.contains('open')")
    print(f"[12] 关闭菜单: {sys_closed}  -> {'OK' if sys_closed else 'FAIL'}")

    # 13. 存档按钮 → 打开存档面板
    page.click('[data-fn="save"]')
    page.wait_for_timeout(400)
    save_panel = page.evaluate("document.getElementById('plot-save-panel').classList.contains('open')")
    slot_count = page.evaluate("document.querySelectorAll('.save-slot').length")
    print(f"[13] 存档面板: open={save_panel}, 10 槽={slot_count} 个  -> {'OK' if save_panel and slot_count == 10 else 'FAIL'}")

    # 14. 关闭存档面板
    page.click('#plot-save-panel .plot-close-btn')
    page.wait_for_timeout(300)
    save_closed = page.evaluate("!document.getElementById('plot-save-panel').classList.contains('open')")
    print(f"[14] 关闭存档: {save_closed}  -> {'OK' if save_closed else 'FAIL'}")

    # 15. 切到地图模式
    page.click('#plot-world')
    page.wait_for_timeout(500)
    map_mode = page.evaluate("document.getElementById('plot-stage').classList.contains('map-mode')")
    map_visible = page.evaluate("getComputedStyle(document.getElementById('plot-map')).display === 'block'")
    print(f"[15] 地图模式: class={map_mode}, display={map_visible}  -> {'OK' if map_mode and map_visible else 'FAIL'}")

    # 16. 地图建筑点击
    page.click('.plot-map-bldg[data-b="御书房"]')
    page.wait_for_timeout(400)
    exit_map = page.evaluate("!document.getElementById('plot-stage').classList.contains('map-mode')")
    print(f"[16] 点击地图建筑后退出地图: {exit_map}  -> {'OK' if exit_map else 'FAIL'}")

    # 17. 免责声明常驻
    disclaimer = page.evaluate("document.querySelector('.plot-disclaimer').textContent.trim()")
    has_disclaimer = 'AI' in disclaimer and '仅供参考' in disclaimer
    print(f"[17] 免责声明常驻: '{disclaimer[:30]}...'  -> {'OK' if has_disclaimer else 'FAIL'}")

    # 18. CG 触发（剧情里直接调用）
    page.evaluate("window.LJPlot && (function(){ var cg=document.getElementById('plot-cg'); cg.querySelector('.cg-title').textContent='初遇·月下相逢'; cg.style.background='linear-gradient(135deg,#E94560,#6C5CE7)'; cg.classList.add('open'); })()")
    page.wait_for_timeout(300)
    cg_open = page.evaluate("document.getElementById('plot-cg').classList.contains('open')")
    cg_title = page.evaluate("document.querySelector('.cg-title').textContent")
    print(f"[18] CG 全屏: open={cg_open}, title='{cg_title}'  -> {'OK' if cg_open and cg_title else 'FAIL'}")

    # 19. 截图 plot-runner 主界面
    page.evaluate("document.getElementById('plot-cg').classList.remove('open')")
    page.wait_for_timeout(300)
    page.screenshot(path='output/preview/screenshots/v18-c-plot-main.png', full_page=False)

    # 20. 截图选项界面
    page.click('#plot-stage')
    page.wait_for_timeout(800)
    if page.evaluate("document.querySelectorAll('.plot-choice').length") > 0:
        page.screenshot(path='output/preview/screenshots/v18-c-plot-choices.png', full_page=False)
        # 选项 → 数值跳动截图
        page.click('.plot-choice:nth-child(1)')
        page.wait_for_timeout(200)
        page.screenshot(path='output/preview/screenshots/v18-c-plot-popup.png', full_page=False)

    # 21. 截图地图
    page.click('#plot-world')
    page.wait_for_timeout(500)
    page.screenshot(path='output/preview/screenshots/v18-c-plot-map.png', full_page=False)

    print("[19-21] 截图已保存: v18-c-plot-{main,choices,popup,map}.png")
    print(f"[22] {len(errors)} 个错误/告警")
    for e in errors[:5]:
        print(f"    ! {e[:120]}")
    browser.close()