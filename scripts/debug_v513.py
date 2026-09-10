"""调试 plot-runner.html"""
import sys, json
from playwright.sync_api import sync_playwright

ROOT = r"F:\开发软件项目文件\灵境 · 双生\output\preview"

with sync_playwright() as p:
    browser = p.chromium.launch(args=['--no-sandbox', '--disable-gpu', '--use-gl=swiftshader'])
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    page = ctx.new_page()

    page.on("console", lambda m: print(f"[{m.type}] {m.text}"))
    page.on("pageerror", lambda e: print(f"[ERROR] {e}"))

    page.goto(f"file://{ROOT}/plot-runner.html?novelId=demo_palace")
    page.wait_for_load_state("networkidle", timeout=10000)
    import time; time.sleep(3.0)

    # 检查 DOM
    info = page.evaluate("""() => {
      const out = {};
      const scEl = document.getElementById('plot-scene');
      out.sceneExists = !!scEl;
      out.sceneBgImage = scEl?.style?.backgroundImage || 'none';
      out.sceneHTML = scEl?.outerHTML?.substring(0, 200) || 'null';

      const charEl = document.getElementById('plot-chars');
      out.charsExists = !!charEl;
      out.charsInnerHTMLLen = charEl?.innerHTML?.length || 0;

      const dlgEl = document.getElementById('plot-dlg');
      out.dlgExists = !!dlgEl;
      out.dlgVisible = dlgEl ? getComputedStyle(dlgEl).display : 'null';

      const txtEl = document.getElementById('dlg-text');
      out.dlgText = txtEl?.textContent?.substring(0, 50) || 'null';

      out.bodyChildren = Array.from(document.body.children).map(c => c.tagName + '#' + c.id);

      // 检查 PlotEngine
      out.hasPlotEngine = !!window.PlotEngine;
      const plot = window.PlotEngine?.getState?.();
      out.currentNodeId = plot?.currentNodeId || 'null';

      // 检查 NovelStore
      const novel = window.NovelStore?.loadNovel?.('demo_palace');
      out.novelTitle = novel?.novel?.title || 'null';
      out.novelChapters = novel?.novel?.chapters?.length || 0;
      out.novelNodes = Object.keys(novel?.nodes || {}).length || 0;
      out.firstNode = Object.values(novel?.nodes || {})[0];
      out.auditTotal = JSON.stringify(novel?.audit?.total || 'null');

      return out;
    }""")
    print("\n=== DOM 状态 ===")
    print(json.dumps(info, ensure_ascii=False, indent=2))

    browser.close()