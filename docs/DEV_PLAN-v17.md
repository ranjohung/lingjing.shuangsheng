# 灵境 · 双生 — V17.0 开发计划（世界功能区 + 心屿功能区重构）

> **文档状态**：🔵 **草案 / 待用户审阅**（未动代码）
>
> **配套 PRD**：[PRD-v17.md](PRD-v17.md)
>
> **原始需求证据**：[docs/sources/2026-09-11/S01-v17-world-and-xinyu-redesign.txt](sources/2026-09-11/S01-v17-world-and-xinyu-redesign.txt)
>
> **本计划范围**：仅覆盖 V17.0（世界功能区 + 心屿功能区 + 启动签到 + 数据表变更）。
>
> **不覆盖**（本次不动）：
> - v5.18 已落地的创作者中心 6 页面
> - v5.20 已落地的 4 张心屿数据表核心 schema
> - World OS 9 表 + 经济 11 表
> - 真 LLM / 真支付接入

---

## 一、工作包总览

| 工作包 | 名称 | 依赖 | 估计 | 状态 |
|---|---|---|---|---|
| **V17-A** | 全局底部 5 Tab 组件 + 设计系统扩展 | 无（基础） | 0.5 轮 | ✅ 已确认启动 |
| **V17-B** | 世界功能区重构（library.html → 内容流货架） | V17-A | 1.5 轮 | ✅ 已确认启动 |
| **V17-C** | 心屿功能区重构（heart-island.html → 5 子标签 + 角色来源角标） | V17-A | 1.5 轮 | ✅ 已确认启动 |
| **V17-D** | 启动签到弹窗 + 4 快捷入口 | V17-A | 0.5 轮 | ✅ 已确认启动 |
| **V17-E** | 数据表迁移 + 3 张新表 + PREFIX 升级 | V17-A, V17-C | 0.5 轮 | ✅ 已确认启动 |
| **V17-F** | 全项目回归测试 + 测试报告 | V17-A~E 全部 | 0.5 轮 | ✅ 已确认启动 |
| **V17-G**（追加） | 创作者分成阶梯（5 档 + 多维门槛 + 协议页） | 无（独立） | 0.5 轮 | ✅ 已确认启动 |

**总计**：~5.5 轮（约 1 个完整工作日 × 5.5）

**实施顺序**：
1. V17-A 基础（5 Tab 复用 shell-v64.css）
2. **并行**：V17-B 世界 + V17-C 心屿 + V17-D 签到 + V17-G 创作者分成
3. V17-E 数据表 + PREFIX 升级
4. V17-F 回归测试 + 报告

---

## 二、V17-A — 全局底部 5 Tab 组件 + 设计系统扩展

### 2.1 目标

建立全局底部 5 Tab 组件，作为 V17-B/C/D 的基础。所有页面（包括现状独立页 `library.html` / `heart-island.html` / `creator-center.html` / `profile.html`）挂上底部 5 Tab。

### 2.2 依赖

无（基础工作包，优先执行）。

### 2.3 交付物

| 文件 | 改动 | 行数估计 |
|---|---|---|
| `output/preview/css/design-system.css` | **新增** `ds-bottom-tabs-v17` / `ds-tab` / `ds-tab-item` / `ds-tab-icon` / `ds-tab-label` / `ds-tab-active` 组件类；保留 v5.19 `ds-bottom-tabs` 兼容老代码 | +120 行 |
| `output/preview/js/tabbar.js`（新建） | 5 Tab 状态管理（localStorage 记忆当前 Tab）；点击响应：Tab 1 → `library.html`（兼首页）/ Tab 2 → `library.html` / Tab 3 → `heart-island.html` / Tab 4 → `creator-center.html` / Tab 5 → `profile.html` | 80 行 |
| `output/preview/library.html` | 替换 v5.19 内联 `ds-bottom-tabs` 为新组件，挂 5 Tab | -50 / +20 |
| `output/preview/heart-island.html` | 同上 | -50 / +20 |
| `output/preview/creator-center.html` | 新增底部 5 Tab（v5.18 没做） | +60 |
| `output/preview/profile.html` | 新增底部 5 Tab | +60 |

### 2.4 设计规格（**复用 v6.4.1 shell-v64.css**，不重复定义）

```css
/* 复用 v6.4.1 shell-v64.css 已有定义（不动） */
.tabbar {
  position: fixed; bottom: 0; left: 0; right: 0;
  height: 64px;
  background: rgba(15, 12, 28, 0.92);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(167, 139, 250, 0.2);
  display: flex;
  z-index: 50;
}
.tab {
  flex: 1;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  font-size: 11px;
  transition: color 0.2s;
}
.tab.active { color: var(--tab-accent, #E94560); }  /* 默认首页红，v17.0 不动 */
/* 各 Tab active 色：首页 #E94560 / 世界 #00B894 / 心屿 #6C5CE7 / 创作 橙 / 我的默认 */
```

**V17.0 不新增 tabbar 相关类**，避免与 v6.4.1 冲突。V17-A 仅在 `js/tabbar.js` 做状态管理（localStorage 记忆当前 Tab）。

### 2.5 验收项

