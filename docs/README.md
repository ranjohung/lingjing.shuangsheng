# 灵境 · 双生 — 当前文档入口（v5.14 更新）

正式名：灵境 · 双生（Lingjing · Dual Souls）。一个角色，两种人生。在故事里经历命运，在现实中陪伴你。

---

## 阅读起点

**全部文档索引见 [docs/INDEX.md](INDEX.md)。**

先看 [docs/ONBOARDING.md](ONBOARDING.md) 5 分钟读懂产品，再按你的角色在 INDEX 找到对应文档。

**最新审查报告**：[docs/AUDIT_2026-09-10.md](AUDIT_2026-09-10.md)（v5.15 全项目代码审查 · 9 页面 + 12 模块 + 22 文档）

---

## 版本时间线（v5.6 → v5.14 · 2026-09-10 当日）

| 版本 | 日期 | 主题 | 主要交付 |
|---|---|---|---|
| **v5.6** | 09-09 晚 | 真机可测版 | 5 题材 3D 世界 + 11 结局（古风/校园/赛博/现代/仙侠） |
| **v5.7** | 09-09 晚 | 移动端适配 | 触屏摇杆 + FPS 监控 + 设置面板 |
| **v5.8** | 09-09 晚 | 重设计（聊天视图） | 角色气泡对话 + 收藏/关注（保留为历史） |
| **v5.9** | 09-09 晚 | 重设计（创作中心） | 4 Tab 应用导航（保留为历史） |
| **v5.10** | 09-09 末 | SD 真实立绘 | majicMIX realisticv7 9 张立绘 + Blender .glb 角色模型 |
| **v5.11** | 09-10 凌晨 | 9 题材 + GLB 集成 | 穿越/悬疑/奇幻/科幻 4 副题材 + GLTFLoader + AudioFX 重建 |
| **v5.12** | 09-10 上午 | 30 题材库 | 30 题材元数据 + 上传向导 + 编辑器 + 沉浸剧情对话运行器 + 5 demo |
| **v5.13** | 09-10 下午 | 经典沉浸剧情对话样式 | 全屏场景 + 立绘 + 底部对话框 + 打字机 + 5 槽位存档 + 结局模态 |
| **v5.14** | 09-10 晚 | 商业化 4 大系统 | AI 辅助填表 + 版权分层（L1-L4）+ 22 种收费点 + 5 维质量审核 + 3 级改编授权 |
| **v5.15** | 09-10 晚 | **代码审查 + 死链修复** | AUDIT 报告 + 6 文件 title 同步 + library.html 死链修复 + games/redesign 归档 banner |

**迭代故事**：6 天 9 个版本（v5.6→v5.15），从 5 题材 3D 单文件原型（1,718 行）扩展到 30 题材 + 9 页面 + 12 JS 模块（11,695 行）+ 商业化 4 大系统。

---

## 当前版本（v5.14）

### 产品视觉总览
- **`product-preview.html`**（[打开](../product-preview.html)）—— 完整产品视觉总览（v5.13 沉浸剧情对话 + v5.14 商业化 + 30 题材 + 11 数据表 + 4 分层 + 22 收费点 + 5 维审核）

### 9 个核心页面（全部双击可预览）
| # | 页面 | 功能 | 版本 |
|---|---|---|---|
| 1 | [library.html](../output/preview/library.html) | 30 题材库首页（搜索/筛选/已上传展示/空仓提示） | v5.14 |
| 2 | [novel-upload.html](../output/preview/novel-upload.html) | 4 步上传向导（选题材→贴文本→元数据→一键解析） | v5.14 |
| 3 | [novel-edit.html](../output/preview/novel-edit.html) | 编辑器（节点/角色/选项/实时预览/覆盖审计） | v5.14 |
| 4 | [plot-runner.html](../output/preview/plot-runner.html) | 沉浸剧情对话运行器（WebGL 背景 + 立绘 + 对话气泡 + 2-4 选项 + 结局模态） | v5.14 |
| 5 | [commerce.html](../output/preview/commerce.html) | 商业化设置（4 系统一站式管理） | v5.14 |
| 6 | [game-3d.html](../output/preview/game-3d.html) | 真实 3D 世界（Three.js + GLB + 9 题材 + 21 结局） | v5.11 |
| 7 | [catalog.html](../output/preview/catalog.html) | 30 题材视觉原型（Tailwind CDN） | v5.14（归档） |
| 8 | [games.html](../output/preview/games.html) | 5 题材入口（早期 dev 原型） | v5.6（历史） |
| 9 | [redesign.html](../output/preview/redesign.html) | 重设计（聊天视图 + 创作中心） | v5.9（历史） |

