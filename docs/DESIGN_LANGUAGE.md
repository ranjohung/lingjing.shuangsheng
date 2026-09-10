# 灵境 · 双生 · 设计语言 v6.3

> **本书比喻**：灵境 = 一本书 + 5 卷 + 总章 + 附录。
> **设计语言**：高密度但不拥挤 · 极简但不冰冷 · 高级感但不炫耀 · 官方感但不呆板。
> **哲学**：**「用户感知不到设计，但离开就难受」**。
>
> **不砍任何功能，未实现也要明确占位**。

---

## 一、参考体系（主流 + 高级感）

| 维度 | 参考 | 取什么 |
|---|---|---|
| 高密度列表 | **Linear** | 任务卡 / 项目行 / 时间线 / 状态指示 / 内联操作 |
| 极简克制 | **Vercel** | 阴影克制 / 字号节制 / 留白大量 / 字体严谨 |
| 数据可视化 | **Stripe** | 图表清晰 / 数据权威 / 进度明确 / 数字字体 |
| 空状态 | **Notion** | 引导文案 / 友好插画 / 上手成本低 |
| 微动效 | **Apple HIG** | 弹性 / 减速 / 弹簧 / 触感反馈 |
| 侧边栏 | **Arc Browser** | 折叠 / 颜色标识 / 多面板 |
| 命令面板 | **Raycast** | ⌘K 全局搜索 / 模糊匹配 / 快速跳转 |
| 中文审美 | **Noto Serif SC** + **Cormorant Garamond** | 标题用衬线 / 数字用衬线 / 正文用无衬线 |

---

## 二、设计 token v6.3

### 2.1 颜色 token（4 色系 + 中性）

```css
/* 中性黑紫（基础） */
--ink-0:   #07061a;  /* 最深黑 */
--ink-1:   #0d0b22;  /* 主背景 */
--ink-2:   #14112e;  /* 次背景 */
--ink-3:   #1c1937;  /* 卡片底 */
--ink-4:   #2a2645;  /* 高亮底 */
--ink-5:   #383356;  /* 边线 */

/* 文字 6 级 */
--text-1:  #ffffff;  /* 主要 */
--text-2:  rgba(255,255,255,.86);  /* 次要 */
--text-3:  rgba(255,255,255,.65);  /* 辅助 */
--text-4:  rgba(255,255,255,.45);  /* 弱化 */
--text-5:  rgba(255,255,255,.30);  /* 占位 */
--text-6:  rgba(255,255,255,.15);  /* 隐藏 */

/* 4 色系 */
--brand-gold:        #e8c75a;  /* 琥珀 · 创作者 */
--brand-gold-light:  #f0d77a;
--brand-gold-dark:   #c49f3a;

--brand-violet:      #8b7cf6;  /* 紫罗兰 · 心屿 */
--brand-violet-light:#a89bf8;
--brand-violet-dark: #6f5fe0;

--brand-cyan:        #6ec6ff;  /* 青色 · 小说世界 */
--brand-cyan-light:  #8fd5ff;
--brand-cyan-dark:   #4ea3e0;

--brand-coral:       #f6a6d8;  /* 珊瑚 · 发现 */
--brand-coral-light: #ffbedc;
--brand-coral-dark:  #d580b4;

/* 状态色 */
--success:  #5be05b;
--warning:  #e8c75a;
--danger:   #ff5e7e;
--info:     #6ec6ff;

/* 渐变 */
--grad-hero:    linear-gradient(135deg, #07061a 0%, #14112e 50%, #1c1937 100%);
--grad-gold:    linear-gradient(135deg, #f0d77a 0%, #e8c75a 50%, #c49f3a 100%);
--grad-violet:  linear-gradient(135deg, #a89bf8 0%, #8b7cf6 50%, #6f5fe0 100%);
--grad-cyan:    linear-gradient(135deg, #8fd5ff 0%, #6ec6ff 50%, #4ea3e0 100%);
--grad-coral:   linear-gradient(135deg, #ffbedc 0%, #f6a6d8 50%, #d580b4 100%);
--grad-shine:   linear-gradient(90deg, transparent, rgba(255,255,255,.4), transparent);
```

