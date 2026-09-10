# -*- coding: utf-8 -*-
"""调试 game 视图为何没切换"""
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 480, "height": 854})
        page = await ctx.new_page()
        await page.goto("http://127.0.0.1:8765/redesign.html", wait_until="networkidle")
        await page.evaluate("localStorage.clear();")
        await page.goto("http://127.0.0.1:8765/redesign.html", wait_until="networkidle")
        await page.wait_for_timeout(800)
        # 检查 startGame 是否是全局
        print("typeof startGame:", await page.evaluate("typeof startGame"))
        print("typeof openNovel:", await page.evaluate("typeof openNovel"))
        print("typeof goView:", await page.evaluate("typeof goView"))
        print("typeof story:", await page.evaluate("typeof story"))
        # 触发并查看
        result = await page.evaluate("""
            (function(){
              try {
                goView('game');
                openNovel('pavilion');
                if (typeof startGame === 'function') startGame(false);
                const v = document.getElementById('view-game');
                return {
                  viewGameActive: v ? v.className : 'missing',
                  currentNovel: typeof currentNovel !== 'undefined' ? currentNovel && currentNovel.title : null,
                  storyKeys: typeof story !== 'undefined' ? Object.keys(story) : 'no story'
                };
              } catch(e) { return 'ERR: ' + e.message; }
            })()
        """)
        print("after eval:", result)
        await page.wait_for_timeout(2500)
        result2 = await page.evaluate("""
            (function(){
              const v = document.getElementById('view-game');
              const d = document.getElementById('dlg');
              return {
                viewGameActive: v ? v.className : 'missing',
                dlgShown: d ? d.className : 'missing',
                visibleText: document.querySelector('#dlg-text') ? document.querySelector('#dlg-text').textContent.substring(0,60) : 'no text'
              };
            })()
        """)
        print("after 2.5s:", result2)
        await browser.close()

asyncio.run(main())