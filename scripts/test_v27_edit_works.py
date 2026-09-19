# -*- coding: utf-8 -*-
"""V27 编辑我的作品 全链路回归（P1~P5）
前置：单 HTML 架构（根 index.html，iframe#stage + srcdoc 路由）
运行：LJ_TEST_PORT=8899 python scripts/test_v27_edit_works.py
产出：screenshots/v27/*.png + 终端 PASS/FAIL 报告（非 0 退出码 = 有失败）
"""
import io
import os
import sys
import threading
import functools
import time
import http.client
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get('LJ_TEST_PORT', '8899'))
SHOTS = os.path.join(ROOT, 'screenshots', 'v27')
os.makedirs(SHOTS, exist_ok=True)

RESULTS = []

def check(name, cond, detail=''):
    ok = bool(cond)
    RESULTS.append((name, ok, detail))
    print(('PASS  ' if ok else 'FAIL  ') + name + (('  | ' + str(detail)) if detail and not ok else ''))
    return ok


def serve():
    handler = functools.partial(SimpleHTTPRequestHandler, directory=ROOT)
    httpd = ThreadingHTTPServer(('127.0.0.1', PORT), handler)
    httpd.daemon_threads = True
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    # 等待端口就绪
    for _ in range(50):
        try:
            c = http.client.HTTPConnection('127.0.0.1', PORT, timeout=1)
            c.request('GET', '/')
            r = c.getresponse()
            c.close()
            if r.status == 200:
                return httpd
        except Exception:
            time.sleep(0.2)
    raise RuntimeError('server not ready')


SEED = """(function(){
  try {
    localStorage.setItem('lingjing_onboarding_done','true');
    localStorage.setItem('lingjing_account_kind','guest');
    localStorage.setItem('lingjing_user_profile', JSON.stringify({name:'测试作者',gender:'female',ageRange:'25-30',companionType:'story'}));
    localStorage.setItem('lingjing_v519_realname_done','true');
  } catch(e){}
})();"""


def stage_frame(page):
    """返回 srcdoc 子 Frame（工作区 iframe 内容）"""
    for f in page.frames:
        if f != page.main_frame:
            return f
    raise RuntimeError('no stage frame found')


def shot(page, name):
    page.screenshot(path=os.path.join(SHOTS, name))
    print('      shot ->', name)


def goto_hash(page, base, step, route):
    """带 query 的全量跳转（避免同文档 hash 导航不触发 LJEnter）"""
    page.goto('%s/?step=%d#/%s' % (base, step, route), wait_until='load')
    page.wait_for_selector('#stage.on', timeout=10000)
    page.wait_for_timeout(600)