### 2.2 字体 5 级

```css
--text-display: 48px / 56px;     /* 大标题 */
--text-h1:      36px / 44px;     /* H1 */
--text-h2:      24px / 32px;
--text-h3:      20px / 28px;
--text-h4:      17px / 24px;     /* 卡标题 */
--text-body:    14px / 22px;     /* 正文 */
--text-caption: 12px / 18px;     /* 辅助 */
--text-micro:   10px / 14px;     /* 微 */
--text-mono:    13px / 20px;     /* 代码 / 数据 */

--font-display: 'Noto Serif SC', 'Cormorant Garamond', serif;  /* 标题 */
--font-body:    'Noto Sans SC', -apple-system, sans-serif;     /* 正文 */
--font-mono:    'JetBrains Mono', monospace;                    /* 数据 */

--weight-display: 700;
--weight-bold:    600;
--weight-medium:  500;
--weight-normal:  400;
```

### 2.3 间距 8pt + 黄金比例

```css
--s-1:  4px;       /* micro */
--s-2:  8px;       /* xs */
--s-3:  12px;      /* sm */
--s-4:  16px;      /* md · 基础 */
--s-5:  24px;      /* lg */
--s-6:  32px;      /* xl */
--s-7:  48px;      /* 2xl */
--s-8:  64px;      /* 3xl */
--s-9:  96px;      /* 4xl */
--s-10: 128px;     /* 5xl · 关键模块黄金 */

--golden-1: 16px;
--golden-2: 26px;  /* 16 × 1.618 */
--golden-3: 42px;  /* 26 × 1.618 */
```

### 2.4 圆角 8 档

```css
--r-0:    0;
--r-1:    4px;
--r-2:    6px;
--r-3:    8px;
--r-4:    12px;
--r-5:    16px;
--r-6:    20px;
--r-7:    28px;
--r-pill: 999px;
```

### 2.5 阴影 6 档（layered）

```css
--shadow-xs: 0 1px 2px rgba(7,6,26,.06);
--shadow-sm: 0 2px 4px rgba(7,6,26,.10), 0 1px 2px rgba(7,6,26,.06);
--shadow-md: 0 4px 8px rgba(7,6,26,.14), 0 2px 4px rgba(7,6,26,.08);
--shadow-lg: 0 8px 16px rgba(7,6,26,.18), 0 4px 8px rgba(7,6,26,.10);
--shadow-xl: 0 16px 32px rgba(7,6,26,.22), 0 8px 16px rgba(7,6,26,.14);
--shadow-glow-gold: 0 0 24px rgba(232,199,90,.35);
--shadow-glow-violet: 0 0 24px rgba(139,124,246,.35);
```

### 2.6 动效 6 套曲线

```css
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);    /* 标准 */
--ease-decel:    cubic-bezier(0, 0, 0.2, 1);      /* 减速进场 */
--ease-accel:    cubic-bezier(0.4, 0, 1, 1);      /* 加速离场 */
--ease-sharp:    cubic-bezier(0.4, 0, 0.6, 1);    /* 锋利 */
--ease-spring:   cubic-bezier(0.16, 1, 0.3, 1);   /* 弹性 · 主力 */
--ease-shimmer:  linear-gradient(90deg, transparent, rgba(255,255,255,.15) 50%, transparent);

--dur-instant: 80ms;
--dur-fast:    160ms;
--dur-base:    240ms;
--dur-slow:    360ms;
--dur-slower:  520ms;
```

---

## 三、6 态反馈

每个交互组件必须实现：

