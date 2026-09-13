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
---

## V20-L · 全应用功能区对照补齐（2026-09-12 已交付）

> 需求：《全应用功能区完整设计文档 V1.0》（`docs/sources/2026-09-12/S01-v20l-full-app-design-doc.txt`）
> 目标：文档有的补上，项目多出的保留（24 项缺口全补 / 0 删除）。

### 改动文件（12）

| 文件 | 改动 |
|---|---|
| `js/home.js` | 签到中心抽屉（7 天格子+视频+4 快捷入口）；陪伴动态→chat?cid、世界更新→plot-detail |
| `js/world-data.js` | RANKS 10→16（+Fans/综合/同人/新晋完结/勤更/稀有卡）；DESCS 30 条一句话简介；明星同人/完结改名 |
| `js/world.js` | 卡片渲染 desc；新榜 Tab 过滤（同人/新晋完结）+ 4 排序维度（fans/zh/qingeng/xika） |
| `library.html` | `.ds-wf-desc` 样式 |
| `js/heart.js` | 创建角色→character-create；故事区双按钮；记忆 查看/编辑/删除 |
| `heart-island.html` | `.si-btns` / `.mi-ops` 样式 |
| `chat.html` | **重写**：?cid= 动态角色 + AI 主动开场 + 职业问答 13 职业 + 敏感三通道（120/12348/12356）+ 底部免责 + 首用弹窗 + 双生[进入 TA 的世界] + 5 Tab 名对齐 |
| `character-detail.html` | 职业问答说明卡 + 底部免责 + 陪聊带 cid |
| `creator-center.html` | 顶栏关闭+草稿箱；两大按钮；3+4 创建入口；工作台 5 入口 |
| `me.html` | 创作数据区（lingjing_is_creator 门控）+ 侵权投诉 + 订阅权益说明 |
| `plot-runner.html` + `js/plot-runner.js` | 工具栏 🔮灵境；属性 6→9；地图建筑→子场景（停打字机）；人物互动菜单（对话/送礼/邀约/攻略） |
| `product-preview.html` | 签到中心样式 + V20-L 状态镜像 mock |

### 测试

- 新增 `scripts/test_v20l_gap_fill.py`：29/29 PASS（设计文档 §九 12 条验收全覆盖 + 0 pageerror）
- 更新 2 处过期期望：v18c 工具栏 6→8、v20k 榜单 10→16
- 回归：v17b 17 / v18a 16 / v18b 21 / v18c 9 / v20j 15 / v20k 17 / v20i 13 — **全绿**

### 工作包台账（V20.x 累计 12 包）

V20-A 公版库 → B 收费点 → C 启动页 → D 钱包 → E tabbar → F 退出登录 → G 全局锁定 → H 真实语料 → I 接口审查 → J 游玩链路 → K 分类扩充 → **L 功能区对照补齐（本轮）**

### 遗留（沿袭 V20-I 登记）

- O-1 通用小说世界引擎（最高优先，plot-runner 目前仅支持 4 本 mock + 三国）
- O-8 测试债 12 套过期期望 / O-9 plot-runner 无独立绿套件（本轮 v18c 已部分补齐）
- 聊天职业问答为规则引擎 mock，接真 LLM 时替换 `buildReply()`（保留 window.AIHelper 钩子约束）

---

## V20-M · 「我的」功能区完整重做（2026-09-12 已交付）

> 需求：《"我的"功能区完整设计文档》（`docs/sources/2026-09-12/S02-v20m-me-tab-design-doc.txt`）
> 目标：七区块结构 + 编辑资料/收藏/我的作品/我的角色/我的世界/我的卡牌六新页 + 钱包/设置/商业页升级；只加不删。

### 改动文件（11）

| 文件 | 改动 |
|---|---|
| `me.html` | **重写**：七区块（个人信息/资产总览/我的内容/创作者中心/订阅消费/设置/法律帮助）+ 底部退出/注销（30 天后悔期弹窗）；保留 `#logout-btn`/`#v20f-list-account`/`v20l-list-creator`/`v20l-t-infringe` 既有选择器 |
| `profile-edit.html` | **新建**：9 项编辑 + 头像选择 + 弹窗绑定手机/邮箱 + 保存 `lingjing_user_profile` |
| `favorites.html` | **新建**：四 Tab 收藏 + 筛选 + `<dialog>` 取消收藏（`lingjing_v52x_favs`） |
| `my-works.html` | **新建**：4 状态 Tab + 作品卡（字数/状态/收益） |
| `my-characters.html` | **新建**：[创]/[双]角标 + 双生筛选 + 亲密度 |
| `my-worlds.html` | **新建**：游玩中（进度条+继续游玩）/ 已完成 |
| `my-cards.html` | **新建**：稀有度 5 档 + 来源筛选 + 详情（分享/设为背景） |
| `wallet.html` | 8 Tab + 充值 6 档 + 消费 50 条 + 充值/灵玉记录 + 提现区 + hash 路由（hashchange）+ 光斑 pointer-events 修复 |
| `settings.html` | 10 Tab（+数据管理）+ 隐私 6 项 + 通知 5 开关 + 偏好 5 项 + 关于 4 项 |
| `commerce.html` | `#earnings`/`#dashboard` 锚点 + 数据看板 5 指标 + 明细三视图 + CSV 导出（window.LJEarn 桥接修复作用域） |
| `product-preview.html` | v20.13 镜像 + 我的区 mock 更新 |