def run():
    from playwright.sync_api import sync_playwright, expect

    httpd = serve()
    base = 'http://127.0.0.1:%d' % PORT
    page_errors = []
    console_errs = []

    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch()
            ctx = b.new_context(viewport={'width': 400, 'height': 880},
                                device_scale_factor=2, locale='zh-CN')
            ctx.add_init_script(SEED)
            page = ctx.new_page()
            page.on('pageerror', lambda e: page_errors.append(str(e)))
            page.on('console', lambda m: console_errs.append(m.text) if m.type == 'error' else None)
            frl = page.frame_locator('#stage')

            def F(sel, *args, **kw):
                return page.frame_locator('#stage').locator(sel, *args, **kw)

            # ---------- S0 首页启动 ----------
            goto_hash(page, base, 0, 'home')
            check('S0 首页启动（跳过引导）', '#/home' in page.url and F('body').count() >= 0, page.url)
            shot(page, 's00_home.png')

            # ---------- S1 创作 Tab → creator-center ----------
            F('.tabbar a[data-tab="create"]').click()
            page.wait_for_timeout(700)
            check('S1 底部 Tab 进入创作中心', '#/creator-center' in page.url, page.url)

            # ---------- S2 → my-works：卡片 6 按钮 ----------
            F('a.more[href="my-works.html"]').click()
            page.wait_for_timeout(700)
            check('S2a 进入编辑我的作品', '#/my-works' in page.url, page.url)
            n_items = F('.mw-item').count()
            check('S2b 作品列表渲染（≥6 部）', n_items >= 6, '实际 %d' % n_items)
            card1 = F('.mw-item').nth(0)
            acts = card1.locator('.acts .a')
            acts_texts = [acts.nth(i).inner_text() for i in range(acts.count())]
            need = ['续写', '收费', '数据', '预览', '图片管理', '删除']
            missing = [k for k in need if not any(k in t for t in acts_texts)]
            check('S2c 《西游记》卡 6 操作按钮齐全', not missing, '缺 %s，实际 %s' % (missing, acts_texts))
            shot(page, 's01_my_works.png')

            # ---------- S3 P1 右上角返回 ----------
            F('button.icon-btn[onclick="LJBack()"]').click()
            page.wait_for_timeout(700)
            check('S3 P1 右上角返回 → 回创作中心（弹栈）', '#/creator-center' in page.url, page.url)
            F('a.more[href="my-works.html"]').click()
            page.wait_for_timeout(700)

            # ---------- S4 删除作品 + 持久化（基线动态：CreatorStore 可能追加演示卡） ----------
            n0 = F('.mw-item').count()
            F('.mw-item').nth(1).locator('span.a', has_text='删除').click()
            page.wait_for_timeout(300)
            check('S4a 删除确认弹窗出现', F('#mw-c-ok').count() == 1)
            shot(page, 's02_delete_confirm.png')
            F('#mw-c-ok').click()
            page.wait_for_timeout(500)
            n_after = F('.mw-item').count()
            check('S4b 删除后列表 -1（%d→%d）' % (n0, n_after), n_after == n0 - 1, '实际 %d' % n_after)
            goto_hash(page, base, 4, 'my-works')
            n_reload = F('.mw-item').count()
            check('S4c 刷新后仍为 %d（持久化）' % (n0 - 1), n_reload == n0 - 1, '实际 %d' % n_reload)

            # ---------- S5 P2 收费道具：添加 → 弹窗 → 保存 ----------
            F('.mw-item').nth(0).locator('.a', has_text='收费').click()
            page.wait_for_timeout(700)
            check('S5a 进入收费设置 Tab', F('.et.active[data-tab="pricing"]').count() == 1, page.url)
            rows0 = F('#monetItemList > div').count()
            check('S5b 默认收费道具 3 条', rows0 == 3, '实际 %d' % rows0)
            F('.pricing-row[onclick*="openAddPricingItem"]').click()
            page.wait_for_timeout(300)
            check('S5c 添加弹窗出现（六字段）',
                  F('#piName').count() == 1 and F('#piDesc').count() == 1 and
                  F('#piPrice').count() == 1 and F('#piTrig').count() == 1 and
                  F('#piUp').count() == 1 and F('#piAi').count() == 1 and F('#piPre').count() == 1)
            shot(page, 's03_pricing_dialog.png')
            F('#piName').fill('测试灵符')
            F('#piDesc').fill('回归测试道具：解锁隐藏结局线索')
            F('#piPrice').fill('88')
            F('#piTrig').fill('第八章 Boss 战后')
            F('.type-pill[data-t="collectible"]').click()
            F('#piPre').click()
            page.wait_for_timeout(300)
            check('S5d 预设库弹窗出现', F('#preGrid .preset-item').count() >= 3,
                  '实际 %d' % F('#preGrid .preset-item').count())
            F('#preGrid .preset-item').nth(0).click()
            page.wait_for_timeout(300)
            F('#piOk').click()
            page.wait_for_timeout(600)
            rows1 = F('#monetItemList > div').count()
            check('S5e 保存后 3→4 条', rows1 == 4, '实际 %d' % rows1)
            check('S5f 新道具「测试灵符」入列', F('#monetItemList', has_text='测试灵符').count() >= 1)
            stored = stage_frame(page).evaluate("JSON.parse(localStorage.getItem('lingjing_v527_monet_items')||'{}')")
            check('S5g localStorage 按 wid 分组持久化',
                  'changye' in stored and any(x.get('name') == '测试灵符' for x in stored.get('changye', [])),
                  str(stored.get('changye', []))[:120])
            shot(page, 's04_pricing_saved.png')
            # 编辑：第 4 条改名
            F('#monetItemList > div').nth(3).locator('.mn-acts .mn-btn', has_text='编辑').click()
            page.wait_for_timeout(300)
            check('S5h 编辑弹窗回填「测试灵符」',
                  F('#piName').count() == 1 and F('#piName').input_value() == '测试灵符')
            F('#piName').fill('测试灵符·改')
            F('#piOk').click()
            page.wait_for_timeout(500)
            check('S5i 编辑保存生效', F('#monetItemList', has_text='测试灵符·改').count() >= 1)

            # ---------- S6 P3 续写：候选使用/换一批/我来说 ----------
            F('.et[data-tab="edit"]').click()
            page.wait_for_timeout(400)
            n_cand = F('.ai-cand').count()
            check('S6a AI 续写候选恒 4 条', n_cand == 4, '实际 %d' % n_cand)
            ed = F('#editorContent')
            len0 = len(ed.inner_text())
            words0 = F('#sbWords').inner_text()
            first_cand0 = F('.ai-cand').nth(0).inner_text()
            F('.ai-cand .cand-use').nth(0).click()
            page.wait_for_timeout(500)
            len1 = len(ed.inner_text())
            check('S6b 点[使用]写入正文（文本变长）', len1 > len0, '%d -> %d' % (len0, len1))
            words1 = F('#sbWords').inner_text()
            check('S6c 字数状态栏实时更新', words0 != words1, '%s -> %s' % (words0, words1))
            shot(page, 's05_ai_used.png')
            F('#candMore').click()
            page.wait_for_timeout(400)
            first_cand1 = F('.ai-cand').nth(0).inner_text()
            check('S6d 换一批刷新候选', first_cand1 != first_cand0 and F('.ai-cand').count() >= 3)
            F('#candMine').click()
            page.wait_for_timeout(300)
            check('S6e 我来说输入框出现', F('.lj-ov textarea, .lj-ov input[type="text"]').count() >= 1)
            F('.lj-ov textarea').first.fill('我手写的一句：夜风穿过酒馆的灯。')
            F('.lj-ov button', has_text='确定').first.click()
            page.wait_for_timeout(500)
            check('S6f 我来说内容写入正文', '夜风穿过酒馆的灯' in ed.inner_text())
            # AI 润色
            F('.tb[onclick="aiAssist(\'polish\')"]').click()
            page.wait_for_timeout(400)
            check('S6g AI 润色出候选', F('.ai-cand').count() >= 3, '实际 %d' % F('.ai-cand').count())
            paras0 = F('#editorContent p').count()
            F('.ai-cand .cand-use').nth(0).click()
            page.wait_for_timeout(500)
            shot(page, 's06_polish.png')

            # ---------- S7 P4 图片管理：三区 + 来源三方式 + 版本 ----------
            F('.et[data-tab="assets"]').click()
            page.wait_for_timeout(400)
            nb = F('#grid-bg .asset-card').count()
            nc = F('#grid-char .asset-card').count()
            np_ = F('#grid-prop .asset-card').count()
            check('S7a 三区卡片齐全 bg/char/prop', nb > 0 and nc > 0 and np_ > 0,
                  '%d/%d/%d' % (nb, nc, np_))
            shot(page, 's07_assets.png')
            F('#grid-bg .asset-card .ac-img').nth(0).click()
            page.wait_for_timeout(300)
            check('S7b 更换图片弹窗三方式', F('.lj-box .src-opt[data-s="up"]').count() == 1 and
                  F('.lj-box .src-opt[data-s="ai"]').count() == 1 and
                  F('.lj-box .src-opt[data-s="pre"]').count() == 1)
            shot(page, 's08_asset_source.png')
            F('.lj-box .src-opt[data-s="ai"]').click()
            page.wait_for_timeout(300)
            check('S7c AI 生成 4 候选', F('#aiGrid .preset-item').count() == 4,
                  '实际 %d' % F('#aiGrid .preset-item').count())
            F('#aiGrid .preset-item').nth(0).click()
            page.wait_for_timeout(500)
            F('#grid-bg .asset-card [data-a="ver"]').nth(0).click()
            page.wait_for_timeout(300)
            n_ver = F('.lj-box .ver-item').count()
            check('S7d 版本历史可回滚（≥V1）', n_ver >= 1 and F('.lj-box .ver-roll').count() >= 1,
                  'ver=%d' % n_ver)
            shot(page, 's09_versions.png')
            F('.lj-box .ver-roll').nth(0).click()
            page.wait_for_timeout(400)

            # ---------- S8 P5 预览：章节选择 → 真实 Runtime → 反馈面板 ----------
            F('.et[data-tab="edit"]').click()
            page.wait_for_timeout(400)
            F('.act-btn[onclick="previewWork()"]').click()
            page.wait_for_timeout(400)
            n_ch = F('.lj-box .src-opt[data-ch]').count()
            check('S8a 预览弹层列出章节（≥2）', n_ch >= 2, '实际 %d' % n_ch)
            shot(page, 's10_preview_picker.png')
            F('.lj-box .src-opt[data-ch]').nth(1 if n_ch >= 2 else 0).click()
            page.wait_for_timeout(900)
            check('S8b 进入小说世界 Runtime（preview=1）',
                  '#/novel-canon-reader' in page.url and 'preview=1' in page.url, page.url)
            check('S8c 预览悬浮条显示', F('#lj-preview-bar.show').count() == 1)
            check('S8d 舞台激活（八层 Runtime）', F('#canon-stage-screen.show').count() == 1)
            page.wait_for_timeout(2800)
            shot(page, 's11_preview_runtime.png')
            F('#lj-preview-bar .pv-back').click()
            page.wait_for_timeout(900)
            check('S8e 返回编辑器', '#/work-editor' in page.url, page.url)
            check('S8f 预览反馈面板弹出（3 组）', F('.lj-ov .fb-group').count() == 3,
                  '实际 %d' % F('.lj-ov .fb-group').count())
            shot(page, 's12_feedback.png')
            F('.fb-group').nth(0).get_by_text('满意', exact=True).click()
            page.wait_for_timeout(200)
            fix_hidden = F('.fb-group').nth(0).locator('.fb-fix.show').count() == 0
            check('S8g 满意 → 隐藏跳转按钮', fix_hidden)
            F('.lj-ov [data-go="monet"]').click()
            page.wait_for_timeout(500)
            check('S8h 不满意收费道具 → 跳转收费 Tab', F('.et.active[data-tab="pricing"]').count() == 1)

            # ---------- 汇总 ----------
            real_errs = [e for e in page_errors]
            noise = [e for e in console_errs
                     if 'favicon' not in e and 'Failed to load resource' not in e]
            check('Z1 无未捕获 JS 异常', len(real_errs) == 0, '; '.join(real_errs[:3]))
            check('Z2 无 console error（排除资源 404）', len(noise) == 0, '; '.join(noise[:3]))
            b.close()
    finally:
        httpd.shutdown()

    ok = sum(1 for _, c, _ in RESULTS if c)
    total = len(RESULTS)
    print('\n========== V27 回归结果: %d/%d PASS ==========' % (ok, total))
    for name, c, d in RESULTS:
        if not c:
            print('  FAIL:', name, '|', d)
    if ok != total:
        sys.exit(1)


if __name__ == '__main__':
    run()