| 态 | 视觉 | 触发 |
|---|---|---|
| **default** | 基础 | 静止 |
| **hover** | +4% 亮度 / -1px Y | 鼠标进入 |
| **focus** | 2px 焦点环 + 8% 缩放 | 键盘 / 鼠标按下 |
| **active** | -2% 缩放 / +6% 暗 | 鼠标按下 |
| **disabled** | 50% 透明 / cursor:not-allowed | 禁用 |
| **loading** | spinner / skeleton | 等待 |
| **success** | ✓ 0.6s 闪动 + 绿色微闪 | 操作成功 |

---

## 四、8 大页面状态（每个页面都要覆盖）

| 状态 | 视觉 | 用途 |
|---|---|---|
| **loading** | skeleton shimmer + 进度条 | 数据加载中 |
| **empty** | illustration + 引导文案 + CTA | 无数据 |
| **error** | 红色图标 + 重试按钮 | 出错 |
| **no-permission** | 锁图标 + 联系客服 | 无权限 |
| **quota-exceeded** | 灵晶图标 + 充值入口 | 额度不足 |
| **offline** | 离线云图标 + 重连 | 断网 |
| **success** | ✓ + 数据预览 | 操作成功 |
| **updating** | 顶部进度条 | 系统更新 |

---

## 五、组件库 v6.3（共 100+ 组件）

### 5.1 通用 30 件
- `ds-shell` / `ds-container` / `ds-stack` / `ds-cluster`
- `ds-btn` / `ds-btn-primary` / `ds-btn-ghost` / `ds-btn-outline` / `ds-btn-destructive` / `ds-btn-xl/lg/sm/xs`
- `ds-card` / `ds-card-hover` / `ds-card-bordered` / `ds-card-elevated`
- `ds-input` / `ds-input-search` / `ds-input-password` / `ds-input-error`
- `ds-textarea` / `ds-select` / `ds-checkbox` / `ds-radio` / `ds-switch` / `ds-slider`
- `ds-badge` / `ds-tag` / `ds-chip`
- `ds-modal` / `ds-sheet` / `ds-bottom-sheet` / `ds-drawer`
- `ds-dropdown` / `ds-tooltip` / `ds-popover`
- `ds-toast` / `ds-notification`
- `ds-tabs` / `ds-segmented` / `ds-stepper`
- `ds-progress` / `ds-progress-linear` / `ds-progress-circle`
- `ds-skeleton` / `ds-skeleton-text` / `ds-skeleton-circle`
- `ds-empty-state` / `ds-empty-state-illustration`
- `ds-fab` / `ds-fab-extended`
- `ds-breadcrumb` / `ds-pagination`
- `ds-avatar` / `ds-avatar-group`
- `ds-divider` / `ds-callout`
- `ds-spinner` / `ds-loader`

### 5.2 沉浸剧情 6 件（v5.13 升级）
- `ds-plot-stage` 沉浸剧情舞台（黑底金边）
- `ds-plot-text` 打字机正文
- `ds-plot-choices` 选项悬浮
- `ds-plot-fx` 数值跳动
- `ds-plot-save` 5 段存档
- `ds-plot-cg` CG 画廊

### 5.3 心屿 12 件（v6.0 升级）
- `ds-protagonist-card` 主角色大卡
- `ds-relationship-meter` 7 维关系仪表
- `ds-stage-progress` 6 阶段亲密度
- `ds-source-tag` 4 类来源
- `ds-dual-portal-card` 双界穿梭
- `ds-mood-banner` 心情横幅
- `ds-character-grid` 角色网格
- `ds-chat-bubble` 聊天气泡
- `ds-emotion-curve` 情绪曲线
- `ds-memory-card` 记忆卡
- `ds-memory-palace` 记忆宫殿
- `ds-activity-card` 共同活动

### 5.4 创作中心 10 件（v5.18 升级）
- `ds-form-field` 字段表单
- `ds-form-wizard` 创建向导
- `ds-form-section` 字段分组
- `ds-tagging-input` 标签输入
- `ds-rich-editor` 富文本
- `ds-cover-uploader` 封面上传
- `ds-quality-meter` 6 维检测仪表
- `ds-revenue-card` 收益卡
- `ds-tier-badge` 版权层级
- `ds-license-card` 授权卡

