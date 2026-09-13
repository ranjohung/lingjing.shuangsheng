# DEV PLAN V22 — 小说世界自动生成引擎

> 日期：2026-09-13 · PRD：[PRD-v22-novel-world-engine.md](PRD-v22-novel-world-engine.md) · 需求原文：[sources/2026-09-13/S03](sources/2026-09-13/S03-novel-world-engine-deepseek-doc.txt)
> 工作包序列：V22-A → V22-E，每包含独立验收；完成一包跑一次 `scripts/test_v22_*.py`
> **与 V21-novel-sim 并行，不冲突**

---

## 前置盘点（2026-09-13）

| 资产 | 现状 | V22 处置 |
|---|---|---|
| `novel-game.html`（V20-X 长滚动阅读 + V20-Y 段落画面 + V20-Z 右侧菜单） | splash + 3 步入口 + 章节封面 + 段落卡片 + 段落画面 + 末选项 + 主菜单 | **V22-C 叠加** 顶部状态栏 + 底部文字框 + 悬浮标签；**保留 V20-X/Y/Z 全部功能** |
| `js/novel-game.js`（控制器） | 1260+ 行，含 `renderChapterReader` / 入口流程 / 主菜单 | **V22-A 引入 store**：调用 NovelWorldStore 读写本地数据；主线选择由 store.flow 判断 |
| `js/novel-game-parser.js` | `parseOriginalNovel` + `extractEntities`（V20-X 已严格不删减） | **V22-A 扩展**：输出 `world_bible` / `assets` / `story_nodes` / `scene_interactions` 五字段 |
| `js/world-data.js` | PUBLIC_DOMAIN 6 本（红楼梦/三国/西游/水浒/聊斋/桃花源） | **V22-E 复用**：plot-detail 路由接通，book=xxx 自动入世界 |
| `output/preview/corpus/books/*.txt` | 部分存在（hongloumeng.txt 等） | **V22-E 复用 + fallback**：EMBEDDED_BOOKS 内嵌保证零崩溃 |
| `js/plot-detail.js` | V20-V3 已接通 taohuayuan → novel-game.html?demo=1 | **V22-E 扩展**：5 大名著 → novel-game.html?book=xxx |
| `css/mobile-lock.css` | V20-G 全手机版 | V22-C 沿用（顶部状态栏 + 悬浮标签响应式适配 ≤480px） |
| `css/design-system.css` | 546 ds-* 类 | V22-C 复用品牌色变量 |
| localStorage | v514（专家表单）/v519（实名/剧情）/v520（钱包）/v521（novel-sim） | V22 新增 `lingjing_v522_novel_world_v1`，互不干扰 |

---

## V22-A 数据中枢 + parser 强化（基础设施）

### 交付物
- `output/preview/js/novel-world-store.js`：`window.NovelWorldStore`（PRD §7 数据模型完整实现）
  - load / save / reset
  - world_bible / assets / story_nodes / scene_interactions / player_state / runtime 全套 CRUD
  - player_state 字段含题材叠加属性（xiuxian/mori/wuxia/jingying/gongdou 自动装载）
  - 严格不删减：`assets.scenes[].paragraphs` = 原文 100%（byte-equal）
- `output/preview/js/novel-world-parser.js`：扩展现有 parser
  - `extractWorldBible(text)` → `{ genre, era, power_system, factions, forbidden_rules }`
  - `extractScenes(text)` → `[{scene_id, scene_name, time_period, paragraphs[]}]`
  - `extractNpcs(text)` → `[{npc_id, name, relation}]`
  - `extractItems(text)` → `[{item_id, name, category, quantity}]`
  - `extractActions(text)` → `[{action_id, label, action_type, cost, target_scene}]`
  - 关键：**所有提取函数严禁使用 LLM / mock 生成**；纯规则化（关键词 + 正则 + 上下文）

### 验收（test_v22_a_store.py）
- 上传样本 txt（混合 5 题材关键词），store 写读 round-trip 正确
- 5 步流水线输出字段完整（world_bible / assets / story_nodes / scene_interactions / player_state）
- **零删减断言**：原文段落 byte-equal 保留
- `node --check` 全部新 JS 通过

---

## V22-B 题材识别器 + 属性面板动态装载

### 交付物
- `output/preview/js/novel-world-genre.js`：`window.NovelWorldGenre`
  - `detect(paragraphs)` → `{ primary, weights, combo }`（PRD §5.3 算法实现）
  - 5 大题材关键词字典（xiuxian/mori/wuxia/jingying/gongdou）
  - 题材 → 属性面板映射表（每题材对应 4-5 个专属属性）
  - 题材 → 默认基础操作列表（每题材 5-8 个悬浮标签类型）
  - `applyToPlayerState(player_state, genre)` → 动态装载属性字段
