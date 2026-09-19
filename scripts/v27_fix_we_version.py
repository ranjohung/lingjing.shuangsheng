# -*- coding: utf-8 -*-
"""V27 修复：applyAsset 首次替换默认资产时未记录版本 → 版本管理无 V1 可回滚。
修复：合成系统默认样式（bg=渐变，char/prop=emoji 图标）作为 V1 入账。
"""
import json, io, sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
SRC = 'index.html'

def load():
    s = open(SRC, encoding='utf-8').read()
    lines = s.split('\n')
    idx = next(i for i, l in enumerate(lines) if l.startswith('<script>var LJ_PAGES = '))
    l = lines[idx]
    start = l.find('= ') + 2
    end = l.rfind('</script>')
    return s, lines, idx, json.loads(l[start:end].rstrip().rstrip(';'))

s, lines, idx, pages = load()
p = pages['work-editor']

old = '''function applyAsset(key, val, name){
  var st = assetState();
  var old = st.assets[key];
  if (old) {'''
new = '''function applyAsset(key, val, name){
  var st = assetState();
  var old = st.assets[key];
  if (!old) {
    // V27 修复：首次替换默认资产时，把系统默认样式记为 V1，保证可回滚
    var __base = null;
    BASE_ASSETS.forEach(function(b){ if (b.key === key) __base = b; });
    if (__base) old = __base.type === 'bg' ? { kind: 'grad', val: __base.grad, name: __base.name } : { kind: 'emoji', val: __base.emoji, name: __base.name };
  }
  if (old) {'''

assert p.count(old) == 1, 'anchor miss or dup: %d' % p.count(old)
p = p.replace(old, new)
pages['work-editor'] = p

out = json.dumps(pages, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
lines[idx] = '<script>var LJ_PAGES = ' + out + ';</script>'
open(SRC, 'w', encoding='utf-8', newline='').write('\n'.join(lines))
print('applyAsset V1 fix, len =', len(p))

_, _, _, pages2 = load()
q = pages2['work-editor']
print('probe:', q.count('首次替换默认资产时'))
