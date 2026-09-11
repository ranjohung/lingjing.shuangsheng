# 灵境 · 双生 — 文档总索引 v6.4（2026-09-12 更新）

> **本文件替代 [README.md](README.md) 的导航职责**。任何人接手，先打开这一份，按下面三个维度找到该读的文档。
>
> **最新审查报告**：[AUDIT_2026-09-12.md](AUDIT_2026-09-12.md) — 接口与功能完整性审查（32 页 + 29 模块 + 35 入口 230+ 点击）
>
> **审查问题报告**：[AUDIT-ISSUES_2026-09-12.md](AUDIT-ISSUES_2026-09-12.md) — 4 项已修复（F-1~F-4）+ 7 项遗留登记（O-1~O-7）
>
> **完整使用说明书**：[READING_GUIDE.md](READING_GUIDE.md) — v6.4 全面改版：5 Tab 架构 + 启动登录链路 + 公版库 40 本 + 三国世界 + 经济双轨
>
> **当前状态**：v6.4.1（5 Tab 手机游戏架构）+ V20-A~H（公版库 / 三国演义世界 / 手机锁定 / 启动登录）+ V20-I（全项目接口审查 · 4 修复）

---

## 0. 三分钟定位

| 你想 5 分钟读懂这个产品做什么 | [ONBOARDING.md](ONBOARDING.md) |
| --- | --- |
| 你想读完即可上手使用 | **[READING_GUIDE.md](READING_GUIDE.md)** |
| 你想知道"接口/功能完整性现状、还缺哪些" | **[AUDIT_2026-09-12.md](AUDIT_2026-09-12.md)** + [AUDIT-ISSUES_2026-09-12.md](AUDIT-ISSUES_2026-09-12.md) |
| 你想知道 v5.x 时代历史审查 | [AUDIT_2026-09-10.md](AUDIT_2026-09-10.md) / [DOCS_AUDIT_2026-09-09.md](DOCS_AUDIT_2026-09-09.md) |
| 你要开始写代码 / 做 UI / 出资产 | 按下面三维索引找到对应文档 |

---

## 一、按角色（你是谁）查文档

### 产品 / 战略
1. [ONBOARDING.md](ONBOARDING.md) — 5 分钟产品速读
2. [PRD.md](PRD.md) — 产品需求 44 项
3. [WORLD_OS_SPEC.md](WORLD_OS_SPEC.md) — World OS / Story OS / Novel OS
4. [DUAL_SOUL_SPEC.md](DUAL_SOUL_SPEC.md) — 陪伴 + 双界
5. [ECONOMY_SYSTEM.md](ECONOMY_SYSTEM.md) — 经济体系
6. [UPDATE_2026-09-09.md](UPDATE_2026-09-09.md) — 26 项冲突登记

### UI / 设计 / UX
1. [ONBOARDING.md](ONBOARDING.md) — 产品速读
2. [UI_DESIGN_GUIDE.md](UI_DESIGN_GUIDE.md) — **12 个核心页面规范 + 22 题材目录**
3. [product/06-world-directory-and-ui.md](product/06-world-directory-and-ui.md) — IA / 题材分类
4. [product/01~05.md](product/) — 产品概览 / 角色 / 功能 / 安全 / 路线
5. [ASSET_PRODUCTION_GUIDE.md](ASSET_PRODUCTION_GUIDE.md) — 资产视觉规范

### 前端 / Next.js
1. [ONBOARDING.md](ONBOARDING.md)
2. [NEXTJS_DEV_GUIDE.md](NEXTJS_DEV_GUIDE.md) — **B0-B11 实施步骤**
3. [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) — 工作包视图
4. [UI_DESIGN_GUIDE.md](UI_DESIGN_GUIDE.md) — 页面规范
5. [frontend/10~13.md](frontend/) — 前端架构 / 3D / 状态 / 设计系统
6. [ASSET_PRODUCTION_GUIDE.md §SD 立绘](ASSET_PRODUCTION_GUIDE.md) — 资产前端接入
7. [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) — 现有前端实现清单