### 测试

- 新增 `scripts/test_v20m_me_tab.py`：**43/43 PASS**（覆盖设计文档 §十一 全部验收 + 0 pageerror）
- 修复 2 套：v17a（splash 预置跳过，9/9）、v20l #19 期望更新（29/29）
- 回归 11 套绿：v17a/v17g/v20e/v20f/v20g/v20i/v20l/v20m/v514/v5172/v519
- v516_ux / v517 / v641_shell / v518_regression 维持 O-8 测试债登记（非本轮引入）

### 本轮沉淀的坑（已入 MEMORY）

1. **同页 hash 跳转**：Playwright `goto` 到已加载页面的纯 hash 变体不触发重载 → hash 路由必须同时监听 `hashchange`
2. **装饰伪元素拦截点击**：`::before/::after` 大尺寸光斑会盖住按钮 → 装饰性伪元素一律 `pointer-events:none`
3. **IIFE 作用域**：外层 DOMContentLoaded 引用 IIFE 内函数 = ReferenceError → 用 `window.XXX` 桥接暴露
4. **id 笔误静默白屏**：`kd-mask` vs `kc-mask`——DOMContentLoaded 中途抛错后后面的绑定和 render() 全不执行且无显性报错 → 新页必须逐 id 核对 + 动态审计
5. **探测端口**：8765 根目录是 output/preview，`/output/preview/xxx` 会 404 → 探测一律用 8767（仓库根）

---

## V20-N · 「我的」Tab 按键逐项实测审计（2026-09-12 已交付）

### 改动文件（3）

| 文件 | 改动 |
|---|---|
| `scripts/test_v20n_my_tab.py` | **新建**：Playwright 真点击 39 项断言（me.html 七区块 + 6 子页 + wallet/settings/commerce 关键元素） |
| `scripts/screenshot_v20n_xinyu.py` 等 3 个 probe 脚本 | 用完即删，留下正式测试套件 |
| `docs/MY_TAB_AUDIT_2026-09-12.md` | **新建**：39 项 PASS 报告 + 实测抓出的 4 类选择器笔误 |

### 测试结论

**V20-N 「我的」按键审计：39 PASS · 通过**

无 0 FAIL、0 PageError、0 console error，覆盖 10 张页面：
- me.html 七区块 + 6 跳转入口真点击
- profile-edit 9 编辑字段 + 保存按钮
- 4 张「我的内容」子页关键元素
- wallet/settings/commerce 关键锚点

### 本轮沉淀的坑（写入 MEMORY.md）

1. **JS 数组里 `#xxx` 写法 → 解析为 private field**：`[#v20m-item-works, ...]` 报语法错，必须用字符串数组 + map/filter：`() => ['id1','id2'].map(s => !!document.getElementById(s))`
2. **审计脚本选择器笔误 ≠ 功能缺失**：`#pe-sig` 实际是 `#pe-sign`；`.mc-card` 是 mc-list 容器类名——功能本来在，是测试写错了。先 Read 实际 HTML 再写 assertion

### 受影响回归

v20i 13 / v20l 29 / v20m 43 / v20n 39 — **全绿**（124 PASS / 0 FAIL）
XEOF\necho DEVPLAN-done

---

## V20-Q · 三国演义·真人摄影风格小说世界（2026-09-12 13:30 · commit 9c1690b）

### 1. 用户反馈与方向
> 继续开发小说世界游戏，我要真人摄影风格的真实场景画面

决策：本机 SD（majicMIX realisticv7）+ 预生成 24 张图 + sanguo-world.html 视觉升级

### 2. 实施步骤
- 探测 SD WebUI 7860 → 列模型 → 选 majicMIX realisticv7
- 测 1 张 prompt → 真人写实·古风·电影感符合需求
- 设计 24 张图 prompt（12 卷封面 + 12 关键回主图）
- 写 `scripts/gen_sanguo_photoreal.py` 批量调用 `/sdapi/v1/txt2img`
- 升级 sanguo-world.html（4 处变更）

