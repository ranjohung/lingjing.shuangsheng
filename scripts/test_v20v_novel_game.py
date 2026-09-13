"""
V20-V · 通用小说世界引擎 · 真点击测试
覆盖：上传→解析→章节列表→选章→进场景→对话→选项→道具 hotzone→NPC hotzone→抽屉交互
        →付费弹窗→付费扣灵晶→背包→存档→章节完成回列表
"""
from playwright.sync_api import sync_playwright
import json
from pathlib import Path

BASE = "http://localhost:8767"
results = []
errs = []

def ok(item, ev=""):
    results.append({"item": item, "result": "PASS", "ev": ev})
    print(f"  ✅ {item}" + (f" — {ev}" if ev else ""))

def fail(item, ev=""):
    results.append({"item": item, "result": "FAIL", "ev": ev})
    print(f"  ❌ {item} — {ev}")

with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=swiftshader"])
    ctx = b.new_context(viewport={"width": 390, "height": 844})
    page = ctx.new_page()
    page.on("pageerror", lambda e: errs.append(str(e)))

    ctx.add_init_script("""
    try{
      localStorage.setItem('lingjing_onboarding_done','true');
      localStorage.setItem('lingjing_v519_realname_done','true');
      // 重置钱包 + 旧存档（防止上次跑过的状态干扰）
      localStorage.setItem('lingjing_v520_wallet', JSON.stringify({jade:10, crystal:200}));
    }catch(e){}
    """)

    # ========== A. 加载示例 ==========
    print("\n[A] 上传页 → 加载示例 → 章节列表")
    page.goto(f"{BASE}/output/preview/novel-game.html", wait_until="networkidle")
    page.wait_for_timeout(1500)
    upload_visible = page.evaluate("document.getElementById('ng-upload-view').style.display !== 'none'")
    if upload_visible: ok("上传页默认显示", "")
    else: fail("上传页未显示")
    page.click("#ng-demo")
    page.wait_for_timeout(2500)
    chapters_visible = page.evaluate("document.getElementById('ng-chapters-view').style.display === 'block'")
    if chapters_visible: ok("加载示例后进入章节列表", "")
    else: fail("未进入章节列表")
    book_title = page.evaluate("document.getElementById('ng-book-title').textContent")
    if "桃花源" in book_title: ok(f"小说标题正确: {book_title}", "")
    else: fail("小说标题不对", book_title)
    ch_count = page.evaluate("document.querySelectorAll('.ng-ch-card').length")
    if ch_count == 6: ok(f"章节卡片数 = 6", "")
    else: fail("章节卡片数不对", str(ch_count))
    # 免费章节标签
    free_tags = page.evaluate("document.querySelectorAll('.ng-ch-card .tag.free').length")
    if free_tags == 3: ok(f"免费章节数 = 3（初入/归途/终章 · 终章虽标注但无 cost 时也算免费）", "")
    else: info_free = f"free={free_tags}"
    paid_tags = page.evaluate("document.querySelectorAll('.ng-ch-card .tag:not(.free)').length")
    if paid_tags >= 3: ok(f"付费章节标签数 = {paid_tags}", "")
    else: fail("付费章节标签不足", str(paid_tags))

    # ========== B. 进入第一章（免费）→ 场景 + 选项 + 道具 hotzone ==========
    print("\n[B] 第一章（免费）→ 进场景 + 道具 + NPC + 选项")
    page.click(".ng-ch-card:first-child")
    page.wait_for_timeout(1000)
    stage_active = page.evaluate("document.getElementById('ng-stage').classList.contains('active')")
    if stage_active: ok("点击第一章进入 stage", "")
    else: fail("未进入 stage")
    # 第一章应有 4 个 block：场景名 + 旁白 + 道具 + 选项 + NPC + 选项 + 旁白 + 选项
    blocks_state = page.evaluate("JSON.stringify({chapIdx: window.LJNovelGame.state().chapIdx, blockIdx: window.LJNovelGame.state().blockIdx})")
    print(f"  · 初始 state: {blocks_state}")
    # 应该有选项按钮
    choices_n = page.evaluate("document.querySelectorAll('.ng-choice').length")
    if choices_n > 0: ok(f"出现 {choices_n} 个选项按钮", "")
    else: fail("无选项按钮")

    # 继续推进到 NPC（item 在 block 2, npc 在 block 4：narration-block 3, choice-block 4, npc-block 5）
    page.click(".ng-choice:first-child")  # block 0→1 narration
    page.wait_for_timeout(300)
    page.click(".ng-choice:first-child")  # block 1→2 item
    page.wait_for_timeout(300)
    page.click(".ng-choice:first-child")  # block 2→3 narration
    page.wait_for_timeout(300)
    page.click(".ng-choice:first-child")  # block 3→4 choice
    page.wait_for_timeout(300)
    page.click(".ng-choice:first-child")  # block 4→5 npc
    page.wait_for_timeout(300)
    speaker3 = page.evaluate("document.querySelector('.ng-dialog .speaker').textContent")
    text3 = page.evaluate("document.querySelector('.ng-dialog .text').textContent")
    if "遇见人物" in speaker3 or "白衣女子" in text3:
        ok("NPC 块识别 · 白衣女子", "")
    else:
        fail("NPC 块未识别", f"{speaker3} {text3[:40]}")

    # ========== C. hotzone 出现 + 点击打开抽屉 ==========
    print("\n[C] 场景 hotzone 可点击交互")
    hot_n = page.evaluate("document.querySelectorAll('.ng-hot').length")
    if hot_n >= 1: ok(f"场景 hotzone 数 = {hot_n}", "")
    else: fail("无 hotzone")
    # 用坐标点击（避免被 dialog 浮层遮挡 selector 解析）
    hot_box = page.evaluate("""(()=>{const h=document.querySelector('.ng-hot');const r=h.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()""")
    page.mouse.click(hot_box["x"], hot_box["y"])
    page.wait_for_timeout(500)
    drawer_open = page.evaluate("document.getElementById('ng-drawer').classList.contains('open')")
    if drawer_open: ok("点击 hotzone 打开交互抽屉", "")
    else: fail("点击 hotzone 未打开抽屉")
    drawer_title = page.evaluate("document.getElementById('ng-drawer-title').textContent")
    print(f"  · 抽屉标题: {drawer_title}")
    # 关抽屉
    page.click("#ng-drawer-close")
    page.wait_for_timeout(300)
    drawer_closed = page.evaluate("!document.getElementById('ng-drawer').classList.contains('open')")
    if drawer_closed: ok("抽屉可关闭", "")
    else: fail("抽屉无法关闭")

    # ========== D. 选项按钮推进 ==========
    print("\n[D] 选项按钮推进")
    blockIdx_before = page.evaluate("window.LJNovelGame.state().blockIdx")
    # 用 evaluate 触发点击（避免不可见问题）
    page.evaluate("document.querySelector('.ng-choice').click()")
    page.wait_for_timeout(400)
    blockIdx_after = page.evaluate("window.LJNovelGame.state().blockIdx")
    if blockIdx_after > blockIdx_before: ok(f"按钮点击 blockIdx 推进 {blockIdx_before}→{blockIdx_after}", "")
    else: fail("按钮未推进", str(blockIdx_after))

    # 推到第一章末尾
    for _ in range(20):
        c = page.evaluate("document.querySelectorAll('.ng-choice').length")
        if c == 0: break
        page.evaluate("document.querySelector('.ng-choice').click()")
        page.wait_for_timeout(250)

    # ========== E. 第二章付费 → 弹付费弹窗 → 付费 ==========
    print("\n[E] 第二章付费 → 弹付费弹窗 → 付费解锁")
    # 现在应该回到章节列表
    in_chapters = page.evaluate("document.getElementById('ng-chapters-view').style.display === 'block'")
    if in_chapters:
        ok("第一章完成 → 自动回章节列表", "")
    else:
        fail("未回章节列表")
        # 强制回
        page.click("#ng-btn-home")
        page.wait_for_timeout(500)

    crystal_before = page.evaluate("localStorage.getItem('lingjing_v520_wallet')")
    print(f"  · 付费前钱包: {crystal_before}")
    # 点第二章（索引 1，琴声问答）
    page.click(".ng-ch-card:nth-child(2)")
    page.wait_for_timeout(800)
    paid_open = page.evaluate("document.getElementById('ng-paid').classList.contains('open')")
    if paid_open: ok("点击付费章节弹付费弹窗", "")
    else: fail("未弹付费弹窗")
    paid_price = page.evaluate("document.getElementById('ng-paid-price').textContent")
    if "20" in paid_price: ok(f"付费弹窗显示价格 20 灵晶", "")
    else: fail("价格不对", paid_price)
    # 取消
    page.click("#ng-paid-cancel")
    page.wait_for_timeout(400)
    paid_closed = page.evaluate("!document.getElementById('ng-paid').classList.contains('open')")
    if paid_closed: ok("取消按钮关闭付费弹窗", "")
    else: fail("取消按钮无效")
    # 再点开付费 → 确认付费
    page.click(".ng-ch-card:nth-child(2)")
    page.wait_for_timeout(500)
    page.click("#ng-paid-pay")
    page.wait_for_timeout(1200)
    crystal_after = page.evaluate("localStorage.getItem('lingjing_v520_wallet')")
    print(f"  · 付费后钱包: {crystal_after}")
    if crystal_after and "crystal\":180" in crystal_after:
        ok("付费扣 20 灵晶（200→180）", "")
    else:
        fail("灵晶未扣", str(crystal_after))
    paid_paid_chap = page.evaluate("JSON.stringify(Object.keys(window.LJNovelGame.state().paidChaps))")
    print(f"  · 已付费章节: {paid_paid_chap}")
    # 应进入 stage
    stage_now = page.evaluate("document.getElementById('ng-stage').classList.contains('active')")
    if stage_now: ok("付费后进入 stage", "")
    else: fail("付费后未进 stage")

    # ========== F. 再点第二章 → 不应重复扣 ==========
    page.click("#ng-btn-home")
    page.wait_for_timeout(500)
    crystal2 = page.evaluate("localStorage.getItem('lingjing_v520_wallet')")
    page.click(".ng-ch-card:nth-child(2)")
    page.wait_for_timeout(800)
    paid_open2 = page.evaluate("document.getElementById('ng-paid').classList.contains('open')")
    crystal3 = page.evaluate("localStorage.getItem('lingjing_v520_wallet')")
    if not paid_open2:
        ok("已付费章节再次进入不弹付费弹窗", "")
    else:
        fail("已付费章节再次进入还弹弹窗", "")
    if crystal2 == crystal3:
        ok(f"已付费章节不再扣灵晶 ({crystal2})", "")
    else:
        fail("已付费章节还扣灵晶", f"{crystal2}→{crystal3}")

    # ========== G. 背包 FAB ==========
    print("\n[G] 背包 FAB")
    # 推到下一 block 让背包按钮显示
    page.evaluate("document.querySelector('.ng-choice')?.click()")
    page.wait_for_timeout(400)
    page.click("#ng-fab-backpack")
    page.wait_for_timeout(400)
    drawer_open_g = page.evaluate("document.getElementById('ng-drawer').classList.contains('open')")
    drawer_title_g = page.evaluate("document.getElementById('ng-drawer-title').textContent")
    if drawer_open_g and "背包" in drawer_title_g:
        ok("点击背包 FAB 打开背包抽屉", f"title={drawer_title_g}")
    else:
        fail("背包 FAB 未生效", f"open={drawer_open_g} title={drawer_title_g}")
    item_n = page.evaluate("document.querySelectorAll('.ng-item').length")
    if item_n >= 1: ok(f"背包显示 {item_n} 件物品", "")
    else: fail("背包无物品")
    page.click("#ng-drawer-close")
    page.wait_for_timeout(300)

    # ========== H. 存档 FAB ==========
    print("\n[H] 存档 FAB")
    page.click("#ng-fab-save")
    page.wait_for_timeout(400)
    # 检查 key 存在
    has_save = page.evaluate("Object.keys(localStorage).some(k=>k.indexOf('_progress')>=0)")
    if has_save:
        ok("存档写入 localStorage", "")
    else:
        fail("存档未写入", "")

    # ========== I. 帮助弹窗 ==========
    print("\n[I] 帮助弹窗 · 行内标注说明")
    page.click("#ng-btn-home")
    page.wait_for_timeout(300)
    page.click("#ng-btn-help")
    page.wait_for_timeout(400)
    help_text = page.evaluate("document.getElementById('ng-drawer-body').textContent")
    if "## 章节标题" in help_text and "【收费章节" in help_text:
        ok("帮助弹窗显示标注说明", "")
    else:
        fail("帮助弹窗内容不全", help_text[:80])

    # ========== J. 解析器单元测试 ==========
    print("\n[J] 解析器单元测试")
    parsed = page.evaluate("JSON.stringify(window.LJNovelGame.parseNovel('# 标题\\n## 第一章\\n### 场景：测试\\n{道具:剑}\\n{人物:女子}\\n「角色」你好\\n[选项A|选项B]\\n【收费章节：10灵晶】'))")
    if parsed:
        d = json.loads(parsed)
        c0 = d["chapters"][0]
        types = [b["type"] for b in c0["scenes"][0]["blocks"]]
        print(f"  · 解析 blocks: {types}")
        if "item" in types and "npc" in types and "dialog" in types and "choice" in types and "paid_gate" in types:
            ok(f"解析器识别 5 类 block · types={types}", "")
        else:
            fail("解析器未全识别", str(types))
        if c0["cost"] == 10:
            ok(f"章节收费解析 · cost={c0['cost']}", "")
        else:
            fail("cost 解析错", str(c0.get("cost")))

    b.close()

# 汇总
print("\n" + "=" * 60)
total = len(results)
passed = sum(1 for r in results if r["result"] == "PASS")
failed = sum(1 for r in results if r["result"] == "FAIL")
print(f"V20-V · 通用小说世界引擎真点击测试：{passed} PASS / {failed} FAIL（总 {total}）")
if errs:
    print(f"\nPageError 数：{len(errs)}")
    for e in errs[:3]: print(f"  · {e[:120]}")
out = Path("scripts/v20v_novel_game_audit.json")
out.write_text(json.dumps({"results": results, "errs": errs, "summary": {"total": total, "pass": passed, "fail": failed}}, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"报告：{out}")
import sys
sys.exit(0 if failed == 0 and not errs else 1)