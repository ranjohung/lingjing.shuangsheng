"""
V21.0 · 小说辅助模拟器 · 端到端回归测试
覆盖 PRD-v21 §6 八条验收：
  1 大纲锁定  2 章节规划生成/增删改排序  3 AI候选上下文引用  4 候选3-5/换一批/我来说
  5 质检报告5维+颜色  6 PC三栏20/55/25+移动堆叠  7 全流程0破链  8 0第三方平台名+mock
链路：问卷引导 → 创作简报 → 大纲编辑+锁定 → 章节规划+锁定 → 三栏创作台 → 质检
自起 8767（仓库根，遵守测试端口铁则；LJ_TEST_PORT 可覆盖）。
"""
import os
import socket
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

REPO = Path(__file__).resolve().parents[1]
# 端口可用 LJ_TEST_PORT 覆盖（并行会话占用 8767 时隔离用），默认 8767
PORT = int(os.environ.get("LJ_TEST_PORT", "8767"))
BASE = f"http://localhost:{PORT}"
PV = REPO / "output" / "preview"
SHOT = PV / "screenshots" / "v21"
SHOT.mkdir(parents=True, exist_ok=True)

results = []
errs = []


def ok(item, ev=""):
    results.append(("PASS", item, ev))
    print(f"  PASS {item}" + (f" — {ev}" if ev else ""))


def fail(item, ev=""):
    results.append(("FAIL", item, ev))
    print(f"  FAIL {item} — {ev}")


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


def within(n, lo, hi):
    return lo <= n <= hi


INIT = """
try {
  if (!localStorage.getItem('lingjing_v519_realname_done')) localStorage.setItem('lingjing_v519_realname_done','true');
  if (!localStorage.getItem('lingjing_v521_test_init')) {
    localStorage.removeItem('lingjing_v521_novsim_v1');
    localStorage.removeItem('lingjing_v521_wizard_draft');
    localStorage.setItem('lingjing_v521_test_init','1');
  }
} catch(e){}
"""

# 移动端 context 独立存储为空 → init() 因 plansLocked()=false 提前 return，
# FAB 监听不绑定且 #wr-layout 不渲染（右栏在非渲染子树中 computed transform=none）。
# 预置一份完整的「已锁定」项目数据，使 init() 完整走完。
INIT_M = """
try {
  if (!localStorage.getItem('lingjing_v519_realname_done')) localStorage.setItem('lingjing_v519_realname_done','true');
  if (!localStorage.getItem('lingjing_v521_test_init')) {
    var P = {
      meta: { title: '深夜订单', updatedAt: null },
      brief: {
        genre: '悬疑推理',
        idea: '外卖骑手深夜送错一单，收件人是三年前去世的自己。',
        protagonist: { type: '单主角', job: '外卖骑手', traits: ['执拗'] },
        conflict: { type: '人与真相', drive: '查清当年旧案' },
        deep: { length: '短篇', tone: '冷峻写实', worldview: '', cast: '', relations: '' }
      },
      outline: {
        status: 'locked',
        theme: '真相与体面，哪一个更贵？',
        background: '当代都市，霓虹与账单之间的灰色地带。',
        main_plot: '外卖骑手追查一个不存在的签收人，逐渐揭开旧案。',
        turning_points: ['发现签收单笔迹是自己的', '对手其实是当年知情者', '真相反转：订单是自导的局'],
        ending_direction: '余味收束：真相公开，生活继续。',
        confirmed_at: '2026-09-13T00:00:00.000Z'
      },
      plans_status: 'locked',
      chapter_plans: [
        { no: 1, goal: '雨夜接单，收件人签名疑点初现', conflict: '签收单笔迹与三年前的死亡记录重合', prev: '', next: '骑手开始暗查旧档', characters: ['陈默'], status: 'planned' },
        { no: 2, goal: '暗查旧档，旧案线索浮现', conflict: '档案缺页，有人提前动过', prev: '雨夜接单', next: '跟踪知情人', characters: ['陈默', '老周'], status: 'planned' },
        { no: 3, goal: '跟踪知情人，得到半截录音', conflict: '知情人突然失联', prev: '暗查旧档', next: '录音反转', characters: ['陈默'], status: 'planned' },
        { no: 4, goal: '录音反转，订单竟是自导', conflict: '自我怀疑与执念拉扯', prev: '跟踪知情人', next: '对峙', characters: ['陈默'], status: 'planned' },
        { no: 5, goal: '对峙当年知情者', conflict: '真相与体面的正面冲突', prev: '录音反转', next: '收束', characters: ['陈默', '老周'], status: 'planned' },
        { no: 6, goal: '真相公开，生活继续', conflict: '放下执念的余味', prev: '对峙', next: '', characters: ['陈默'], status: 'planned' }
      ],
      chapters: {},
      characters: [
        { id: 'chr_seed1', name: '陈默', role: '主角', personality: '执拗、寡言',
          voice: { tone: '短句', catchphrase: ['说真的'], forbidden: ['OK'] }, rules: { note: '从不先动手' } }
      ],
      foreshadows: [],
      ai_logs: []
    };
    localStorage.setItem('lingjing_v521_novsim_v1', JSON.stringify(P));
    localStorage.setItem('lingjing_v521_test_init', '1');
  }
} catch(e){}
"""

