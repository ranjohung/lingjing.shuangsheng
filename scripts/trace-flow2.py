# -*- coding: utf-8 -*-
"""trace 正确 IDs"""
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 480, "height": 854})
        page = await ctx.new_page()
        await page.goto("http://127.0.0.1:8765/redesign.html", wait_until="networkidle")
        await page.wait_for_timeout(800)
        await page.click("text=立即开玩")
        await page.wait_for_timeout(3000)
        info = await page.evaluate("""(function(){
            const dlg = document.getElementById('gameDialogue');
            const txt = document.getElementById('gameText');
            const opts = Array.from(document.querySelectorAll('.game-opt')).map(o => o.textContent.trim());
            const npcBtn = Array.from(document.querySelectorAll('.game-opt.npc')).map(o => o.textContent.trim());
            return {
                dlgShown: dlg ? dlg.style.display || (dlg.offsetHeight > 0 ? 'visible' : 'hidden') : 'no dlg',
                dlgText: txt ? txt.textContent.substring(0, 80) : 'no text',
                optionsCount: opts.length,
                options: opts,
                npcBtns: npcBtn
            };
        })()""")
        print("开玩后:")
        for k, v in info.items(): print(f"  {k}: {v}")

        # 选第一个选项
        if info['optionsCount'] > 0:
            await page.click('.game-opt:not(.npc)')
            await page.wait_for_timeout(2000)
            info2 = await page.evaluate("""(function(){
                const txt = document.getElementById('gameText');
                const opts = Array.from(document.querySelectorAll('.game-opt')).map(o => o.textContent.trim());
                const npcBtn = Array.from(document.querySelectorAll('.game-opt.npc')).map(o => o.textContent.trim());
                return {text: txt ? txt.textContent.substring(0,80) : 'none', opts, npcBtns: npcBtn};
            })()""")
            print("选第一项后:")
            for k, v in info2.items(): print(f"  {k}: {v}")

        # 触发 NPC 按钮
        npc_selector = '.game-opt.npc'
        has_npc = await page.query_selector(npc_selector)
        if has_npc:
            await page.click(npc_selector)
            await page.wait_for_timeout(2000)
            info3 = await page.evaluate("""(function(){
                const m = document.getElementById('npcModal');
                const npcName = document.getElementById('npcName');
                const npcText = document.getElementById('npcText');
                return {
                    modalShown: m ? m.classList.contains('show') : 'no',
                    npcName: npcName ? npcName.textContent : '',
                    npcText: npcText ? npcText.textContent.substring(0,80) : ''
                };
            })()""")
            print("触发 NPC 后:")
            for k, v in info3.items(): print(f"  {k}: {v}")
        else:
            print("no npc btn")

        await browser.close()

asyncio.run(main())