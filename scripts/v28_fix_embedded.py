# -*- coding: utf-8 -*-
"""V28 修复：?book= 入口直接加载内嵌公版（loadEmbedded），不再 fetch corpus 完整 txt
（完整 txt 与 parseOriginalNovel 体例不匹配 title='第1'，且 srcdoc 下原路径 404——内嵌才是 V20-X 实际验收路径）
"""
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

# 1) 新增 loadEmbedded（插在 loadBook 前）
old1 = "function loadBook(bookId) {"
assert ng.count(old1) == 1, "anchor1 x%d" % ng.count(old1)
new1 = """  /* V28-B：?book= 入口直接加载内嵌公版（corpus 完整 txt 与解析器体例不匹配，内嵌为 V20-X 验收路径） */
  function loadEmbedded(bookId) {
    var fb = EMBEDDED_BOOKS[bookId];
    if (!fb) { toast('warn', '加载失败', '未知公版 id：' + bookId); return; }
    try {
      var book = window.LJNovelParser.parseOriginalNovel(fb);
      book.author = book.author || ({hongloumeng:'曹雪芹',sanguoyanyi:'罗贯中',xiyouji:'吴承恩',shuihuzhuan:'施耐庵',liaozhai:'蒲松龄'}[bookId] || '公版作者');
      state.bookId = bookId;
      state.book = book;
      state.bookHash = hashStr(book.title + '_' + (book.chapters[0].title || ''));
      $('#ng-title').textContent = book.title;
      $('#ng-splash-title').textContent = book.title;
      $('#ng-splash-author').textContent = book.author + ' · ' + book.chapters.length + ' 章';
      $('#ng-splash-start').textContent = '▶ 开始阅读';
      updateChaptersBtn();
      showSplash();
      toast('ok', '已加载', book.chapters.length + ' 章 · ' + book.author);
    } catch (e) {
      toast('warn', '解析失败', String(e).slice(0, 60));
    }
  }

  function loadBook(bookId) {"""
ng = ng.replace(old1, new1)

# 2) bootstrap ?book= 分支改调 loadEmbedded
old2 = """    var bookMatch = qs.match(/[?&]book=([a-z]+)/);
    if (bookMatch) {
      loadBook(bookMatch[1]);"""
assert ng.count(old2) == 1, "anchor2 x%d" % ng.count(old2)
new2 = """    var bookMatch = qs.match(/[?&]book=([a-z]+)/);
    if (bookMatch) {
      loadEmbedded(bookMatch[1]);"""
ng = ng.replace(old2, new2)
pages["novel-game"] = ng
print("novel-game loadEmbedded OK")

new_json = json.dumps(pages, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
html_new = html[:start] + new_json + html[end:]
io.open(PATH, "w", encoding="utf-8", newline="").write(html_new)
print("index.html -> %d chars" % len(html_new))
