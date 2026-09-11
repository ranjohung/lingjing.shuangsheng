# DEV_PLAN · 灵境 · 双生 V20.0 — 公版小说库 + 收费点自动生成系统

> **版本**：V20.0 实施计划（2026-09-11 23:36）  
> **配套文档**：[PRD-v20.md](PRD-v20.md) + [S06-v20-public-domain-library.txt](docs/sources/2026-09-11/S06-v20-public-domain-library.txt)

---

## 总览：V20.0 分 4 批交付

```
V20-A ─┬─ public-domain.html（独立页 · 接 5 Tab）        ~400 行
       ├─ public-domain-data.js（40 本 mock 数据）          ~350 行
       └─ public-domain.js（3 Tab + 瀑布流 + 排序）          ~250 行

V20-B ─┬─ public-domain-parser.js（结构化提取 mock）        ~200 行
       ├─ integrity-checker.js（4 维校验算法）                ~250 行
       └─ integrity-reporter.js（报告生成器）                 ~150 行

V20-C ─┬─ monetization-generator.js（收费点生成器）         ~350 行
       ├─ chapter-locks.js（章节锁）                        ~150 行
       ├─ choice-locks.js（选择锁）                         ~200 行
       └─ bonus-locks.js（番外锁）                          ~150 行

V20-D ─┬─ creator-monetization.html（创作者收费点设计页）    ~400 行
       ├─ creator-monetization.js（5 类型 + JSON 编辑器）     ~350 行
       └─ creator-center.html / commerce.html 扩展            ~200 行

合计：~3300 行 JS + HTML + CSS
```

---

## V20-A（本批 · 立即启动）

### 工作包 A1：public-domain-data.js（40 本 mock）

**结构**：
```js
window.PUBLIC_DOMAIN_DATA = {
  books: [
    // 中国古典 25 本
    { id: 'hongloumeng', title: '红楼梦', author: '曹雪芹', lang: 'zh',
      category: '中国古典', source: '文硕阁',
      cover: 'linear-gradient(135deg,#8B4513,#A0522D)', emoji: '📕',
      integrity: { size: 4096, chapters: 120, words: 730000, keepRate: 0.987, conclusion: 'pass' },
      monetization: { chapterLocks: 24, choiceLocks: 8, bonusLocks: 3, avgPrice: 18 },
      isDownloaded: true },
    // ... 24 更多中文书
    
    // 外国经典 15 本
    { id: 'pride-prejudice', title: '傲慢与偏见', author: '简·奥斯汀', lang: 'en',
      category: '外国经典', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#4682B4,#5F9EA0)', emoji: '📘',
      integrity: { size: 614, chapters: 61, words: 122000, keepRate: 0.994, conclusion: 'pass' },
      monetization: { chapterLocks: 12, choiceLocks: 4, bonusLocks: 2, avgPrice: 15 },
      isDownloaded: true }
    // ... 14 更多外文书
  ]
}
```

**数据完整性**：
- 25 中文：红楼梦/西游记/三国演义/水浒传/聊斋/儒林外史/镜花缘/封神/东周列国/隋唐/说岳/老残/二十年目睹/官场/世说/史记/山海经/庄子/孙子/论语/道德经/资治通鉴/三十六计/菜根谭/颜氏家训
- 15 外文：傲慢与偏见/呼啸山庄/简爱/德古拉/安娜/悲惨世界/巴黎/红与黑/高老头/欧也妮/苔丝/远大前程/双城/雾都/福尔摩斯
- 每本都带真实可查的标准字数（红楼梦 73 万 / 西游记 86 万 / 三国 80 万 / 水浒 96 万 / 聊斋 40 万 ...）

### 工作包 A2：public-domain.js（3 Tab + 瀑布流 + 排序）

**功能**：
- `getQuery()` — 读 ?tab=zh|en|manage
- `renderStats(books)` — 顶部概览卡 4 维
- `renderList(books, sortBy)` — 双列瀑布流
- `setTab(tabId)` — Tab 切换 + 过滤
- `sortBooks(books, by)` — 排序逻辑
- `showDetail(bookId)` — 详情 modal
- `bindEvents()` — Tab / Sort / Card 事件