- [ ] 5 Tab 在 mobile (412px) + desktop (1280px) 都正确显示
- [ ] 当前 Tab 高亮（紫琥珀 #A78BFA）
- [ ] 点击响应符合 PRD 8.1 节
- [ ] localStorage 记忆当前 Tab（刷新后保持）
- [ ] 不影响 v5.19 已有的功能区

### 2.6 风险

| 风险 | 缓解 |
|---|---|
| 与 v6.4.1 `shell-v64.css` 冲突（已落地） | **不重复造轮子**，V17-A 仅做状态管理 + 新增页面接入，不修改 `shell-v64.css` |
| 5 个独立页都加底部 Tab，文件散乱 | 抽到 `js/tabbar.js` 公共组件，所有页面引用 |
| 当前 Tab 高亮依赖 URL 路径判断 | `tabbar.js` 提供 `getCurrentTabFromUrl()` |
| profile.html（v5.19 命名）vs me.html（v6.4.1 重命名）| **Q10 待用户确认**：v6.4.1 已重命名为 `me.html`，V17.0 沿用 |

---

## 三、V17-B — 世界功能区重构

### 3.1 目标

把 `library.html` 从"内容列表单页"升级为"内容流货架"：
- 顶部 7 子导航（首页 / 排行榜 / 心屿推 / 福利 / 创世杯 / 同人区 / 🔍）
- 主视觉 Banner 轮播（5 张）
- 四大金刚（⊞全部分类 / 📅更新日历 / 👑经典必看 / ✍创作）
- 双列瀑布流（3 板块：编辑推荐 / 热门佳作 / 最新完结）
- 分类侧边栏（从左滑出）
- 筛选结果页（6 类筛选）
- 同人区（公版小说专区）
- 搜索子区

### 3.2 依赖

V17-A（底部 5 Tab 组件）

### 3.3 交付物

| 文件 | 改动 | 行数估计 |
|---|---|---|
| `output/preview/library.html` | **重写**为世界功能区主页面 | ~800 行（从 ~600 行扩） |
| `output/preview/css/design-system.css` | 新增 `ds-sub-nav`（7 项横向）/ `ds-banner`（轮播）/ `ds-quick-grid`（四大金刚）/ `ds-waterfall`（双列）/ `ds-side-drawer`（侧边栏）/ `ds-filter-bar`（筛选条）/ `ds-corner-badge`（角标） | +280 行 |
| `output/preview/js/world.js`（新建） | 7 子导航切换、Banner 轮播自动 + 手动、四大金刚点击、瀑布流渲染、分类侧边栏开关、筛选逻辑 | 320 行 |
| `output/preview/js/world-data.js`（新建） | 集中管理世界数据：分类树 + Banner 配置 + mock 瀑布流卡片 30 张 + 同人区 10 张 | 280 行 |
| `output/preview/library.html`（备份） | 重写前备份为 `library.html.v517.bak` | - |

### 3.4 子任务拆分

| 子任务 | 内容 | 估计 |
|---|---|---|
| B-1 | 7 子导航（`ds-sub-nav`）+ 默认"首页" | 0.2 轮 |
| B-2 | Banner 轮播（`ds-banner`）+ 5 张 mock 数据 | 0.3 轮 |
| B-3 | 四大金刚（`ds-quick-grid`）+ 4 入口逻辑 | 0.2 轮 |
| B-4 | 3 板块双列瀑布流（`ds-waterfall`）+ mock 30 张卡片 | 0.3 轮 |
| B-5 | 分类侧边栏（`ds-side-drawer`）+ 10 一级 + 多二级 | 0.3 轮 |
| B-6 | 筛选结果页（`ds-filter-bar`）+ 6 类筛选 + 角标 | 0.2 轮 |

### 3.5 mock 数据

**Banner（5 张）**：

| # | 标题 | 副标题 | 跳转 |
|---|---|---|---|
| 1 | 双生 · 入世 | "一个角色，两种人生" | `discover.html?id=banner1` |
| 2 | 长夜城 · 第三章 | "新章节上线" | `discover.html?id=banner2` |
| 3 | 创作者激励计划 | "灵晶奖池 10000+" | `creator-center.html` |
| 4 | 心屿 · 新角色 | "苏念 入驻" | `heart-island.html` |
| 5 | 红楼梦 · 灵境版 | "公版新解读" | `discover.html?id=hongloumeng` |

**30 张瀑布流卡片**：从 `js/db.js` `worlds` 表读，无数据时用预置 30 个 mock（涵盖 30 题材）。

**分类树**：

