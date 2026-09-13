"""
V20-U · 通用实名门控 · 真点击测试

需求：
  ① 客户点击世界功能区的小说介绍图片 → 先进 plot-detail.html 介绍页
  ② 已实名的用户不体现实名（不弹窗）
  ③ 未实名的用户点心屿创建角色 / 创作创建智能体 → 弹实名 modal，
     提交后写入 lingjing_v519_realname_done 并跳走

覆盖：
  A. 世界 Tab 卡片 → plot-detail.html
  B. 心屿 Tab 未实名 → 创建新角色 → modal 弹起 + 校验拒绝 + 提交成功 + localStorage 写入 + 跳走
  C. 创作 Tab 未实名 → 创建智能体 → modal 弹起 + 提交 + 写入 + 跳走
  D. 心屿 Tab 已实名 → 创建新角色 → 不弹 modal，直接跳走
  E. 创作 Tab 已实名 → 创建智能体 → 不弹 modal，直接跳走
  F. 取消按钮 + 姓名长度校验 + 身份证号格式校验
"""
from playwright.sync_api import sync_playwright
import json, time
from pathlib import Path

BASE = "http://localhost:8767"
results = []
errs = []

def pass_(item, evidence=""):
    results.append({"item": item, "result": "PASS", "evidence": evidence})
    print(f"  ✅ {item}")

def fail_(item, evidence=""):
    results.append({"item": item, "result": "FAIL", "evidence": evidence})
    print(f"  ❌ {item} — {evidence}")

def info(msg):
    print(f"  · {msg}")

