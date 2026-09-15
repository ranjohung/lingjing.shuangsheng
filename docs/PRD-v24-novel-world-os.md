# PRD V24 — 小说世界 OS V2.0（已废弃）

> 状态：**已废弃 / 方向错误**。本文件保留为历史记录，仅作说明。

## 废弃原因

扣子编写的 V24 规划试图**取代 V22-novel-world-engine 的架构层设计**，并新建 `novel-os-*` 页面体系。这与已交付并通过验收的 V22 路线冲突：

- V22 已完整交付：数据中枢、5 步提取流水线、5 题材识别、视觉小说范式 UI、主线/支线收敛，累计 117/117 PASS。
- V24 另起炉灶的 `lingjing_v524_novel_os_v1` 命名空间、`novel-os-upload.html` / `world-os.html` 等页面，未经过需求对齐，造成与 V22 的架构分裂。

因此 V24 方向被废弃，不再开发。

## 当前权威设计

「小说世界自动生成引擎」的权威设计继续由 V22 承载：

- [PRD-v22-novel-world-engine.md](PRD-v22-novel-world-engine.md)
- [DEV_PLAN-v22-novel-world-engine.md](DEV_PLAN-v22-novel-world-engine.md)
- 代码：`output/preview/js/novel-world-*.js`、`output/preview/novel-game.html`
- 交付状态：V22-A/B/C/D 117/117 PASS

## V24 中的可取思想

V24 文档中提到的部分概念（原著零删减、AI 是提取器不是作者、主线不可篡改、Canon Lock）本质上与 V22 铁律等价。这些思想已在 V22 中通过以下方式实现：

- `novel-world-parser.js` 保留原文段落 byte-equal。
- `novel-world-flow.js` 主线锚点 + 支线收敛机制。
- 视觉小说范式禁止聊天气泡，以原文场景为中心。

如需对 V22 进行架构层增强，应直接在 V22 工作包内迭代（V22-E 及以后），而不是新建 V24 体系。

## 已冻结资产

以下 V24 新建文件不再接线、不再扩展：

- `docs/sources/2026-09-15/S05-novel-world-os-v2.txt`（需求原文归档，永不修改）
- `output/preview/novel-editor.html`
- `output/preview/workshop.html`
- `output/preview/dashboard.html`
- `output/preview/agent-create.html`、`create-*.html`、`interaction-manage.html` 等