```js
const WORLD_CATEGORIES = [
  { id: 'gufeng', name: '古风', children: [
    { id: 'gonggu', name: '宫闺府宅' },
    { id: 'wangquan', name: '王权朝堂' },
    { id: 'xianxia', name: '仙侠玄幻' },
    { id: 'wuxia', name: '武侠江湖' },
    { id: 'gdshenghuo', name: '古代生活' },
    { id: 'shinong', name: '士农工商' },
    { id: 'zhuxianmianfei', name: '主线免费' }
  ]},
  { id: 'xiandai', name: '现代', children: [
    { id: 'yulequan', name: '娱乐圈' },
    { id: 'xiaoyuan', name: '校园' },
    { id: 'yuanyuzhou', name: '元宇宙电竞' },
    { id: 'hunyin', name: '婚姻家庭' },
    { id: 'xianshi', name: '现实题材' },
    { id: 'zhichang', name: '职场' },
    { id: 'haomen', name: '豪门' },
    { id: 'minguo', name: '民国' },
    { id: 'xiandaiyiwen', name: '现代异闻' },
    { id: 'xingzhen', name: '刑侦悬疑' },
    { id: 'huanxiang', name: '幻想言情' }
  ]},
  { id: 'huanxiang', name: '幻想冒险', children: [
    { id: 'datuosha', name: '大逃杀' },
    { id: 'maoxian', name: '冒险' },
    { id: 'mori', name: '末日' },
    { id: 'paotuan', name: '跑团怪谈' },
    { id: 'zainan', name: '灾难' },
    { id: 'xuanyi', name: '悬疑推理' }
  ]},
  { id: 'kuachuan', name: '快穿穿书', children: [
    { id: 'kuachuan', name: '快穿' },
    { id: 'chuanshu', name: '穿书' },
    { id: 'yishi', name: '异世玄幻' }
  ]},
  { id: 'shiguang', name: '时光档案', children: [
    { id: 'time1', name: '回到过去' },
    { id: 'time2', name: '未来幻想' },
    { id: 'time3', name: '平行时空' }
  ]},
  // ⚠️ 注意：明星分类下原话示例有 BTS/HP/EXO 等国际 IP 名，按 PRD 9.1 R7 替换为：
  { id: 'mingxing', name: '同人专区', children: [
    { id: 'hnt', name: '韩流同人' },         // 替换 BTS
    { id: 'omt', name: '欧美同人' },         // 替换 HP/EXO
    { id: 'ri', name: '日系同人' },
    { id: 'yingxi', name: '影视改编' }
  ]},
  { id: 'guangying', name: '光影', children: [
    { id: 'dianying', name: '电影改编' },
    { id: 'dianshi', name: '电视剧改编' }
  ]},
  { id: 'chengzhang', name: '成长向', children: [
    { id: 'shaonian', name: '少年成长' },
    { id: 'qingchun', name: '青春校园' }
  ]},
  { id: 'dongren', name: '动人情感', children: [
    { id: 'aiqing', name: '爱情' },
    { id: 'youqing', name: '友情' },
    { id: 'qinqing', name: '亲情' }
  ]},
  { id: 'wanjie', name: '完结', children: [
    { id: 'wanjiequan', name: '完结全收录' }
  ]}
];
```

### 3.6 验收项

参考 PRD 8.2 节验收项 1-12。

### 3.7 风险

| 风险 | 缓解 |
|---|---|
| 信息密度高，mobile 拥挤 | mobile 视图 Banner 25% / 板块字号 -1 / 卡片间距缩 25% |
| 7 子导航点击切换内容，需要内容容器动态渲染 | 用 `data-tab` 属性 + 单一 `world.js` 内容容器，避免多页跳转 |
| 分类侧边栏从左滑出动画 | 用 CSS transform + transition，300ms cubic-bezier |
| 同人区与分类侧边栏视觉冲突 | 同人区右侧只展示瀑布流，不显示分类树 |
| 30 张 mock 卡片数据来源 | 优先读 `db.worlds`，为空时 fallback 到 `world-data.js` 预置 |

---

## 四、V17-C — 心屿功能区重构

### 4.1 目标

把 `heart-island.html` 从"主页面"升级为"心屿功能区容器"：
- 顶部 5 子标签（陪伴 / 精选 / 记忆 / 故事 / 🔍）
- 陪伴子筛选（全部 / 我创建的 / 双生角色）
- 角色卡片（[创]/[双] 角标 + 关系阶段 + 亲密度 + 最近消息 + 按钮）
- 首次进入心屿弹窗（角色来源介绍）
- 角色详情页（来源标签 + 职业问答说明 + 免责声明）
- 聊天界面（AI 主动首条消息 + 自由输入 + 快捷回复 + 免责声明）
- 首次使用陪伴弹窗（完整免责声明）
- 职业问答能力（敏感问题规范）
- 双生角色"进入 TA 的世界"按钮

### 4.2 依赖

V17-A（底部 5 Tab 组件）

### 4.3 交付物

| 文件 | 改动 | 行数估计 |
|---|---|---|
| `output/preview/heart-island.html` | **重写**为心屿功能区容器（5 子标签 SPA） | ~1100 行（从 ~700 行扩） |
| `output/preview/css/design-system.css` | 新增 `ds-xinyu-sub-nav`（5 项）/ `ds-character-card-v17`（角色卡）/ `ds-source-tag`（来源角标）/ `ds-disclaimer-bar`（免责声明小字） | +160 行 |
| `output/preview/js/xinyu.js`（新建） | 5 子标签切换、陪伴子筛选、首次弹窗控制、角色卡渲染、详情页跳转、聊天主动消息生成、敏感问题回复模板 | 420 行 |
| `output/preview/chat.html` | 升级：加 "选 1 句回 TA" 快捷回复 + 双生角色"进入 TA 的世界"按钮 + 免责声明底部小字 | +200 行 |
| `output/preview/memory.html` | 升级：时间线 + 关系里程碑 + 编辑删除 + 来源角色头像 | +150 行 |
| `output/preview/profile.html` | 升级：作为"我的"Tab 落地点（v17.0 把"我的"入口统到这里） | +100 行 |
| `output/preview/character-detail.html`（新建） | 角色详情页（来源标签 + 职业问答说明 + 免责声明） | 250 行 |
| `output/preview/js/sensitive-qa.js`（新建） | 敏感问题识别 + 5 类回复模板 + 求助渠道映射 | 150 行 |

