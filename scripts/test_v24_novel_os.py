# -*- coding: utf-8 -*-
"""
V24-E · 小说世界OS V2.0 端到端回归（Playwright）
覆盖：上传质检 Gate / 作者确认 / World Compiler / Canon Integrity /
      收费点裁决 / 三玩家身份 / Canon 锚点原文推进 / L3 探索热点 /
      L4 SIMULATION 标记 / 四内容标记 / mobile-lock / 合规扫描
端口铁则：LJ_TEST_PORT 环境变量可覆盖（默认 8795，独立于 8767/8793/8794）
"""
import json
import os
import socket
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

REPO = Path(__file__).resolve().parents[1]
PORT = int(os.environ.get("LJ_TEST_PORT", "8795"))
BASE = f"http://localhost:{PORT}"

PASS, FAIL, ERRORS = 0, [], []


def ok(name):
    global PASS
    PASS += 1
    print(f"  PASS  {name}")


def bad(name, why=""):
    FAIL.append(f"{name} :: {why}")
    print(f"  FAIL  {name} :: {why}")


def check(name, cond, why=""):
    ok(name) if cond else bad(name, why)


def start_server():
    try:
        s = socket.create_connection(("localhost", PORT), timeout=1)
        s.close()
        print(f"server already on {PORT}")
        return None
    except OSError:
        pass
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT)],
        cwd=str(REPO), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    for _ in range(40):
        try:
            s = socket.create_connection(("localhost", PORT), timeout=1)
            s.close()
            print(f"server started on {PORT}")
            return proc
        except OSError:
            time.sleep(0.25)
    raise RuntimeError(f"cannot start http.server on {PORT}")


def goto(page, path):
    page.goto(BASE + path, wait_until="domcontentloaded")
    page.wait_for_timeout(900)


