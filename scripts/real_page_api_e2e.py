import sys
import os
sys.stdout.reconfigure(encoding='utf-8')
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    api_base = os.environ.get('LJ_TEST_API_BASE', 'http://127.0.0.1:8765')
    web_base = os.environ.get('LJ_TEST_WEB_BASE', 'http://127.0.0.1:8001')
    page.add_init_script(f"localStorage.setItem('lingjing_api_base', {api_base!r})")
    events = []
    page.on('response', lambda response: events.append((response.url, response.status)) if '/api/' in response.url else None)
    page.on('console', lambda message: events.append(('console:' + message.type, message.text)))
    page.goto(web_base + '/index.html#/home', wait_until='domcontentloaded')
    page.wait_for_timeout(2500)
    frames = []
    for frame in page.frames:
        frames.append({'url': frame.url, 'body': (frame.locator('body').inner_text()[:160] if frame.locator('body').count() else '')})
    print({'frames': frames, 'events': events, 'iframe_count': page.locator('iframe').count()})
    assert any(url.endswith('/api/v1/recommendations?limit=4') and status == 200 for url, status in events if isinstance(url, str) and url.startswith('http'))
    assert any(url.endswith('/api/v1/notifications') and status == 200 for url, status in events if isinstance(url, str) and url.startswith('http'))
    assert any('接口已连接' in frame['body'] for frame in frames)
    browser.close()