### 4.4 子任务拆分

| 子任务 | 内容 | 估计 |
|---|---|---|
| C-1 | 5 子标签（`ds-xinyu-sub-nav`）+ 默认"陪伴" | 0.2 轮 |
| C-2 | 陪伴子筛选（全部 / 我创建的 / 双生角色） | 0.1 轮 |
| C-3 | 角色卡（`ds-character-card-v17`）+ [创]/[双] 角标 + 关系阶段 | 0.3 轮 |
| C-4 | 双生角色"进入世界"按钮 + 跳转逻辑 | 0.1 轮 |
| C-5 | 列表底部"+ 创建新角色"按钮（v17.0 占位，wizard 待 v17.1） | 0.05 轮 |
| C-6 | 首次进入心屿弹窗 + localStorage 控制只弹一次 | 0.2 轮 |
| C-7 | 精选子功能区（双列瀑布流角色卡） | 0.1 轮 |
| C-8 | 记忆子功能区（时间线 + 里程碑 + 编辑删除） | 0.2 轮 |
| C-9 | 故事子功能区（双生角色带出记录） | 0.1 轮 |
| C-10 | 搜索子功能区（搜索框 + 结果列表） | 0.1 轮 |
| C-11 | 角色详情页 `character-detail.html`（来源标签 + 职业 + 免责声明） | 0.2 轮 |
| C-12 | 聊天界面升级（`chat.html` 主动首条 + 快捷回复 + 免责声明） | 0.3 轮 |
| C-13 | 首次使用陪伴弹窗（完整免责声明） | 0.1 轮 |
| C-14 | 职业问答能力（`sensitive-qa.js` + 5 类敏感回复模板） | 0.2 轮 |

### 4.5 mock 数据

**3 个示例角色**（v5.20 已有，沿用）：

| 角色 | source_type | occupation | 阶段 | 亲密度 |
|---|---|---|---|---|
| 阿岁 | user_created | 教师 | 知己 | 89 |
| 苏念 | novel_brought_out | 心理医生 | 亲密 | 76 |
| 林若 | official | 作家 | 灵魂伴侣 | 96 |

**敏感问题回复模板**（`sensitive-qa.js` 至少 5 类）：

```js
const SENSITIVE_QA_TEMPLATES = {
  medical: {
    keywords: ['病', '症状', '药', '治疗', '诊断', '医院', '处方'],
    reply: '我是 AI 角色，不能替代医生诊断。如有健康问题，请咨询专业医生或前往医院。紧急情况请拨打 120。'
  },
  legal: {
    keywords: ['律师', '起诉', '判决', '官司', '违法', '合同'],
    reply: 'AI 不能提供法律意见，建议咨询执业律师。法律援助热线 12348。'
  },
  psychological: {
    keywords: ['抑郁', '自杀', '想死', '焦虑', '崩溃'],
    reply: '如果你正在经历心理困扰，建议咨询专业心理咨询师。紧急情况请拨打 120。'
  },
  financial: {
    keywords: ['股票', '投资', '理财', '基金', '买入', '卖出'],
    reply: 'AI 不提供投资建议。请咨询持牌金融机构或理财顾问。'
  },
  educational: {
    keywords: ['升学', '择校', '考试', '志愿'],
    reply: 'AI 不替代教育规划师，建议结合孩子的实际情况，与学校老师沟通。'
  }
};
```

### 4.6 验收项

参考 PRD 8.3 节验收项 1-17。

### 4.7 风险

| 风险 | 缓解 |
|---|---|
| `chat.html` 主动首条消息需要上下文敏感（时间+情绪+上次聊天） | v17.0 mock：预置 4 时段 × 3 情绪 × 是否首次 = 24 条模板，按规则选 |
| 角色卡 `[创]/[双]` 角标颜色 | 沿用 v5.20 心屿色板：[创] 蓝 #4A90E2 / [双] 粉 #D85B9A |
| 5 子标签 SPA 切换 vs 独立页面跳转 | **Q1/Q2 待用户确认**（推荐多页 + 锚点） |
| 职业问答敏感问题识别 | 用关键词匹配（v17.0 mock），v17.1+ 接真 LLM 后用意图分类 |

---

## 五、V17-D — 启动签到弹窗 + 4 快捷入口

### 5.1 目标

实现每日启动签到弹窗，包含 7 天奖励 + 4 快捷入口。

### 5.2 依赖

V17-A（底部 5 Tab 组件）— 不强依赖，但建议在 V17-A 之后做，因为需要与首页衔接。

### 5.3 交付物

| 文件 | 改动 | 行数估计 |
|---|---|---|
| `output/preview/js/signin.js`（新建） | 启动检测每日是否已签到 + 弹窗控制 + 签到逻辑 + 视频计数 + 灵晶奖励累加 | 180 行 |
| `output/preview/css/design-system.css` | 新增 `ds-signin-modal` / `ds-signin-week`（7 天格子）/ `ds-signin-actions`（2 主按钮）/ `ds-signin-shortcuts`（4 快捷入口） | +100 行 |
| `output/preview/js/app-entry.js`（新建） | App 启动入口（每个页面 head 引入）：先弹签到 → 关闭后渲染主页面 | 50 行 |
| `output/preview/library.html` | 引入 `signin.js` + `app-entry.js`（同时是首页） | +20 行 |
| `output/preview/heart-island.html` | 同上 | +20 行 |
| `output/preview/creator-center.html` | 同上 | +20 行 |
| `output/preview/profile.html` | 同上 | +20 行 |
| `output/preview/js/db.js` | 注册 `signin_records` 表（schema 见 V17-E） | +40 行 |

