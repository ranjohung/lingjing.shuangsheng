# PRD V21.0 — 小说辅助模拟器（引导式创作 + 大纲锁定 + 三栏创作台）

> 版本：V21.0（独立命名空间，延续 V17→V20 工作包序列）
> 日期：2026-09-13
> 需求原文：[sources/2026-09-13/S01](sources/2026-09-13/S01-novel-sim-questionnaire-guidance.txt) · [S02](sources/2026-09-13/S02-novel-sim-implementation-plan.txt)（永不修改）
> 关联：升级 `novel-ai-helper.html`（v5.18 原型），新增 `novel-outline.html` / `novel-writer.html`

---

## 1. 背景与定位

创作 Tab 的「小说辅助模拟器」（novel-ai-helper.html）目前是 **6 表 28 字段填空原型**：
问题一次铺开、无对话引导、无大纲锁定、无章节规划、无逐章创作台。用户反馈
"还没有看到完整的创作工具界面"，并给出两轮明确设计指令：

1. **S01 问卷式引导改造**：问卷是创作流程的骨架，必须保留，但从"填空题"
   升级为"引导式选项 + 自由输入"的混合模式（对话式引导 + AI随机生成 + 自由描述）。
2. **S02 实现方案文档**：大纲锁定防跑偏、上下文感知保连贯、多选项生成尊重作者主导；
   5 张数据表 + 4 阶段 AI 调用流程 + PC 三栏布局 + 质量检查。

**定位**：面向不懂写作的新手作者，从"不知道填什么"到"逐章写出第一本书"的
完整创作链路；同时保留专家模式（28 字段表单）不砍功能。

## 2. 用户主流程（5 步链路）

```
创作中心 → ① 创作引导问卷（novel-ai-helper.html 引导模式）
        → ② 创作简报摘要确认（"这就是我的故事"）
        → ③ 大纲编辑 + 锁定（novel-outline.html，AI 给 3-5 候选/字段）
        → ④ 章节规划 + 锁定（同页，AI 依大纲自动生成章节列表）
        → ⑤ 逐章创作台（novel-writer.html 三栏，写完自动质量检查）
```

## 3. 功能需求

### F-1 引导问卷（novel-ai-helper.html · 引导模式，重做）
- **第一层必答 3 问**（分步对话式，一次只问一个问题）：
  1. 题材与创意概要：热门题材 chips 单选 + 自由输入；创意概要 textarea
  2. 主角设定：主角类型（单主角/双主角/群像）+ 职业身份（按题材联动）+ 核心性格
  3. 核心冲突与驱动力：冲突类型（生存/真相/复仇/权力/守护/救赎）+ 内在驱动力
- **第二层深度定制 5 问（选答，可跳过）**：世界观设定 / 重要配角 / 关系网络 /
  故事长度（决定章节数）/ 情感基调
- 每个问题旁提供：**[🤖 AI随机生成]**（按已答上下文给 3-5 候选）、**[✏️ 自由描述]**
  （modal 输入，禁用 prompt()）、**[跳过]**（仅选答题）
- 回答后系统给出确认反馈再进入下一问（对话式体验）
- 全部完成 → **创作简报摘要卡**（必答+选答分区展示）→ [返回修改] / [✅ 确认，这就是我的故事]

### F-2 专家模式（novel-ai-helper.html · 保留，不砍功能）
- 原 6 表 28 字段表单完整保留（基础信息/世界格局/主线情节/章节细纲/人物小传/场景对话）
- 12 类提问模板 + 6 维自动检测保留
- 模式切换：「引导模式（推荐）」/「专家模式」页签
- 专家模式数据（lingjing_v514_*）可在大纲页一键导入为简报（兼容旧用户）

### F-3 大纲编辑与锁定（novel-outline.html · 新建）
- 5 字段：故事主题 / 世界背景 / 主线梗概 / 关键转折点（3-5 个可增删）/ 结局方向
- 每字段 **[🤖 AI 给几个选项]** → modal 3-5 候选（带风格标签 + 上下文引用行
  "基于：题材/主角/冲突"）+ [换一批] + [✏️ 我来说]