### 12 个 JS 模块（共 11,695 行）
| 模块 | 行数 | 暴露 API |
|---|---|---|
| `genres.js` | 150 | GENRES_LIBRARY（30 题材）+ getGenreById + matchGenre |
| `novel-store.js` | 87 | NovelStore（CRUD） |
| `novel-parser.js` | 381 | NovelParser（5 步解析 + 审计） |
| `plot-schema.js` | 99 | PLOT_SCHEMA + createEmptyPlot |
| `plot-engine.js` | 738 | PlotEngine（剧情 UI 引擎） |
| `demo-seed.js` | 254 | DemoSeed（5 题材 demo） |
| `audiofx.js` | 214 | AudioFX（9 音阶 BGM + SFX + ambient） |
| `db.js` | 246 | DB（11 张表 schema + 通用 CRUD） |
| `copyright-tier.js` | 193 | CopyrightTier（4 级分层） |
| `monetization.js` | 218 | Monetization（22 收费点 + 5 档作者等级） |
| `quality-review.js` | 414 | QualityReview（5 维审核） |
| `ai-helper.js` | 485 | AIHelper（22 字段模板库） |

### 商业化 4 大系统（v5.14）
| 系统 | 核心能力 | 数据表 |
|---|---|---|
| **① AI 辅助填表** | 22 字段模板库 + 🤖 帮我写弹层 + 换一批 + 我来说 + 选项数量动态控制 | `ai_helper_usage` |
| **② 版权分层** | 4 级自动判定（L1 AI辅助 / L2 人机协作 / L3 作者主导 / L4 纯人工）+ 动态证书 | `novel_copyright_tiers` |
| **③ 收费点 + 收益** | 22 种收费点（剧情锁/属性道具/卡牌/外观/功能）+ 5 档作者等级 + 阶梯分成 | `creator_monetization_points` + `creator_earnings` |
| **④ 质量审核 + 改编授权** | 5 维评估（叙事 30% + 角色 25% + 文学 20% + AI味 15% + 合规 10%）+ 3 级授权（A 60% / B 70% / C 90%） | `novel_quality_reports` + `novel_review_records` + `adaptation_licenses` + `adaptation_revenue_records` |

### 11 张数据表（localStorage 持久化）
1. `novel_copyright_tiers` — 版权分层记录
2. `adaptation_licenses` — 改编授权记录
3. `adaptation_revenue_records` — 改编收益记录
4. `creator_monetization_points` — 作者收费点
5. `creator_earnings` — 作者收益
6. `novel_quality_reports` — 质量评估报告
7. `novel_review_records` — 审核记录
8. `content_reports` — 侵权举报
9. `tax_records` — 税务记录
10. `aml_monitoring` — 反洗钱监控
11. `ai_helper_usage` — AI 辅助填表使用记录

**前缀**：`lingjing_v514_`（可一键迁移到真后端）

---

## 测试报告（按版本归档）

| 版本 | 报告 | 状态 |
|---|---|---|
| v5.6 | [v5.6-TEST-REPORT.md](v5.6-TEST-REPORT.md) | ✅ |
| v5.7 | [v5.7-TEST-REPORT.md](v5.7-TEST-REPORT.md) | ✅ |
| v5.8 | [v5.8-TEST-REPORT.md](v5.8-TEST-REPORT.md) | ✅ |
| v5.10 | [v5.10-TEST-REPORT.md](v5.10-TEST-REPORT.md) | ✅ |
| v5.11 | [v5.11-TEST-REPORT.md](v5.11-TEST-REPORT.md) | ✅ |
| v5.12 | [v5.12-TEST-REPORT.md](v5.12-TEST-REPORT.md) | ✅ |
| v5.14 | [v5.14-TEST-REPORT.md](v5.14-TEST-REPORT.md) | ✅ |
| **v5.15** | **[AUDIT_2026-09-10.md](AUDIT_2026-09-10.md)** | **✅ 代码审查** |