with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=swiftshader"])

    # ============================================================
    # A. 世界 Tab 卡片 → plot-detail.html
    # ============================================================
    print("\n[A] 世界 Tab 卡片 → plot-detail.html")
    ctx_a = b.new_context(viewport={"width": 390, "height": 844})
    page_a = ctx_a.new_page()
    page_a.on("pageerror", lambda e: errs.append({"where": "A", "msg": str(e)}))
    ctx_a.add_init_script("try{localStorage.setItem('lingjing_v519_realname_done','true'); localStorage.setItem('lingjing_onboarding_done','true'); localStorage.setItem('lingjing_user_profile', JSON.stringify({id:'u1',username:'测试',gender:'女',age:'25',region:'北京',realname:true}))}catch(e){}")
    page_a.goto(f"{BASE}/output/preview/library.html", wait_until="networkidle")
    page_a.wait_for_timeout(1500)
    # 检查卡片链接
    cards = page_a.evaluate("document.querySelectorAll('.ds-wf-card').length")
    if cards > 0:
        pass_(f"世界 Tab 发现 {cards} 张作品卡片含 plot-detail 链接", f"ds-wf-card count={cards}")
        # 拿到第一张卡片的 href
        first_href = page_a.evaluate("document.querySelector('.ds-wf-card').getAttribute('href')")
        if first_href and "plot-detail.html" in first_href:
            pass_("第一张卡片 href 指向 plot-detail.html", first_href)
        else:
            fail_("第一张卡片 href 不正确", str(first_href)[:80])
    else:
        fail_("世界 Tab 无 .ds-wf-card 卡片", f"count={cards}")
    # 点击跳转
    try:
        before = page_a.url
        page_a.click(".ds-wf-card", timeout=4000)
        page_a.wait_for_timeout(1500)
        after = page_a.url
        if "plot-detail.html" in after:
            pass_("点击世界卡片成功跳转到 plot-detail.html", after)
        else:
            fail_("点击世界卡片未跳转到 plot-detail.html", f"before={before[:60]} after={after[:60]}")
    except Exception as e:
        fail_("点击世界卡片 TIMEOUT", str(e)[:80])

    # ============================================================
    # B. 心屿 Tab 未实名 → 创建新角色 → modal 弹起 + 校验 + 提交 + 写入 + 跳走
    # ============================================================
    print("\n[B] 心屿 Tab 未实名 · 创建新角色 → 实名 modal")
    ctx_b = b.new_context(viewport={"width": 390, "height": 844})
    page_b = ctx_b.new_page()
    page_b.on("pageerror", lambda e: errs.append({"where": "B", "msg": str(e)}))
    # 不预置 lingjing_v519_realname_done（未实名）
    ctx_b.add_init_script("try{if(!localStorage.getItem('lingjing_v519_realname_done')){localStorage.removeItem('lingjing_v519_realname_done')}localStorage.setItem('lingjing_onboarding_done','true');localStorage.setItem('lingjing_v519_realname_tries','0');localStorage.setItem('lingjing_heart_intro_done','true')}catch(e){}")
    page_b.goto(f"{BASE}/output/preview/heart-island.html", wait_until="networkidle")
    page_b.wait_for_timeout(1500)
    # 关掉首次进入弹窗（mask + dialog div）
    try:
        page_b.evaluate("document.querySelectorAll('.heart-dialog-mask,.heart-dialog').forEach(function(n){n.remove()})")
    except Exception:
        pass
    page_b.wait_for_timeout(200)
    # 检查 realname-gate.js 加载
    gate_ok = page_b.evaluate("typeof window.LJRealname !== 'undefined' && typeof window.LJRealname.gate === 'function'")
    if gate_ok:
        pass_("heart-island.html 已加载 LJRealname 实名门控", "LJRealname.gate defined")
    else:
        fail_("heart-island.html 缺 LJRealname", "realname-gate.js 未生效")

    # 点击「创建新角色」按钮
    create_btn = page_b.locator("#heart-create")
    if create_btn.count() == 0:
        fail_("心屿页找不到 #heart-create 按钮", "")
    else:
        pass_("心屿页存在 #heart-create 按钮", "")
        create_btn.first.click()
        page_b.wait_for_timeout(500)
        # 检查 modal 弹起
        modal_open = page_b.evaluate("document.getElementById('rnm-mask')?.classList.contains('open') || false")
        if modal_open:
            pass_("未实名前点击创建新角色 → modal 弹起", "rnm-mask.open=true")
        else:
            fail_("未实名点击创建新角色 → modal 未弹", "rnm-mask.open=false")
            page_b.screenshot(path="/tmp/v20u_b_fail.png")

        if modal_open:
            # F-1: 姓名长度校验
            page_b.fill("#rnm-name", "A")  # 太短
            page_b.fill("#rnm-id", "11010119900101000X")  # 18 位身份证
            page_b.click("#rnm-submit")
            page_b.wait_for_timeout(300)
            still_open_after_bad_name = page_b.evaluate("document.getElementById('rnm-mask')?.classList.contains('open') || false")
            if still_open_after_bad_name:
                pass_("姓名 1 位被拒绝（modal 仍 open）", "")
            else:
                fail_("姓名 1 位未被拒绝", "")

            # F-2: 身份证号格式校验
            page_b.fill("#rnm-name", "张三")
            page_b.fill("#rnm-id", "12345")  # 太短
            page_b.click("#rnm-submit")
            page_b.wait_for_timeout(300)
            still_open_after_bad_id = page_b.evaluate("document.getElementById('rnm-mask')?.classList.contains('open') || false")
            if still_open_after_bad_id:
                pass_("身份证号 5 位被拒绝（modal 仍 open）", "")
            else:
                fail_("身份证号 5 位未被拒绝", "")

            # F-3: 取消按钮关闭 modal
            page_b.click("#rnm-cancel")
            page_b.wait_for_timeout(300)
            closed_by_cancel = page_b.evaluate("!document.getElementById('rnm-mask')?.classList.contains('open')")
            if closed_by_cancel:
                pass_("点击取消按钮关闭 modal", "")
            else:
                fail_("取消按钮未关闭 modal", "")

            # 再开 modal → 提交正确信息 → 写 localStorage + 跳走
            create_btn.first.click()
            page_b.wait_for_timeout(500)
            page_b.fill("#rnm-name", "张三")
            page_b.select_option("#rnm-type", "身份证")
            page_b.fill("#rnm-id", "11010119900101000X")
            page_b.click("#rnm-submit")
            page_b.wait_for_timeout(1200)
            # 检查 localStorage
            done_after = page_b.evaluate("localStorage.getItem('lingjing_v519_realname_done')")
            if done_after == "true":
                pass_("提交成功后写入 lingjing_v519_realname_done=true", f"value={done_after}")
            else:
                fail_("提交成功但未写入 lingjing_v519_realname_done", f"value={done_after}")
            # 检查 URL 跳到 character-create.html
            cur_url = page_b.url
            if "character-create.html" in cur_url:
                pass_("提交后跳转到 character-create.html", cur_url)
            else:
                fail_("提交后未跳转到 character-create.html", cur_url[:80])

    # ============================================================
    # C. 创作 Tab 未实名 → 创建智能体 → modal 弹起 + 写入 + 跳走
    # ============================================================
    print("\n[C] 创作 Tab 未实名 · 创建智能体 → 实名 modal")
    ctx_c = b.new_context(viewport={"width": 390, "height": 844})
    page_c = ctx_c.new_page()
    page_c.on("pageerror", lambda e: errs.append({"where": "C", "msg": str(e)}))
    ctx_c.add_init_script("try{if(!localStorage.getItem('lingjing_v519_realname_done')){localStorage.removeItem('lingjing_v519_realname_done')}localStorage.setItem('lingjing_is_creator','true'); localStorage.setItem('lingjing_onboarding_done','true'); localStorage.setItem('lingjing_v519_realname_tries','0')}catch(e){}")
    page_c.goto(f"{BASE}/output/preview/creator-center.html", wait_until="networkidle")
    page_c.wait_for_timeout(1500)
    gate_loaded = page_c.evaluate("typeof window.LJRealname !== 'undefined'")
    if gate_loaded:
        pass_("creator-center.html 已加载 LJRealname", "")
    else:
        fail_("creator-center.html 缺 LJRealname", "")
    # 点击创建智能体
    agent_btn = page_c.locator("a.big-btn.agent")
    if agent_btn.count() == 0:
        fail_("创作页找不到 .big-btn.agent 创建智能体按钮", "")
    else:
        pass_("创作页存在 .big-btn.agent 按钮", "")
        # 阻止默认跳转以观察 modal
        page_c.evaluate("window.addEventListener('beforeunload', e => e.preventDefault())")  # 无效
        agent_btn.first.click()
        page_c.wait_for_timeout(700)
        modal_open_c = page_c.evaluate("document.getElementById('rnm-mask')?.classList.contains('open') || false")
        if modal_open_c:
            pass_("未实名前点击创建智能体 → modal 弹起", "")
            # 提交
            page_c.fill("#rnm-name", "李四")
            page_c.fill("#rnm-id", "11010119900202000X")
            page_c.click("#rnm-submit")
            page_c.wait_for_timeout(1200)
            done_c = page_c.evaluate("localStorage.getItem('lingjing_v519_realname_done')")
            if done_c == "true":
                pass_("创作创建智能体 · 提交成功写入 localStorage", f"value={done_c}")
            else:
                fail_("创作创建智能体 · 未写入 localStorage", f"value={done_c}")
            cur_url_c = page_c.url
            if "character-create.html" in cur_url_c:
                pass_("创作创建智能体 · 跳转 character-create.html", cur_url_c)
            else:
                # 可能被 beforeunload 阻止？不影响 modal 流程，URL 应已变
                fail_("创作创建智能体 · 未跳转 character-create.html", cur_url_c[:80])
        else:
            fail_("未实名前点击创建智能体 · modal 未弹", "")
            page_c.screenshot(path="/tmp/v20u_c_fail.png")

    # ============================================================
    # D. 心屿 Tab 已实名 → 创建新角色 → 不弹 modal，直接跳走
    # ============================================================
    print("\n[D] 心屿 Tab 已实名 · 创建新角色 → 不弹 modal")
    ctx_d = b.new_context(viewport={"width": 390, "height": 844})
    page_d = ctx_d.new_page()
    page_d.on("pageerror", lambda e: errs.append({"where": "D", "msg": str(e)}))
    ctx_d.add_init_script("try{localStorage.setItem('lingjing_v519_realname_done','true'); localStorage.setItem('lingjing_onboarding_done','true')}catch(e){}")
    page_d.goto(f"{BASE}/output/preview/heart-island.html", wait_until="networkidle")
    page_d.wait_for_timeout(1200)
    page_d.evaluate("document.querySelectorAll('.heart-dialog-mask').forEach(m=>m.remove()); document.querySelectorAll('.heart-dialog').forEach(d=>d.remove());")
    page_d.wait_for_timeout(300)
    page_d.click("#heart-create")
    page_d.wait_for_timeout(1500)
    cur_url_d = page_d.url
    modal_d = page_d.evaluate("document.getElementById('rnm-mask')?.classList.contains('open') || false")
    if not modal_d:
        pass_("已实名前点击 → modal 未弹起", "")
    else:
        fail_("已实名前点击 → modal 仍弹起", "")
    if "character-create.html" in cur_url_d:
        pass_("已实名前点击 → 直接跳转到 character-create.html", cur_url_d)
    else:
        fail_("已实名前点击 → 未跳转 character-create.html", cur_url_d[:80])

    # ============================================================
    # E. 创作 Tab 已实名 → 创建智能体 → 不弹 modal
    # ============================================================
    print("\n[E] 创作 Tab 已实名 · 创建智能体 → 不弹 modal")
    ctx_e = b.new_context(viewport={"width": 390, "height": 844})
    page_e = ctx_e.new_page()
    page_e.on("pageerror", lambda e: errs.append({"where": "E", "msg": str(e)}))
    ctx_e.add_init_script("try{localStorage.setItem('lingjing_v519_realname_done','true'); localStorage.setItem('lingjing_is_creator','true'); localStorage.setItem('lingjing_onboarding_done','true')}catch(e){}")
    page_e.goto(f"{BASE}/output/preview/creator-center.html", wait_until="networkidle")
    page_e.wait_for_timeout(1200)
    page_e.click("a.big-btn.agent")
    page_e.wait_for_timeout(1500)
    modal_e = page_e.evaluate("document.getElementById('rnm-mask')?.classList.contains('open') || false")
    if not modal_e:
        pass_("创作已实名前点击创建智能体 → modal 未弹起", "")
    else:
        fail_("创作已实名前 → modal 仍弹起", "")
    cur_url_e = page_e.url
    if "character-create.html" in cur_url_e:
        pass_("创作已实名 → 直接跳转到 character-create.html", cur_url_e)
    else:
        fail_("创作已实名 → 未跳转 character-create.html", cur_url_e[:80])

    b.close()

# ============================================================
# 汇总
# ============================================================
print("\n" + "=" * 60)
print("V20-U · 实名门控真点击测试报告")
print("=" * 60)
total = len(results)
passed = sum(1 for r in results if r["result"] == "PASS")
failed = sum(1 for r in results if r["result"] == "FAIL")
print(f"\n总断言数：{total}")
print(f"PASS：{passed}")
print(f"FAIL：{failed}")
if errs:
    print(f"\nPage Errors ({len(errs)}):")
    for e in errs[:5]:
        print(f"  [{e['where']}] {e['msg'][:150]}")
else:
    print("\n✓ 0 Page Error")

# 保存结果
out = Path("scripts/v20u_realname_gate_audit.json")
out.write_text(json.dumps({"results": results, "errs": errs, "summary": {"total": total, "pass": passed, "fail": failed}}, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"\n报告：{out}")

if failed > 0 or errs:
    print("\n❌ FAIL 详情：")
    for r in results:
        if r["result"] == "FAIL":
            print(f"  - {r['item']}: {r['evidence']}")
    sys_exit = 1
else:
    print("\n🎉 V20-U 全绿")
    sys_exit = 0

import sys
sys.exit(sys_exit)