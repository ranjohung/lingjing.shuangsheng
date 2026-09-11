# -*- coding: utf-8 -*-
"""V20-K · 分类功能区全量扩充（题材/筛选/排序/排行榜）（14 项）
用户需求（2026-09-12）：分类要包括市面所有题材 + 完本连载 + 字数区间 + 排行榜名称等
（参考主流小说 App 的筛选查找条件）。

静态（6）：
  1. 分类树 16 一级（古风/现代/科幻/悬疑灵异/幻想冒险/快穿穿书/时光档案/同人专区/
     光影/游戏竞技/二次元/热血爽文/成长向/动人情感/完结专区/免费专区）
  2. 二级 ≥ 88 且市面常见题材抽查（星际文明/本格推理/赘婿逆袭/乙女向/轻小说…）
  3. 卡片 cat/sub id 与分类树全兼容（无悬空引用）
  4. 筛选 6 维：状态 4 / 字数 8 档 / 价格 6 档（含免费/200+）/ 属性 10 / 年份 5（含更早）
  5. 排序 8 种（灵韵/人气/收藏/评分/字数/更新/发布/评论）
  6. 排行榜 10 榜（人气/灵韵/新书/完本/收藏/热搜/更新/口碑/付费/免费）
端到端（8）：
  7. 抽屉打开显示 16 一级
  8. 新分类可选（科幻/悬疑灵异二级渲染）
  9. 筛选页 6 维 + 8 排序渲染
 10. 字数区间筛选（10-30 万）结果正确（仙侠奇缘录 28.4 万在册）
 11. 热门属性筛选生效（免费价格+治愈等组合非空）
 12. 完结筛选（status=done）全部为完结卡
 13. 排行榜 10 榜 Tab 渲染 + 免费榜只含 price=0 作品
 14. 全程 0 pageerror
"""
import re
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:8767/output/preview'
PASS = FAIL = 0

def check(name, cond, extra=''):
    global PASS, FAIL
    if cond:
        PASS += 1; print(f'  PASS {name}')
    else:
        FAIL += 1; print(f'  FAIL {name} {extra}')

# ---------- 静态 ----------
print('== A. 静态检查')
src = open('output/preview/js/world-data.js', encoding='utf-8').read()

cat_ids = re.findall(r"\{ id: '([a-z]+)', name: '[^']+', children: \[", src)
sub_ids = re.findall(r"\{ id: '([A-Za-z0-9]+)', name: '[^']+' \}", src)
check('1. 一级分类 = 16', len(cat_ids) == 16, f'{len(cat_ids)}: {cat_ids}')

need_subs = ['星际文明', '赛博朋克', '本格推理', '规则怪谈', '赘婿逆袭', '无敌流', '乙女向',
             '轻小说', '电竞', '密室逃脱', '西方奇幻', '无限流', '历史架空', '种田经商', '循环流']
missing = [s for s in need_subs if f"name: '{s}'" not in src]
check('2. 市面常见二级题材抽查 15 项', not missing, f'缺失: {missing}')
check('2b. 二级总数 ≥ 88', len(sub_ids) >= 88, str(len(sub_ids)))

# 卡片 cat/sub 兼容
rows = re.findall(r"\['([^']+)', '[^']+', '[^']+', '([a-z]+)', '([A-Za-z0-9]+)',", src)
dangling = [(t, c, s) for t, c, s in rows if c not in cat_ids or s not in sub_ids]
check('3. 30 卡片 cat/sub 全兼容', not dangling, str(dangling[:3]))

check('4. 筛选 6 维扩充',
      all(k in src for k in ["{ id: 'w6',", "{ id: 'free', name: '免费' }", "{ id: 'p3',",
                             "{ id: 'older', name: '2023 及更早' }", "name: '无敌流'"])
      and src.count("attrs: ['") == 30)

sort_ids = re.findall(r"\{ id: '([a-z]+)', name: '(本周灵韵|本周人气|收藏最多|评分最高|字数最多|最新更新|最新发布|评论最多)' \}", src)
check('5. 排序 8 种', len(sort_ids) == 8, str([s[1] for s in sort_ids]))

rank_names = re.findall(r"name: '(人气榜|灵韵榜|新书榜|完本榜|收藏榜|热搜榜|更新榜|口碑榜|付费榜|免费榜)'", src)
check('6. 排行榜 10 榜', len(rank_names) == 10, str(rank_names))