- 题材识别准确率自检（mock 5 题材各 100 段关键词样本）

### 验收（test_v22_b_genre.py）
- 5 题材各 1 本 mock txt，detect 正确识别
- 属性面板装载：识别修仙 → player_state.attrs 出现 修为/灵根/神识/寿元/灵气
- 题材叠加：修仙+经营 → 同时出现 修为 和 体力/土地
- 题材权重：纯修仙 → combo 只 1 项；修仙+少量经营 → combo = 2 项
- `node --check` 通过

---

## V22-C 顶部状态栏 + 底部文字框 + 悬浮标签 UI（视觉小说范式落地）

### 交付物
- `output/preview/novel-game.html` 新增 DOM：
  ```html
  <!-- 顶部状态栏（fixed） -->
  <div id="ng-topbar" class="ng-topbar">
    <div class="ng-tb-avatar">[Q版头像]</div>
    <div class="ng-tb-time" id="ng-tb-time">0年12月上旬</div>
    <div class="ng-tb-stamina">🏃 <span id="ng-tb-stamina">62</span></div>
    <div class="ng-tb-copper">🪙 <span id="ng-tb-copper">31</span></div>
    <div class="ng-tb-silver">💰 <span id="ng-tb-silver">5</span></div>
  </div>
  
  <!-- 底部文字框（fixed bottom） -->
  <div id="ng-bottom-text" class="ng-bottom-text">
    <div class="ng-bt-text" id="ng-bt-text">（原文逐字显示）</div>
    <button class="ng-bt-next" id="ng-bt-next">▶</button>
  </div>
  
  <!-- 悬浮标签容器（叠加在 scene 上） -->
  <div id="ng-hot-tags" class="ng-hot-tags"></div>
  ```
- 配套 CSS：`.ng-topbar` / `.ng-bottom-text` / `.ng-hot-tag`
  - 顶部状态栏：背景 `rgba(26,26,46,0.92)` + 边框 + 高度 44px + fixed top
  - 底部文字框：背景 `rgba(26,26,46,0.85)` + 花纹装饰 + 高度 110px + fixed bottom + z-index 100（不挡 5 Tab）
  - 悬浮标签：position absolute 在 scene 内，pointer-events: auto，圆角 16px + 小三角
- `output/preview/js/novel-game.js` 扩展：
  - `renderTopbar(player_state)` → 装载 5 个字段，运行时实时更新（行动值/铜钱跳动动画）
  - `renderBottomText(paragraph)` → 打字机逐字显示（30ms/字），点击屏幕或 ▶ 按钮推进
  - `renderHotTags(scene_interactions[])` → 在 #ng-hot-tags 内生成悬浮标签
  - 点击悬浮标签 → dialog 确认消耗 → 触发 action → 更新 store → 重渲染 topbar

### 验收（test_v22_c_ui.py）
- 顶部状态栏 5 元素全部存在 + 可读
- 底部文字框打字机效果（30ms/字，文字数量渐增）
- 悬浮标签点击有"是否"确认弹窗
- 数值跳动动画（行动值 -1 后值变化 + 短暂红色高亮）
- **无语聊天气泡**（关键字扫描 0 命中 `.chat-bubble` / `#chat-bubble*`）
- 桌面视口 ≤480px 居中 + mobile-lock.css 引入
- `node --check` 通过

---

## V22-D 主线锚点 + 支线收敛逻辑（互动核心）

### 交付物
- `output/preview/js/novel-world-flow.js`：`window.NovelWorldFlow`
  - `isCanonicalChoice(choice, story_node)` → bool
  - `convergeToAnchor(player_state, target_anchor)` → 强制跳到 anchor
  - `selectChoice(choice, scene)` → 触发后续流程（主线 → 下一段原文；偏离 → 收敛计时）
  - 收敛计时：`selected_choice_history.length` ≥ 3 → 自动跳回下一 anchor
- 集成到 novel-game.js：点击悬浮标签 → 调 flow → 更新 store → 重新渲染
- UI 反馈：支线进行时顶部状态栏时间推进 +1 个时辰（"0年12月上旬" → "0年12月中旬"）

### 验收（test_v22_d_flow.py）
- 选 canonical 路线 → 原文逐字推进（主线），支线历史长度 = 0
- 选 divergence 路线 → 触发"支线提示"对话框（"你选择了不在原著中的选项……"）
- 收敛断言：3 次偏离后自动跳回 anchor，下一段文字 = 原文下一段
- 支线历史持久化：runtime.selected_choice_history 写 store
- `node --check` 通过

