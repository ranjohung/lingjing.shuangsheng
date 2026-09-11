"""V20-C · 启动页 + 注册登录 + 新手引导 流程回归测试
验证 splash 出现 → 自动隐藏 → 登录页 → 必勾协议 → 引导 4 步 → 主页揭示
"""
import os
import sys
from pathlib import Path

PROJECT_ROOT = Path("F:/开发软件项目文件/灵境 · 双生")
URL = "http://localhost:8767/product-preview.html"
SCREENSHOT_DIR = PROJECT_ROOT / "output/preview/screenshots"
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

sys.path.insert(0, str(PROJECT_ROOT / "scripts"))
from playwright.sync_api import sync_playwright

results = []

def check(name, ok, detail=""):
    status = "✓" if ok else "✗"
    line = f"[{status}] {name}"
    if detail:
        line += f" · {detail}"
    print(line)
    results.append((name, ok, detail))

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-gpu"])
    ctx = browser.new_context(viewport={"width": 390, "height": 844})
    # 重要：先清空 onboarding localStorage，模拟新用户
    page = ctx.new_page()
    page.goto(URL, wait_until="domcontentloaded")
    page.evaluate("""
        localStorage.removeItem('lingjing_onboarding_done');
        localStorage.removeItem('lingjing_user_profile');
        localStorage.removeItem('lingjing_account_kind');
    """)
    page.reload(wait_until="domcontentloaded")
    page.wait_for_timeout(500)

    # ====== Splash ======
    splash_visible = page.is_visible("#splash-overlay")
    check("splash 出现", splash_visible)

    splash_title = page.text_content(".splash-title")
    check("splash 标题", "灵境" in (splash_title or ""), f"got={splash_title!r}")

    splash_bar_pct = page.text_content("#splash-percent")
    check("splash 进度", splash_bar_pct is not None, f"initial={splash_bar_pct!r}")

    page.screenshot(path=str(SCREENSHOT_DIR / "v20-c-splash.png"), full_page=False)

    # ====== 等待 splash 自动隐藏（3s + 400ms transition）======
    page.wait_for_timeout(3600)
    splash_hidden = page.is_hidden("#splash-overlay")
    check("splash 自动隐藏（3s 后）", splash_hidden)

    login_visible = page.is_visible("#login-overlay")
    check("登录页出现", login_visible)

    page.screenshot(path=str(SCREENSHOT_DIR / "v20-c-login.png"), full_page=False)

    # ====== 登录验证：未勾协议应被拦截 ======
    page.click("#login-submit")
    page.wait_for_timeout(500)
    login_still = page.is_visible("#login-overlay")
    check("未勾协议 → 登录拦截", login_still)

    # ====== 勾 3 个协议 ======
    page.click('.login-check[data-agree="1"]')
    page.click('.login-check[data-agree="2"]')
    page.click('.login-check[data-agree="3"]')
    page.wait_for_timeout(200)

    agree_checked = page.evaluate("""
        document.querySelectorAll('.login-check-box.checked').length
    """)
    check("3 个协议全部勾选", agree_checked == 3, f"count={agree_checked}")

    # ====== 走访客模式登录（最简单）======
    page.click('.login-method[data-method="guest"]')
    page.wait_for_timeout(500)

    login_hidden = page.is_hidden("#login-overlay")
    onb_visible = page.is_visible("#onb-overlay")
    check("访客登录成功 → 进入引导", login_hidden and onb_visible)

    # ====== 引导步骤 1：称呼 ======
    step1_title = page.text_content(".onb-step-title")
    check("步骤 1 标题", "称呼" in (step1_title or ""), f"got={step1_title!r}")

    next_disabled = page.is_disabled("#onb-next")
    check("空输入 → 下一步禁用", next_disabled)

    page.fill("#onb-input", "小雅")
    page.wait_for_timeout(200)
    next_enabled = page.is_enabled("#onb-next")
    check("输入称呼 → 下一步启用", next_enabled)

    page.screenshot(path=str(SCREENSHOT_DIR / "v20-c-onb-step1.png"), full_page=False)

    page.click("#onb-next")
    page.wait_for_timeout(400)

    # ====== 步骤 2：性别 ======
    step2_title = page.text_content(".onb-step-title")
    check("步骤 2 标题", "性别" in (step2_title or ""), f"got={step2_title!r}")

    page.click('.onb-option[data-v="female"]')
    page.wait_for_timeout(300)
    female_selected = page.is_visible('.onb-option.selected[data-v="female"]')
    check("选项高亮", female_selected)

    page.screenshot(path=str(SCREENSHOT_DIR / "v20-c-onb-step2.png"), full_page=False)

    page.click("#onb-next")
    page.wait_for_timeout(400)

    # ====== 步骤 3：年龄段 ======
    step3_title = page.text_content(".onb-step-title")
    check("步骤 3 标题", "年龄" in (step3_title or ""), f"got={step3_title!r}")

    page.click('.onb-option[data-v="25-34"]')
    page.wait_for_timeout(300)
    page.click("#onb-next")
    page.wait_for_timeout(400)

    # ====== 步骤 4：陪伴类型 ======
    step4_title = page.text_content(".onb-step-title")
    check("步骤 4 标题", "陪伴" in (step4_title or ""), f"got={step4_title!r}")

    page.click('.onb-option[data-v="warm"]')
    page.wait_for_timeout(300)

    next_btn_text = page.text_content("#onb-next")
    check("步骤 4 按钮变「开始体验」", "开始体验" in (next_btn_text or ""), f"got={next_btn_text!r}")

    page.screenshot(path=str(SCREENSHOT_DIR / "v20-c-onb-step4.png"), full_page=False)

    page.click("#onb-next")
    page.wait_for_timeout(500)

    # ====== 揭示主页 ======
    app_visible = page.is_visible("#app")
    onb_hidden = page.is_hidden("#onb-overlay")
    check("完成引导 → 揭示主页", app_visible and onb_hidden)

    # ====== 验证 localStorage 持久化 ======
    profile = page.evaluate("localStorage.getItem('lingjing_user_profile')")
    onb_done = page.evaluate("localStorage.getItem('lingjing_onboarding_done')")
    kind = page.evaluate("localStorage.getItem('lingjing_account_kind')")

    import json
    profile_obj = json.loads(profile) if profile else {}
    check("localStorage 写入 profile", profile_obj.get("name") == "小雅" and profile_obj.get("gender") == "female" and profile_obj.get("ageRange") == "25-34" and profile_obj.get("companionType") == "warm", f"got={profile!r}")
    check("localStorage 写入 onb_done", onb_done == "true", f"got={onb_done!r}")
    check("localStorage 写入 kind=guest", kind == "guest", f"got={kind!r}")

    page.screenshot(path=str(SCREENSHOT_DIR / "v20-c-home-after-onb.png"), full_page=False)

    # ====== 二次访问：应直接进主页 ======
    page2 = ctx.new_page()
    page2.goto(URL, wait_until="domcontentloaded")
    page2.wait_for_timeout(500)
    splash_hidden_v2 = page2.is_hidden("#splash-overlay")
    app_visible_v2 = page2.is_visible("#app")
    check("二次访问 → 直接进主页", splash_hidden_v2 and app_visible_v2)

    # ====== 关键校验：v20.1 铁律 #14 还在（无开发元数据）======
    visible_text = page2.locator("#app").text_content() or ""
    bad_keywords = ["155/155", "产品状态镜像", "SYNTAX_OK", "Git:", "tabbar.js", "核心铁律", "§2.", "数据看板"]
    leaked = [k for k in bad_keywords if k in visible_text]
    check("铁律 #14：0 开发元数据外露（#app 可见文本）", len(leaked) == 0, f"leaked={leaked}")

    browser.close()

passed = sum(1 for _, ok, _ in results if ok)
total = len(results)
print(f"\n{'='*50}\nV20-C 回归: {passed}/{total} PASS\n{'='*50}")

if passed == total:
    sys.exit(0)
else:
    print("\n失败的项：")
    for name, ok, detail in results:
        if not ok:
            print(f"  - {name}: {detail}")
    sys.exit(1)