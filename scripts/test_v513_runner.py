"""v5.13 沉浸剧情对话样式真机测试
测试目标：
1. 全屏背景图正确加载
2. 角色立绘（左/中/右布局）正常
3. 顶部菜单栏 7 个按钮
4. 名字条 + 正文 typewriter
5. ▼ 继续提示闪烁
6. 选项按钮（蓝绿色块，hover 高亮）
7. 数值面板（信任/亲密/声望）
8. 历史/存档/读档/设置 模态
9. 结局模态（限定/珍稀/稀有/普通 + 数值）
"""
import os, sys, time, json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(r"F:\开发软件项目文件\灵境 · 双生\output\preview")
OUT = ROOT / "screenshots" / "v513"
OUT.mkdir(parents=True, exist_ok=True)

# 5 个 demo novelId
NOVELS = [
    ("demo_palace",  "古言 · 锦绣未央", "palace_tang"),
    ("demo_study",   "悬疑 · 雾锁民国", "study_republic"),
    ("demo_forest",  "奇幻 · 月森林",   "elf_forest"),
    ("demo_starship","科幻 · 银河纪元", "starship_bridge"),
    ("demo_campus",  "校园 · 春风不及", "classroom_sunny"),
]

results = []

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(args=['--no-sandbox', '--disable-gpu', '--use-gl=swiftshader'])
        ctx = browser.new_context(viewport={"width": 1280, "height": 800})
        page = ctx.new_page()

        # 收集 console
        errors = []
        page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type in ("error", "warning") else None)
        page.on("pageerror", lambda exc: errors.append(f"[pageerror] {exc}"))

        # 1. 空态（无 novelId）
        page.goto(f"file://{ROOT / 'plot-runner.html'}")
        page.wait_for_load_state("networkidle", timeout=8000)
        time.sleep(0.5)
        page.screenshot(path=str(OUT / "01-empty-state.png"))
        print("✓ 01-empty-state.png")

        # 2. 5 个 demo 进入游戏
        for i, (nid, label, scene) in enumerate(NOVELS):
            page.goto(f"file://{ROOT / 'plot-runner.html'}?novelId={nid}")
            page.wait_for_load_state("networkidle", timeout=10000)
            # 等待 plot-scene / chars / dlg fade-in 动画 + 图片加载
            page.wait_for_function("() => { const e=document.getElementById('plot-scene'); return e && e.style.backgroundImage; }", timeout=5000)
            time.sleep(2.0)

            # 截图：开场（等 typewriter 进行中）
            page.screenshot(path=str(OUT / f"02-{i+1}-{nid}-start.png"))
            print(f"✓ 02-{i+1}-{nid}-start.png")

            # 等文字完全显示（点对话框）
            page.click("#plot-dlg")
            time.sleep(1.0)
            page.screenshot(path=str(OUT / f"03-{i+1}-{nid}-textshown.png"))
            print(f"✓ 03-{i+1}-{nid}-textshown.png")

            # 点击选项 1（如果存在）
            opt = page.query_selector(".opt-btn")
            if opt:
                # hover 效果
                opt.hover()
                time.sleep(0.3)
                page.screenshot(path=str(OUT / f"04-{i+1}-{nid}-option-hover.png"))
                print(f"✓ 04-{i+1}-{nid}-option-hover.png")
                opt.click()
                time.sleep(1.5)
                page.screenshot(path=str(OUT / f"05-{i+1}-{nid}-after-pick.png"))
                print(f"✓ 05-{i+1}-{nid}-after-pick.png")

            # 测历史 modal
            hist_btn = page.query_selector("#tb-history")
            if hist_btn:
                hist_btn.click()
                time.sleep(0.5)
                page.screenshot(path=str(OUT / f"06-{i+1}-{nid}-history.png"))
                print(f"✓ 06-{i+1}-{nid}-history.png")
                page.click(".modal-close")
                time.sleep(0.3)

            # 测设置 modal
            set_btn = page.query_selector("#tb-settings")
            if set_btn:
                set_btn.click()
                time.sleep(0.5)
                page.screenshot(path=str(OUT / f"07-{i+1}-{nid}-settings.png"))
                print(f"✓ 07-{i+1}-{nid}-settings.png")
                page.click(".modal-close")
                time.sleep(0.3)

            # 测存档 modal
            save_btn = page.query_selector("#tb-save")
            if save_btn:
                save_btn.click()
                time.sleep(0.5)
                page.screenshot(path=str(OUT / f"08-{i+1}-{nid}-save.png"))
                print(f"✓ 08-{i+1}-{nid}-save.png")
                page.click(".modal-close")
                time.sleep(0.3)

        # 3. 快速跑完一个 demo 看结局
        page.goto(f"file://{ROOT / 'plot-runner.html'}?novelId=demo_palace")
        page.wait_for_load_state("networkidle", timeout=10000)
        page.wait_for_function("() => { const e=document.getElementById('plot-scene'); return e && e.style.backgroundImage; }", timeout=5000)
        time.sleep(1.0)
        # 把文字速度调到最快
        page.click("#tb-settings")
        time.sleep(0.4)
        page.evaluate("""() => {
          const slider = document.getElementById('set-speed');
          slider.value = 10;
          slider.dispatchEvent(new Event('input'));
        }""")
        time.sleep(0.4)
        page.click(".modal-close")
        time.sleep(0.3)

        # 依次点完（每步都处理结局弹出）
        for step in range(12):
            end = page.query_selector("#plot-end-modal")
            if end:
                page.screenshot(path=str(OUT / "10-palace-ending-modal.png"))
                print("✓ 10-palace-ending-modal.png")
                break
            # 跳过 typewriter
            page.evaluate("""() => { if (window.PlotEngine) window.PlotEngine.finishTypewriter(); }""")
            time.sleep(0.3)
            # 选第一个选项（如果没有就跳过）
            opt = page.query_selector(".opt-btn")
            if opt:
                opt.click()
                time.sleep(0.6)
            else:
                # 没选项，点对话框推进
                try:
                    page.click("#plot-dlg", timeout=2000)
                except Exception:
                    pass
                time.sleep(0.5)
            if step == 6:
                page.screenshot(path=str(OUT / "09-palace-flow-mid.png"))
                print("✓ 09-palace-flow-mid.png")

        # 4. 移动端视图
        mobile_ctx = browser.new_context(viewport={"width": 390, "height": 844})
        mobile_page = mobile_ctx.new_page()
        mobile_page.goto(f"file://{ROOT / 'plot-runner.html'}?novelId=demo_palace")
        mobile_page.wait_for_load_state("networkidle", timeout=10000)
        mobile_page.wait_for_function("() => { const e=document.getElementById('plot-scene'); return e && e.style.backgroundImage; }", timeout=5000)
        time.sleep(2.0)
        mobile_page.screenshot(path=str(OUT / "11-mobile-palace.png"))
        print("✓ 11-mobile-palace.png")

        # mobile 选项展开
        mobile_page.evaluate("() => { if (window.PlotEngine) window.PlotEngine.finishTypewriter(); }")
        time.sleep(1.0)
        mobile_page.screenshot(path=str(OUT / "12-mobile-options.png"))
        print("✓ 12-mobile-options.png")

        # 5. 横屏视图（移动设备横屏）
        land_ctx = browser.new_context(viewport={"width": 812, "height": 375})
        land_page = land_ctx.new_page()
        land_page.goto(f"file://{ROOT / 'plot-runner.html'}?novelId=demo_forest")
        land_page.wait_for_load_state("networkidle", timeout=10000)
        land_page.wait_for_function("() => { const e=document.getElementById('plot-scene'); return e && e.style.backgroundImage; }", timeout=5000)
        time.sleep(2.0)
        land_page.screenshot(path=str(OUT / "13-landscape-forest.png"))
        print("✓ 13-landscape-forest.png")

        browser.close()

        # 检查错误
        if errors:
            print(f"\n⚠ Console errors: {len(errors)}")
            for e in errors[:20]:
                print(f"  {e}")
        else:
            print("\n✅ No console errors")

        # 列出所有截图
        pngs = sorted(OUT.glob("*.png"))
        print(f"\n📁 {len(pngs)} 张截图：")
        for p in pngs:
            size = p.stat().st_size
            print(f"  - {p.name} ({size // 1024} KB)")

if __name__ == "__main__":
    main()