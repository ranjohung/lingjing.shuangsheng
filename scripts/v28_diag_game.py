# -*- coding: utf-8 -*-
"""诊断：novel-game?book=xiyouji 直达后 iframe 内部状态"""
import functools, os, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8909

SEED = "try{localStorage.setItem('lingjing_onboarding_done','true');}catch(e){}"

def main():
    handler = functools.partial(SimpleHTTPRequestHandler, directory=BASE)
    handler.log_message = lambda *a, **k: None
    httpd = ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    base = "http://127.0.0.1:%d/index.html" % PORT
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_context(viewport={"width": 1150, "height": 800}).new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.add_init_script(SEED)
        pg.goto("%s?step=diag1#/novel-game?book=xiyouji" % base)
        pg.wait_for_function("document.getElementById('stage').classList.contains('on')", timeout=10000)
        pg.wait_for_timeout(3500)
        info = pg.evaluate("""(function(){
          var d = document.getElementById('stage');
          var c = d && d.contentDocument;
          if (!c) return {err:'no contentDocument'};
          var t = c.querySelector('#ng-splash-title');
          var e = c.querySelector('#ng-entry-mask');
          var page = c.defaultView && c.defaultView.__LJ_PAGE__;
          var params = c.defaultView && c.defaultView.__LJ_PARAMS__;
          var search = c.defaultView ? c.defaultView.location.search : null;
          var href = c.defaultView ? c.defaultView.location.href : null;
          return {
            page: page, params: params, search: search, href: (href||'').slice(0,120),
            splashTitle: t ? t.textContent : null,
            entryOpen: e ? e.className : null,
            hasParser: !!(c.defaultView && c.defaultView.LJNovelParser)
          };
        })()""")
        print("iframe info:", info)
        print("pageerrors:", errs)
        b.close()

main()