### 3. sanguo-world.html 升级点（574 → 658 行）
1. JS 新增 SG_SCENES 映射表 + sgSceneUrl() + sgFallbackGradient() 12 色 fallback
2. HTML 加 `<div class="sg-hero-bg" id="sg-hero-bg">` 卷一封面背景
3. CSS 加 `.sg-hero-bg`（cover + opacity .85 + z-index 0）+ `.sg-hero::after` 暗色叠加
4. CSS 加 `.sg-vol-thumb`（54x72 cover + 渐变蒙层）
5. JS 改 renderCatalog() 每卷加缩略图
6. CSS 加 `.sg-chapter-img` + `.sg-chapter-caption`
7. JS 改 renderChapter() 12 关键回顶部加主图
8. JS 加 initHeroBg() 启动时初始化 Hero 背景图

### 4. 关键决策
- **保留所有收费点/双轨经济**：卷 20💎 + 全书券 128💎 + 阅读券 10 灵玉兑 1 张 + 签到 +10 灵玉/日 100% 保留
- **fallback 策略**：图加载失败时仍显示 12 色渐变（不破坏 layout）
- **图片路径**：`../../assets/scenes/sg_*.jpg`（assets 在仓库根）
- **HTTP server**：8767（仓库根）保证 assets/scenes/ 可达

### 5. 测试结果（test_v20q_sanguo_photoreal.py）
38 PASS / 0 FAIL / 0 PageError
- 静态：24/24 张图存在 · 13.8MB
- 主页：Hero + 12 卷缩略图（全部含 sg_v URL）
- 钱包：灵玉 100 / 灵晶 1000（充足测全部付费点）
- 签到 + 阅读券 + 买卷 + 买全书券 + 关键回主图 + 非关键回无图

### 6. 回归（全套 v20）
v20i 13 + v20l 29 + v20m 43 + v20n 39 + **v20q 38** = **162 PASS / 0 FAIL**

### 7. 沉淀坑（复用）
1. **批量生图脚本必须 stdout 每张状态**，否则超时判断困难（log 实时可见 6-7s/张）
2. **Playwright `add_init_script` 预置钱包状态**：直接写 localStorage 简化付费测试
3. **付费回访问**：必须先 buyVol/buyPass，否则 readChapter() 触发未解锁弹窗而非主图（v20q 第 1 跑踩坑 → 加 buyPass 后修复）

---

## V20-U · 通用实名门控（2026-09-13 08:50 · commit pending）

### 1. 用户反馈与方向
> 客户点击世界功能区的小说介绍图片先看到这个介绍页。使命认证这个之前实名过不体现。心屿功能区创建角色和创作功能区创建智能体功能区点击后没有实名的用户也弹出实名操作对话框

决策：
- 世界 Tab 小说卡片 → plot-detail.html 介绍页（V20-A 已实现，验证通过）
- 实名门控：未实名前必须填表 → 复用 plot-runner 现有 modal 样式但抽成独立组件
- 已实名用户在 UI 中不显示实名元素（铁律）

### 2. 实施步骤
1. 调查：world 卡片跳转 / heart-create 按钮 / character-create 链接 / 现有实名 modal 4 个落点
2. 抽取 `js/realname-gate.js` 通用组件（240 行）
3. 改造 heart.js（创建按钮走 gate）+ creator-center.html（创建智能体走 gate）
4. 引入 realname-gate.js 到两个 Tab 页面
5. Playwright 真点击测试 5 场景 / 20 断言

### 3. realname-gate.js 接口
```js
window.LJRealname.gate(targetUrl, opts?) → boolean
  // 已实名 → window.location.href = targetUrl; return true
  // 未实名 → 弹 modal → 提交后 setItem(STORAGE_DONE, 'true') + 跳 targetUrl
  // opts.skipTries: 跳过每日 3 次限制（测试用）

window.LJRealname.isDone() → boolean
window.LJRealname.validateName(s) → boolean
window.LJRealname.validateId(type, id) → boolean
```

### 4. 关键决策
- **不改动 plot-runner.html 现有 modal**：抽成独立组件，让其他页面也能复用
- **门控 onclick 写法**：`event.preventDefault(); LJRealname.gate(this.href)` — 保留 href 让右键/中键仍可工作
- **提交后 400ms 延迟跳转**：让 toast 显示给用户看
- **暗色模式适配**：prefers-color-scheme: dark 用 dark 系列配色
- **失败兜底**：LJRealname 未加载（脚本顺序问题）时降级直跳目标页

### 5. 测试结果（test_v20u_realname_gate.py）
**20 PASS / 0 FAIL / 0 PageError**
- A. 世界卡片 → plot-detail.html（30 张卡片全检 + 1 次点击）
- B. 心屿未实名 → 创建新角色（8 项断言：LJRealname 加载 + 按钮存在 + modal 弹起 + 姓名长度 + 身份证格式 + 取消关闭 + 提交写入 + 跳转）
- C. 创作未实名 → 创建智能体（5 项）
- D. 心屿已实名 → 创建新角色（2 项：不弹 + 直跳）
- E. 创作已实名 → 创建智能体（2 项）