server = start_server()
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--use-gl=swiftshader"])
        ctx = browser.new_context(viewport={"width": 1280, "height": 900})
        page = ctx.new_page()
        page.on("pageerror", lambda e: errs.append(str(e)))
        ctx.add_init_script(INIT)

        # ================= A. 引导问卷 =================
        print("\n[A] novel-ai-helper 引导模式")
        page.goto(f"{BASE}/output/preview/novel-ai-helper.html", wait_until="networkidle")
        page.wait_for_timeout(600)
        if page.is_visible("#guide-view"):
            ok("引导模式默认显示")
        else:
            fail("引导模式未显示")
        card_text = page.text_content("#wz-card")
        if "题材与创意概要" in card_text:
            ok("第 1 问 = 题材与创意概要")
        else:
            fail("第 1 问不对", card_text[:40])
        dots = page.locator(".wz-dot").count()
        if dots == 8:
            ok("进度点 8 个（3 必答 + 5 选答）")
        else:
            fail("进度点数量不对", str(dots))

        # Q1: 题材 chip + AI 生成概要（候选 3-5 + 上下文）
        page.click(".wz-chips[data-key='genre'] .wz-chip:has-text('悬疑推理')")
        page.click(".wz-field[data-key='idea'] >> .aih-ai-btn >> nth=0")
        page.wait_for_timeout(400)
        n_opt = page.locator(".aih-ai-modal .aih-ai-option").count()
        if within(n_opt, 3, 5):
            ok(f"AI 概要候选 {n_opt} 个（3-5）")
        else:
            fail("候选数量不对", str(n_opt))
        ctx_line = page.text_content(".aih-ai-ctx") or ""
        if "基于" in ctx_line:
            ok("候选带上下文引用（基于…）")
        else:
            fail("无上下文引用", ctx_line)
        page.click(".aih-ai-modal .aih-ai-option >> nth=0")
        page.wait_for_timeout(300)
        idea_v = page.input_value("#wz-field-idea")
        if len(idea_v) > 6:
            ok(f"采纳 AI 概要: {idea_v[:18]}…")
        else:
            fail("概要未填入")

        # 自由描述 modal（无 prompt）
        page.click(".wz-field[data-key='idea'] >> .aih-ai-btn >> nth=1")
        page.wait_for_timeout(300)
        page.fill("#free-input", "外卖骑手深夜送错一单，收件人是三年前去世的自己。")
        page.click("#free-ok")
        page.wait_for_timeout(300)
        idea_v2 = page.input_value("#wz-field-idea")
        if "外卖骑手" in idea_v2:
            ok("自由描述弹窗采纳成功（替代 prompt）")
        else:
            fail("自由描述未生效")
        raw = PV.joinpath("novel-ai-helper.html").read_text(encoding="utf-8")
        if "prompt(" not in raw:
            ok("页面 0 处 prompt()")
        else:
            fail("仍存在 prompt()")

        page.click("#wz-next")
        page.wait_for_timeout(300)
        # Q2 主角：类型/职业/性格 chips
        page.click(".wz-chips[data-key='ptype'] .wz-chip >> nth=0")
        page.click(".wz-chips[data-key='job'] .wz-chip >> nth=0")
        page.click(".wz-chips[data-key='traits'] .wz-chip >> nth=0")
        page.click("#wz-next")
        page.wait_for_timeout(300)
        # Q3 冲突
        page.click(".wz-chips[data-key='ctype'] .wz-chip >> nth=0")
        page.click(".wz-chips[data-key='drive'] .wz-chip >> nth=0")
        page.click("#wz-next")
        page.wait_for_timeout(300)
        # 深度定制 5 问全部跳过
        for i in range(5):
            page.click("#wz-skip")
            page.wait_for_timeout(250)
        if page.is_visible("#wz-brief"):
            ok("完成问卷 → 创作简报显示")
        else:
            fail("简报未显示")
        brief_body = page.text_content("#wz-brief-body") or ""
        if "必答 · 故事骨架" in brief_body and "深度定制 · 选答" in brief_body:
            ok("简报分必答/选答两区")
        else:
            fail("简报分区不对")
        page.screenshot(path=str(SHOT / "v21-01-brief.png"), full_page=True)
        page.click("#btn-confirm-brief")
        page.wait_for_url("**/novel-outline.html", timeout=5000)
        page.wait_for_timeout(600)
        ok("确认简报 → 跳转大纲页")

        # ================= B. 大纲与章节规划 =================
        print("\n[B] novel-outline 大纲编辑 + 锁定 + 章节规划")
        if page.is_visible(".ol-brief"):
            ok("大纲页回显创作简报")
        else:
            fail("简报未回显")
        if "active" in (page.get_attribute("#step-2", "class") or ""):
            ok("步骤条高亮 ② 大纲编辑")
        else:
            fail("步骤条状态不对")

        # AI 给几个选项（含换一批 + 我来说）
        page.click(".ol-ai-btn >> nth=0")
        page.wait_for_timeout(400)
        n_opt = page.locator(".ol-modal .ol-opt").count()
        if within(n_opt, 3, 5):
            ok(f"大纲主题候选 {n_opt} 个（3-5）")
        else:
            fail("大纲候选数量不对", str(n_opt))
        page.click("#olc-refresh")
        page.wait_for_timeout(300)
        n_opt2 = page.locator(".ol-modal .ol-opt").count()
        if within(n_opt2, 3, 5):
            ok("换一批重新生成")
        else:
            fail("换一批失效")
        page.click("#olc-mysay")
        page.fill("#olc-mysay-input", "真相与体面，哪一个更贵？")
        page.click("#olc-mysay-ok")
        page.wait_for_timeout(300)
        if len(page.input_value("#ol-theme")) > 3:
            ok("我来说 → 直接采纳进字段")
        else:
            fail("我来说未生效")
        page.screenshot(path=str(SHOT / "v21-02-outline.png"), full_page=True)

        page.fill("#ol-background", "当代都市，霓虹与账单之间的灰色地带。")
        page.fill("#ol-main_plot", "外卖骑手追查一个不存在的签收人，逐渐揭开旧案。")
        page.fill("#ol-turning_points", "发现签收单笔迹是自己的\n对手其实是当年知情者\n真相反转：订单是自导的局")
        page.fill("#ol-ending_direction", "余味收束：真相公开，生活继续。")
        page.click("#btn-confirm-outline")
        page.wait_for_timeout(300)
        page.click("#olc-ok")
        page.wait_for_timeout(500)
        if page.is_visible("#ol-lock-badge"):
            ok("确认后大纲 🔒 锁定")
        else:
            fail("未锁定")
        ro = page.get_attribute("#ol-theme", "readonly")
        if ro is not None:
            ok("锁定后字段只读（验收 #1）")
        else:
            fail("字段仍可编辑")

        # 解锁 → 重新锁定（验证状态机）
        page.click("#btn-unlock-outline")
        page.wait_for_timeout(300)
        page.click("#olc-ok")
        page.wait_for_timeout(400)
        page.click("#btn-confirm-outline")
        page.wait_for_timeout(300)
        page.click("#olc-ok")
        page.wait_for_timeout(400)

        # 章节规划
        page.click("#btn-gen-plans")
        page.wait_for_timeout(500)
        n_plans = page.locator(".plan-card").count()
        if n_plans >= 6:
            ok(f"依大纲生成 {n_plans} 章规划（验收 #2）")
        else:
            fail("章节数不足", str(n_plans))
        first_goal = page.input_value(".plan-card >> nth=0 >> .plan-goal")
        # 排序：↓ 第一张
        page.click(".plan-mini[data-act='down'][data-i='0']")
        page.wait_for_timeout(300)
        second_goal = page.input_value(".plan-card >> nth=1 >> .plan-goal")
        if second_goal == first_goal:
            ok("↓ 下移排序生效")
        else:
            fail("排序失效")
        n_before = page.locator(".plan-card").count()
        page.click(".plan-mini[data-act='del'][data-i='0']")
        page.wait_for_timeout(300)
        n_after = page.locator(".plan-card").count()
        if n_after == n_before - 1:
            ok("✕ 删除章节生效")
        else:
            fail("删除失效")
        page.click("#btn-add-plan")
        page.wait_for_timeout(300)
        if page.locator(".plan-card").count() == n_before:
            ok("＋ 新增章节生效")
        else:
            fail("新增失效")
        page.screenshot(path=str(SHOT / "v21-03-plans.png"), full_page=True)
        page.click("#btn-lock-plans")
        page.wait_for_timeout(300)
        page.click("#olc-ok")
        page.wait_for_timeout(500)
        if page.is_visible("#plans-lock-badge") and page.is_visible("#btn-goto-writer"):
            ok("章节规划锁定 → 出现进入创作台按钮")
        else:
            fail("规划锁定态不对")

        # ================= C. 三栏创作台（桌面 1280） =================
        print("\n[C] novel-writer 三栏创作台")
        page.click("#btn-goto-writer")
        page.wait_for_url("**/novel-writer.html**")
        page.wait_for_timeout(700)
        cols = page.evaluate("getComputedStyle(document.getElementById('wr-layout')).gridTemplateColumns")
        parts = [float(x.replace("px", "")) for x in cols.split(" ") if x]
        if len(parts) == 3:
            total = sum(parts)
            ratios = [round(x / total, 2) for x in parts]
            if abs(ratios[0] - 0.20) < 0.03 and abs(ratios[1] - 0.55) < 0.03 and abs(ratios[2] - 0.25) < 0.03:
                ok(f"PC 三栏 20/55/25（实测 {ratios}）")
            else:
                fail("三栏比例不对", str(ratios))
        else:
            fail("非三栏布局", cols)
        n_ch = page.locator(".ch-item").count()
        if n_ch == n_before:
            ok(f"左栏章节列表 {n_ch} 项与规划一致")
        else:
            fail("章节数不一致", f"{n_ch} vs {n_before}")
        goal_txt = page.text_content("#ed-goal") or ""
        if "本章目标" in goal_txt and "硬约束" in goal_txt:
            ok("中栏显示章目标硬约束（上下文感知）")
        else:
            fail("章目标未显示")

        # AI 面板
        page.click("#btn-ai-generate")
        page.wait_for_timeout(500)
        n_cand = page.locator(".wr-cand").count()
        if within(n_cand, 3, 5):
            ok(f"AI 段落候选 {n_cand} 个（3-5，验收 #4）")
        else:
            fail("候选数量不对", str(n_cand))
        ai_ctx = page.text_content("#ai-ctx") or ""
        if "基于" in ai_ctx:
            ok(f"候选上下文引用：{ai_ctx[:30]}…")
        else:
            fail("无上下文引用")
        page.screenshot(path=str(SHOT / "v21-04-writer-desktop.png"))
        t1 = page.text_content(".wr-cand >> nth=0 >> .cand-text")
        page.click("#btn-cand-refresh")
        page.wait_for_timeout(400)
        t2 = page.text_content(".wr-cand >> nth=0 >> .cand-text")
        if t1 != t2:
            ok("换一批生成新候选")
        else:
            fail("换一批内容未变")
        page.click("#btn-my-say")
        page.fill("#my-say-input", "他把外卖箱摔在电动车上，决定今晚就把那个门牌号查清楚。")
        page.click("#my-say-ok")
        page.wait_for_timeout(400)
        first_style = page.text_content(".wr-cand >> nth=0 >> .cand-style") or ""
        if "作者口述" in first_style:
            ok("我来说 → AI 格式化为候选")
        else:
            fail("我来说格式化失败", first_style)
        page.click(".wr-cand >> nth=0 >> .cand-use")
        page.wait_for_timeout(400)
        content_v = page.input_value("#ed-content")
        if len(content_v) > 20:
            ok("使用候选 → 插入正文")
        else:
            fail("正文未插入")

        # 自动保存
        page.fill("#ed-title", "第一章 · 深夜订单")
        page.click("#ed-content")
        page.keyboard.press("End")
        page.keyboard.type("雨还在下。")
        page.wait_for_timeout(1300)
        save_txt = page.text_content("#status-save") or ""
        if "已保存" in save_txt:
            ok(f"防抖自动保存（{save_txt.strip()}）")
        else:
            fail("未自动保存", save_txt)
        words = page.evaluate("window.NovelSimStore.totalWords()")
        if words > 0:
            ok(f"localStorage 持久化：总字数 {words}")
        else:
            fail("字数未持久化")

        # 质量检查
        page.click("#btn-finish-chapter")
        page.wait_for_timeout(500)
        n_dims = page.locator("#wr-modal .q-dim").count()
        if n_dims == 5:
            ok("质检报告 5 维（验收 #5）")
        else:
            fail("维度数不对", str(n_dims))
        score = page.text_content("#q-score")
        if score and score.strip().isdigit():
            ok(f"质量分 {score}")
        else:
            fail("无质量分", str(score))
        page.screenshot(path=str(SHOT / "v21-05-quality.png"))
        page.click("#btn-fix-all")
        page.wait_for_timeout(700)
        if page.locator("#wr-modal .q-dim").count() == 5:
            ok("一键修复后复检重新渲染")
        else:
            fail("修复后报告异常")
        page.click("#btn-mark-done")
        page.wait_for_timeout(1200)
        active = page.text_content(".ch-item.active") or ""
        if "第 2 章" in active:
            ok("标记完成后自动进入第 2 章")
        else:
            fail("未自动进入下一章", active.strip())

        # ================= D. 移动端 390 堆叠 =================
        print("\n[D] 移动端 390×844")
        mctx = browser.new_context(viewport={"width": 390, "height": 844})
        mpage = mctx.new_page()
        mpage.on("pageerror", lambda e: errs.append(str(e)))
        mctx.add_init_script(INIT_M)
        mpage.goto(f"{BASE}/output/preview/novel-writer.html", wait_until="networkidle")
        mpage.wait_for_timeout(700)
        if mpage.is_visible("#wr-fab"):
            ok("移动端 🤖 浮动按钮显示")
        else:
            fail("浮动按钮未显示")
        tr = mpage.evaluate("getComputedStyle(document.getElementById('wr-right')).transform")
        if tr and tr != "none" and "matrix" in tr:
            ok("右栏默认隐藏（底部弹出面板）")
        else:
            fail("右栏未按弹出面板处理", str(tr))
        mpage.click("#wr-fab")
        mpage.wait_for_timeout(500)
        has_open = mpage.evaluate("document.getElementById('wr-right').classList.contains('sheet-open')")
        if has_open:
            ok("点击浮钮展开底部面板（验收 #6 移动堆叠）")
        else:
            fail("面板未展开")
        ovf = mpage.evaluate("getComputedStyle(document.getElementById('lp-chapters')).overflowX")
        if ovf == "auto" or ovf == "scroll":
            ok("左栏章节条横向滚动")
        else:
            fail("章节条非横滚", ovf)
        mpage.screenshot(path=str(SHOT / "v21-06-writer-mobile.png"))
        mpage.goto(f"{BASE}/output/preview/novel-ai-helper.html", wait_until="networkidle")
        mpage.wait_for_timeout(400)
        if mpage.is_visible("#guide-view"):
            ok("移动端问卷页正常")
        else:
            fail("移动端问卷页异常")
        mctx.close()

        # ================= E. 链路 + 文案 =================
        print("\n[E] 0 破链 + 0 第三方平台名")
        broken = []
        for f in ["novel-ai-helper.html", "novel-outline.html", "novel-writer.html"]:
            raw = PV.joinpath(f).read_text(encoding="utf-8")
            import re as _re
            for href in _re.findall(r'href="([^"]+)"', raw):
                if href.startswith(("http", "javascript:", "#", "data:")):
                    continue
                target = href.split("?")[0].split("#")[0]
                if not target:
                    continue
                if not PV.joinpath(target).exists():
                    broken.append(f"{f} → {href}")
        if not broken:
            ok("三新页 0 破链（验收 #7）")
        else:
            fail("存在破链", "; ".join(broken[:5]))
        new_links = ["novel-ai-helper.html", "novel-outline.html", "novel-writer.html"]
        cc_raw = PV.joinpath("creator-center.html").read_text(encoding="utf-8")
        missing_entries = [x for x in new_links if x not in cc_raw]
        if not missing_entries:
            ok("创作中心 3 个入口齐全")
        else:
            fail("入口缺失", str(missing_entries))
        bad_kw = ["橙光", "星野", "丸子", "田间记", "B站", "哔哩", "tiktok", "TikTok"]
        hits = []
        for f in ["novel-ai-helper.html", "novel-outline.html", "novel-writer.html",
                  "js/novel-sim-store.js", "js/novel-sim-ai.js"]:
            raw = PV.joinpath(f).read_text(encoding="utf-8")
            for kw in bad_kw:
                if kw in raw:
                    hits.append(f"{f}:{kw}")
        if not hits:
            ok("0 第三方平台名（验收 #8）")
        else:
            fail("第三方名词残留", "; ".join(hits))

        # ================= 结果 =================
        n_pass = sum(1 for r in results if r[0] == "PASS")
        n_fail = sum(1 for r in results if r[0] == "FAIL")
        print(f"\n===== V21 回归：{n_pass} PASS / {n_fail} FAIL / {len(errs)} PageError =====")
        if errs:
            print("PageErrors:")
            for e in errs[:10]:
                print("  ", e[:200])
        browser.close()
finally:
    if server:
        server.terminate()

sys.exit(0 if (not any(r[0] == "FAIL" for r in results)) and not errs else 1)