---

## 主要文档目录

| 文档 | 说明 |
|---|---|
| [INDEX.md](INDEX.md) | 完整文档索引（v5.14 更新） |
| [ONBOARDING.md](ONBOARDING.md) | 5 分钟产品速读 |
| [PRD.md](PRD.md) | 产品需求文档（v5.1 基础 + v5.6-v5.14 更新日志） |
| [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) | 开发计划 |
| [WORLD_OS_SPEC.md](WORLD_OS_SPEC.md) | 世界 OS 规范 |
| [DUAL_SOUL_SPEC.md](DUAL_SOUL_SPEC.md) | 双生规范 |
| [ECONOMY_SYSTEM.md](ECONOMY_SYSTEM.md) | 经济系统 |
| [CREATOR_SYSTEM.md](CREATOR_SYSTEM.md) | 创作者系统 |
| [UI_DESIGN_GUIDE.md](UI_DESIGN_GUIDE.md) | UI 设计指南（沉浸剧情 UI 规范） |
| [ASSET_PRODUCTION_GUIDE.md](ASSET_PRODUCTION_GUIDE.md) | 资产生产指南 |
| [NEXTJS_DEV_GUIDE.md](NEXTJS_DEV_GUIDE.md) | Next.js 实施指南 |
| [ECONOMY_BIBLE.md](ECONOMY_BIBLE.md) | 经济工程手册 |
| [MASTER_SPEC.md](MASTER_SPEC.md) | 主规范 |
| [MIRAI_SPEC.md](MIRAI_SPEC.md) | MIRAI 规范 |
| [UPDATE_2026-09-09.md](UPDATE_2026-09-09.md) | 09-09 更新 |
| [UPDATE_2026-09-10.md](UPDATE_2026-09-10.md) | 09-10 更新（v5.13+v5.14 详细说明） |
| [DOCS_AUDIT_2026-09-09.md](DOCS_AUDIT_2026-09-09.md) | 09-09 文档审计（历史） |
| [AUDIT_2026-09-10.md](AUDIT_2026-09-10.md) | **09-10 全项目代码审查（最新）** |
| [CODEX_RULES.md](CODEX_RULES.md) | Codex 开发规则 |
| [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) | 实施状态 |
| [backend/](backend/) | 后端规格（27 份） |
| [frontend/](frontend/) | 前端规格 |
| [infrastructure/](infrastructure/) | 基础设施 |
| [legal/](legal/) | 法律（14 项入口） |
| [product/](product/) | 产品文档 |
| [sources/2026-09-09/](sources/2026-09-09/) | 7 份源文件留档 |

---

## 约束（持续遵守）

- ✅ **不接真 LLM** — 所有 AI 辅助用规则引擎 + 模板库，保留 `window.AIHelper.generate` 钩子
- ✅ **不接真支付/提现** — 月流水 < 10 万仅可平台消费
- ✅ **localStorage 优先** — 11 张表全用 `lingjing_v514_` 前缀，保留 `window.DB` 接入真后端
- ✅ **不抽卡/不卖确定性胜利**
- ✅ **数据自主可控** — 30 题材 demo + 5 部小说 demo 全部本地注入
- ✅ **真机模拟优先** — Chromium swiftshader 软渲染跑全套真机测试

---

## 审查历史

| 日期 | 审查范围 | 报告 |
|---|---|---|
| 2026-09-09 | 文档完整性审计（7 份源文件） | [DOCS_AUDIT_2026-09-09.md](DOCS_AUDIT_2026-09-09.md) |
| **2026-09-10** | **全项目代码审查（9 页面 + 12 模块 + 22 文档）** | **[AUDIT_2026-09-10.md](AUDIT_2026-09-10.md)** |

---

## 注意

- 本批新增文档不修改 v5.1 的功能范围与冲突裁决；任何冲突以 v5.1 为准。
- v5.14 的 4 大商业化系统来自与 DeepSeek 多轮讨论的 PRD，已落地但仍需用户验收。
- 工程启动信号仍在等待用户指令；本批文档交付不代表开始实现。
- 7 份源文件留档于 [sources/2026-09-09/](sources/2026-09-09/)；15 份法律原稿未做法律核验，不作为合规承诺。