### 5.4 子任务拆分

| 子任务 | 内容 | 估计 |
|---|---|---|
| D-1 | `signin.js` 核心逻辑（每日检测 + 弹窗 + 7 天 streak 计算） | 0.15 轮 |
| D-2 | 弹窗 UI（`ds-signin-modal` + 7 天格子 + 主按钮 + 视频按钮） | 0.15 轮 |
| D-3 | 4 快捷入口（CP 排行 / 运势 / 邀友 / 会员） | 0.1 轮 |
| D-4 | 视频按钮（0/3 计数 + mock 点击 +10 灵晶） | 0.1 轮 |

### 5.5 数据存储

```js
// localStorage key（v17.0 新增）
lingjing_v5170_signin_2026MMDD  // 每日是否签到 (boolean)
lingjing_v5170_signin_streak    // 连续天数 (number)
lingjing_v5170_signin_video_count_today  // 今日已看视频数 (0-3)
lingjing_v5170_signin_total    // 累计签到获得的灵晶
```

### 5.6 验收项

参考 PRD 8.4 节验收项 1-6。

### 5.7 风险

| 风险 | 缓解 |
|---|---|
| 每次启动都弹可能烦扰 | localStorage 控制每日只弹一次；可选"今日不再提醒"开关（**Q4 待用户确认**） |
| 关闭后默认进入哪个 Tab | **Q5 待用户确认**（推荐 🏠首页 / 复用 `library.html`） |
| 视频按钮需要模拟看视频 | v17.0 mock：点击直接 +10 灵晶 + 计数 +1，3 次后禁用 |
| 签到状态跨页面同步 | 所有页面共享 localStorage，无需额外同步 |

---

## 六、V17-E — 数据表迁移 + 3 张新表 + PREFIX 升级

### 6.1 目标

- 在 v5.20 21 张表基础上，**新增 3 字段**（`heart_island_characters` 表）
- **新增 3 张表**（`signin_records` / `world_categories` / `world_featured_banners`）
- **升级 PREFIX**：`lingjing_v520_` → `lingjing_v5170_`（v17.0 标识）
- **保留兼容**：老 PREFIX 数据迁移脚本（一次性）

### 6.2 依赖

V17-A + V17-C（V17-C 用了 source_type/occupation/occupation_qa_enabled 3 字段）

### 6.3 交付物

| 文件 | 改动 | 行数估计 |
|---|---|---|
| `output/preview/js/db.js` | PREFIX 升级 + 3 字段 + 3 新表 + 兼容迁移脚本 | +120 行 |
| `output/preview/js/db-migrate-v5170.js`（新建） | 一次性迁移脚本：把 `lingjing_v520_*` 数据搬到 `lingjing_v5170_*` | 80 行 |

### 6.4 PREFIX 升级决策（**Q3 待用户确认**）

**推荐方案**：A. 升级到 `lingjing_v5170_`

理由：
- 单一 PREFIX 便于后续维护
- v5.20 还在迭代期，趁早统一
- 数据迁移用脚本一次性完成，老用户无感

### 6.5 新表 DDL

```js
// 22. signin_records 签到记录
{
  name: 'signin_records',
  fields: [
    'id', 'user_id', 'sign_date', 'day_index',  // 1-7
    'reward_amount', 'is_video_bonus',
    'streak_count', 'created_at'
  ]
}

// 23. world_categories 世界分类树
{
  name: 'world_categories',
  fields: [
    'id', 'parent_id', 'name', 'icon',
    'sort_order', 'is_active', 'is_public_domain',
    'created_at'
  ]
}

// 24. world_featured_banners 主视觉 Banner 配置
{
  name: 'world_featured_banners',
  fields: [
    'id', 'image_url', 'title', 'subtitle',
    'link_url', 'sort_order', 'active',
    'start_at', 'end_at', 'created_at'
  ]
}
```

### 6.6 新增字段

```js
// heart_island_characters 表新增 3 字段
fields: [
  // ... v5.20 已有字段
  'source_type',        // VARCHAR(20) — user_created / novel_brought_out / official
  'occupation',         // VARCHAR(50) — 医生、律师、教师等
  'occupation_qa_enabled'  // BOOLEAN DEFAULT true
]
```

### 6.7 验收项

- [ ] PREFIX 全局替换为 `lingjing_v5170_`
- [ ] 老 PREFIX 数据迁移脚本可执行（无数据丢失）
- [ ] `heart_island_characters` 3 新字段生效
- [ ] 3 新表 DDL 正确（读 / 写 / 删）
- [ ] v5.20 已有功能无回归

---

## 七、V17-F — 全项目回归测试 + 测试报告

### 7.1 目标

