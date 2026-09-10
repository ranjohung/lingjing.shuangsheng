"""深度调试：检查 opacity/computed style"""
import time
from playwright.sync_api import sync_playwright

ROOT = r"F:\开发软件项目文件\灵境 · 双生\output\preview"

with sync_playwright() as p:
    browser = p.chromium.launch(args=['--no-sandbox', '--disable-gpu', '--use-gl=swiftshader'])
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    page = ctx.new_page()
    page.on("console", lambda m: print(f"[{m.type}] {m.text}"))

    page.goto(f"file://{ROOT}/plot-runner.html?novelId=demo_palace")
    page.wait_for_load_state("networkidle", timeout=10000)
    time.sleep(3.5)

    info = page.evaluate("""() => {
      const out = {};
      const scEl = document.getElementById('plot-scene');
      const cs1 = getComputedStyle(scEl);
      out.scene = { opacity: cs1.opacity, display: cs1.display, zIndex: cs1.zIndex,
                    bgImage: cs1.backgroundImage.substring(0,60), pos: cs1.position,
                    width: cs1.width, height: cs1.height, visibility: cs1.visibility };

      const charEl = document.getElementById('plot-chars');
      const cs2 = getComputedStyle(charEl);
      out.chars = { opacity: cs2.opacity, display: cs2.display, zIndex: cs2.zIndex,
                    pos: cs2.position, html: charEl.innerHTML.substring(0,200) };

      const dlgEl = document.getElementById('plot-dlg');
      const cs3 = getComputedStyle(dlgEl);
      out.dlg = { opacity: cs3.opacity, display: cs3.display, zIndex: cs3.zIndex,
                  pos: cs3.position, bottom: cs3.bottom, height: cs3.height,
                  text: document.getElementById('dlg-text').textContent.substring(0,50) };

      const topEl = document.getElementById('plot-topbar');
      const cs4 = getComputedStyle(topEl);
      out.topbar = { opacity: cs4.opacity, zIndex: cs4.zIndex, pos: cs4.position };

      const statsEl = document.getElementById('plot-stats');
      const cs5 = getComputedStyle(statsEl);
      out.stats = { opacity: cs5.opacity, zIndex: cs5.zIndex, pos: cs5.position };

      return out;
    }""")
    import json
    print(json.dumps(info, ensure_ascii=False, indent=2))

    # 再次截图
    page.screenshot(path=r"F:\开发软件项目文件\灵境 · 双生\output\preview\screenshots\v513\_dbg-3.5s.png")

    # 检查所有图片是否加载
    imgs = page.evaluate("""() => {
      return Array.from(document.images).map(i => ({
        src: i.src.replace(location.origin, ''),
        complete: i.complete,
        naturalWidth: i.naturalWidth,
        naturalHeight: i.naturalHeight,
        displayWidth: i.offsetWidth,
        displayHeight: i.offsetHeight
      }));
    }""")
    print("\n=== 图片加载状态 ===")
    print(json.dumps(imgs, ensure_ascii=False, indent=2))

    browser.close()