### 6. 沉淀坑（复用）
1. 测试 add_init_script 中 `localStorage.removeItem('k')` 会在**每次页面加载**时跑，包括目标页跳转后 → 会把刚写入的值清掉
2. 正确写法：`if(!localStorage.getItem('k')){localStorage.removeItem('k')}`
3. 心屿首次进入弹窗（.heart-dialog-mask）拦截测试按钮 → 测试前手动 `.heart-dialog-mask,.heart-dialog` 移除
4. 验证通用组件是否加载：`typeof window.LJRealname !== 'undefined' && typeof window.LJRealname.gate === 'function'`

---

## V20-V · 通用小说世界引擎 MVP（2026-09-13 09:30 · commit pending）

### 1. 用户指令（V20-T 沉淀）
> 仔细阅读理解给你的现实世界玩法样式的参考，开始继续开发小说世界要系统可以根据上传的小说和收费章节关卡道具（如果收费点作者没有手动选择系统可以自动生成）自动生成小说世界
> 所有小说世界场景道具都可以点击场景道具家具建筑图片交互操作像给你的参考人物对话那样除了主页操作按键外其他不点击是场景图片点击是交互操作界面的小说世界

决策（V20-T 22:00 用户已确认）：
- **视觉风格**：古风插画（田间记样板）= 默认；V20-Q 真人写实三国作为另一模板
- **引擎路径**：新建 `output/preview/novel-game.html`（独立页 · 上传即玩）
- **txt 标注格式**：行内标注（用户已确认）

### 2. 实施步骤
1. 设计 7 种行内标注：`## 章名` / `### 场景：名` / `「角色」对话` / `{道具:name}` / `{人物:name}` / `[选项A|选项B]` / `【收费章节：N灵晶】`
2. 写示例 txt：`corpus/books/demo-taohuayuan.txt`（6 章 · 含全部标注）
3. 写解析器 `js/novel-game-parser.js`（150 行）
4. 写控制器 `js/novel-game.js`（320 行 · upload/chapters/stage 三模式）
5. 写 `novel-game.html`（280 行 · letterboxed 古风视觉）
6. 写测试 `test_v20v_novel_game.py`（26 项断言 · 0 FAIL）

### 3. novel-game.js 接口（控制器）
```js
window.LJNovelGame = {
  state(),         // 当前状态 {book, chapIdx, blockIdx, inventory, paidChaps}
  loadTxt(txt, label),  // 解析并显示章节列表
  parseNovel(txt)  // 仅解析（测试用）
}
```

### 4. novel-game-parser.js 接口（解析器）
```js
window.LJNovelParser = {
  parseNovel(txt),  // txt → {title, chapters[]}
  flatBlocks(chapter)  // chapter → [block, ...]（合并场景）
}
```

### 5. 关键决策
- **场景图占位**：古风渐变（用户未上传图时显示）；后续可接入 SD 生成场景图
- **hotzone 随机位置**：`{ left: 20 + Math.random()*60, top: 30 + Math.random()*40 }`
- **选项按钮 fallback**：每个 block 末尾追加「继续」按钮（防止 block 推不出去）
- **付费章节持久化**：`lingjing_v520_novel_game_state_<bookHash>` 存 `paid` + `_progress` 存进度
- **钱包复用 V20-Q**：`lingjing_v520_wallet`（{jade, crystal}）
- **货币铁律**：UI 中只准出现灵晶/灵玉，禁用丸子/铜钱

### 6. 测试结果（test_v20v_novel_game.py）
**26 PASS / 0 FAIL / 0 PageError**
- A. 上传页 → 示例加载 → 章节列表（5 项）
- B. 第一章进 stage + 选项 + 道具 + NPC（3 项）
- C. hotzone 可点击 → 抽屉交互 → 关闭（3 项）
- D. 选项按钮推进 blockIdx（1 项）
- E. 付费弹窗 + 取消 + 付费扣灵晶 + paidChaps + 不重复扣（7 项）
- G. 背包 FAB + 物品显示（2 项）
- H. 存档 FAB + localStorage（1 项）
- I. 帮助弹窗（1 项）
- J. 解析器单元测试 5 类 block + cost（2 项）

### 7. 沉淀坑（复用）
1. **测试断言错位**：测试推 N 次后必须查实际 block.text 而不是凭推断
2. **hotzone click 超时**：用 `page.mouse.click(x, y)` 坐标点击绕开 selector 解析遮挡
3. **evaluate JS 字符串嵌套**：避免在 Python 字符串里嵌 `Math.abs(...)` 嵌套函数
