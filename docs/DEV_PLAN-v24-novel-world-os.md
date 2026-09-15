# DEV_PLAN V24 — 小说世界 OS V2.0（已废弃）

> 状态：**已废弃 / 方向错误**。本文件保留为历史记录，仅作说明。

## 废弃原因

扣子编写的 `DEV_PLAN-v24-novel-world-os.md` / `PRD-v24-novel-world-os.md` 与已确认并交付的 **V22-novel-world-engine** 在数据层、命名空间、页面体系上存在方向冲突：

- V22 已交付：数据中枢 `novel-world-parser.js` / `novel-world-store.js` / 题材识别器 / 视觉小说范式 UI，累计 117/117 PASS。
- V24 另起炉灶（`lingjing_v524_novel_os_v1`、novel-os-* 新页面），与 V22 并行线冲突，且未经过需求对齐。

因此 V24 方向被废弃，后续所有「小说世界自动生成引擎」迭代应基于 V22 展开，而不是新建 `novel-os-*` 体系。

## 权威替代

- 需求与开发计划：[PRD-v22-novel-world-engine.md](PRD-v22-novel-world-engine.md) / [DEV_PLAN-v22-novel-world-engine.md](DEV_PLAN-v22-novel-world-engine.md)
- 代码资产：`output/preview/js/novel-world-*.js`、`output/preview/novel-game.html`
- 验收：V22-A 36/36 · V22-B 24/24 · V22-C 27/27 · V22-D 30/30

## 已冻结资产

以下扣子创建的 V24 页面当前保留在仓库中，但**不再接线、不再扩展**：

- `output/preview/novel-editor.html`（扣子重写的小说辅助模拟器）
- `output/preview/workshop.html`（灵境工坊）
- `output/preview/dashboard.html`（数据看板）
- `output/preview/agent-create.html` 等新建子页

如需启用这些能力，应先在 V22 需求对齐会议中评估，避免再次分岔。

## 当前生效的接线

- 小说辅助模拟器入口：`creator-center.html` → `novel-ai-helper.html`（V21 原设计）
- 编辑作品入口：`creator-center.html` → `work-editor.html`（V23 修正版）
- 小说世界游戏入口：`novel-game.html`（V22 视觉小说范式）
