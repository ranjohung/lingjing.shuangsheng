# -*- coding: utf-8 -*-
"""V28-B 路由修复：
1) 壳层删除 novel-game -> world-view 旧映射（LJ.go + LJEnter 两处），恢复 V20-V 游戏引擎可达
2) novel-game 参数获取规范化（srcdoc 下 location.search 恒空 -> LJSearch/__LJ_PARAMS__）
3) world-view 补回丢失的 showToast 函数头（并行提交 R18 吞行 bug）
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

# ---------- A1 壳层：LJ.go 内重定向 ----------
old_a1 = "if (id === 'novel-game') { id = 'world-view'; }"
assert html.count(old_a1) == 1, "A1 anchor x%d" % html.count(old_a1)
html = html.replace(old_a1, "/* V28-B: 移除 novel-game->world-view 旧映射，恢复 V20-V 游戏引擎可达 */")
print("A1 壳层 LJ.go 重定向删除 OK")

# ---------- A2 壳层：LJEnter 三元重定向 ----------
old_a2 = "LJ.go(m[1] === 'novel-game' ? 'world-view' : m[1], m[2] || '', m[3] || '');"
assert html.count(old_a2) == 1, "A2 anchor x%d" % html.count(old_a2)
html = html.replace(old_a2, "LJ.go(m[1], m[2] || '', m[3] || '');")
print("A2 壳层 LJEnter 重定向删除 OK")

# ---------- B novel-game：qs 规范化 ----------
ng = pages["novel-game"]

old_b0 = """  function init() {
    // 预置钱包（若无）"""
new_b0 = """  /* V28-B：srcdoc 下 location.search 恒空，统一从 __LJ_PARAMS__ 取参并规范化 */
  function ngQS() {
    var q = (typeof LJSearch === 'function' ? (LJSearch() || '') : '') || location.search || '';
    if (q && q.charAt(0) !== '?') q = '?' + q;
    return q;
  }

  function init() {
    // 预置钱包（若无）"""
assert ng.count(old_b0) == 1, "B0 anchor x%d" % ng.count(old_b0)
ng = ng.replace(old_b0, new_b0)

old_b1 = """    // ?demo=1 自动加载桃花源示例（来自 product-preview / 主页横幅入口）
    var qs = location.search || '';"""
new_b1 = """    // ?demo=1 自动加载桃花源示例（来自 product-preview / 主页横幅入口）
    // V28-B：srcdoc 下 location.search 恒空，改用 ngQS()（__LJ_PARAMS__）
    var qs = ngQS();"""
assert ng.count(old_b1) == 1, "B1 anchor x%d" % ng.count(old_b1)
ng = ng.replace(old_b1, new_b1)

old_b2 = "    if (/[?&]book=/.test(location.search)) {"
assert ng.count(old_b2) == 2, "B2 anchor x%d" % ng.count(old_b2)
ng = ng.replace(old_b2, "    if (/[?&]book=/.test(ngQS())) {")
pages["novel-game"] = ng
print("B novel-game qs 规范化 OK（ngQS + init + 2 处返回检测）")

# ---------- C world-view：补回 showToast 函数头 ----------
wv = pages["world-view"]
old_c = """    }
  });
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;"""
new_c = """    }
  });
}

function showToast(id, text, duration) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;"""
assert wv.count(old_c) == 1, "C anchor x%d" % wv.count(old_c)
wv = wv.replace(old_c, new_c)
pages["world-view"] = wv
print("C world-view showToast 函数头补回 OK")

# ---------- 写回 ----------
new_json = json.dumps(pages, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
html_new = html[:start] + new_json + html[end:]
io.open(PATH, "w", encoding="utf-8", newline="").write(html_new)
print("index.html: %d -> %d chars" % (len(html), len(html_new)))