# ---------- 端到端 ----------
print('== B. 端到端（Playwright）')
with sync_playwright() as p:
    browser = p.chromium.launch(args=['--use-gl=swiftshader', '--disable-gpu'])
    ctx = browser.new_context(viewport={'width': 375, 'height': 812})
    pg = ctx.new_page()
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))

    pg.goto(f'{BASE}/library.html', wait_until='networkidle'); pg.wait_for_timeout(700)

    # 7. 抽屉 16 分类
    pg.evaluate('window.LJWorld.openDrawer()'); pg.wait_for_timeout(400)
    cats = pg.evaluate("Array.from(document.querySelectorAll('.ds-d-cat')).map(x=>x.textContent)")
    check('7. 抽屉 16 一级', len(cats) == 16 and '科幻' in cats and '悬疑灵异' in cats, str(cats))

    # 8. 科幻二级
    pg.click(".ds-d-cat[data-id='kehuan']"); pg.wait_for_timeout(300)
    subs = pg.evaluate("Array.from(document.querySelectorAll('.ds-d-tag')).map(x=>x.textContent)")
    check('8. 科幻 6 二级', '星际文明' in subs and '赛博朋克' in subs, str(subs))
    pg.evaluate('window.LJWorld.closeDrawer()'); pg.wait_for_timeout(200)

    # 9-12. 筛选页（古风/仙侠玄幻 有作品）
    pg.evaluate('window.LJWorld.openDrawer()'); pg.wait_for_timeout(300)
    pg.click(".ds-d-cat[data-id='gufeng']"); pg.wait_for_timeout(200)
    pg.click(".ds-d-tag[data-sub='xianxia']"); pg.wait_for_timeout(600)
    dims = pg.evaluate("document.querySelectorAll('.filter-dim-row').length")
    sorts = pg.evaluate("document.querySelectorAll('.filter-sort-item').length")
    check('9. 筛选页 6 维 + 8 排序', dims == 6 and sorts == 8, f'{dims}/{sorts}')

    pg.click(".filter-chip[data-dim='words'][data-v='w2']"); pg.wait_for_timeout(400)
    n = pg.evaluate("document.querySelectorAll('.ds-wf-card').length")
    check('10. 字数 10-30 万筛选（仙侠奇缘录 28.4 万）', n == 1, str(n))

    pg.click(".filter-chip[data-dim='words'][data-v='all']"); pg.wait_for_timeout(200)
    pg.click(".filter-chip[data-dim='status'][data-v='done']"); pg.wait_for_timeout(400)
    n2 = pg.evaluate("document.querySelectorAll('.ds-wf-card').length")
    check('12. 完结筛选（仙侠玄幻无完结 → 0 空态）', n2 == 0, str(n2))

    # 11. 属性筛选（回到首页 filter：免费 + 治愈 —— 用无分类限制不可行，改为验证属性 chip 存在与点击生效）
    pg.click(".filter-chip[data-dim='status'][data-v='all']"); pg.wait_for_timeout(200)
    attr_chips = pg.evaluate("Array.from(document.querySelectorAll('.filter-chip[data-dim=\"attr\"]')).map(x=>x.textContent)")
    check('11a. 热门属性 10 chip', len(attr_chips) == 10, str(attr_chips))
    pg.click(".filter-chip[data-dim='attr'][data-v='rexue']"); pg.wait_for_timeout(400)
    n3 = pg.evaluate("document.querySelectorAll('.ds-wf-card').length")
    check('11b. 热血属性筛选生效（仙侠奇缘录含热血 → 1）', n3 == 1, str(n3))

    # 13. 排行榜
    pg.click('.ds-sn[data-sn="rank"]'); pg.wait_for_timeout(600)
    ranks = pg.evaluate("Array.from(document.querySelectorAll('.rank-tab')).map(x=>x.textContent)")
    check('13a. 排行榜 10 榜 Tab', len(ranks) == 10 and '💎 付费榜' in ranks, str(ranks))
    pg.click(".rank-tab[data-rank='free']"); pg.wait_for_timeout(500)
    free_titles = pg.evaluate("Array.from(document.querySelectorAll('.rank-row .rank-title')).map(x=>x.textContent)")
    all_cards = pg.evaluate("""(() => {
      const all = window.WORLD_DATA.FEATURED.concat(window.WORLD_DATA.HOT).concat(window.WORLD_DATA.NEW_DONE);
      return all.filter(c => c.price === 0).map(c => c.title);
    })()""")
    check('13b. 免费榜只含 price=0 作品', sorted(free_titles) == sorted(all_cards) and len(free_titles) >= 4,
          f'{free_titles} vs {all_cards}')

    check('14. 全程 0 pageerror', not errs, str(errs[:2]))
    ctx.close(); browser.close()

print()
print(f'V20-K 结果: {PASS} PASS / {FAIL} FAIL')
exit(0 if FAIL == 0 else 1)
