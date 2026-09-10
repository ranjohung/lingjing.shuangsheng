#!/usr/bin/env python3
"""v5.18 源码打包脚本（不含 node_modules / .venv / 早期截图）"""
import zipfile, os

ROOT = "F:/开发软件项目文件/灵境 · 双生"
os.chdir(ROOT)

EXCLUDE_PATH = (
    'node_modules', '.venv', '__pycache__', '.next', '.tsbuildinfo',
    'screenshots/v57', 'screenshots/v58', 'screenshots/audit',
    'screenshots/preview', 'screenshots/v513', 'screenshots/v514',
    'screenshots/v510', 'screenshots/v511', 'screenshots/v512',
    'output/playwright', '.playwright-cli', '.workbuddy',
)

files = []

# 顶层单文件
for f in ['product-preview.html', '.gitignore', '.env.example',
          'package.json', 'pnpm-workspace.yaml', 'pnpm-lock.yaml']:
    if os.path.exists(f):
        files.append(f)

# 递归遍历
def walk(p):
    if any(e in p for e in EXCLUDE_PATH):
        return
    if not os.path.isdir(p):
        return
    for root, dirs, fs in os.walk(p):
        if any(e in root for e in EXCLUDE_PATH):
            dirs[:] = []
            continue
        for f in fs:
            full = os.path.join(root, f)
            if any(e in full for e in EXCLUDE_PATH):
                continue
            files.append(full)

for p in ['output/preview', 'docs', 'scripts', 'assets', 'infrastructure',
          'apps/api/src', 'apps/api/migrations', 'apps/api/tests',
          'apps/web/src', 'apps/web/public']:
    if os.path.exists(p):
        walk(p)

# 单文件
for f in ['apps/api/requirements.txt', 'apps/api/alembic.ini',
          'apps/web/package.json', 'apps/web/next.config.mjs',
          'apps/web/postcss.config.mjs', 'apps/web/tailwind.config.ts',
          'apps/web/tsconfig.json']:
    if os.path.exists(f):
        files.append(f)

files = list(set(files))
files.sort()
print(f"共 {len(files)} 个文件")

OUT = 'output/preview/lingjing-v518-source.zip'
with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
    for f in files:
        try:
            zf.write(f)
        except Exception as e:
            print('skip', f, e)
print(f"写入完成: {OUT}")