跑 Playwright 真机回归测试，确保 v17.0 实施后：
- mobile (412px) + desktop (1280px) 双视图通过
- 0 console error
- 5 Tab 切换正常
- 世界/心屿/启动签到功能完整

### 7.2 交付物

| 文件 | 内容 |
|---|---|
| `scripts/test_v5170_world_xinyu.py`（新建） | Playwright 真机测试脚本（mobile + desktop） |
| `docs/v17.0-REDESIGN-REPORT.md`（新建） | V17.0 重构报告（命名变更 / 5 Tab / 世界/心屿/签到 / 数据表 / 验收 / 待办） |
| `output/preview/screenshots/v17.0/`（新建） | 截图：mobile + desktop × 5 Tab × 关键功能区 |

### 7.3 测试用例

| # | 用例 | 期望 |
|---|---|---|
| T1 | mobile 412px：底部 5 Tab 可见 | ✅ |
| T2 | desktop 1280px：底部 5 Tab 可见 | ✅ |
| T3 | 点击「📖世界」进入 `library.html`，看到 7 子导航 + Banner + 四大金刚 | ✅ |
| T4 | 点击「💬心屿」进入 `heart-island.html`，看到 5 子标签 + 角色卡 + [创]/[双] 角标 | ✅ |
| T5 | 首次进入心屿弹窗介绍两种角色 | ✅ |
| T6 | 关闭弹窗后再进入心屿不弹 | ✅ |
| T7 | 双生角色卡有 `[ 进入世界 ]` 按钮 | ✅ |
| T8 | 聊天界面 AI 主动发送第一条消息 | ✅ |
| T9 | 首次进入聊天弹窗完整免责声明 | ✅ |
| T10 | 角色详情页显示来源标签 + 职业问答说明 + 免责声明 | ✅ |
| T11 | 启动 App 先弹签到界面 | ✅ |
| T12 | 签到后 +4 灵晶，连续签到 7 天累计 69 灵晶 | ✅ |
| T13 | 视频按钮 (0/3) 计数 | ✅ |
| T14 | 职业问答敏感问题引导咨询专业人士 | ✅ |
| T15 | 所有页面 0 console error | ✅ |
| T16 | 所有文案 0 出现第三方产品名 | ✅ |
| T17 | localStorage 数据持久化（刷新后保持） | ✅ |
| T18 | PREFIX 升级后老数据可读 | ✅ |

### 7.4 风险

| 风险 | 缓解 |
|---|---|
| 测试 502 网络中断（v5.19 经验） | 用本地 HTTP server 替代远程访问，端口 8767 |
| 测试用时 > 30 分钟超时 | 拆为 2-3 批执行，每批 10 用例 |
| mobile 截图渲染慢 | swiftshader 软渲染 + 截图等待 3s |

---

## 八、实施顺序与依赖图

```
        ┌─────────┐
        │ V17-A   │  ← 基础：5 Tab 组件 + 设计系统扩展
        └────┬────┘
             │
   ┌─────────┼─────────┬─────────┐
   ↓         ↓         ↓         ↓
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│V17-B │ │V17-C │ │V17-D │ │V17-E │
│ 世界  │ │ 心屿  │ │ 签到  │ │ 数据  │
└──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘
   │        │        │        │
   └────────┴────────┴────────┘
             │
        ┌────┴────┐
        │ V17-F   │  ← 收尾：回归测试 + 报告
        └─────────┘
```

**建议执行顺序**：V17-A → (V17-B + V17-C + V17-D 并行) → V17-E → V17-F

---

## 九、工作量估计

| 工作包 | 子任务数 | 行数估计 | 轮数估计 | 备注 |
|---|---|---|---|---|
| V17-A | 4 文件改动 | ~330 行 | 0.5 轮 | 优先 |
| V17-B | 6 子任务 / 5 文件 | ~1660 行 | 1.5 轮 | 信息密度高 |
| V17-C | 14 子任务 / 8 文件 | ~2730 行 | 1.5 轮 | 子任务最多 |
| V17-D | 4 子任务 / 8 文件 | ~510 行 | 0.5 轮 | 较小 |
| V17-E | 2 文件 | ~200 行 | 0.5 轮 | 较小但关键 |
| V17-F | 测试 + 报告 + 截图 | — | 0.5 轮 | 收尾 |
| **V17-G** | 5 子任务 / 6 文件 | ~1150 行 | 0.5 轮 | **追加 · 创作者分成** |
| **总计** | — | **~6580 行** | **5.5 轮** | — |

---

## 十、与既有版本的关系

### 10.1 沿用

| 来源 | 沿用内容 |
|---|---|
| v5.18 | `css/design-system.css`（设计系统基底）+ 创作者中心 6 页面（不动） |
| v5.19 | `ds-mh` / `ds-bottom-tabs`（v5.19 mobile tab 方案保留为兼容类） |
| v5.20 | 4 张心屿数据表 schema + 21 张表 PREFIX 逻辑 + `heart-island.html` 主页面 |
| v5.17.2 | "沉浸剧情对话"视觉风格术语 |
| v5.16 | UX 规范（独立页面 + 返回箭头 + 选项弹窗） |
| v5.12 | 30 题材库 + 同人区数据源 |

### 10.2 修改

