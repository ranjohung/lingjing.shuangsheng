import functools
import threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PORT = 8899


def main():
    handler = functools.partial(SimpleHTTPRequestHandler, directory=str(ROOT))
    handler.log_message = lambda *args, **kwargs: None
    server = ThreadingHTTPServer(('127.0.0.1', PORT), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            page = browser.new_page(viewport={'width': 390, 'height': 844})
            page.add_init_script("localStorage.setItem('lingjing_onboarding_done','true');localStorage.setItem('lingjing_realname_verified','true');localStorage.setItem('lingjing_v519_realname_done','true');localStorage.setItem('lingjing_api_base','http://127.0.0.1:8897')")
            page.goto(f'http://127.0.0.1:{PORT}/index.html#/me', wait_until='domcontentloaded')
            page.evaluate("""async () => { const c = await fetch('http://127.0.0.1:8897/api/characters', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name:'评论安全测试', persona:'用于验证评论隔离'})}).then(r=>r.json()); await fetch('http://127.0.0.1:8897/api/characters/'+c.id+'/publish', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({summary:'评论安全 UI 测试角色'})}); }""")
            frame = page.frame_locator('#stage')
            frame.locator('.lj-plaza-entry').click()
            frame.locator('#lj-character-plaza').wait_for(state='visible', timeout=5000)
            page.on('dialog', lambda dialog: dialog.accept('这是诈骗内容'))
            button = frame.locator('[data-plaza-comment]').last
            button.click()
            page.wait_for_timeout(500)
            assert button.inner_text() == '已隔离待审核'
            assert '安全审核队列' in (button.get_attribute('title') or '')
            page.screenshot(path=str(ROOT / 'screenshots' / 'character-comment-safety-ui.png'), full_page=True)
            print('CHARACTER_COMMENT_SAFETY_UI_PASS', button.inner_text())
            browser.close()
    finally:
        server.shutdown()


if __name__ == '__main__':
    main()
