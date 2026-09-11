# -*- coding: utf-8 -*-
"""
V20-H · 公版小说真实语料库 + 三国演义小说世界 回归测试
覆盖：
  A. 语料库静态校验（40 本文件 + manifest 真实字数 + 三国 120 回）
  B. sanguo-world.html 端到端（加载 120 回 / 目录 12 卷 / 免费阅读 / 锁触发 / 付费解锁 / 阅读券 / 全书券 / 签到 / 进度保存 / 字号）
  C. public-domain.html 真实数据联动（三国卡片 → 小说世界入口）
"""
import json, os, re, sys
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = 'http://localhost:8767'
SHOT = os.path.join(ROOT, 'output', 'preview', 'screenshots')
os.makedirs(SHOT, exist_ok=True)

PASS = FAIL = 0
def check(name, cond, detail=''):
    global PASS, FAIL
    if cond:
        PASS += 1; print(f'  PASS {name}')
    else:
        FAIL += 1; print(f'  FAIL {name}  {detail}')

# ============ A. 语料库静态校验 ============
print('\n=== A. 语料库静态校验 ===')
manifest = json.load(open(os.path.join(ROOT, 'corpus', 'manifest.json'), encoding='utf-8'))
ok_books = [b for b in manifest if 'error' not in b]
check('A1 manifest 40 本', len(manifest) == 40, f'got {len(manifest)}')
check('A2 全部构建成功', len(ok_books) == 40, f'errors: {[b["id"] for b in manifest if "error" in b]}')

zh = [b for b in ok_books if b['lang'] == 'zh']
en = [b for b in ok_books if b['lang'] == 'en']
check('A3 中文 25 本', len(zh) == 25, f'got {len(zh)}')
check('A4 外文 15 本', len(en) == 15, f'got {len(en)}')

sg = [b for b in ok_books if b['id'] == 'sanguoyanyi'][0]
check('A5 三国演义 120 回', sg['chapters'] == 120, f'got {sg["chapters"]}')
check('A6 三国演义 48 万字级别', 400000 < sg['words'] < 600000, f'got {sg["words"]}')

# 所有 books/*.txt 存在且非空
missing = [b['id'] for b in ok_books
           if not os.path.exists(os.path.join(ROOT, 'corpus', 'books', b['id'] + '.txt'))]
check('A7 40 本 txt 全部落盘', len(missing) == 0, f'missing {missing}')

total_mb = sum(b['sizeBytes'] for b in ok_books) / 1024 / 1024
check('A8 语料库总量 30MB+', total_mb > 30, f'{total_mb:.1f}MB')

# 三国内容抽查：首回 + 末回关键句
sgtxt = open(os.path.join(ROOT, 'corpus', 'books', 'sanguoyanyi.txt'), encoding='utf-8').read()
check('A9 首回「宴桃园豪杰三结义」', '宴桃园豪杰三结义' in sgtxt)
check('A10 末回「降孙皓三分归一统」', '降孙皓三分归一统' in sgtxt)
check('A11 名句「话说天下大势」', '话说天下大势' in sgtxt)
check('A12 简体（无「國」残留主体）', sgtxt.count('國') < 20, f'殘留 {sgtxt.count("國")} 处')