### 工作包 A3：public-domain.html（独立页）

**结构**：
```html
<!DOCTYPE html>
<head>
  <title>公版名著库 · 灵境 · 双生</title>
  <link href="css/shell-v64.css">
  <style>/* 详情页专属样式 ≤ 30 行 */</style>
</head>
<body>
  <header><!-- topbar --></header>
  <nav class="pd-tabs"><!-- 中国古典/外国经典/下载管理 --></nav>
  <section class="pd-stats"><!-- 概览卡 4 维 --></section>
  <section class="pd-sort-bar"><!-- 排序 --></section>
  <main class="pd-grid" id="pd-grid"><!-- 瀑布流 --></main>
  <div id="plot-stage-mount"></div>
  
  <!-- 详情 modal -->
  <div class="pd-detail-modal" id="pd-detail-modal"></div>
  
  <script src="js/tabbar.js"></script>
  <script src="js/public-domain-data.js"></script>
  <script src="js/public-domain.js"></script>
</body>
```

### 工作包 A4：测试 + 截图

- `scripts/test_v20a_public_domain.py`（12 项）
- `scripts/screenshot_v20a.py`（5 张）

---

## V20-B（次批 · 结构化提取）

**目标**：实现脚本层的"AI 解析"mock
- public-domain-parser.js
  - 章节边界识别（"第 N 回/章"正则）
  - 段落分割（空行/换行）
  - 对话识别（"「」"或"' '"）
- integrity-checker.js
  - 4 维校验算法
  - 与标准值对比（每个 book 配 std）
  - 偏差率计算
- integrity-reporter.js
  - 报告模板生成
  - pass/suspect/fail 结论

---

## V20-C（三批 · 收费点生成器）

**目标**：V20-A UI 的"自动收费点"实际算法
- monetization-generator.js
  - 输入：book 数据
  - 输出：收费点数组（每章锁 + 选择锁 + 番外锁）
- chapter-locks.js
  - 每 N 章末尾自动设置锁
  - 价格 = 字数 × 0.000025（按字数定价）
- choice-locks.js
  - 关键选择点识别（情感/命运转折词）
  - 2 免费 + 1 付费"特殊选项"
- bonus-locks.js
  - 番外提取（角色背景/隐藏结局/支线）
  - 单独定价 50-200 灵晶

---

## V20-D（四批 · 创作者后台收费点）

**目标**：作者手动设计收费点的 UI
- creator-monetization.html
  - 5 类型选择（章节锁/属性道具/卡牌/外观/功能性解锁）
  - 价格滑块 10-5000 灵晶
  - 触发条件 JSON 编辑器
  - 效果 JSON 编辑器
  - 预览按钮（模拟玩家视角）
- creator-monetization.js
  - 列表管理（增删改查）
  - localStorage `creator_monetization_points` 表
- creator-center.html / commerce.html 扩展
  - 「商业化设置」入口
  - 收费点统计 + 编辑入口

---

## 回归测试策略

V20-A 测试用例：
1. public-domain.html 200 OK
2. 顶部概览 4 维数字
3. 3 Tab 切换
4. 中国古典 25 本
5. 外国经典 15 本
6. 双列瀑布流
7-10. 4 种排序
11. 详情 modal 打开
12. 「进入小说世界」跳转

预计：12/12 PASS

---

## 数据看板

V20-A 完成后：
- 工作包：10 → 11
- 总通过：137 → 149 PASS

---

## 下一步

V20-A 立即启动（4 文件 + 12 测试 + 5 截图）：
1. public-domain-data.js（350 行）
2. public-domain.js（250 行）
3. public-domain.html（400 行）
4. test_v20a_public_domain.py（150 行）
5. screenshot_v20a.py（100 行）
6. product-preview.html 同步
7. git commit V20-A
8. memory + MEMORY.md 更新

预计代码量：~1250 行
预计测试用例：12 项
预计截图：5 张