- **[确认大纲]** → 状态 `confirmed → locked`：字段只读 + 🔒 标识；
  [🔓 解锁修改] 需二次确认（弹窗说明"解锁后需重新确认"）
- 顶部步骤条：① 简报 ✓ → ② 大纲 → ③ 章节规划 → ④ 逐章创作

### F-4 章节规划（novel-outline.html · 新建）
- 大纲确认后解锁；**[🤖 根据大纲生成章节规划]** 按简报"故事长度"生成章节数
  （短篇 6 / 中篇 10 / 长篇 12，prototype 上限 12）
- 每章卡片：章节目标 / 主要冲突 / 出场人物（chips）/ 关键事件 / 承接上章 / 引向下章
- 支持编辑、[↑↓] 排序、[✕] 删除、[+] 新增、单章 [🎲 换个思路]（AI 重新生成该章目标）
- **[锁定章节规划]** → 锁定态 → [进入逐章创作台 →]

### F-5 三栏逐章创作台（novel-writer.html · 新建）
- **PC 三栏 20 / 55 / 25**；移动端（≤900px）堆叠：左栏变顶部横向滚动章节条，
  右栏变底部弹出面板（🤖 浮动按钮唤起）
- 左栏 4 页签：**章节**（列表：状态 planned/writing/done + 字数）/
  **大纲**（简报+大纲摘要只读 + 去修改链接）/ **人物**（列表 + 添加：
  姓名/身份/性格/口癖/忌讳词/行为约束）/ **伏笔**（内容/埋设章/计划回收/重要度/状态）
- 中栏：章节标题 + 章目标横幅 + 正文 textarea（自动保存 800ms 防抖）+ 字数统计
- 底部状态栏：保存状态（● 已保存 / ● 未保存）/ 总字数 / 版本 v1 / 质量分
- **[完成本章并质检]** → 质量检查报告 modal

### F-6 AI 辅助面板（novel-writer.html 右栏）
- 4 类型页签：场景描写 / 人物对话 / 剧情过渡 / 心理活动
- **[🤖 生成候选]** → 3-5 张候选卡，每卡标注**上下文引用**（"基于：第 N 章规划 +
  出场人物语言指纹 + 前章结尾"）
- 每卡 [使用]（插入正文）/ 全部候选 [换一批]
- **[✏️ 我来说]**：作者输入想法 → AI 格式化为候选卡（不直接写正文）
- 未接真 LLM：本地 mock 生成器；若存在 `window.AIHelper.generate` 外部实现则优先调用

### F-7 质量检查（novel-writer.html）
- 5 维报告 + 质量分（100 − fail×15 − warn×5）：
  1. 大纲一致性：正文是否覆盖本章目标关键词
  2. 人物一致性：出场人物口癖出现情况 / 忌讳词命中（fail）
  3. 时间线：时间词扫描（昨天/三天前/次日…）冲突启发式
  4. 伏笔状态：未回收伏笔 >3 警告；本章计划回收未回收警告
  5. 章节衔接：上章结尾关键词在本章开头复现度
- 颜色标记：绿 pass / 黄 warn / 红 fail；**[一键修复]**（mock：伏笔标记回收、
  衔接插入过渡段、其余生成修复候选段）修复后复检

### F-8 数据模型（localStorage 镜像 S02 五表，前缀 `lingjing_v521_`）
```
lingjing_v521_novsim_v1 = {
  meta:        { title, updatedAt }                      // ≙ novels
  brief:       { genre, idea, protagonist{type,job,traits},
                 conflict{type,drive},
                 deep{world,cast,relations,length,tone} } // 创作简报（问卷输出）
  outline:     { theme, background, main_plot,
                 turning_points[], ending_direction,
                 status: draft|confirmed|locked, confirmed_at }  // ≙ novel_outlines
  chapter_plans: [{ no, goal, conflict, characters[],
                    events, prev, next,
                    status: planned|writing|done }]        // ≙ novel_chapter_plans
  chapters:    { [no]: { title, content, wordcount,
                         versions[], saved_at } }          // ≙ 正文
  characters:  [{ id, name, role, personality,
                  voice{tone,catchphrase[],forbidden[]},
                  rules{never[],always[]} }]               // ≙ character_profiles
  foreshadows: [{ id, content, introduced_ch,
                  resolution_planned, importance,
                  status: introduced|hinted|revealed|resolved }] // ≙ foreshadowing_tracker
  ai_logs:     [{ type, context_used, candidates_n, selected, created_at }] // ≙ ai_generation_logs
}
```