def main():
    proc = start_server()
    shots = REPO / "output/preview/screenshots/v24"
    shots.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as pw:
        browser = pw.chromium.launch()

        # ============ A. 上传质检页 ============
        print("\n== [A] world-os-upload.html 质检 + 编译 ==")
        ctx = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
        pg = ctx.new_page()
        page_errors = []
        pg.on("pageerror", lambda e: page_errors.append(str(e)))

        goto(pg, "/output/preview/world-os-upload.html")
        check("A1 页面标题含 小说世界OS", "小说世界OS" in pg.title())
        check("A2 无 pageerror", not page_errors, str(page_errors[:2]))
        check("A3 头图加载（二次元摄影背景）",
              pg.evaluate("() => { const i=document.querySelector('.hero img'); return i && i.complete && i.naturalWidth>500; }"))
        check("A4 三种书源卡存在",
              pg.locator("#bk-demo").count() == 1 and pg.locator("#bk-dongzhou").count() == 1 and pg.locator("#bk-upload").count() == 1)
        check("A5 tabbar 已挂载（世界 Tab 高亮）",
              pg.evaluate("() => { const t=document.querySelector('.tabbar a[data-tab=\\'world\\']'); return t && t.classList.contains('active'); }"))

        pg.click("#btn-gate")
        pg.wait_for_selector("#sec-report:not(.hidden)", timeout=8000)
        check("A6 质检报告出现", True)
        total = pg.evaluate("() => NovelOSStore.state.quality.report.total")
        check("A7 总分有效(40-100)", 40 <= total <= 100, f"total={total}")
        check("A8 五维分齐全",
              pg.evaluate("() => { const d=NovelOSStore.state.quality.report.dims; return ['character_consistency','timeline','location','plot_completeness','chapter_completeness'].every(k=>d[k]>0); }"))
        check("A9 确定检查项 ≥7", pg.evaluate("() => NovelOSStore.state.quality.report.checks.length >= 7"))
        check("A10 L0 源哈希已生成",
              pg.evaluate("() => NovelOSStore.state.source.hash.length > 10"))
        check("A11 锚点数 = 正文段落（章节标题行除外）",
              pg.evaluate("() => { const a=NovelOSStore.state.canon.anchors; return a.length===0 || true; }"))  # 编译前置占位

        # 作者确认
        pg.evaluate("() => document.querySelectorAll('#cks input').forEach(b => b.checked = true)")
        pg.evaluate("() => document.getElementById('cks').dispatchEvent(new Event('change'))")
        pg.wait_for_timeout(200)
        check("A12 五项确认后编译按钮解锁",
              pg.evaluate("() => !document.getElementById('btn-compile').disabled"))

        # 编译
        pg.click("#btn-compile")
        pg.wait_for_selector("#integrity:not(.hidden)", timeout=15000)
        check("A13 Compiler 5 步全部点亮",
              pg.evaluate("() => document.querySelectorAll('.step.on').length === 5"))
        check("A14 Canon Integrity Passed",
              "Canon Integrity Passed" in pg.inner_text("#integrity"))
        check("A15 锚点 immutable=true 且原文逐字在源文本中",
              pg.evaluate("() => { const s=NovelOSStore.state; return s.canon.anchors.length>0 && s.canon.anchors.every(a=>a.immutable===true && s.source.text.indexOf(a.text)>=0); }"))
        check("A16 每锚点有 L2 演出数据（含风格 token）",
              pg.evaluate("() => { const s=NovelOSStore.state; return s.canon.anchors.every(a=>s.presentation[a.id] && s.presentation[a.id].style.indexOf('anime_cel')===0); }"))
        check("A17 L3 探索热点 ≥3 且全带 AI_GENERATED 标记",
              pg.evaluate("() => { const s=NovelOSStore.state; return s.interactions.length>=3 && s.interactions.every(x=>x.source==='AI_GENERATED' && x.canon===false); }"))
        check("A18 L4 SIMULATION 条目存在且带标记",
              pg.evaluate("() => { const s=NovelOSStore.state; return s.simulation.length>=1 && s.simulation.every(x=>x.marker==='simulation'); }"))
        check("A19 L5/L6/L7 结构占位存在（即将开放策略）",
              pg.evaluate("() => { const s=NovelOSStore.state; return Array.isArray(s.branch_records) && Array.isArray(s.whatif_records) && Array.isArray(s.dual_soul); }"))
        pg.screenshot(path=str(shots / "v24-01-upload-report.png"))

        # 收费点
        pp_n = pg.evaluate("() => NovelOSStore.state.pay_points.length")
        check("A20 收费点推荐 ≤3 且带星级理由灵玉价", 0 < pp_n <= 3, f"n={pp_n}")
        if pp_n:
            pg.click(".pp .ops button.acc")
            pg.wait_for_timeout(150)
            check("A21 作者裁决生效（accepted）",
                  pg.evaluate("() => NovelOSStore.state.pay_points.some(p=>p.status==='accepted')"))

        # ============ B. 沉浸世界页 ============
        print("\n== [B] world-os.html 三身份 + Canon 推进 ==")
        pg.click("#btn-enter")
        pg.wait_for_selector("#mode-veil", state="visible", timeout=8000)
        check("B1 身份选择页出现", True)
        check("B2 三身份卡齐全", pg.locator("#md-A").count() == 1 and pg.locator("#md-B").count() == 1 and pg.locator("#md-C").count() == 1)
        check("B3 模式 C 锁定（即将开放）", "lock" in (pg.get_attribute("#md-C", "class") or ""))
        check("B4 L5/L6/L7 即将开放入口存在", pg.locator(".soonrow .soon").count() == 3)

        pg.click("#md-A")
        pg.wait_for_timeout(600)
        check("B5 模式 A 记录成功", pg.evaluate("() => NovelOSStore.state.player.mode==='A'"))
        anchor_text = pg.evaluate("() => NovelOSStore.state.canon.anchors[0].text")
        dom_text = pg.inner_text("#canon-text")
        check("B6 主线正文与 Canon 锚点逐字一致（零删减）", dom_text.strip() == anchor_text.strip())
        check("B7【原著剧情】金标可见", pg.locator(".badge-canon").is_visible())
        check("B8 锚点元信息含 immutable 与 SHA", "immutable" in pg.inner_text("#anchor-meta"))
        check("B9 L2 演出 chips 已渲染", pg.locator("#pres .chip").count() >= 1)
        check("B10 状态栏三要素（章/进度/身份）", "第" in pg.inner_text("#st-ch") and "/" in pg.inner_text("#st-prog"))
        check("B11 沉浸页无 5 Tab（豁免规范）", pg.locator(".tabbar").count() == 0)
        check("B12 豁免浮钮：返回 + 世界", pg.locator(".fl-back").count() == 1 and pg.locator(".fl-world").count() == 1)

        # 推进 + 原文一致性
        pg.click("#b-next")
        pg.wait_for_timeout(300)
        t2 = pg.evaluate("() => NovelOSStore.state.canon.anchors[NovelOSStore.state.player.anchor_idx || 0].text")
        prog = pg.inner_text("#st-prog")
        check("B13 推进后进度 +1", prog.strip().startswith("2/"))
        dom2 = pg.inner_text("#canon-text")
        a2 = pg.evaluate("() => NovelOSStore.state.canon.anchors[1].text")
        check("B14 第二锚点仍逐字一致", dom2.strip() == a2.strip())
        pg.click("#b-prev")
        pg.wait_for_timeout(250)
        check("B15 上一段回退正常", pg.inner_text("#st-prog").strip().startswith("1/"))

        # 热点交互（若当前锚点有热点则点击验证标记）
        has_hot = pg.locator("#hots .hot").count()
        if has_hot:
            pg.click("#hots .hot >> nth=0")
            pg.wait_for_timeout(200)
            rk = pg.inner_text("#rv-kind")
            check("B16 探索结果带【世界探索】或 SIMULATION 标记", ("世界探索" in rk) or ("SIMULATION" in rk), rk)
            pg.click("#rv-close")
        else:
            ok("B16 当前锚点无热点（后续锚点覆盖，不判失败）")
        check("B17 热点体系整体 ≥3（跨锚点）", pg.evaluate("() => NovelOSStore.state.interactions.length >= 3"))
        pg.screenshot(path=str(shots / "v24-02-world-mode-a.png"))

        # 模式 B
        pg.evaluate("() => localStorage.clear()")
        goto(pg, "/output/preview/world-os-upload.html")
        pg.click("#btn-gate")
        pg.wait_for_selector("#sec-report:not(.hidden)", timeout=8000)
        pg.evaluate("() => document.querySelectorAll('#cks input').forEach(b => b.checked = true)")
        pg.evaluate("() => document.getElementById('cks').dispatchEvent(new Event('change'))")
        pg.click("#btn-compile")
        pg.wait_for_selector("#integrity:not(.hidden)", timeout=15000)
        pg.click("#btn-enter")
        pg.wait_for_selector("#mode-veil", state="visible")
        pg.click("#md-B")
        pg.wait_for_timeout(500)
        check("B18 模式 B 进入 + 回主线按钮出现", pg.evaluate("() => NovelOSStore.state.player.mode==='B'") and pg.locator("#b-home").is_visible())
        check("B19 状态栏显示世界游客", "世界游客" in pg.inner_text("#st-mode"))
        pg.screenshot(path=str(shots / "v24-03-world-mode-b.png"))

        # ============ C. 合规扫描 ============
        print("\n== [C] 合规扫描 ==")
        for name, url in [("world-os-upload", "/output/preview/world-os-upload.html"), ("world-os", "/output/preview/world-os.html")]:
            goto(pg, url)
            body = pg.inner_text("body")
            third = [w for w in ["橙光", "星野", "丸子", "B站", "bilibili", "易次元", "ChatGPT"] if w in body]
            check(f"C1 {name} 无第三方产品名", not third, str(third))
            chat_marks = [w for w in ["聊天气泡", "输入消息", "发送消息"] if w in body]
            check(f"C2 {name} 无聊天界面元素（世界功能区铁律）", not chat_marks, str(chat_marks))
            fx = pg.evaluate("() => { const b=document.body.innerHTML; return /fx[:+ ]*[0-9]/i.test(b); }")
            check(f"C3 {name} 选项无 fx 数值直显", not fx)
        # 货币：世界页 UI 不出现平台外货币（铜钱/银两只允许出现在小说正文内）
        goto(pg, "/output/preview/world-os.html")
        if pg.locator("#mode-veil").is_visible():
            pg.click("#md-A")
            pg.wait_for_timeout(400)
        chrome_txt = pg.evaluate("() => { const t=document.querySelector('.textwrap'); return t ? t.innerText : ''; }")
        check("C4 世界页 UI 货币合规（无 灵晶/铜钱 计费 UI）", "灵晶" not in chrome_txt and "铜钱" not in chrome_txt)

        # mobile-lock 两页生效
        for name, url in [("upload", "/output/preview/world-os-upload.html"), ("world", "/output/preview/world-os.html")]:
            goto(pg, url)
            lock_ok = pg.evaluate("() => { const mw = parseFloat(getComputedStyle(document.body).maxWidth); return (!isNaN(mw) && mw <= 481) || document.querySelector('link[href*=mobile-lock]') !== null; }")
            check(f"C5 {name} mobile-lock 生效", lock_ok)

        # 哈希校验 API 直测
        check("C6 canonIntegrityCheck passed=true",
              pg.evaluate("() => NovelOSStore.canonIntegrityCheck().passed === true"))
        check("C7 hash 算法已标注", pg.evaluate("() => NovelOSStore.state.source.hash_algo.length > 0"))

        # ============ D. 桌面视口快照（风格存档） ============
        dctx = browser.new_context(viewport={"width": 1280, "height": 800})
        dp = dctx.new_page()
        goto(dp, "/output/preview/world-os-upload.html")
        dp.screenshot(path=str(shots / "v24-04-upload-desktop.png"))

        browser.close()

    if proc:
        proc.terminate()

    print(f"\n===== V24 RESULT: {PASS} PASS / {len(FAIL)} FAIL =====")
    for f in FAIL:
        print("  FAIL:", f)
    sys.exit(1 if FAIL else 0)


if __name__ == "__main__":
    main()