# ============ B. sanguo-world.html 端到端 ============
print('\n=== B. 三国演义小说世界端到端 ===')
with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-gpu'])
    ctx = b.new_context(viewport={'width': 390, 'height': 844})
    page = ctx.new_page()

    page.goto(f'{BASE}/output/preview/sanguo-world.html', wait_until='domcontentloaded')
    page.wait_for_timeout(1500)  # 等 fetch + 解析

    check('B1 顶栏 + 书名', page.is_visible('.sg-title b'))
    check('B2 钱包渲染（默认 100 灵玉 + 60 灵晶）',
          page.text_content('#sg-jade').strip() == '100' and page.text_content('#sg-crystal').strip() == '60')

    vols = page.locator('.sg-vol').count()
    check('B3 目录 12 卷', vols == 12, f'got {vols}')
    chs = page.locator('.sg-ch').count()
    check('B4 目录 120 回', chs == 120, f'got {chs}')
    check('B5 卷一免费标记', '免费' in (page.locator('.sg-vol').first.text_content() or ''))
    check('B6 卷二锁定标记（20 💎）', '20' in (page.locator('.sg-vol').nth(1).text_content() or ''))
    page.screenshot(path=f'{SHOT}/v20-h-sanguo-catalog.png')

    # 免费读第一回
    print('\n--- B7-B10 免费阅读 ---')
    page.click('.sg-ch >> nth=0')
    page.wait_for_timeout(600)
    check('B7 阅读器打开', page.is_visible('#sg-reader.open'))
    check('B8 第一回标题（宴桃园豪杰三结义）', '宴桃园豪杰三结义' in (page.text_content('#sg-article') or ''))
    paras = page.locator('#sg-article p').count()
    check('B9 正文段落 > 10', paras > 10, f'got {paras}')
    # 滚动后进度条变宽
    page.evaluate('document.getElementById("sg-reader").scrollTop = 500')
    page.wait_for_timeout(400)
    pw = page.evaluate('document.getElementById("sg-progress").style.width')
    check('B10 阅读进度条随滚动增长', pw not in ('', '0%', '0px') , f'width={pw}')
    page.screenshot(path=f'{SHOT}/v20-h-sanguo-read-ch1.png')

    # 锁定回触发付费弹窗
    print('\n--- B11-B14 付费解锁 ---')
    page.evaluate('SGWorld.closeReader()')
    page.wait_for_timeout(300)
    page.click('.sg-ch >> nth=10')  # 第 11 回（卷二 · 锁定）
    page.wait_for_timeout(400)
    check('B11 锁定回弹付费 sheet', page.is_visible('#sg-sheet.open'))
    sheet_txt = page.text_content('#sg-sheet-body') or ''
    check('B12 sheet 含本卷 20 💎 选项', '20 💎' in sheet_txt)
    check('B13 sheet 含全书券 128 💎 选项', '128 💎' in sheet_txt)
    check('B14 sheet 含阅读券选项', '阅读券' in sheet_txt)
    page.screenshot(path=f'{SHOT}/v20-h-sanguo-paysheet.png')

    # 余额足够（60）→ 买卷二成功
    page.evaluate('SGWorld.buyVol(2)')
    page.wait_for_timeout(400)
    crystal = page.evaluate('JSON.parse(localStorage.getItem("lingjing_v520_sanguo_wallet")).crystal')
    check('B15 买卷二扣 20 灵晶（60→40）', crystal == 40, f'got {crystal}')
    vols = page.evaluate('JSON.parse(localStorage.getItem("lingjing_v520_sanguo_vols"))')
    check('B16 卷二写入已解锁', 2 in vols)

    # 卷二第 11 回现在可读
    page.evaluate('SGWorld.readChapter(11)')
    page.wait_for_timeout(500)
    check('B17 第 11 回可读（刘皇叔北海救孔融）', '北海' in (page.text_content('#sg-article') or ''))
    page.evaluate('SGWorld.closeReader()')

    # 全书券（40 不够 128）→ 提示不足
    print('\n--- B18-B19 全书券 ---')
    page.evaluate('SGWorld.openPassSheet()')
    page.wait_for_timeout(300)
    page.evaluate('SGWorld.buyPass()')
    page.wait_for_timeout(300)
    crystal = page.evaluate('JSON.parse(localStorage.getItem("lingjing_v520_sanguo_wallet")).crystal')
    check('B18 灵晶不足不扣款', crystal == 40)
    # 充值 200 → 买全书券成功
    page.evaluate('var w=JSON.parse(localStorage.getItem("lingjing_v520_sanguo_wallet")); w.crystal+=200; localStorage.setItem("lingjing_v520_sanguo_wallet",JSON.stringify(w))')
    page.evaluate('SGWorld.buyPass()')
    page.wait_for_timeout(300)
    has_pass = page.evaluate('JSON.parse(localStorage.getItem("lingjing_v520_sanguo_pass"))')
    crystal = page.evaluate('JSON.parse(localStorage.getItem("lingjing_v520_sanguo_wallet")).crystal')
    check('B19 全书券购买成功（240-128=112）', has_pass is True and crystal == 112, f'pass={has_pass} crystal={crystal}')
    # 全书券后 120 回全解锁
    check('B20 全书券后末回可读', page.evaluate('chUnlocked(120)'))

    # 阅读券流程
    print('\n--- B21-B23 阅读券 ---')
    page.evaluate('SGWorld.closeSheet()')
    page.evaluate('localStorage.setItem("lingjing_v520_sanguo_pass", "false")')  # 重置以便测券
    page.evaluate('localStorage.setItem("lingjing_v520_sanguo_vols", "[]")')
    page.evaluate('SGWorld.exchange(1)')
    page.wait_for_timeout(300)
    tickets = page.evaluate('JSON.parse(localStorage.getItem("lingjing_v520_sanguo_tickets"))')
    jade = page.evaluate('JSON.parse(localStorage.getItem("lingjing_v520_sanguo_wallet")).jade')
    check('B21 灵玉兑券（100-10=90 · 券 0→1）', tickets == 1 and jade == 90, f't={tickets} jade={jade}')
    page.evaluate('SGWorld.useTicket(15)')
    page.wait_for_timeout(500)
    chs_unlocked = page.evaluate('JSON.parse(localStorage.getItem("lingjing_v520_sanguo_chs"))')
    check('B22 用券解锁第 15 回', 15 in chs_unlocked)
    check('B23 用券后直接进入阅读', page.is_visible('#sg-reader.open'))
    page.evaluate('SGWorld.closeReader()')

    # 签到
    print('\n--- B24-B25 签到 ---')
    page.evaluate('localStorage.setItem("lingjing_v520_sanguo_checkin", "")')
    jade0 = page.evaluate('JSON.parse(localStorage.getItem("lingjing_v520_sanguo_wallet")).jade')
    page.evaluate('SGWorld.checkin()')
    page.wait_for_timeout(300)
    jade1 = page.evaluate('JSON.parse(localStorage.getItem("lingjing_v520_sanguo_wallet")).jade')
    check('B24 签到 +10 灵玉', jade1 == jade0 + 10, f'{jade0}→{jade1}')
    page.evaluate('SGWorld.checkin()')
    page.wait_for_timeout(200)
    jade2 = page.evaluate('JSON.parse(localStorage.getItem("lingjing_v520_sanguo_wallet")).jade')
    check('B25 重复签到不重复领', jade2 == jade1)

    # 阅读进度保存
    print('\n--- B26-B27 进度与字号 ---')
    page.evaluate('SGWorld.readChapter(5)')
    page.wait_for_timeout(400)
    check('B26 进度落盘第 5 回',
          page.evaluate('JSON.parse(localStorage.getItem("lingjing_v520_sanguo_progress")).ch') == 5)
    page.evaluate('SGWorld.setFont(2)')
    page.wait_for_timeout(200)
    fs = page.evaluate('document.querySelector("#sg-article p").style.fontSize')
    check('B27 字号切换大（19px）', fs == '19px', f'got {fs}')
    page.evaluate('SGWorld.closeReader()')

    # 关键页面截图（支付前状态）
    page.evaluate('localStorage.clear()')
    page.reload(wait_until='domcontentloaded')
    page.wait_for_timeout(1500)
    page.screenshot(path=f'{SHOT}/v20-h-sanguo-fresh.png')
    b.close()