| 来源 | 修改内容 |
|---|---|
| `library.html`（v5.6~v5.20） | 从"内容列表单页" → "世界功能区容器" |
| `heart-island.html`（v5.20） | 从"主页面" → "心屿功能区容器（5 子标签 SPA）" |
| `chat.html`（v5.19） | 加 "选 1 句回 TA" + 双生角色"进入世界" + 免责声明 |
| `memory.html`（v5.19） | 加 时间线 + 里程碑 + 来源角色头像 |
| `profile.html`（v5.19） | 升为"我的"Tab 落地点 |
| `db.js`（v5.20） | PREFIX 升级 + 3 字段 + 3 新表 |

### 10.3 新增

| 文件 | 用途 |
|---|---|
| `character-detail.html` | 角色详情页 |
| `js/tabbar.js` | 5 Tab 状态管理 |
| `js/world.js` | 世界功能区逻辑 |
| `js/world-data.js` | 世界分类 + Banner + mock 数据 |
| `js/xinyu.js` | 心屿功能区逻辑 |
| `js/sensitive-qa.js` | 敏感问题识别 |
| `js/signin.js` | 启动签到逻辑 |
| `js/app-entry.js` | App 启动入口 |
| `js/db-migrate-v5170.js` | 一次性 PREFIX 迁移脚本 |

---

## 十一、用户决策锁定（2026-09-11 20:10）

| # | 决策 | 锁定结果 |
|---|---|---|
| Q1 | 底部 Tab 切换 vs 顶部子导航切换 | 底部 Tab 切 5 主功能区；功能区内部用顶部子导航切子功能；沉浸页（chat/plot-runner）用左上角返回键 |
| Q2 | 原 `chat.html` / `memory.html` / `profile.html` 独立页是否保留 | ✅ A. 保留（加跳转锚点） |
| Q3 | localStorage PREFIX 升级 | ✅ A. `lingjing_v5170_` |
| Q4 | 启动签到弹窗默认行为 | ✅ A. 每日只弹一次 |
| Q5 | 启动签到关闭后默认进入哪个 Tab | ✅ A. 🏠首页（复用 `library.html`） |
| Q6 | 角色卡 `[创] / [双]` 角标颜色 | ✅ A. 蓝 #4A90E2 / 粉 #D85B9A |
| Q7 | `BTS / HP / EXO` 等国际 IP 名是否替换 | ✅ A. 替换为"韩流同人/欧美同人/影视改编同人" |
| Q8 | v17.0 是否同步重构创作者中心 / 我的 | ✅ A. 不动（仅世界+心屿） |
| Q9 | mobile 视图 Banner 高度 | ✅ A. 25% |
| Q10 | `home.html` 是否新建 | ✅ B. 复用 `library.html` 作首页 |
| Q11 | V17-G 创作者分成阶梯本轮纳入 | ✅ **追加 V17-G 工作包** |

**v17.0 状态**：🔵 **决策锁定 · 进入实施阶段**

---

## 十一.5、V17-G — 创作者分成阶梯（追加）

### 11.5.1 目标

按用户 2026-09-11 19:56 第一段讨论，把 5 档分成阶梯（青铜/白银/黄金/钻石/传奇）落地到 commerce.html + creator-center.html，新增 creator-legal.html 协议页。

### 11.5.2 5 档阶梯定义

| 档位 | 名称 | 分成比例 | 升级门槛 |
|---|---|---|---|
| L1 | 🥉 青铜 | 50% | 注册创作者 + 发布 1 部作品 |
| L2 | 🥈 白银 | 60% | 累计流水 ≥ 500 元 + 作品完本或稳定连载 |
| L3 | 🥇 黄金 | 70% | 月流水 ≥ 2000 元 + 评分 ≥ 8.0 + 独家发布 |
| L4 | 💎 钻石 | 75% | 月流水 ≥ 5000 元 + 评分 ≥ 8.5 + 稳定更新 3 个月以上 + 阅读时长 ≥ 30 分钟 + 无违规 |
| L5 | 🏆 传奇 | 80% | 平台主动签约 + 独家 + 月更新 ≥ 5 万字 + 完本承诺 + 配合运营 + 版权授权清晰 |

### 11.5.3 依赖

无（独立于 V17-A~E），可与 V17-B/C/D 并行。

### 11.5.4 交付物

| 文件 | 改动 | 行数估计 |
|---|---|---|
| `output/preview/commerce.html` | 升级：当前档位展示 + 5 档阶梯表 + 升级进度提示 | +250 行 |
| `output/preview/creator-center.html` | 升级：分成档位卡片（创作者等级入口）+ 阶梯可视化 | +180 行 |
| `output/preview/creator-legal.html` | 新建：创作者协议页（5 档义务 + 考核周期 + 退出机制） | +400 行 |
| `output/preview/js/tier.js`（新建） | 分成档位计算 + 升级检测 + 状态展示 | +180 行 |
| `output/preview/css/design-system.css` | 新增 `ds-tier-card`（档位卡片）/ `ds-tier-progress`（升级进度条） | +80 行 |
| `output/preview/js/db.js` | 新增 `creator_tiers` 表（5 档定义）+ `creator_tier_history`（档位变更历史） | +60 行 |

### 11.5.5 子任务