---

## V22-E 系统菜单扩充 + 4 大名著接通 + 全面回归（收尾）

### 交付物
- `output/preview/novel-game.html` 右侧菜单扩充：9 项功能全可点
  - 存档（已有 / 新增）→ 写 store.runtime
  - 读档（已有 / 新增）→ 弹「从头开始 / 继续观看」二选一（PRD §6.5 铁律）
  - 回放（新增）→ 显示 runtime.selected_choice_history + 触发过的原文段落
  - 设置（已有）→ 字号 / 背景 / 打字机速度 / 自动模式
  - 商城（新增）→ 灵晶购买"行动值回复药水"（灵境货币，不破坏铜钱/银两）
  - 属性（新增）→ 显示 player_state.attrs 全部字段
  - 衣柜（新增）→ V22 暂留空（占位 + 「v5.21+ 即将开放」）
  - 好感（新增）→ NPC 列表 + affinity 数值
  - 福利（新增）→ 每日签到 +10 灵玉
- `output/preview/js/plot-detail.js` 5 大名著 routing：
  - `hongloumeng` / `sanguoyanyi` / `xiyouji` / `shuihuzhuan` / `liaozhai` → `novel-game.html?book=xxx`
  - `taohuayuan` → `novel-game.html?demo=1`（保持 V20-V3）
- `scripts/test_v22_protection.py`：5 条强制验收（PRD §10 表格）
- `scripts/test_v22_e2e.py`：E2E 完整链路（splash → 选角 → 进游戏 → 顶部状态栏 → 底部文字框 → 悬浮标签 → 主菜单 → 退出）

### 验收（test_v22_e_*.py）
- 9 项菜单功能全可点 + 0 破链
- 5 大名著 entry → 进游戏后顶栏正确显示对应小说名 + 公版作者
- 5 条强制验收全通过：
  1. 原著保护（byte-equal 原文）
  2. 题材自动识别（5 本测试）
  3. 交互点触发（拾取/去后山/维修 全测）
  4. 支线收敛（3 步内回 anchor）
  5. 无聊天界面（关键字扫描）
- 桌面 + 移动双视口截图各 5 张（v22 命名目录）
- GitHub commit + push（如远端可达）

---

## 时间线（估算）

| 工作包 | 预计耗时 | 关键里程碑 |
|---|---|---|
| V22-A | 0.5 天 | 数据中枢 + 5 步 parser 跑通 |
| V22-B | 0.3 天 | 5 题材识别 + 属性装载 |
| V22-C | 0.5 天 | UI 三层落地 + 视觉小说范式 |
| V22-D | 0.3 天 | 主线/支线流程 |
| V22-E | 0.4 天 | 菜单扩充 + 5 大名著 + 全面回归 |
| **合计** | **2 天** | V22.0 完成 |

---

## 风险与回退（开发期预案）

| 风险 | 触发条件 | 回退方案 |
|---|---|---|
| 题材识别误判 | 关键词频次统计阈值过低 | 默认"模拟经营"（最宽松），不强制 UI 装载 |
| 悬浮标签坐标无原文依据 | parser 提取 position 字段为空 | fallback position `(0.5, 0.5)`，CSS 自适应居中 |
| 铜钱/银两与灵晶冲突 | topbar 同时显示两类货币 | 顶栏铜钱/银两仅作"小说内资产"标识（灰色显示），不可点击交易 |
| 打字机 30ms 过慢 | 长段落时阅读耗时过长 | 设置面板可调速（10ms / 30ms / 60ms / 即时） |
| V20-X 长滚动与 V22 视觉小说冲突 | 段落卡片 vs 悬浮标签布局打架 | V22-C 段落卡片 → 内嵌悬浮标签 + 底部文字框并存 |

---

## 验收门槛（每包必跑）

1. **node --check** 全部新 JS（防止 Write 工具丢行）
2. **Playwright 回归**（对应 test_v22_X_*.py 必须 PASS）
3. **桌面 + 移动双视口截图**（写 `screenshots/v22/{工作包}/`）
4. **关键字扫描**：0 命中第三方产品名 / 聊天界面 / 开发元数据
5. **Git commit + push**（如远端可达）

---

## 后续（登记不做，V22 之后轮次）

- 美术资源 AI 自动匹配（V22-C 当前用渐变 + emoji 占位）
- 工坊制作 + 配方数据库真实实现
- 云端存档 + 多端同步
- 与 V21-novel-sim 联动（创作 → 自动转游戏）
- 实时 LLM 接入（window.AIHelper 钩子已预留）