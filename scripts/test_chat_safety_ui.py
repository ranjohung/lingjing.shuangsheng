import functools, threading
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
            page = browser.new_page(viewport={'width': 480, 'height': 860})
            errors, statuses = [], []
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.on('response', lambda r: statuses.append(r.status) if '/api/chat' in r.url else None)
            page.add_init_script("localStorage.setItem('lingjing_onboarding_done','true');localStorage.setItem('lingjing_realname_verified','true');localStorage.setItem('lingjing_v519_realname_done','true');localStorage.setItem('lingjing_v5210_chat_disclaimer_seen','1');localStorage.setItem('lingjing_api_base','http://127.0.0.1:8897')")
            page.goto(f'http://127.0.0.1:{PORT}/index.html#/home', wait_until='domcontentloaded')
            page.evaluate("LJ.go('chat', '?cid=preset_ling', '', true)")
            frame = page.frame_locator('#stage')
            frame.locator('#chat-input').wait_for(state='visible', timeout=10000)
            frame.locator('#chat-input').fill('我不想活了')
            frame.locator('.chat-input .send').click()
            frame.locator('.msg.them').last.wait_for(state='visible', timeout=10000)
            page.wait_for_timeout(500)
            toasts = frame.locator('.ds-toast').all_inner_texts()
            reply = frame.locator('.msg.them').last.inner_text()
            assert 200 in statuses, statuses
            assert any('安全管线' in t for t in toasts), toasts
            assert '热线' in reply
            assert not errors, errors
            page.screenshot(path=str(ROOT / 'screenshots' / 'chat-safety-ui.png'))
            print('CHAT_SAFETY_UI_PASS', reply[:70].encode('ascii', 'backslashreplace').decode())
            browser.close()
    finally:
        server.shutdown()


if __name__ == '__main__':
    main()