### F-9 入口与门控（creator-center.html）
- 功能区卡片「小说辅助模拟器」文案更新为五步链路描述
- 工作台新增「大纲规划」「逐章创作台」两个入口（不砍既有 5 项）
- 创作类入口全部走 `LJRealname.gate()` 实名门控（V20-U 铁律）

## 4. 界面规格

### PC 主编辑器（novel-writer.html ≥1024px）
| 区域 | 宽度 | 内容 |
|---|---|---|
| 左侧栏 | 20% | 章节列表 / 大纲入口 / 人物库 / 伏笔追踪 |
| 中间编辑区 | 55% | 正文写作（最主要操作区域） |
| 右侧辅助区 | 25% | AI 辅助面板 / 当前章目标 / 出场人物 / 未回收伏笔 |

### 移动端（≤900px）
- 三栏堆叠：左栏 → 顶部横向滚动章节条；右栏 → 底部弹出面板
- 问卷页 / 大纲页保持 480px 手机锁定（手机游戏铁律 #15）

### 布局豁免登记
`novel-writer.html` 为**工作台类页面**，PC 视口解除 480px 锁定（page-level
override，登记于本 PRD §4 与 ALL_FUNCTIONS §15）——依据用户 S02 "PC端主编辑器
三栏布局" 最新指令，优先于 V20-G 全局锁定规则；移动端行为仍符合堆叠规格。

## 5. 非功能约束（铁律继承）

1. 不砍功能：专家模式 28 字段完整保留；novel-edit.html 互动剧编辑器不动
2. 第三方产品名 0 出现；货币只用灵晶/灵玉（本轮 UI 不涉及交易）
3. 不接真 LLM / 不接真支付：mock 数据 + `window.AIHelper` 钩子
4. `<dialog>`/Toast 替代 alert/confirm/prompt（清偿 novel-ai-helper 旧债）
5. 文档与代码同步：ALL_FUNCTIONS §15 + SITE_MAP + 本 PRD 同步登记
6. 返回路径：三个页面左上角均有 [← 返回]（问卷/大纲 → 创作中心，创作台 → 大纲页）

## 6. 验收标准（对应 S02 八条）

| # | 标准 | 验证方式 |
|---|---|---|
| 1 | 大纲确认后 🔒 锁定，字段只读 | test_v21：锁定后 textarea disabled |
| 2 | 章节规划依大纲自动生成，可增删改排序 | test_v21：生成 ≥6 章 + ↑↓ ✕ 可点 |
| 3 | AI 候选展示上下文引用 | test_v21：候选卡含"基于："字样 |
| 4 | 候选 3-5 个 / 换一批 / 我来说 | test_v21：数量断言 + 两按钮功能 |
| 5 | 质检报告 5 项 + 颜色标记 | test_v21：报告 modal 5 维 + 质量分 |
| 6 | PC 三栏 20/55/25 + 移动堆叠 | test_v21：1280 / 390 双视口 |
| 7 | 全流程 0 破链 | test_v21：href 目标文件存在 |
| 8 | 0 第三方平台名 / mock AI | test_v21：关键字扫描 0 命中 |

## 7. 范围外（登记不做）

- 真实 LLM 接入（window.AIHelper 钩子预留）
- 正文版本 diff 视图（versions 数组已预留）
- 商业化收费点与小说辅助模拟器联动（commerce 已有，独立演进）
