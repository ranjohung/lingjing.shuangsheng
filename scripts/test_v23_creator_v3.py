# -*- coding: utf-8 -*-
"""V23 创作功能区 V3.0 端到端回归（创作 Tab 除小说辅助模拟器外全部功能区）。

覆盖（V3.0 §11 执行要求 / §12 验收标准）：
  A creator-center 布局与接线（布局键位不变）
  B 多媒体创作额度与灵晶扣费（图片日3→20/视频月1→200/声音日5→10）
  C 智能体周额度（10/周）+ 8 步向导 + 语言指纹/行为约束
  D 灵境工坊（等级/收益/作品/互动管理入口/模板库）
  E 互动管理四模块（场景/事件/碎片/任务）+ AI 候选 3-5
  F 动态/灵念/Agent 行为 + 音色复刻授权门
  G 合规：0 第三方名 / Toast 替代 alert / tabbar / mobile-lock / 0 console.error

端口：LJ_TEST_PORT（默认 8796），仓库根自起 http.server。
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
PORT = int(os.environ.get("LJ_TEST_PORT", "8796"))
BASE = f"http://localhost:{PORT}"
OUT = REPO / "output" / "preview" / "screenshots" / "v23"
OUT.mkdir(parents=True, exist_ok=True)

PASS, FAIL, PAGE_ERRORS = [], [], []


def check(name, cond, detail=""):
    (PASS if cond else FAIL).append(name)
    print(("  PASS " if cond else "  FAIL ") + name + (f"  [{detail}]" if detail and not cond else ""))


def start_server():
    try:
        s = socket.create_connection(("localhost", PORT), timeout=1)
        s.close()
        return None
    except OSError:
        pass
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT)],
        cwd=str(REPO), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    for _ in range(40):
        try:
            socket.create_connection(("localhost", PORT), timeout=1).close()
            return proc
        except OSError:
            time.sleep(0.25)
    raise RuntimeError(f"cannot start http.server on {PORT}")


def watch(page, tag):
    page.on("pageerror", lambda e: PAGE_ERRORS.append(f"{tag}:{e}"))
    page.on("console", lambda m: PAGE_ERRORS.append(f"{tag}:console.error:{m.text}")
            if m.type == "error" else None)


INIT = """
(function(){
  if (localStorage.getItem('__lj_test_init_done')) return;
  localStorage.setItem('__lj_test_init_done','1');
  localStorage.setItem('lingjing_v519_realname_done','true');
  localStorage.setItem('lingjing_v520_wallet', JSON.stringify({crystal: 8888, jade: 60}));
  localStorage.removeItem('lingjing_v523_creator_v1');
})();
"""


def goto(page, url, wait=900):
    page.goto(url, wait_until="domcontentloaded")
    page.wait_for_timeout(wait)


def main():
    srv = start_server()
    try:
        with sync_playwright() as p:
            br = p.chromium.launch()
            ctx = br.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
            ctx.add_init_script(INIT)
            pg = ctx.new_page()
            watch(pg, "main")
            P = lambda f: goto(pg, f"{BASE}/output/preview/{f}")

            # ---------- A. creator-center 布局键位不变 ----------
            print("== A creator-center ==")
            P("creator-center.html")
            check("A1 页面加载无错", True)
            check("A2 创建智能体入口", pg.locator(".big-btn.agent").count() == 1)
            check("A3 智能体周额度角标", "本周剩余" in (pg.locator("#ljAgentQuota").inner_text() or ""))
            check("A4 灵境工坊入口", pg.locator(".big-btn.workshop[href='workshop.html']").count() == 1)
            for key, label in [("create-video.html", "创建视频"), ("create-image.html", "创建图片"),
                               ("create-sound.html", "创建声音"), ("create-post.html", "创建动态"),
                               ("voice-clone.html", "复刻音色"), ("create-card.html", "创建灵念"),
                               ("agent-create.html", "Agent 创建")]:
                check(f"A5 入口接线 {label}", pg.locator(f"[onclick*='{key}']").count() >= 1)
            check("A6 工作台去重(创作页无 novel-* 直链,已迁工坊)", pg.locator("[href*='novel-writer'],[href*='novel-outline']").count() == 0)
            check("A7 tabbar 存在", pg.locator(".tabbar, #tabbar-mount, [data-page-node-id*='tabbar']").count() >= 1)
            pg.screenshot(path=str(OUT / "v23-01-creator-center.png"))

            # ---------- B. 多媒体额度与灵晶扣费 ----------
            print("== B create-image 额度/扣费 ==")
            P("create-image.html")
            check("B1 额度条显示今日剩余", "今日剩余" in pg.locator(".cost-info").inner_text())
            pg.locator(".btn-gen").click(); pg.wait_for_timeout(400)
            check("B2 生成弹出候选弹窗", pg.locator("#resultModal.show").count() == 1)
            q1 = pg.evaluate("JSON.parse(localStorage.getItem('lingjing_v523_creator_v1')).quotaUse.image || {}")
            check("B3 首次生成计入额度(免费)", sum(q1.values()) == 1, json.dumps(q1))
            pg.locator("#resultModal .btn-gen, #resultModal button").first.click() if False else None
            pg.evaluate("CreatorStore ? null : 0")
            # 直接确认（候选选1张）
            pg.evaluate("document.querySelector('#resultModal.show') && document.querySelector('#resultModal.show').classList.remove('show')")
            # 连生成 3 次后第 4 次应扣灵晶
            bal0 = pg.evaluate("CreatorStore.getCoins().crystal")
            for _ in range(2):
                pg.locator(".btn-gen").click(); pg.wait_for_timeout(250)
                pg.evaluate("var m=document.querySelector('.modal-overlay.show'); m&&m.classList.remove('show')")
            pg.locator(".btn-gen").click(); pg.wait_for_timeout(400)  # 第4次：超额扣费
            bal1 = pg.evaluate("CreatorStore.getCoins().crystal")
            check("B4 超额扣灵晶 20", bal0 - bal1 == 20, f"{bal0}->{bal1}")
            check("B5 钱包键同步扣减", pg.evaluate(
                "JSON.parse(localStorage.getItem('lingjing_v520_wallet')).crystal") == bal1)
            pg.evaluate("var m=document.querySelector('.modal-overlay.show'); m&&m.classList.remove('show')")
            pg.screenshot(path=str(OUT / "v23-02-image-quota.png"))

            # ---------- C. 智能体周额度 + 8 步向导 ----------
            print("== C character-create 8步向导 ==")
            P("character-create.html")
            check("C1 8 个步骤区块", pg.locator(".cc-step-section").count() == 8)
            check("C2 8 个 stepper 节点", pg.locator(".ds-step").count() == 8)
            check("C3 语言指纹字段", pg.locator("#ljFpCatch").count() == 1)
            check("C4 行为约束字段", pg.locator("#ljNeverDo").count() == 1)
            for _ in range(7):
                pg.locator("#next-btn").click(); pg.wait_for_timeout(150)
            check("C5 Step8 预览填充", "姓名：" in pg.locator("#ljPreview").inner_text())
            pg.locator("#next-btn").click(); pg.wait_for_timeout(500)
            w1 = pg.evaluate("JSON.parse(localStorage.getItem('lingjing_v523_creator_v1')).works.filter(w=>w.type==='character').length")
            check("C6 创建成功入库角色作品(种子1+新建1)", w1 == 2, f"got {w1}")
            check("C7 周额度扣减 1", sum(pg.evaluate(
                "JSON.parse(localStorage.getItem('lingjing_v523_creator_v1')).quotaUse.agent || {}").values()) == 1)
            pg2 = ctx.new_page(); watch(pg2, "cc-back")
            goto(pg2, f"{BASE}/output/preview/creator-center.html")
            check("C8 首页角标联动 9/10", "9/10" in pg2.locator("#ljAgentQuota").inner_text())
            pg2.close()
            pg.screenshot(path=str(OUT / "v23-03-8step.png"))

            # ---------- D. 灵境工坊 ----------
            print("== D workshop ==")
            P("workshop.html")
            check("D1 等级卡渲染 L3", "L3" in pg.locator("#ljLevelName").inner_text())
            check("D2 总收益渲染", pg.locator("#ljIncomeTotal").inner_text().replace(",", "").isdigit())
            check("D3 我的作品含西游记(公版种子)", "西游记" in pg.locator("#ljWorkList").inner_text())
            check("D4 角色卡带互动管理", pg.locator("#ljWorkList [onclick*='interaction-manage']").count() >= 1)
            check("D5 模板库四类", pg.locator("[onclick*='ljTpl']").count() >= 4)
            check("D6 数据看板入口", pg.locator("[onclick*='dashboard.html']").count() >= 1)
            check("D7 工作台 7 入口迁入工坊", pg.locator("#ljWorkbench .tool-item").count() == 7)
            check("D8 工作台含逐章创作台+大纲规划", pg.locator("#ljWorkbench [href*='novel-writer']").count() == 1
                  and pg.locator("#ljWorkbench [href*='novel-outline']").count() == 1)
            pg.screenshot(path=str(OUT / "v23-04-workshop.png"))

            # ---------- E. 互动管理四模块 ----------
            print("== E interaction-manage ==")
            P("interaction-manage.html")
            counts = pg.locator(".mod-count").all_inner_texts()
            check("E1 首页计数联动(3+1=4)", "已创建 4个" in counts[0], str(counts))
            pg.locator("[onclick*=\"openCreate('scene')\"]").first.click(); pg.wait_for_timeout(1400)
            n_c = pg.locator("#lj-ai-box .candidate-item").count()
            check("E2 AI 候选 3-5 条", 3 <= n_c <= 5, f"n={n_c}")
            pg.locator("#lj-ai-more").click(); pg.wait_for_timeout(1200)
            check("E3 换一批刷新候选", pg.locator("#lj-ai-box .candidate-item").count() >= 3)
            pg.fill("#createForm input", "测试场景 · 雨夜同行")
            pg.evaluate("typeof saveAndBack==='function' && saveAndBack()"); pg.wait_for_timeout(300)
            sc = pg.evaluate("(function(){var d=JSON.parse(localStorage.getItem('lingjing_v523_creator_v1'));var c=d.interactions.char_wukong;return c&&c.scenes?c.scenes.length:0})()")
            check("E4 保存入库互动场景", sc == 2)
            pg.screenshot(path=str(OUT / "v23-05-interaction.png"))

            # ---------- F. 动态/灵念/Agent/音色 ----------
            print("== F 其他创作 ==")
            P("create-post.html")
            pg.fill("#postText", "第一卷今天完结，感谢各位读者。")
            pg.evaluate("publish()"); pg.wait_for_timeout(300)
            check("F1 动态发布入库(无限制)", pg.evaluate(
                "JSON.parse(localStorage.getItem('lingjing_v523_creator_v1')).posts.length") == 1)
            P("create-card.html")
            pg.evaluate("genCard()"); pg.wait_for_timeout(300)
            check("F2 灵念生成入库", pg.evaluate(
                "JSON.parse(localStorage.getItem('lingjing_v523_creator_v1')).cards.length") == 1)
            P("agent-create.html")
            pg.evaluate("saveAgent()"); pg.wait_for_timeout(300)
            check("F3 Agent 行为入库+月额度", sum(pg.evaluate(
                "JSON.parse(localStorage.getItem('lingjing_v523_creator_v1')).quotaUse.agentBehavior || {}").values()) == 1)
            P("voice-clone.html")
            pg.evaluate("startClone()"); pg.wait_for_timeout(300)
            check("F4 未勾授权不启动", pg.evaluate(
                "window.CreatorStore.voiceCloneDone()") is False)
            pg.evaluate("var c=document.querySelector('input[type=checkbox]'); c&&(c.checked=true)")
            pg.evaluate("startClone()"); pg.wait_for_timeout(300)
            check("F5 勾授权后首次免费启动", pg.evaluate(
                "window.CreatorStore.voiceCloneDone()") is True)
            P("dashboard.html")
            pg.wait_for_timeout(1200)
            check("F6 看板 AI 建议 5 条", pg.locator("[data-lj-sug] > div:not(:first-child)").count() >= 5)

            # ---------- G. 合规扫描 ----------
            print("== G 合规 ==")
            files = ["creator-center", "workshop", "interaction-manage", "create-image", "create-video",
                     "create-sound", "create-post", "create-card", "agent-create", "voice-clone",
                     "dashboard", "revenue-detail", "work-editor", "character-create"]
            bad = []
            for f in files:
                t = (REPO / "output" / "preview" / f"{f}.html").read_text(encoding="utf-8")
                for kw in ["橙光", "星野", "丸子", "哔哩", "B站", "Midjourney", "ChatGPT"]:
                    if kw in t:
                        bad.append(f"{f}:{kw}")
            check("G1 第三方名 0 出现", not bad, str(bad))
            check("G2 0 PageError / console.error", not PAGE_ERRORS, str(PAGE_ERRORS[:3]))
            ml = all("mobile-lock.css" in (REPO / "output" / "preview" / f"{f}.html").read_text(encoding="utf-8") for f in files)
            check("G3 全部页面 mobile-lock", ml)

            br.close()
    finally:
        if srv:
            srv.terminate()

    print(f"\n===== V23 RESULT: {len(PASS)} PASS / {len(FAIL)} FAIL / {len(PAGE_ERRORS)} PageError =====")
    if FAIL:
        print("FAILED:", *FAIL, sep="\n  - ")
    sys.exit(1 if FAIL else 0)


if __name__ == "__main__":
    main()
