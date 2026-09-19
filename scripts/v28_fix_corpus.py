# -*- coding: utf-8 -*-
"""V28 修复：novel-game BOOK_FILES 改为相对上跳路径（base=output/preview/ 下 fetch 到根 corpus/）"""
import io, json, re, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATH = os.path.join(BASE, "index.html")
html = io.open(PATH, encoding="utf-8").read()
m = re.search(r"var LJ_PAGES\s*=\s*", html)
start = html.index("{", m.end())
depth = 0; i = start; instr = False; esc = False
while i < len(html):
    c = html[i]
    if instr:
        if esc: esc = False
        elif c == "\\": esc = True
        elif c == '"': instr = False
    else:
        if c == '"': instr = True
        elif c == "{": depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                break
    i += 1
end = i + 1
pages = json.loads(html[start:end])
ng = pages["novel-game"]

old_tbl = """  var BOOK_FILES = {
    hongloumeng: 'corpus/books/hongloumeng.txt',
    sanguoyanyi: 'corpus/books/sanguoyanyi.txt',
    xiyouji: 'corpus/books/xiyouji.txt',
    shuihuzhuan: 'corpus/books/shuihuzhuan.txt',
    liaozhai: 'corpus/books/liaozhai.txt'
  };"""
assert ng.count(old_tbl) == 1, "BOOK_FILES anchor x%d" % ng.count(old_tbl)
new_tbl = """  var BOOK_FILES = {
    hongloumeng: '../../corpus/books/hongloumeng.txt',
    sanguoyanyi: '../../corpus/books/sanguoyanyi.txt',
    xiyouji: '../../corpus/books/xiyouji.txt',
    shuihuzhuan: '../../corpus/books/shuihuzhuan.txt',
    liaozhai: '../../corpus/books/liaozhai.txt'
  };"""
ng = ng.replace(old_tbl, new_tbl)
pages["novel-game"] = ng
print("BOOK_FILES -> ../../corpus/ OK")

new_json = json.dumps(pages, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
html_new = html[:start] + new_json + html[end:]
io.open(PATH, "w", encoding="utf-8", newline="").write(html_new)
print("index.html -> %d chars" % len(html_new))
