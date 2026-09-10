"""v5.16 UX 测试：移除 fx 预览 + 弹窗 + 返回箭头 + 独立页面"""
from playwright.sync_api import sync_playwright
import os, sys, time

ROOT = "F:/开发软件项目文件/灵境 · 双生"
OUT = f"{ROOT}/output/preview/screenshots/v516"
os.makedirs(OUT, exist_ok=True)

errors = []
console_logs = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    page = ctx.new_page()
    page.on("console", lambda m: (console_logs.append((m.type, m.text)), m.type == "error" and errors.append(f"console.{m.type}: {m.text}")))
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))

    # === 1. 进入 plot-runner，验证选项上无 fx 标签 ===
    print("=== 1. plot-runner 选项 fx 验证 ===")
    page.goto(f"file://{ROOT}/output/preview/plot-runner.html?novelId=demo_palace", wait_until="domcontentloaded", timeout=15000)
    page.wait_for_timeout(3500)
    # 先看 console
    msgs = []
    page.on("console", lambda m: msgs.append(f"[{m.type}] {m.text}"))
    page.on("pageerror", lambda e: msgs.append(f"[pageerror] {e}"))
    # 强制把文本速度调到最快
    page.evaluate("""() => {
      try {
        const opts = JSON.parse(localStorage.getItem('plotrunner.opts') || '{}');
        opts.textSpeed = 10;
        opts.skipMode = true;
        localStorage.setItem('plotrunner.opts', JSON.stringify(opts));
      } catch {}
    }""")
    page.reload(wait_until="domcontentloaded")
    page.wait_for_timeout(3500)
    page.screenshot(path=f"{OUT}/01-runner-start.png")
    print("  console msgs:")
    for m in msgs[:15]:
        print(f"    {m}")

    # 调试：检查 plot 数据
    state_info = page.evaluate("""() => {
      const root = document.getElementById('runner-root');
      const dlgText = document.getElementById('dlg-text')?.innerText || '';
      const optBtns = document.querySelectorAll('.opt-btn');
      const optsContainer = document.getElementById('dlg-options');
      return {
        rootExists: !!root,
        rootChildren: root?.children?.length,
        dlgExists: !!document.getElementById('dlg'),
        dlgText: dlgText.substring(0, 80),
        optBtnCount: optBtns.length,
        optsChildren: optsContainer?.children?.length,
        optsStyleDisplay: optsContainer ? getComputedStyle(optsContainer).display : 'n/a'
      };
    }""")
    print(f"  state: {state_info}")

    # 等文字打完 + 选项出现
    page.wait_for_selector(".opt-btn", timeout=15000)
    page.wait_for_timeout(800)
    page.screenshot(path=f"{OUT}/02-runner-options.png")
    # 检查选项按钮上没有 fx-tag / fx-trust / fx-int / fx-rep 元素
    fx_count = page.evaluate("""() => {
      const opts = document.querySelectorAll('.opt-btn');
      let cnt = 0;
      opts.forEach(o => {
        if (o.querySelector('.fx-tag, .fx-tags, [class*="fx-"]')) cnt++;
      });
      return cnt;
    }""")
    print(f"  选项按钮上残留 fx 元素数: {fx_count}（应为 0）")

    # === 2. 点击一个选项，验证弹窗出现 ===
    print("=== 2. 选项 fx 弹窗验证 ===")
    # 找第一个选项（第一个有 data-idx=0）
    page.evaluate("() => document.querySelector('.opt-btn[data-idx=\"0\"]')?.click()")
    page.wait_for_timeout(700)
    # 检查 .plot-fx-toast 是否出现
    toast_visible = page.evaluate("() => !!document.querySelector('.plot-fx-toast.show')")
    print(f"  fx 弹窗显示: {toast_visible}")
    if toast_visible:
        page.screenshot(path=f"{OUT}/03-runner-fx-toast.png")
        # 弹窗内容
        rows = page.evaluate("""() => Array.from(document.querySelectorAll('.fx-row')).map(r => r.textContent.replace(/\\s+/g,' ').trim())""")
        for r in rows:
            print(f"    → {r}")

    # 关闭弹窗
    page.evaluate("() => document.querySelector('.fx-toast-close')?.click()")
    page.wait_for_timeout(500)

    # === 3. 验证返回箭头 ===
    print("=== 3. 返回箭头验证 ===")
    back_exists = page.evaluate("() => !!document.getElementById('plot-back-arrow')")
    back_text = page.evaluate("() => document.getElementById('plot-back-arrow')?.innerText")
    print(f"  退出游戏按钮存在: {back_exists}，文字: {back_text}")

    # === 4. 验证顶栏设置按钮跳转独立页面 ===
    print("=== 4. 顶栏跳转独立页验证 ===")
    page.click("#tb-settings")
    page.wait_for_load_state("domcontentloaded", timeout=10000)
    page.wait_for_timeout(800)
    settings_url = page.url
    print(f"  设置跳转 URL: {settings_url}")
    assert "plot-settings.html" in settings_url, f"应该跳到 plot-settings.html，实际 {settings_url}"
    page.screenshot(path=f"{OUT}/04-settings-page.png")

    # === 5. plot-settings 内部验证（speed slider 等）===
    print("=== 5. 设置页 UI 验证 ===")
    speed_val = page.evaluate("() => document.getElementById('set-speed-val')?.textContent")
    print(f"  当前速度: {speed_val}")
    # 调速度
    page.evaluate("""() => {
      const s = document.getElementById('set-speed');
      s.value = 20;
      s.dispatchEvent(new Event('input'));
    }""")
    page.wait_for_timeout(300)
    new_speed = page.evaluate("() => document.getElementById('set-speed-val')?.textContent")
    print(f"  调整后: {new_speed}")
    page.screenshot(path=f"{OUT}/05-settings-speed-changed.png")
    # 返回
    page.click("#saveBtn")
    page.wait_for_load_state("domcontentloaded", timeout=10000)
    page.wait_for_timeout(800)
    back_url = page.url
    print(f"  返回游戏 URL: {back_url}")

    # === 6. 历史独立页 ===
    print("=== 6. 历史独立页验证 ===")
    page.click("#tb-history")
    page.wait_for_load_state("domcontentloaded", timeout=10000)
    page.wait_for_timeout(800)
    hist_url = page.url
    print(f"  历史跳转 URL: {hist_url}")
    assert "plot-history.html" in hist_url
    page.screenshot(path=f"{OUT}/06-history-page.png")
    page.click("#backArrow")
    page.wait_for_timeout(500)

    # === 7. 存档独立页 ===
    print("=== 7. 存档独立页验证 ===")
    page.click("#tb-save")
    page.wait_for_load_state("domcontentloaded", timeout=10000)
    page.wait_for_timeout(800)
    save_url = page.url
    print(f"  存档跳转 URL: {save_url}")
    assert "plot-save.html" in save_url
    page.screenshot(path=f"{OUT}/07-save-page.png")
    page.click("#backArrow")
    page.wait_for_timeout(500)

    # === 8. scene-select 独立页 ===
    print("=== 8. 场景选择独立页验证 ===")
    page.goto(f"file://{ROOT}/output/preview/scene-select.html", wait_until="domcontentloaded", timeout=10000)
    page.wait_for_timeout(1000)
    page.screenshot(path=f"{OUT}/08-scene-select.png")
    card_count = page.evaluate("() => document.querySelectorAll('.card').length")
    print(f"  场景卡片数: {card_count}（应为 9）")

    # === 9. game-3d 验证返回箭头 ===
    print("=== 9. game-3d 验证 ===")
    page.goto(f"file://{ROOT}/output/preview/game-3d.html", wait_until="domcontentloaded", timeout=15000)
    page.wait_for_timeout(2500)
    back_g3d = page.evaluate("() => !!document.querySelector('.back-arrow')")
    back_g3d_text = page.evaluate("() => document.querySelector('.back-arrow')?.innerText")
    print(f"  game-3d 退出按钮: {back_g3d}, 文字: {back_g3d_text}")
    page.screenshot(path=f"{OUT}/09-game3d-back-arrow.png")

    # === 10. 移动端测试 ===
    print("=== 10. 移动端测试 ===")
    mobile = browser.new_context(viewport={"width": 390, "height": 844})
    mp = mobile.new_page()
    mp.goto(f"file://{ROOT}/output/preview/plot-runner.html?novelId=demo_palace", wait_until="domcontentloaded")
    mp.wait_for_timeout(2500)
    mp.wait_for_selector(".opt-btn", timeout=10000)
    mp.wait_for_timeout(600)
    mp.screenshot(path=f"{OUT}/10-mobile-runner.png")
    # 点击选项
    mp.evaluate("() => document.querySelector('.opt-btn[data-idx=\"0\"]')?.click()")
    mp.wait_for_timeout(700)
    mp.screenshot(path=f"{OUT}/11-mobile-fx-toast.png")

    browser.close()

print("\n=== 测试结果 ===")
if errors:
    print(f"⚠ {len(errors)} 错误:")
    for e in errors[:10]:
        print(f"  - {e}")
else:
    print("✅ 0 console error")

# 显示 console log
if console_logs:
    print(f"\n=== 全部 console 输出 ({len(console_logs)}) ===")
    for t, msg in console_logs[-10:]:
        print(f"  [{t}] {msg[:120]}")