| # | 内容 | 估计 |
|---|---|---|
| G-1 | `creator_tiers` 表 + 5 档预置数据 | 0.1 轮 |
| G-2 | `tier.js` 档位计算 + 升级检测 | 0.1 轮 |
| G-3 | commerce.html 升级：当前档位 + 阶梯表 + 升级提示 | 0.1 轮 |
| G-4 | creator-center.html 升级：档位卡片 + 阶梯可视化 | 0.1 轮 |
| G-5 | creator-legal.html 新建：协议页（5 档义务） | 0.1 轮 |

### 11.5.6 验收

- [ ] commerce.html 显示当前档位 + 5 档阶梯表
- [ ] creator-center.html 档位卡片入口可见
- [ ] creator-legal.html 协议完整（5 档义务 + 考核周期）
- [ ] 数据表 `creator_tiers` + `creator_tier_history` 落地
- [ ] 0 出现第三方产品名
- [ ] 与 v5.17 "商业化只对作者可见"硬规则一致（普通用户看不到档位相关 UI）

### 11.5.7 风险

| 风险 | 缓解 |
|---|---|
| 商业化 UI 误暴露给普通用户 | commerce.html 仅 `creator-center.html` 入口可见，普通用户 my.html 不展示 |
| 阶梯门槛数据动态化（用户实际流水） | v17.0 mock：固定数据 + UI 占位；v17.1+ 接真实流水数据 |
| creator-legal.html 协议文案合规 | 协议正文加占位 + "待法务核验"提示；正式发布前法务审核 |

---

## 十二、风险登记

| # | 风险 | 等级 | 缓解 |
|---|---|---|---|
| R1 | v17.0 与 v5.20 大改，功能回归风险 | 高 | V17-A 前跑 v5.20 baseline，PASS 列表作为对照 |
| R2 | 启动签到每天弹，UX 扰民 | 中 | localStorage 控制每日一次，v17.1+ 加开关 |
| R3 | 世界功能区 mobile 拥挤 | 中 | mobile 字号 -1、间距缩 25%、Banner 25% |
| R4 | 心屿 5 子标签全内嵌到 heart-island.html | 中 | **Q1/Q2 待确认**，推荐多页 + 锚点 |
| R5 | 角色卡角标用色需协调 v5.20 心屿风格 | 低 | 沿用 [创]蓝/[双]粉 |
| R6 | PREFIX 升级数据迁移 | 中 | **Q3 待确认**，推荐 A + 一次性脚本 |
| R7 | 国际 IP 名 BTS/HP/EXO 与零第三方名冲突 | 中 | **Q7 待确认**，推荐 A 替换 |
| R8 | 重构后是 SPA 还是多页 | 中 | **Q1 待确认**，推荐 A 多页 |
| R9 | 分类侧边栏从左滑出动画 | 低 | CSS transform + transition 300ms |
| R10 | 启动签到关闭后跳转逻辑 | 低 | **Q5 待确认**，推荐 A 复用 library.html |
| R11 | 角色卡双列瀑布流 mobile 拥挤 | 低 | mobile 字号 -1，卡片宽度 46% |
| R12 | 7 子导航横滑 vs 折叠 | 中 | mobile 横向滚动，desktop 全部可见 |
| R13 | 心屿 5 子标签 mobile 拥挤 | 低 | mobile 字号 -1，间距缩 |
| R14 | 角色详情页与 heart-island.html 视觉协调 | 低 | 沿用 v5.20 心屿风格 |
| R15 | 职业问答敏感问题识别准确率 | 中 | v17.0 关键词匹配，v17.1+ 接真 LLM |

---

## 十三、发布闸门（V17.0 → 下一版）

下列全部满足才能宣告 v17.0 完成：

- [ ] V17-A~F 全部工作包 ✅
- [ ] 18 个测试用例 T1~T18 全部 PASS
- [ ] 0 console error（mobile + desktop）
- [ ] 0 出现第三方产品名
- [ ] PREFIX 升级成功（老数据可读）
- [ ] `docs/v17.0-REDESIGN-REPORT.md` 完成
- [ ] 截图齐全（mobile + desktop × 5 Tab × 关键功能区）
- [ ] MEMORY.md / 2026-09-11.md 已更新

---

## 十四、待办（v17.1+）

| 优先级 | 工作 | 估计 |
|---|---|---|
| P0 | `character-create.html` 7 步 wizard | 1 轮 |
| P0 | 真 LLM 接入（保留 `window.AIHelper` 钩子） | 不可估 |
| P1 | 心屿主动行为推送（早安/晚安/关心提醒）模拟 | 1 轮 |
| P1 | 关系健康监测仪表（依赖/时长/社交平衡） | 1 轮 |
| P1 | 启动签到"今日不再提醒"开关 | 0.2 轮 |
| P2 | 4 个角色互动页面（朋友圈/日记/语音/视频）独立化 | 2 轮 |
| P2 | 排行榜 + 心屿推 + 福利 + 创世杯 内容来源（v17.0 mock） | 1 轮 |
| P3 | 双界穿梭完整流程（多步骤 + 灵晶校验 + 三重条件确认） | 1 轮 |

---

**V17.0 草案状态**：🔵 文档已就位，等待用户审阅 Q1-Q10 后启动实施。

**配套 PRD**：[PRD-v17.md](PRD-v17.md)

**原始需求证据**：[docs/sources/2026-09-11/S01-v17-world-and-xinyu-redesign.txt](sources/2026-09-11/S01-v17-world-and-xinyu-redesign.txt)