#!/usr/bin/env node
/* =====================================================================
 * V25 · 世界蓝图编译 CLI
 *
 * 用法：
 *   node scripts/forge_build.js --book xiyouji --chars 80000
 *   node scripts/forge_build.js --file corpus/books/xiyouji.txt --title 西游记 --author 吴承恩
 *
 * 产出：output/preview/worlds/<id>.json  —— 供 world-forge.html / world-view.html /
 *        SD 与 Blender 资产脚本共同消费的「世界蓝图」
 * ===================================================================== */
'use strict';

var fs = require('fs');
var path = require('path');

var ROOT = path.resolve(__dirname, '..');
var Forge = require(path.join(ROOT, 'output/preview/js/novel-world-forge.js'));

function argOf(name, def) {
  var i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

var bookId = argOf('book', '');
var fileIn = argOf('file', '');
var title = argOf('title', '');
var author = argOf('author', '');
var maxChars = parseInt(argOf('chars', '80000'), 10);
var outDir = path.join(ROOT, 'output/preview/worlds');
fs.mkdirSync(outDir, { recursive: true });

var manifest = [];
try { manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus/manifest.json'), 'utf8')); }
catch (e) { manifest = []; }

var entry = null;
if (bookId) {
  entry = manifest.filter(function (b) { return b.id === bookId; })[0] || null;
  if (!entry) { console.error('未在 corpus/manifest.json 找到 book id = ' + bookId); process.exit(2); }
}
if (!fileIn && entry) fileIn = path.join('corpus/books', entry.id + '.txt');
if (!fileIn) { console.error('请指定 --book <id> 或 --file <path>'); process.exit(2); }

var abs = path.isAbsolute(fileIn) ? fileIn : path.join(ROOT, fileIn);
if (!fs.existsSync(abs)) { console.error('原文不存在：' + abs); process.exit(2); }

if (!title) title = entry ? entry.title : path.basename(abs, '.txt');
if (!author) author = entry ? (entry.author || '') : '';
var id = bookId || path.basename(abs, '.txt');

var raw = fs.readFileSync(abs, 'utf8').replace(/\r/g, '');
var text = maxChars > 0 ? raw.slice(0, maxChars) : raw;

var t0 = Date.now();
var world = Forge.forge({
  bookId: id,
  title: title,
  author: author,
  text: text,
  sourceKind: bookId ? 'public_domain' : 'author_upload',
  options: { maxBackgrounds: 12 }
});
var ms = Date.now() - t0;

if (!world || world.ok === false) {
  console.error('世界生成失败：' + (world && world.reason));
  process.exit(3);
}

world.meta.source_file = path.relative(ROOT, abs).split(path.sep).join('/');
world.meta.full_chars = raw.length;
world.meta.window_chars = text.length;
world.meta.built_ms = ms;

var outFile = path.join(outDir, id + '.json');
fs.writeFileSync(outFile, JSON.stringify(world), 'utf8');

console.log('=== 世界蓝图已生成 ===');
console.log('书籍      : ' + title + ' / ' + (author || '佚名'));
console.log('原文窗口  : ' + text.length + ' 字（全文 ' + raw.length + ' 字）');
console.log('体裁      : ' + world.genre.primary + '  ' + world.genre.list.map(function (g) { return g.id + ' ' + g.weight + '%'; }).join(' · '));
console.log('锚点/场景 : ' + world.anchors.length + ' / ' + world.scenes.length);
console.log('角色/地点 : ' + world.characters.length + ' / ' + world.locations.length);
console.log('道具/热点 : ' + world.props.length + ' / ' + world.interactions.length);
console.log('资产请求  : 背景 ' + world.assets.backgrounds.length + ' · 3D ' + world.assets.models3d.length + ' · 立绘 ' + world.assets.portraits.length);
console.log('零删减    : ' + (world.checks.anchors_byte_equal.ok ? 'PASS' : 'FAIL') + '（' + world.checks.anchors_byte_equal.total + ' 锚点逐字比对）');
console.log('零创造    : ' + (world.checks.from_source.ok ? 'PASS' : 'FAIL ' + JSON.stringify(world.checks.from_source.bad)));
console.log('耗时      : ' + ms + ' ms');
console.log('输出      : ' + path.relative(ROOT, outFile).split(path.sep).join('/'));
