# v6 — 全项目前端重构蓝图

**日期**：2026-09-11
**作者**：Codex
**状态**：v6.0 蓝图 + 设计系统 + 2 个标杆页（product-preview / heart-island）升级完成

---

## 一、问题诊断（v5.18 → v5.20 的局限）

v5.18 重构了 6 个创作者中心页（设计系统 +0 重复入口）。v5.19 / v5.20 加入心屿 4 页。但**全项目仍有 14 个页面停留在 v5.14 / v5.16 视觉风格**，导致：

| 问题 | 体现 |
|---|---|
| **视觉断层** | 创作者中心（设计系统）/ 心屿（v5.19-20 风格）/ 其他页面（v5.14 散装）— 三代并存 |
| **设计语言分散** | 颜色 token 各页面硬编码（`#ffd980` / `#8b7cf6` 散落），圆角 / 间距 / 字体不一致 |
| **返回箭头 3 种实现** | `ds-back-arrow` 已有，但老页面仍在用 `<a class="back-arrow">` / 浮在 fixed |
| **底部 tab bar 覆盖不全** | v5.19 加了，但其他页面仍依赖顶部 nav（mobile 不可见） |
| **缺乏空状态 / 加载态** | 多数页面只有 happy path，无 `ds-empty-state` / `ds-skeleton` / `ds-toast` |
| **缺乏现代组件** | ds-stat / ds-stepper / ds-segmented / ds-search / ds-fab / ds-tag 缺位 |

---

## 二、设计哲学（v6.0 立）

> **「一个角色，两种人生」** — 用户感知不到设计，但离开就难受。

3 条不可破原则：

1. **少即是多** — 每屏只有一个主焦点；信息密度低；CTA 强；
2. **操作流最短** — 关键操作 ≤ 2 步可达；少层级；少弹窗；
3. **设计语言统一** — 所有页面共用 `css/design-system.css`；不写 inline style 散装颜色。

设计基调：

- **「灵境 · 双生」** — 黑暗底（`#0d0b22` / `#0a0717`）+ 琥珀金高光（`#e8c75a`）+ 紫罗兰强调（`#8b7cf6`）
- **「心屿」** — 粉紫渐变（`#2a1556 → #5d1f5f`）+ 暖光
- **「创作者」** — 紫琥珀（沿用 v5.18）
- **动效曲线** — `cubic-bezier(0.16, 1, 0.3, 1)` （Apple HIG）
- **网格** — 8pt 严格网格

---

## 三、v6 卷次规划（一张蓝图）

| 卷 | 范围 | 工作量 |
|---|---|---|
| **v6.0**（本轮） | 蓝图 + design-system.css v6 token + 10 个新组件 | 1 轮 |
| **v6.1**（本轮） | product-preview.html + heart-island.html 升级 | 1 轮 |
| v6.2 | 创作中心三件套深度 polish | 1 轮 |
| v6.3 | library.html（30 题材库）+ catalog.html（题材商店）| 1 轮 |
| v6.4 | plot-runner / plot-history / plot-save / plot-settings / scene-select（沉浸剧情） | 1 轮 |
| v6.5 | game-3d.html（3D 世界）+ 配套 9 题材场景 | 1 轮 |
| v6.6 | novel-upload / novel-edit / commerce / 4 心屿子页 polish | 1 轮 |

合计 7 卷约 7 轮。本轮交付 v6.0 + v6.1。

---

## 四、v6.0 设计系统升级（design-system.css v6）

新增 ~300 行 / 10 个核心组件：

| 组件 | 用途 | 关键设计 |
|---|---|---|
| `ds-shell` | 全屏应用 shell（侧栏 + 主区） | grid-template 自动适配 |
| `ds-empty-state` | 空状态（图标 + 文案 + CTA） | 灰底 + 主色强调 |
| `ds-stat-row` | 数据行（数字 + 标签 + 走势） | 大数字 + 小标签 |
| `ds-search-input` | 搜索框 | 圆角 + 左侧图标 |
| `ds-fab` | 浮动操作按钮 | 56px 圆 + 主色阴影 |
| `ds-skeleton` | 骨架屏 | linear-gradient(90deg, ..., ..., ...) |
| `ds-stepper` | 步骤条 | 圆点 + 连接线 |
| `ds-segmented` | 分段控制器 | 圆角胶囊 + 滑动指示 |
| `ds-progress-linear` | 进度条 | track + fill（圆角） |
| `ds-tag` | 轻量标签 | 5 种语义色 + 可关闭 |

