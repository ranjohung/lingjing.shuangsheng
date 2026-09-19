# -*- coding: utf-8 -*-
"""
export_corpus_js.py
把公版语料导出为可被 <script> 标签直接加载的 .js：
  corpus/manifest.json       -> corpus/manifest.js        （window.__LJ_MANIFEST__）
  corpus/books/<id>.txt      -> corpus/books/<id>.js      （window.__LJ_BOOK__[id]）

原因：file:// 协议下浏览器禁止 fetch() 本地文件，但 <script src> 不受限制，
      这是让「双击 index.html」也能读公版原文的唯一可行途径。
      全部 41 部共 50MB 不现实，只导出高频的四大名著。
原始 .txt / .json 保持不动。
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
CORPUS = ROOT / 'corpus'
TARGETS = ['xiyouji', 'sanguoyanyi', 'hongloumeng', 'shuihuzhuan']


def wrap(payload):
    """script 内联时 </script> 必须转义"""
    return payload.replace('</', '<\\/')


def main():
    mf_path = CORPUS / 'manifest.json'
    if mf_path.exists():
        mf = json.loads(mf_path.read_text(encoding='utf-8'))
        js = 'window.__LJ_MANIFEST__ = ' + wrap(json.dumps(mf, ensure_ascii=False, separators=(',', ':'))) + ';\n'
        (CORPUS / 'manifest.js').write_text(js, encoding='utf-8')
        print('  manifest.js        {:>6} KB  ({} 部)'.format(len(js.encode('utf-8')) // 1024, len(mf)))

    for bid in TARGETS:
        src = CORPUS / 'books' / (bid + '.txt')
        if not src.exists():
            print('  skip ' + bid + ' (缺 txt)')
            continue
        txt = src.read_text(encoding='utf-8', errors='replace')
        js = ('window.__LJ_BOOK__ = window.__LJ_BOOK__ || {};\n'
              'window.__LJ_BOOK__[' + json.dumps(bid) + '] = ' + wrap(json.dumps(txt, ensure_ascii=False)) + ';\n')
        (CORPUS / 'books' / (bid + '.js')).write_text(js, encoding='utf-8')
        print('  {:<18} {:>6} KB  ({} 字)'.format(bid + '.js', len(js.encode('utf-8')) // 1024, len(txt)))


if __name__ == '__main__':
    print('导出公版语料：')
    main()
