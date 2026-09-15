# -*- coding: utf-8 -*-
"""
export_world_js.py
把 output/preview/worlds/*.json 导出为同名 .js，
内容为 window.__LJ_WORLD__['<id>'] = {...};
目的：让 world-view / world-assets 等页面在 file:// 协议下也能加载世界蓝图
（file:// 下 fetch() 本地 JSON 会被浏览器拦截，script 标签则不受限）。
原始 .json 保留不动。
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
WORLDS = ROOT / 'output' / 'preview' / 'worlds'


def main():
    total = 0
    for src in sorted(WORLDS.glob('*.json')):
        data = json.loads(src.read_text(encoding='utf-8'))
        payload = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
        # </script> 必须转义，否则会提前闭合宿主 script 标签
        payload = payload.replace('</', '<\\/')
        js = (
            'window.__LJ_WORLD__ = window.__LJ_WORLD__ || {};\n'
            'window.__LJ_WORLD__[' + json.dumps(src.stem) + '] = ' + payload + ';\n'
        )
        dst = src.with_suffix('.js')
        dst.write_text(js, encoding='utf-8')
        kb = len(js.encode('utf-8')) // 1024
        total += kb
        print('  {:<20} {:>6} KB'.format(src.stem + '.js', kb))
    print('共 {} 个文件, {} KB'.format(len(list(WORLDS.glob("*.js"))), total))


if __name__ == '__main__':
    main()