加上动效 utility：

| 动效 | 用途 |
|---|---|
| `ds-anim-shine` | 标题 shimmer 扫光 |
| `ds-anim-pulse` | 数字数字 pulse 跳动 |
| `ds-anim-countup` | 数字 count up 滚入 |

---

## 五、v6.1 主页（product-preview.html）重写

**v5.14 现状**：1474 行；颜色 token 各页面硬编码；hero 极长；30 题材墙只展示一半；创作者中心 / 心屿两段散乱。

**v6.1 目标**（600 行内）：
1. **顶部 nav** — 4 大功能区（总览 / 30题材 / 心屿 / 创作者）+ 暗模式开关 + 返回首页
2. **Hero** — 一句话价值主张 + 主 CTA + 数据角标
3. **3 大系统卡片** — 沉浸剧情 / 心屿双界 / 创作者经济（每张 1 屏 + 主 CTA + 数据）
4. **30 题材预览** — Grid 6 列 × 5 行 + 搜索过滤 + 题材分类 Tab
5. **「一个角色，两种人生」叙事段** — 角色立绘 + 双界穿梭示意
6. **技术架构段** — 6 大模块（World OS / Character / Memory / Economy / Asset / Legal）
7. **数据 + 团队 + 联系段** — 压底
8. **Footer** — 法律 + 备案 + 友情链接

设计语言：**深紫黑底 + 琥珀金高光 + 紫罗兰色 accent**，所有块使用 `ds-*` 组件，**不写 inline style 颜色**。

---

## 六、v6.1 心屿主页（heart-island.html）升级

**v5.20 现状**：骨架已 OK，但内联 80 行 CSS（应沉淀到设计系统）。

**v6.1 升级内容**：
1. **ds-protagonist-card**（设计系统级）取代原内联 `.protagonist-card`
2. **ds-relationship-meter**（7 维关系）取代 `.pc-rel`
3. **ds-stage-progress**（6 阶段进度条）取代 `.pc-stage-bar`
4. **ds-source-tag** 取代 `.source-tag`
5. **ds-character-grid** 取代 `.role-grid`
6. **ds-mood-banner**（心屿特色 banner）
7. **顶部导航 + 心屿指示器**：在 ds-mh 加 "🏝 心屿" 标记
8. **主 CTA 升级**：双界穿梭 CTA 升级为 ds-dual-portal-card（含条件可视化）

---

## 七、回归 + 验收

### 自动化回归（Playwright Python）

- 5 页面（library / heart-island / chat / memory / profile）+ 2 新页（product-preview + updated heart-island）
- 0 console error
- 0 page error
- 设计系统被加载（`link[rel=stylesheet][href*="design-system.css"]` 存在）
- 关键交互通过：底部 tab bar 切换 / 主角色大卡 7 维 / 双界穿梭 CTA 点开

### 视觉验收

- PC 截图（1440×900）+ mobile 截图（412×915）
- 主题色一致（无散装硬编码颜色）
- 字体大小 / 圆角 / 间距遵循 8pt 网格

### 文档验收

- `docs/v6.0-REDESIGN-BLUEPRINT.md`（本文件）
- `docs/v6.0-DESIGN-SYSTEM-RELEASE.md`（设计系统 v6 release note）
- `docs/v6.1-HOMEPAGE-RELEASE.md`（主页 v6.1 release note）
- `docs/v6.1-XINYU-POLISH.md`（心屿主页 v6.1 polish release note）

---

## 八、不破坏既有功能

v6 是"重构"，不是"重写"。**已落地功能不动**：
- 17 张表 / 21 张表数据保留（DB PREFIX 不变）
- 所有剧情 30 题材不动
- 所有 demo seed 数据不动
- 所有 1v1 跑通的故事路径不动
- 不变更外部合同（pricing / 收费点 / 带出条件）

**变更限定为**：UI / 布局 / 交互 / 视觉风格。**数据层 + 业务逻辑层零修改**。

---

**核心交付**：v6.0 让灵境 · 双生的视觉语言达到"通用设计系统级"水准——50+ 组件 / 8pt 网格 / 三主题色轨 / 强动效。所有后续页面只要共用 design-system.css，自动获得一致观感。

本轮交付：**v6.0 蓝图 + 设计系统 v6 token + 主页 v6.1 + 心屿主页 v6.1**。