# ============ C. public-domain.html 联动 ============
print('\n=== C. 公版库联动 ===')
with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-gpu'])
    ctx = b.new_context(viewport={'width': 390, 'height': 844})
    page = ctx.new_page()
    page.goto(f'{BASE}/output/preview/public-domain.html', wait_until='domcontentloaded')
    page.wait_for_timeout(1000)

    # 三国卡片显示真实数据（485415 字 → 49 万字）
    body = page.text_content('body') or ''
    check('C1 库页含真实字数展示（49 万字）', '49 万字' in body)
    # 详情弹窗
    page.evaluate('LJPubDom.showDetail("sanguoyanyi")')
    page.wait_for_timeout(400)
    detail = page.text_content('#pd-detail-modal') or ''
    check('C2 详情含 120 章', '120 章' in detail)
    check('C3 详情含「原文保留率」', '原文保留率' in detail)
    page.screenshot(path=f'{SHOT}/v20-h-pd-detail.png')
    # 进入小说世界跳转
    href = page.evaluate('LJPubDom.enterPlot.toString().indexOf("sanguo-world") >= 0')
    check('C4 enterPlot 三国 → sanguo-world.html', href)
    b.close()

print(f'\n{"="*50}\nV20-H 结果：{PASS} PASS / {FAIL} FAIL')
sys.exit(1 if FAIL else 0)