### 后端 / FastAPI / Python
1. [ONBOARDING.md](ONBOARDING.md)
2. [NEXTJS_DEV_GUIDE.md](NEXTJS_DEV_GUIDE.md) §B0/B2
3. [backend/26-world-os-engineering-contract.md](backend/26-world-os-engineering-contract.md) — **工程契约 / 八步 AI / DDL 补强**
4. [backend/27-world-os-source-ddl.md](backend/27-world-os-source-ddl.md) — 9 张表 DDL
5. [backend/20-25.md](backend/) — 后端架构 / 数据库 / AI 编排 / 熔断 / 计费 / 叙事
6. [MIRAI_SPEC.md](MIRAI_SPEC.md) — 既有工程契约
7. [infrastructure/30-31.md](infrastructure/) — 环境与 Docker

### AI / Prompt / 数据 / 算法
1. [ONBOARDING.md](ONBOARDING.md)
2. [DUAL_SOUL_SPEC.md](DUAL_SOUL_SPEC.md) — 八层 + 心理学
3. [WORLD_OS_SPEC.md](WORLD_OS_SPEC.md) — 八步 AI
4. [backend/26 §八步AI链](backend/26-world-os-engineering-contract.md) — 完整调用规范
5. [backend/22-ai-orchestrator.md](backend/22-ai-orchestrator.md)
6. [testing/40-test-strategy.md](testing/40-test-strategy.md) — 记忆冲突 / 关系衰减测试

### 美术 / SD / AI 绘图
1. [ONBOARDING.md](ONBOARDING.md)
2. [ASSET_PRODUCTION_GUIDE.md §SD 立绘](ASSET_PRODUCTION_GUIDE.md) — **完整 SD 流程**
3. [product/06 §ASSET-01](product/06-world-directory-and-ui.md)
4. [DUAL_SOUL_SPEC §CHAR-03 八层创建](../DUAL_SOUL_SPEC.md) — 角色 DNA 与美术字段对齐

### 3D / Blender / Three.js
1. [ONBOARDING.md](ONBOARDING.md)
2. [ASSET_PRODUCTION_GUIDE.md §Blender 模型](ASSET_PRODUCTION_GUIDE.md) — **完整 3D 流程**
3. [frontend/11-3d-interaction.md](frontend/11-3d-interaction.md) — 前端 3D 集成
4. [backend/26 §Avatar](backend/26-world-os-engineering-contract.md) — scene_update 事件

