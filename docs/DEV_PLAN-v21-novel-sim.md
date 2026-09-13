# DEV PLAN V21.0 — 小说辅助模拟器

> 日期：2026-09-13 · PRD：[PRD-v21-novel-sim.md](PRD-v21-novel-sim.md) · 需求原文：sources/2026-09-13/S01+S02
> 工作包序列：V21-A → V21-E，每包含独立验收；完成一包跑一次 `scripts/test_v21_novel_sim.py`

## 前置盘点（2026-09-13）

| 资产 | 现状 | V21 处置 |
|---|---|---|
| `novel-ai-helper.html`（1049 行） | 6 表 28 字段 + 对话式 3 步雏形（占位多：alert 换一批/我来说、prompt() 自由描述、showSummary 未实现、右栏空标签） | **V21-B 重写**：引导模式（3 必答 + 5 选答 + 简报确认）+ 保留专家模式 |
| `js/novel-outline.js` / `js/quality-auto.js` / `js/character-profile.js` | v5.17 数据层（28 字段定义 / 6 维检测 / 人物小传） | 专家模式继续引用，不动 |
| `novel-edit.html` | 互动剧（plot-runner）编辑器，用途不同 | **不动**（不砍不混） |
| `js/realname-gate.js` | V20-U 通用实名门控，creator-center 已挂载 | 入口复用 |
| localStorage | v514（专家表单）/ v519（实名/剧情）/ v520（钱包） | V21 新增 `lingjing_v521_*`，互不干扰 |

---

## V21-A 数据中枢 + AI mock（基础设施）

**交付物**
- `output/preview/js/novel-sim-store.js`：`window.NovelSimStore` —— load/save/reset、
  brief / outline（锁定状态机 draft→confirmed→locked）/ chapter_plans / chapters /
  characters / foreshadows / ai_logs 全套 CRUD（镜像 PRD §3 F-8 五表）
- `output/preview/js/novel-sim-ai.js`：`window.NovelSimAI` —— 
  `generate(kind, ctx)`（题材概要/职业/性格/冲突/驱动力/世界观/配角/关系/大纲字段/
  章节规划/段落 4 类型候选）、`formatUserText(kind, text)`（"我来说"格式化）、
  `checkQuality(no)`（5 维 + 质量分）、`applyFixes(no)`（一键修复 mock）；
  **若 `window.AIHelper.generate` 存在则优先外部实现（真 LLM 钩子）**

**验收**
- 候选数量恒 3-5；`ai_logs` 每次生成留痕
- store 写读 round-trip 正确；outline 锁定后 `setOutline` 拒绝写（除非显式 unlock）

## V21-B 引导问卷重做（novel-ai-helper.html）

**交付物**
- 引导模式（默认）：对话式分步 —— 3 必答（题材与创意概要 / 主角设定 / 核心冲突与
  驱动力）+ 5 选答深度定制（世界观 / 配角 / 关系网络 / 故事长度 / 情感基调，可跳过）
- 每问：chips 选项 + [🤖 AI随机生成] + [✏️ 自由描述]（modal，清偿 prompt() 债）
- 创作简报摘要卡（必答/选答分区）→ [返回修改] / [✅ 确认，这就是我的故事] →
  写入 NovelSimStore.brief → 跳 novel-outline.html
- 专家模式：恢复被注释的 6 表表单（switchTable/renderFields），28 字段 / 12 模板 /
  6 维检测原样保留
- 模式切换页签；页级样式 ≤30 行新增（复用 design-system 变量）

**验收**：问卷流 Playwright 全通；alert/prompt 0 处；专家模式计数与旧版一致

## V21-C 大纲编辑与章节规划（novel-outline.html · 新建）

**交付物**
- 步骤条（①简报 ✓ → ②大纲 → ③章节规划 → ④逐章创作）+ 简报摘要回显
- 5 字段大纲编辑，每字段 [🤖 AI 给几个选项] modal（3-5 候选 + 风格标签 +
  "基于：…"上下文行 + 换一批 + 我来说）
- [确认大纲并锁定]（dialog 二次确认）→ 🔒 只读态 + [🔓 解锁修改]
- 章节规划区（大纲锁定后显示）：按简报长度生成 6/10/12 章；章节卡 6 字段可编辑 +
  ↑↓ 排序 + ✕ 删除 + + 新增 + 单章 [🎲 换个思路]；[锁定章节规划] → [进入逐章创作台 →]
- 简报缺失兜底：空态 + [先去完成创作引导] + [从专家模式 28 字段导入]（v514 有数据时）

**验收**：PRD 验收 #1 #2；0 破链

## V21-D 三栏逐章创作台（novel-writer.html · 新建）

**交付物**
- PC 三栏 grid 20/55/25（≥1024px 解除 480px 锁定，布局豁免登记 PRD §4）；
  ≤900px 堆叠（左栏横滚章节条 + 右栏底部弹出面板 🤖 浮钮）
- 左栏 4 页签（章节/大纲/人物/伏笔）+ 添加人物/伏笔弹窗
- 中栏正文编辑 + 防抖自动保存 + 字数统计；右栏 AI 面板（4 类型 + 候选卡
  [使用]/[换一批]/[我来说] + 当前章目标 + 出场人物 + 未回收伏笔）
- [完成本章并质检] → 5 维报告 modal（颜色标记 + 质量分 + [一键修复] + 复检）
- 底部状态栏：保存状态 / 总字数 / 版本 / 质量分
- 未锁定章节规划 → 空态引导去大纲页；章节完成 → 状态 done + 下一章

**验收**：PRD 验收 #3 #4 #5 #6；双视口 Playwright 全通

## V21-E 入口接入 + 回归 + 截图（收尾）

**交付物**
- creator-center.html：功能区卡文案更新（五步链路）；工作台 +2 入口
  （大纲规划 / 逐章创作台）；新增入口全走 LJRealname.gate
- `scripts/test_v21_novel_sim.py`：PRD §6 八条验收 + node --check 全部新 JS
- 截图 → `output/preview/screenshots/v21/`（问卷 3 步 / 简报 / 大纲候选 / 章节
  规划 / 三栏桌面 / 三栏移动 / 质检报告）
- 文档同步：ALL_FUNCTIONS §15 登记 + SITE_MAP 补遗 + 每日日志

**验收**：测试全绿 0 PageError；0 破链；0 第三方平台名；git commit

---

## 风险与坑（会话沉淀）

1. **Edit 工具静默丢失**（V20-J 铁则）：同批多 Edit 会丢内容 → 新页面一律整文件
   Write + 写后 grep 关键函数；改 creator-center 一次一个 Edit 立即验证
2. **Write 丢独立成行 `(function(){`**：新 JS 用具名函数/裸 `{}`；写完 `node --check`
3. **测试端口**：8767 必须从仓库根起（/assets 可达）；curl 加 `--noproxy "*"`
4. **实名门控测试**：add_init_script 预写 `lingjing_v519_realname_done='true'`，
   用 `if(!getItem)` 守卫防循环清除
5. **mobile-lock 与三栏冲突**：writer 页 override 登记豁免，其余两页保持锁定

## 状态跟踪

| 工作包 | 状态 | 交付 | 测试 |
|---|---|---|---|
| V21-A | 待开发 | store + ai | node --check + 单测段 |
| V21-B | 待开发 | novel-ai-helper 重写 | test 段 B |
| V21-C | 待开发 | novel-outline 新建 | test 段 C |
| V21-D | 待开发 | novel-writer 新建 | test 段 D（双视口） |
| V21-E | 待开发 | 入口 + 回归 + 截图 | test 全量 + 截图 7 张 |