### 5.5 商业化 8 件（v5.14 升级）
- `ds-tier-card` 订阅卡
- `ds-recharge-card` 充值卡
- `ds-quota-bar` 额度条
- `ds-pay-method` 支付方式
- `ds-invoice-item` 发票项
- `ds-coupon-card` 优惠券
- `ds-earnings-row` 收益行
- `ds-withdraw-card` 提现卡

### 5.6 高密度 12 件（v6.3 新增）
- `ds-command-palette` ⌘K 命令面板（Raycast 风格）
- `ds-spotlight` Spotlight 搜索
- `ds-shortcut-key` 快捷键提示
- `ds-status-pill` 状态指示
- `ds-step-indicator` 步骤指示
- `ds-timeline` 时间线
- `ds-chart-bar-mini` 柱图（mini）
- `ds-chart-line-mini` 折线图（mini）
- `ds-chart-sparkline` sparkline
- `ds-pull-quote` 引用块
- `ds-code-block` 代码块
- `ds-metric-card` 指标卡

### 5.7 高级动效 8 件（v6.3 新增）
- `ds-anim-shine` 标题扫光
- `ds-anim-shimmer` skeleton 闪烁
- `ds-anim-pulse` 脉动
- `ds-anim-press` 按下反馈
- `ds-anim-lift` hover 浮起
- `ds-anim-fade-up` 淡入上移
- `ds-anim-spring` 弹簧
- `ds-anim-flip` 翻转

---

## 六、图标系统

- **首选 emoji**：1 屏最多 3 个（用户规则）
- **次选 Lucide**：线性图标，统一 24px
- **避免**：彩色 emoji / 异形字符 / 动图

---

## 七、布局原则

| 原则 | 落实 |
|---|---|
| mobile-first | 所有页面 320px 起适配 |
| 8pt 网格 | 所有间距用 token |
| 黄金比例 | 关键模块用 1.618 |
| 内容优先 | 装饰 ≤ 20%，内容 ≥ 80% |
| 状态齐全 | 8 大状态每页全覆盖 |
| 操作最短 | 关键操作 ≤ 2 步 |

---

## 八、不做什么（铁律）

- ❌ 不砍任何功能
- ❌ 不在主页堆功能
- ❌ 不让创作者法律在主页露出
- ❌ 不在法律入口堆链接
- ❌ 不滥用 emoji（1 屏最多 3 个）
- ❌ 不写内联颜色（必须用 token）
- ❌ 不写 `alert()`（用 `<dialog>` / Toast）
- ❌ 不做单一状态页面（8 大状态齐全）

---

## 九、与 v6.1.2 兼容

| 项 | 兼容 |
|---|---|
| 字体 / 颜色 token | ✅ 完全兼容 |
| 圆角 / 间距 / 阴影 | ✅ 完全兼容 |
| `ds-page-header` / `ds-breadcrumb` | ✅ 强化 |
| `ds-bottom-tabs` | ✅ 强化（加长按弹菜单） |
| `ds-icon-btn` / `ds-back-arrow` | ✅ 兼容 |
| 21 张数据表 PREFIX | ✅ 不变 |
| 5 Tab 底部导航 | ✅ 不变 |

---

## 十、改动清单（v6.3）

| 文件 | 改动 |
|---|---|
| `docs/DESIGN_LANGUAGE.md` | 本文档 |
| `output/preview/css/design-system.css` | 1720 → 2800 行 |
| 22 个 HTML 页面 | 全部升级到 v6.3 |
| `docs/SITE_MAP.md` | 加 v6.3 进度 |
| `docs/ALL_FUNCTIONS.md` | 加 §16 v6.3 设计语言 |
| `.workbuddy/memory/MEMORY.md` | 加 §3.5 v6.3 设计语言硬规则 |
