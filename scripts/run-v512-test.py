"""v5.12 真机模拟器全链路测试
   (1) 打开 library.html，验证 30 题材 + 5 demo 注入
   (2) 点击 demo novel → 进入 plot-runner，截图
   (3) 模拟剧情推进：选择 → 推进 → 触达结局
   (4) 上传向导：模拟一段小说 → 4 步 → 解析结果截图
   (5) 编辑器：调整一个节点 → 保存
"""
import asyncio, os, hashlib
from playwright.async_api import async_playwright

BASE = "http://127.0.0.1:8765"
SHOTS = "F:/开发软件项目文件/灵境 · 双生/output/preview/screenshots/v512"
os.makedirs(SHOTS, exist_ok=True)

async def shot(p, name):
    path = os.path.join(SHOTS, name + ".png")
    await p.screenshot(path=path, full_page=False)
    sz = os.path.getsize(path)
    h = hashlib.md5(open(path,'rb').read()).hexdigest()[:8]
    print(f"  📸 {name}.png  {sz//1024}KB  md5={h}")
    return path

async def main():
    errs = []
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=['--use-gl=swiftshader'])
        ctx = await b.new_context(viewport={'width':1280,'height':800})
        page = await ctx.new_page()
        page.on('pageerror', lambda e: errs.append(('PE', str(e))))
        page.on('console', lambda m: errs.append((m.type, m.text)) if m.type=='error' else None)

        # === (1) library.html ===
        print('1. library.html')
        await page.goto(f'{BASE}/library.html?v=1')
        await page.wait_for_load_state('networkidle')
        await page.wait_for_timeout(1500)
        # verify genres rendered
        genres_n = await page.evaluate('document.querySelectorAll("#genre-grid > *").length')
        novels_n = await page.evaluate('document.querySelectorAll("#novel-grid > .novel-card, #novel-grid > .novel-card").length')
        stats = await page.evaluate('({novels: +document.getElementById("stats-novels").textContent, games: +document.getElementById("stats-games").textContent, endings: +document.getElementById("stats-endings").textContent, genres: +document.getElementById("stats-genres").textContent})')
        print(f'   题材渲染 {genres_n} 个, 小说渲染 {novels_n} 本, 统计={stats}')
        await shot(page, '01-library')

        # === (2) 进入 demo novel 古言 ===
        print('2. 进入 demo (锦绣未央 - 古言)')
        # 取第一个 demo id
        demo_id = await page.evaluate("(NovelStore.listNovels()[0]||{}).id")
        print(f'   demo id = {demo_id}')
        await page.goto(f'{BASE}/plot-runner.html?novelId={demo_id}')
        await page.wait_for_load_state('networkidle')
        await page.wait_for_timeout(2200)
        # 检查
        st = await page.evaluate('({dlgOpen: !!document.getElementById("plot-dlg"), opts: document.querySelectorAll("#plot-dlg .plot-opt").length, hud: !!document.getElementById("plot-hud"), charImg: document.getElementById("plot-char").children.length, topTitle: document.getElementById("top-title").textContent})')
        print(f'   节点状态 = {st}')
        await shot(page, '02-runner-start')

        # === (3) 推进剧情 ===
        print('3. 推进剧情链路')
        steps = 0
        end_seen = False
        while steps < 6 and not end_seen:
            opts_n = await page.evaluate('document.querySelectorAll("#plot-dlg .plot-opt").length')
            if opts_n == 0:
                print('   已到底（无选项）')
                break
            # 选择第一个（"继续前进" / 正面回应）
            await page.evaluate('document.querySelectorAll("#plot-dlg .plot-opt")[0].click()')
            await page.wait_for_timeout(1300)
            steps += 1
            # 检查是否出现结局
            end_open = await page.evaluate('!!document.getElementById("plot-end-modal")')
            if end_open:
                end_seen = True
                print(f'   触发结局 (在第 {steps} 步)')
                await shot(page, f'03-end-at-step-{steps}')
                # 验证 HUD 数值
                st2 = await page.evaluate('({trust: +document.getElementById("hud-trust").textContent, intimacy: +document.getElementById("hud-intimacy").textContent, rep: +document.getElementById("hud-rep").textContent, coverage: document.getElementById("hud-coverage").textContent.replace(/\\s+/g, " ")})')
                print(f'   结局 HUD = {st2}')
                # 截结局模态
                await shot(page, '03a-ending-modal')
                break
        if not end_seen:
            print('   未能触达结局')

        # === (4) novel-upload 4 步向导 ===
        print('4. 上传向导 (4 步)')
        await page.goto(f'{BASE}/novel-upload.html?v=1')
        await page.wait_for_load_state('networkidle')
        await page.wait_for_timeout(1500)
        await shot(page, '04-upload-step1')
        # 选 都市
        await page.evaluate('document.querySelector("#genre-grid .genre-opt[data-genre=\\"dushi\\"]").click()')
        await page.wait_for_timeout(400)
        await page.click('#step1-next')
        await page.wait_for_timeout(800)
        # Step 2: 粘测试小说
        novel_text = """第一章 重逢
我叫林晚，是在陆家嘴工作的投行经理。今天酒会上我见到了顾衍，他是我大学时候的男友。

第二章 阴天
顾衍端着酒杯走过来。"林晚，五年没见。"他看了我一会儿。"你比以前更好看了。"我说："你比五年前更会讲话。"
陆彦青走过来："顾总，今晚又能见到你，是我的荣幸。"

第三章 真相
陆彦青举手：那支股票，就是你大学时候帮我研究过的那一支。顾衍点头。决战原来是这样的。

第四章 终局
我看着顾衍，说：我留下来赌一把。他点头。我们拥抱。

第五章 尾声
陆彦青订婚了。婚礼上顾衍说：很高兴还能看见你。生死都已经不重要了。我们都笑了。
"""
        await page.fill('#text-input', novel_text)
        await page.wait_for_timeout(300)
        await shot(page, '04-upload-step2')
        await page.click('#step2-next')
        await page.wait_for_timeout(600)
        await page.fill('#meta-title', '陆家嘴 · 重逢')
        await page.fill('#meta-author', '测试人')
        await shot(page, '04-upload-step3')
        await page.click('#step3-next')
        await page.wait_for_timeout(2200)
        # step 4 - 解析结果
        result = await page.evaluate('({chCov:document.getElementById("audit-ch-cov").textContent, chTotal:document.getElementById("audit-ch-total").textContent, charCov:document.getElementById("audit-char-cov").textContent, charTotal:document.getElementById("audit-char-total").textContent, hlCov:document.getElementById("audit-hl-cov").textContent, hlTotal:document.getElementById("audit-hl-total").textContent, chGap:document.getElementById("audit-ch-gap").textContent, charGap:document.getElementById("audit-char-gap").textContent, hlGap:document.getElementById("audit-hl-gap").textContent})')
        print(f'   覆盖审计 = {result}')
        await shot(page, '04-upload-step4')
        # 保存并进入
        await page.click('#step4-save')
        await page.wait_for_load_state('networkidle')
        await page.wait_for_timeout(2500)
        await shot(page, '04-upload-runs')

        # === (5) 编辑器 ===
        print('5. 编辑器 (微调 + 保存)')
        # 用刚上传的 novel id
        new_id = await page.evaluate('Object.keys(NovelStore.listNovels().reduce((a,r)=>{a[r.id]=1;return a},{})).find(id => id.startsWith("n_"))')
        print(f'   新上传 novel id = {new_id}')
        await page.goto(f'{BASE}/novel-edit.html?novelId={new_id}')
        await page.wait_for_load_state('networkidle')
        await page.wait_for_timeout(1800)
        # 验证编辑器
        ed = await page.evaluate('({audit:document.getElementById("audit-box").innerText, sideItems: document.querySelectorAll("#side-list .item-row").length, sideText: document.querySelector("#side-list .item-row")?.innerText?.slice(0,80)})')
        print(f'   编辑器 = {ed}')
        await shot(page, '05-edit-overview')
        # 编辑第一个节点
        await page.evaluate('document.querySelector("#side-list .item-row").click()')
        await page.wait_for_timeout(800)
        # 修改说话者
        new_speaker = '【旁白:章节开篇】'
        try:
            await page.fill('#ed-speaker', new_speaker)
            await page.wait_for_timeout(300)
            await page.click('#btn-save')
            await page.wait_for_timeout(800)
            await shot(page, '05-edit-saved')
            print(f'   已修改第一个节点说话者 → {new_speaker}')
        except Exception as ex:
            print('   编辑器操作异常', ex)
            await shot(page, '05-edit-error')

        # === Final Overview ===
        print()
        print('=' * 60)
        print('错误：')
        crit = [e for e in errs if e[0] in ('PE','error')]
        print(f'  严重错误 {len(crit)} 条:')
        for e in crit[:8]:
            print(f'    {e[0]}: {str(e[1])[:300]}')
        non = [e for e in errs if e[0] not in ('PE','error')]
        print(f'  其它日志/告警 {len(non)} 条 (GL ReadPixels etc)')
        print('=' * 60)
        await b.close()

asyncio.run(main())