### 法务 / 隐私 / 合规
1. [legal/PRIVACY_POLICY.md](legal/PRIVACY_POLICY.md)
2. [legal/TERMS_OF_SERVICE.md](legal/TERMS_OF_SERVICE.md)
3. [legal/LEGAL_INTEGRATION_PLAN.md](legal/LEGAL_INTEGRATION_PLAN.md) — 15 份文案接入计划
4. [legal/* (15 份原稿)](legal/) — 知情同意 / 版权 / AI 免责声明等

### 商务 / BD / 投融资
1. [ONBOARDING.md §六、七、九](ONBOARDING.md)
2. [ECONOMY_SYSTEM.md](ECONOMY_SYSTEM.md) — 商业化模型
3. [ECONOMY_BIBLE.md §三-§十](ECONOMY_BIBLE.md) — 竞品对标 + 收入目标 + 单位经济
4. [PRD.md §内容规模](PRD.md)

### 测试 / QA
1. [testing/40-test-strategy.md](testing/40-test-strategy.md)
2. [NEXTJS_DEV_GUIDE.md §全局工程规范](NEXTJS_DEV_GUIDE.md)

### 运维 / SRE
1. [NEXTJS_DEV_GUIDE.md §B0 / §B11](NEXTJS_DEV_GUIDE.md)
2. [infrastructure/30-env-setup.md](infrastructure/30-env-setup.md)
3. [infrastructure/31-docker-local.md](infrastructure/31-docker-local.md)

---

## 二、按文档方向分类

### v5.3 前端骨架落地（apps/web Next.js 15）

| 产物 | 路径 | 说明 |
| --- | --- | --- |
| `/worlds` 22 题材小说世界目录 | [apps/web/src/app/worlds/page.tsx](../apps/web/src/app/worlds/page.tsx) | 用户最强调的功能，已实现 Hero + 22 主类横滑 + 子类 + 跨类标签 + 4 维筛选 + 题材封面墙 + 热门推荐 |
| `/worlds/[slug]` 题材详情 | [apps/web/src/app/worlds/[slug]/page.tsx](../apps/web/src/app/worlds/[slug]/page.tsx) | 题材 Hero + 子类导航 + 该类作品列表 |
| `/worlds/[slug]/[sub]` 子类 | [apps/web/src/app/worlds/[slug]/[sub]/page.tsx](../apps/web/src/app/worlds/[slug]/[sub]/page.tsx) | 子类概览 + 作品列表 |
| `/worlds/item/[id]` 作品详情（骨架） | [apps/web/src/app/worlds/item/[id]/page.tsx](../apps/web/src/app/worlds/item/[id]/page.tsx) | MVP2 接入 |
| `/companions` 双生陪伴 | [apps/web/src/app/companions/page.tsx](../apps/web/src/app/companions/page.tsx) | 双生介绍页 |
| `/studio` 创作中心 | [apps/web/src/app/studio/page.tsx](../apps/web/src/app/studio/page.tsx) | 三栏编辑器示意 + 创作者等级 |
| `/discover` 发现 | [apps/web/src/app/discover/page.tsx](../apps/web/src/app/discover/page.tsx) | Feed + 平台看板 |
| `/wallet` 钱包 | [apps/web/src/app/wallet/page.tsx](../apps/web/src/app/wallet/page.tsx) | 双货币 + 订阅 + 充值 + 交易记录 |
| `/legal` 法律中心 | [apps/web/src/app/legal/page.tsx](../apps/web/src/app/legal/page.tsx) | 9 项法务入口（草稿状态） |
| AppShell 5 Tab | [apps/web/src/components/layout/AppShell.tsx](../apps/web/src/components/layout/AppShell.tsx) | 小说世界 / 双生陪伴 / 创作中心 / 发现 / 我的 |
| 22 题材数据 | [apps/web/src/lib/genres.ts](../apps/web/src/lib/genres.ts) | 与 UI_DESIGN_GUIDE §UI-06.2 对齐 |
| 独立可视化原型 | [output/preview/catalog.html](../output/preview/catalog.html) | **双击立即可看**，Tailwind CDN + 完整 22 题材视觉 |

### v5.2 补强（结构补强 / 不动范围）

| 文档 | 用途 |
| --- | --- |
| [DOCS_AUDIT_2026-09-09.md](DOCS_AUDIT_2026-09-09.md) | 审计报告：新加的、本批不动 |
| [ONBOARDING.md](ONBOARDING.md) | 5 分钟产品速读 |
| [UI_DESIGN_GUIDE.md](UI_DESIGN_GUIDE.md) | 12 个核心页面规范 + 22 题材目录 |
| [ASSET_PRODUCTION_GUIDE.md](ASSET_PRODUCTION_GUIDE.md) | SD + Blender 资产规范 |
| [NEXTJS_DEV_GUIDE.md](NEXTJS_DEV_GUIDE.md) | B0-B11 实施级步骤 |
| [INDEX.md](INDEX.md) | **本文件** |

### v5.1 功能规范（范围与冲突）

| 文档 | 关键 ID |
| --- | --- |
| [PRD.md](PRD.md) | 44 项 PRD（v5.1 范围总览） |
| [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) | B0-B11 工作包 + 历史 Phase 0-19 |
| [WORLD_OS_SPEC.md](WORLD_OS_SPEC.md) | WOS-01~15 / NOV-01~04 |
| [DUAL_SOUL_SPEC.md](DUAL_SOUL_SPEC.md) | CHAR-03 / COMP-01~04 / DUAL-01~05 |
| [ECONOMY_SYSTEM.md](ECONOMY_SYSTEM.md) | ECON-01~08 |
| [ECONOMY_BIBLE.md](ECONOMY_BIBLE.md) | **补强**：工程级 DDL + API + 竞品对标 + 生命周期 + 单位经济 |
| [CREATOR_SYSTEM.md](CREATOR_SYSTEM.md) | CREATE-02~06 / EXPORT-01~03 |
| [UPDATE_2026-09-09.md](UPDATE_2026-09-09.md) | 26 项冲突登记 C01-C26 |
| [MASTER_SPEC.md](MASTER_SPEC.md) | 历史主规范（保留参考） |
| [MIRAI_SPEC.md](MIRAI_SPEC.md) | 既有工程契约 |

### 产品 / UX / 安全

| 文档 | 用途 |
| --- | --- |
| [product/01-product-overview.md](product/01-product-overview.md) | 产品概览 |
| [product/02-personas-and-scenarios.md](product/02-personas-and-scenarios.md) | 用户画像 |
| [product/03-features.md](product/03-features.md) | 功能列表 |
| [product/04-safety-and-compliance.md](product/04-safety-and-compliance.md) | 安全合规 |
| [product/05-roadmap-and-moat.md](product/05-roadmap-and-moat.md) | 路线图与壁垒 |
| [product/06-world-directory-and-ui.md](product/06-world-directory-and-ui.md) | IA / 题材 / 资产 |

### 前端 / 3D / 设计系统

| 文档 | 用途 |
| --- | --- |
| [frontend/10-frontend-architecture.md](frontend/10-frontend-architecture.md) | 前端架构 |
| [frontend/11-3d-interaction.md](frontend/11-3d-interaction.md) | 3D 交互 |
| [frontend/12-state-and-api.md](frontend/12-state-and-api.md) | 状态与 API |
| [frontend/13-design-system.md](frontend/13-design-system.md) | 设计系统 |

### 后端 / 工程契约 / 数据库

| 文档 | 用途 |
| --- | --- |
| [backend/20-backend-architecture.md](backend/20-backend-architecture.md) | 后端架构 |
| [backend/21-database-schema.md](backend/21-database-schema.md) | 数据库 |
| [backend/22-ai-orchestrator.md](backend/22-ai-orchestrator.md) | AI 编排 |
| [backend/23-kill-switch.md](backend/23-kill-switch.md) | 成本熔断 |
| [backend/24-billing-and-subscription.md](backend/24-billing-and-subscription.md) | 计费 / 订阅 |
| [backend/25-narrative-engine.md](backend/25-narrative-engine.md) | 叙事引擎 |
| [backend/26-world-os-engineering-contract.md](backend/26-world-os-engineering-contract.md) | **工程契约（关键）** |
| [backend/27-world-os-source-ddl.md](backend/27-world-os-source-ddl.md) | 9 表 DDL（关键） |

### 基础设施 / Docker / 环境

| 文档 | 用途 |
| --- | --- |
| [infrastructure/30-env-setup.md](infrastructure/30-env-setup.md) | 环境变量 |
| [infrastructure/31-docker-local.md](infrastructure/31-docker-local.md) | Docker 本地起服务 |

### 法务 / 协议（15 份原稿）

| 文档 | 用途 |
| --- | --- |
| [legal/PRIVACY_POLICY.md](legal/PRIVACY_POLICY.md) | 隐私政策 |
| [legal/TERMS_OF_SERVICE.md](legal/TERMS_OF_SERVICE.md) | 用户协议 |
| [legal/USER_AGREEMENT.md](legal/USER_AGREEMENT.md) | 用户协议（旧） |
| [legal/INFORMED_CONSENT.md](legal/INFORMED_CONSENT.md) | 知情同意 |
| [legal/MINOR_BAN_NOTICE.md](legal/MINOR_BAN_NOTICE.md) | 未成年禁入 |
| [legal/AI_DISCLAIMER.md](legal/AI_DISCLAIMER.md) | AI 免责声明 |
| [legal/AI_COPYRIGHT_NOTICE.md](legal/AI_COPYRIGHT_NOTICE.md) | AI 版权声明 |
| [legal/DUAL_SOUL_CHARACTER_NOTICE.md](legal/DUAL_SOUL_CHARACTER_NOTICE.md) | 双界角色声明 |
| [legal/ENTER_WORLD_RISK_NOTICE.md](legal/ENTER_WORLD_RISK_NOTICE.md) | 入世风险提示 |
| [legal/EXPORT_COPYRIGHT_PAGE.md](legal/EXPORT_COPYRIGHT_PAGE.md) | 导出版权附页 |
| [legal/EXPORT_USER_PROMPT.md](legal/EXPORT_USER_PROMPT.md) | 导出用户提示 |
| [legal/COPYRIGHT_CERTIFICATE.md](legal/COPYRIGHT_CERTIFICATE.md) | 版权证书 |
| [legal/COPYRIGHT_COMPLAINT_PROCESS.md](legal/COPYRIGHT_COMPLAINT_PROCESS.md) | 侵权投诉流程 |
| [legal/NOVEL_AI_DISCLAIMER.md](legal/NOVEL_AI_DISCLAIMER.md) | 小说 AI 免责声明 |
| [legal/UPLOAD_THIRD_PARTY_NOTICE.md](legal/UPLOAD_THIRD_PARTY_NOTICE.md) | 第三方内容上传声明 |
| [legal/LINGJING_USER_GUIDE.md](legal/LINGJING_USER_GUIDE.md) | 用户指南 |
| [legal/LEGAL_INTEGRATION_PLAN.md](legal/LEGAL_INTEGRATION_PLAN.md) | 接入计划 |
| [legal/LEGAL_INDEX.md](legal/LEGAL_INDEX.md) | 法务索引 |

### 测试

| 文档 | 用途 |
| --- | --- |
| [testing/40-test-strategy.md](testing/40-test-strategy.md) | 测试策略 |

### 工程实现 / 状态证据

| 文档 | 用途 |
| --- | --- |
| [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) | 当前实现状态与证据 |
| [development-progress.html](../development-progress.html) | 44 项 PRD 可视化看板 |

### 来源 / 原始附件

| 文档 | 用途 |
| --- | --- |
| [sources/2026-09-09/](../sources/2026-09-09/) | 用户原始 7 份附件存档 |

---

## 三、按项目阶段（看版本演进）

| 阶段 | 时间 | 状态 |
| --- | --- | --- |
| v4.1 | 2026-09-08 之前 | 已交付吕布开发稿 + 基础工程契约 |
| v5.0 | 2026-09-09 上午 | 文档整合 7 份源文件 |
| v5.1 | 2026-09-09 下午 | 资料齐全 + WORLD_OS / DUAL_SOUL / ECONOMY / CREATOR |
| v5.2 | 2026-09-09 晚 | 结构补强 5 份新增（不修改范围） |
| v5.6 | 2026-09-09 晚 | 真机可测版 · 5 题材 3D 世界（[test](v5.6-TEST-REPORT.md)） |
| v5.7 | 2026-09-09 晚 | 移动端适配（[test](v5.7-TEST-REPORT.md)） |
| v5.8 | 2026-09-09 晚 | 重设计聊天视图（保留历史） |
| v5.9 | 2026-09-09 晚 | 重设计创作中心（保留历史） |
| v5.10 | 2026-09-09 末 | SD 真实立绘 + Blender .glb（[test](v5.10-TEST-REPORT.md)） |
| v5.11 | 2026-09-10 凌晨 | 9 题材 + GLTFLoader + AudioFX（[test](v5.11-TEST-REPORT.md)） |
| v5.12 | 2026-09-10 上午 | 30 题材库 + 上传即生成（[test](v5.12-TEST-REPORT.md)） |
| v5.13 | 2026-09-10 下午 | 沉浸剧情对话 UI |
| v5.14 | 2026-09-10 晚 | 商业化 4 大系统（[test](v5.14-TEST-REPORT.md)） |
| **v5.15** | **2026-09-10 晚** | **全项目代码审查 + 死链修复**（[AUDIT](AUDIT_2026-09-10.md)） |
| MVP 上线 | TBD | 待 B0-B11 全部完成 + 真实接通 |

详见：[IMPLEMENTATION_STATUS.md §本轮已交付](IMPLEMENTATION_STATUS.md) 与 [UPDATE_2026-09-10.md](UPDATE_2026-09-10.md)。

---

## 四、版本与责任

- 当前最新版本：**v5.14**（产品）+ **v5.15**（代码审查）
- v5.6-v5.14 详见 [README.md §版本时间线](README.md)
- 本批新增文档以 `v5.14` 标识；不动 v5.1 的功能范围与冲突裁决。
- 任何 v5.14 与 v5.1 内容冲突时一律让位 v5.1。
- 工程实施步骤以 [NEXTJS_DEV_GUIDE.md](NEXTJS_DEV_GUIDE.md) 为准；范围与验收以 [PRD.md](PRD.md) / [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) 为准。
- 验收状态以 [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) 为准；本文档不得冒充"实现证据"。

---

## 五、待用户指令的事项

- B0 启动信号：让 Codex / Trae 按 [NEXTJS_DEV_GUIDE §B0](NEXTJS_DEV_GUIDE.md) 开工
- 美术启动信号：让 SD 角色生成按 [ASSET_PRODUCTION_GUIDE §SD](ASSET_PRODUCTION_GUIDE.md) 跑
- 3D 启动信号：让 Blender 按 [ASSET_PRODUCTION_GUIDE §Blender](ASSET_PRODUCTION_GUIDE.md) 建模
- 法务启动信号：法务核验 15 份 [legal/](legal/) 文案

未启动前，不执行代码、不生成资产、不跑模型、不连支付。
