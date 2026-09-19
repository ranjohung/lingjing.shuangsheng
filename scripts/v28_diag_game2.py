# -*- coding: utf-8 -*-
"""诊断2：novel-game 完整 txt 加载后的内部状态"""
import functools, os, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8911

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
        pg.goto("%s?step=diag2#/novel-game?book=xiyouji" % base)
        pg.wait_for_function("document.getElementById('stage').classList.contains('on')", timeout=10000)
        pg.wait_for_timeout(5000)
        info = pg.evaluate("""(function(){
          var d = document.getElementById('stage');
          var c = d && d.contentDocument;
          var w = c && c.defaultView;
          if (!w) return {err:'no doc'};
          var t = c.querySelector('#ng-splash-title');
          var a = c.querySelector('#ng-splash-author');
          var toasts = Array.prototype.slice.call(c.querySelectorAll('.toast, .ng-toast, [class*=toast]')).map(function(e){return e.textContent.slice(0,60);});
          var st = w.state || {};
          return {
            page: w.__LJ_PAGE__, params: w.__LJ_PARAMS__,
            splashTitle: t ? t.textContent : null,
            splashAuthor: a ? a.textContent : null,
            bookId: st.bookId, bookTitle: st.book ? st.book.title : null,
            chapters: st.book && st.book.chapters ? st.book.chapters.length : null,
            toasts: toasts.slice(0,5)
          };
        })()""")
        print("info:", info)
        print("pageerrors:", errs)
        b.close()

main()
