# PRD · 灵境 · 双生 V20.0 — 公版小说库 + 收费点自动生成系统

> **版本**：V20.0 草案（2026-09-11 23:36）  
> **来源**：[S06-v20-public-domain-library.txt](docs/sources/2026-09-11/S06-v20-public-domain-library.txt)  
> **前置版本**：V19.0 plot-runner 启动序列 + 详情页  
> **状态**：用户拍板确认范围后实施（已说"更新开发需求文档并开发这部分内容"，默认 V20-A~D 全量分批交付）

---

## 一、产品定位

公版小说库 = 灵境 · 双生为"公有领域作品"设立的专有内容池。系统自动下载、结构化提取、自动生成收费点；与作者创作小说走完全独立的变现通路。

**目标**：
- **40 本**公版小说上线（《红楼梦》/《西游记》/《傲慢与偏见》/《悲惨世界》等）
- **完整性 100% 保证**：每本都带 4 维校验报告（size/chapters/words/keep_rate），全部 pass
- **主线 0 AI 改写**：玩家体验到完整原著内容（`original_text` 字段直读）
- **公版 / 作者收费点分离**：公版自动生成、作者手动设计，**数据表分开**

---

## 二、4 批实施规划

| 批次 | 内容 | 范围 |
|---|---|---|
| **V20-A** | 公版库 UI + 完整性 mock | public-domain.html · 40 本书 · 4 维校验 · 收费点状态可视 |
| V20-B | 结构化提取 + 校验流程 | 脚本层 parser · 章节边界 · 保留率算法 · 报告生成 |
| V20-C | 收费点自动生成器 | monetization-generator.js · 章节锁 · 选择锁 · 番外锁 · 定价 |
| V20-D | 创作者后台收费点设计 | creator-center / commerce 扩展 · 5 类型 UI · 触发条件编辑器 |

---

## 三、V20-A（本批 · 立即交付）

### 3.1 public-domain.html（独立页）

**入口**：
- 主页 → 快捷入口"公版名著"（v5.21+ 即将开放占位）
- 顶部菜单：世界 Tab → 7 子导航 → 公版名著（入口）

**页面结构**（自顶向下）：
```
┌─ [← 返回] [公版名著库] [···] ─────────┐
│                                         │
│ ┌─ Tab ─┬─ Tab ─┬─ Tab ─┐            │
│ 中国古典（25）│外国经典（15）│  下载管理    │
│                                       │
│ ┌─ 概览卡 ──────────────────────────┐│
│ │ 总计 40 本 · 完整下载 38/40         ││
│ │ 平均保留率 98.2% · 平均字数 52 万字  ││
│ │ 自动收费点 412 个 · 平均价格 18 灵晶  ││
│ └────────────────────────────────────┘│
│                                       │
│ [排序] 完整性↓ 字数↓ 章节数↓ 价格↓      │
│                                       │
│ 瀑布流书籍卡（双列）：                     │
│  ┌─────────┐ ┌─────────┐               │
│  │ 红楼梦  │ │ 西游记   │               │
│  │ 曹雪芹  │ │ 吴承恩   │               │
│  │ ✅ 100% │ │ ✅ 99.8% │               │
│  │ 120 章  │ │ 100 章   │               │
│  │ 73万字  │ │ 86万字   │               │
│  │ 💎 自动  │ │ 💎 自动  │               │
│  │ [详情]  │ │ [详情]   │               │
│  └─────────┘ └─────────┘               │
│                                       │
└─────────────────────────────────────────┘
```

**数据层**：`output/preview/js/public-domain-data.js`（约 350 行）

```js
window.PUBLIC_DOMAIN_DATA = {
  books: [
    {
      id: 'hongloumeng',
      title: '红楼梦',
      author: '曹雪芹',
      lang: 'zh',
      category: '中国古典',
      source: '文硕阁',
      cover: 'linear-gradient(135deg,#8B4513,#A0522D)',
      emoji: '📕',
      integrity: {
        size: 4096,           // KB
        chapters: 120,        // 标准章节数
        words: 730000,        // 标准字数
        keepRate: 0.987,      // 原文保留率 98.7%
        conclusion: 'pass'    // pass / suspect / fail
      },
      monetization: {
        chapterLocks: 24,     // 24 个章节锁
        choiceLocks: 8,       // 8 个选择锁
        bonusLocks: 3,        // 3 个番外锁
        avgPrice: 18          // 平均价格 18 灵晶
      },
      isDownloaded: true
    },
    // ... 25 中文 + 15 外文
  ]
}
```

**逻辑层**：`output/preview/js/public-domain.js`（约 250 行）
- `getQuery()` — 读 ?tab=zh|en|manage
- `renderStats()` — 顶部概览卡（4 维度统计）
- `renderList(books)` — 瀑布流书籍卡（双列）
- `setTab(tabId)` — 3 Tab 切换（zh/en/manage）
- `sortBooks(by)` — 排序（integrity/words/chapters/price）
- `bindDetail(btn)` — 点击进入详情 modal

**详情 modal**：
- 大封面 + 标题 + 作者
- 4 维完整性报告（每项带 ✓/⚠️/✗）
- 收费点列表（章节锁 + 选择锁 + 番外锁）
- 平均价格 + 总收费点数
- 「进入小说世界」按钮（跳转 plot-runner.html）

---

## 四、视觉规范

### 4.1 书籍卡片（双列瀑布流）

```
┌────────────────────────┐
│     渐变背景封面           │
│        📕               │
├────────────────────────┤
│ 红楼梦 · 曹雪芹           │
│ 中国古典 · 文硕阁          │
│ ✅ 98.7% · 120 章 · 73 万字 │
│ 💎 自动收费 · 35 个节点    │
│ 平均 18 灵晶/章           │
└────────────────────────┘
```

### 4.2 完整性状态徽章

| 状态 | 颜色 | 标签 |
|---|---|---|
| pass | 🟢 `#4ECCA3` | ✅ 100% 完整 |
| suspect | 🟡 `#FFB347` | ⚠️ 需复核 |
| fail | 🔴 `#E94560` | ✗ 失败 |

### 4.3 收费点角标

- 「💎 自动生成」黄色徽章 — 标记自动收费点
- 「✍ 手动设计」紫色徽章 — 创作者收费点（V20-D 才出现）

---

## 五、关键技术约束

### 5.1 数据表分离（铁律）

```sql
-- 公版收费点（自动生成）
public_domain_monetization {
  novel_id, chapter_number, monetization_type, price,
  description, is_auto_generated: true
}

-- 创作者收费点（手动设计）
creator_monetization_points {
  novel_id, creator_id, point_type, price,
  point_name, point_description, trigger_condition, effect
}
```

### 5.2 主线 = 原文（铁律）

数据层每本书带 `original_text` 字段，玩家在主线路径中**直接读取该字段**，不经任何 AI 改写。

### 5.3 不接真 LLM

- 完整性校验、保留率计算、收费点生成都是 **mock 算法**
- 真实实现需要后端 + 真实下载（V20-A~D 是 prototype）
- 真正"未实现"功能 UI 标「v5.21+ 即将开放」

---

## 六、回归测试计划

V20-A 测试脚本 `scripts/test_v20a_public_domain.py`（约 12 项）：
1. public-domain.html 200 OK
2. 顶部概览卡 4 维数字正确
3. 3 Tab 切换
4. 中国古典 25 本书
5. 外国经典 15 本书
6. 双列瀑布流渲染
7. 排序：完整性降序
8. 排序：字数降序
9. 排序：价格升序
10. 详情 modal 打开
11. 4 维完整性报告渲染
12. 「进入小说世界」跳转 plot-runner.html

---

## 七、累计回归

V20-A 完成后预期：

| 套件 | 通过 | 覆盖 |
|---|---|---|
| V17-A~F | tabbar | 5 Tab |
| V17-B-Strict | 16/16 | 世界功能区 |
| V17-G | 16/16 | 创作者分成阶梯 |
| V18-A~D | 13/13/21/18/9 = 61 | 首页/心屿/plot/经济 |
| V19-A | 21/21 | plot 启动序列 |
| product-preview | 22/22 | 状态镜像 |
| V17-A-Fix | 9/9 | 路径修复 |
| **小计** | **145/145** | V20-A 之前 |
| **V20-A** | **12/12** | **公版库 UI** |
| **合计** | **157/157 PASS · 11 工作包** | 0 业务错误 · 0 第三方平台名 |

---

## 八、未实现项处理（v5.21+ 即将开放）

- 真实下载（文硕阁 / Gutenberg API）→ modal 提示
- AI 提取 / LLM 改写 → modal 提示（仅 mock）
- 创作者后台收费点编辑（V20-D 才实现）→ 显式「V20-D 即将开放」

---

## 九、与 V19.0 兼容性

| V19.0 已实现 | V20-A 复用 |
|---|---|
| plot-detail.html | **复用**：从公版库点书进入 plot-detail?novel=hongloumeng |
| plot-runner.html | **复用**：进入小说世界 |
| 5 Tab 壳 | **复用**：公版库页接 world Tab |

---

## 十、命名空间与版本号

| 命名空间 | 当前版本 | 范围 |
|---|---|---|
| v6.x | v6.4.1 | 5 Tab 共享壳 |
| V17.x | V17.0 草案 | 世界/心屿重构 |
| V18.x | V18.0 | 首页/心屿/plot-runner |
| V19.x | V19.0 | 小说世界游戏全功能 |
| **V20.x** | **V20.0 草案** | **公版小说库 + 收费点自动生成** |

**命名约定**：V20-A/B/C/D = V20.0 4 个工作包。
---

## 十一、V20-L · 全应用功能区对照补齐（2026-09-12 交付）

> 需求原文：`docs/sources/2026-09-12/S01-v20l-full-app-design-doc.txt`（《全应用功能区完整设计文档 V1.0》，永不修改）
> 规则：**文档有的补上；项目已有而文档没有的保留不删除**（24 项缺口全补，0 项删除）。

### V20-L.1 缺口清单（24 项 · 全部交付）

| # | Tab | 缺口 | 实现 |
|---|---|---|---|
| G1 | 首页 | 完整签到界面（7 天签到 + 看视频领灵晶 + 4 快捷入口） | home.js `openSigninCenter()` 底部抽屉 + sc-day-cell 7 格子 + 视频 +5 灵晶 |
| G2 | 首页 | 陪伴动态点击进入角色聊天 | COMPANION_FEED 加 cid → `chat.html?cid=` |
| G3 | 首页 | 世界更新点击进入世界详情 | WORLD_UPDATE 加 id → `plot-detail.html?novel=` |
| G4 | 世界 | 排行榜缺 Fans/综合/同人/新晋完结/勤更/稀有卡六榜 | RANKS 10→16 榜，同人榜过滤型 + 4 新排序维度 |
| G5 | 世界 | 卡片缺一句话简介 | world-data.js DESCS 30 条 + `.ds-wf-desc` 渲染 |
| G6 | 世界 | 分类侧边栏"明星"命名 | 「同人专区」→「明星同人」、「完结专区」→「完结」（id 不变，0 断链） |
| G7 | 心屿 | 创建新角色只 toast | 跳转 `character-create.html`（7 层向导） |
| G8 | 心屿 | 聊天底部免责声明小字 | `.chat-disclaimer` 常驻 |
| G9 | 心屿 | 首次使用完整免责声明弹窗 | `.disc-mask` 5 条声明 + localStorage 记忆 |
| G10 | 心屿 | 聊天页写死阿岁、无 cid | `?cid=` 动态角色（CHARACTERS+FEATURED 池，默认阿岁）+ AI 主动第一条 |
| G11 | 心屿 | 双生角色聊天缺 [进入 TA 的世界] | header 按钮 → plot-runner |
| G12 | 心屿 | 职业问答 + 敏感问题引导 | OCC_TOPICS 13 职业 + SENSITIVE_RULES 三通道（120 急救 / 12348 法律 / 12356 心理） |
| G13 | 心屿 | 故事区缺角色专属剧情入口 | `.si-btns` 双按钮（进入世界 + 📖 专属剧情） |
| G14 | 心屿 | 记忆缺查看/编辑/删除 | `.mi-ops` 三操作（查看弹窗 / 编辑 textarea / 删除确认弹窗） |
| G15 | 心屿 | 角色详情页缺职业问答说明 + 免责 | character-detail 职业卡 + 底部免责小字 + 陪聊带 cid |
| G16 | 创作 | 缺关闭按钮 + 草稿箱 | 顶栏 ✕（history.back）+ 📝 草稿箱（novel-edit） |
| G17 | 创作 | 缺两大按钮（创建智能体/灵境工坊） | `.big-duo` → character-create / novel-edit |
| G18 | 创作 | 缺视频/图片/声音 3 按钮 + 4 更多创建 | `.fn-trio` + `.more-create`（toast v5.21+ 即将开放） |
| G19 | 创作 | 缺工作台 5 入口 | `.workbench`：编辑器/AI 辅助/收费点/封面/发布管理 |
| G20 | 我的 | 缺创作数据区（仅创作者可见） | 作品列表/收益明细/提现入口（`lingjing_is_creator` 开关） |
| G21 | 我的 | 法律区缺侵权投诉 | → `legal-view.html?doc=COPYRIGHT_COMPLAINT_PROCESS` |
| G22 | 我的 | 订阅缺权益说明 | Free / 月卡 / 星卡 链接 wallet#sub |
| G23 | 游戏 | 工具栏缺灵境平台标识 | `#plot-brand` 🔮 按钮 |
| G24 | 游戏 | 属性面板缺体魄/智谋/好感度 | 6→9 属性；地图建筑点击进子场景 + 人物互动菜单（对话/送礼/邀约/攻略） |

### V20-L.2 验收对照（设计文档 §九 12 条 → 29 项测试全绿）

`scripts/test_v20l_gap_fill.py`：29 PASS / 0 FAIL（含全程 0 pageerror）。
受影响回归：v17b 17✅ / v18a 16✅ / v18b 21✅ / v18c 9✅（工具栏 6→8 更新）/ v20j 15✅ / v20k 17✅（榜单 10→16 更新）/ v20i 13✅。

### V20-L.3 设计文档未覆盖但保留的项目自有功能（0 删除）

更新日历视图、创世杯、心屿推（每周回响/引路人排行）、福利充值 5 档、公版库 40 本真实语料、三国演义卷制收费、分成阶梯 5 档、创作者法律 13 份、plot-detail 三级回退、自动/快进/10 槽存档、CG 全屏、实名认证、退出登录、举报中心、自动打字机 30ms 等 — **全部保留**。

### V20.x 工作包台账（累计）

| 包 | 内容 | 状态 |
|---|---|---|
| V20-A~D | 公版库 + 收费点自动生成（详见上文） | ✅ |
| V20-E | tabbar z-index/居中修复 | ✅ |
| V20-F | 退出登录 + 账号切换 | ✅ |
| V20-G | 手机游戏全局锁定（32/32） | ✅ |
| V20-H | 公版真实语料 40 本 49.8MB + 三国世界（43/43） | ✅ |
| V20-I | 全项目接口审查（6 修复 + 9 登记，21 套绿） | ✅ |
| V20-J | 卡片→详情→游玩链路（15/15） | ✅ |
| V20-K | 分类全量扩充（17/17，16 类/88+ 二级/8 排序/10 榜） | ✅ |
| **V20-L** | **全应用功能区对照设计文档补齐（24 缺口，29/29）** | ✅ 2026-09-12 |

---

## 十二、V20-M · 「我的」功能区完整重做（2026-09-12 交付）

> 需求原文：`docs/sources/2026-09-12/S02-v20m-me-tab-design-doc.txt`（《"我的"功能区完整设计文档》，永不修改）
> 规则：文档有的补上；项目已有而文档没有的保留不删除。

### V20-M.1 交付范围（七区块 + 6 新页 + 3 页升级）

| 区块/页面 | 实现 |
|---|---|
| 个人信息区 | 头像/用户名/ID/签名/实名状态六要素 + 编辑资料按钮；头像·用户名可点击直进编辑页 |
| 资产总览区 | 💎灵晶 / 🪙灵玉 / ⭐收藏 三卡横排，前两者→钱包、收藏→收藏页 |
| 我的内容区 | 我的作品（创作者可见）/ 我的角色 / 我的世界 / 我的卡牌 四入口 |
| 创作者中心区 | 等级卡（L3 黄金 · 70% 进度条）+ 收益总览 4 格（总收益/待结算/已提现/本月）+ 数据看板入口；`lingjing_is_creator` 门控（非创作者整区隐藏） |
| 订阅与消费区 | 当前订阅卡（Free/月卡/星卡 + 续费 + 权益说明）+ 订阅管理 4 入口（升级/取消/历史/消费记录） |
| 设置区 | 10 Tab：账号/安全/通知(5 开关)/隐私(6 项)/显示/声音/AI 偏好/**数据管理**（导出 JSON/清缓存/记忆管理/对话历史）/法律/关于（版本/日志/社群/商务） |
| 法律与帮助区 | 法律 5（用户协议/隐私政策/未成年人声明/AI 免责/侵权投诉）+ 帮助 4（FAQ/反馈/举报/客服）+ 关于 4 |
| 底部 | 退出登录 + 注销账号双按钮；注销弹窗含 30 天后悔期 + 数据处理说明 |

**新页 6 张**：
- `profile-edit.html`：9 项编辑（头像 emoji 选择/用户名/签名/性别/生日/所在地/手机/邮箱/实名入口），保存写 `lingjing_user_profile`，我的页同步显示；绑定用弹窗输入（铁律 #10：无 prompt）
- `favorites.html`：四 Tab（📖小说世界/💬角色/🃏卡牌/🔥动态）+ 状态筛选 + `<dialog>` 确认取消收藏（写 `lingjing_v52x_favs`）
- `my-works.html`：已发布/草稿箱/审核中/已下架 4 状态 Tab，作品卡（封面/字数/状态/收益）→ 作品管理
- `my-characters.html`：我创建的 + 双生角色，[创]/[双]角标、亲密度、双生筛选 → character-detail
- `my-worlds.html`：正在游玩（进度条 + 最后游玩时间 + ▶ 继续游玩→plot-runner）/ 已完成
- `my-cards.html`：命运卡牌 8 张，稀有度 5 档（普通/稀有/史诗/传说/限定）+ 来源筛选，详情弹窗（📤分享 / 🖼️设为背景写 `lingjing_v52x_profile_bg` / 收下）

**升级 3 页**：
- `wallet.html` 6 Tab→8 Tab：充值 6 档（**6/30/68/128/328/648**，补 68/328 档）+ 消费记录 50 条（JS 生成）+ 充值记录 + 灵玉获取（签到/任务/活动）+ 提现区（可提现余额/申请提现/提现记录/提现规则）；hash 路由 `#tab-N`/`#sub`/`#withdraw`（含 hashchange 同页响应）；修 balance-card 装饰光晕 `pointer-events:none` 遮挡按钮
- `settings.html` 9→10 Tab：新增数据管理（导出 JSON/清除缓存/记忆管理/对话历史）；隐私细化 6 项；通知 5 开关（+角色主动消息/世界更新提醒/创作者收益）；使用偏好 5 项（语言/主题/字号/自动播放/语音）；关于补更新日志/社群/商务
- `commerce.html`：`#earnings`/`#dashboard` 锚点 + 创作数据看板 5 指标（阅读量/进入世界次数/平均游玩时长/角色受欢迎程度/章节退出率）+ 收益明细三视图（按作品/按收费点/按时间，`window.LJEarn` 桥接）+ CSV 导出报表

### V20-M.2 验收对照（设计文档 §十一 11 条 → 43 项测试全绿）

`scripts/test_v20m_me_tab.py`：**43 PASS / 0 FAIL**（A 七区块 14 项 / B 编辑资料 3 / C 钱包 6 / D 收藏 5 / E 我的内容 6 / F 设置 6 / G 看板 2 / Z 全程 0 pageerror）。

### V20-M.3 修复的既有缺陷（本轮回归抓出）

| 缺陷 | 根因 | 修复 |
|---|---|---|
| my-cards 页面白屏（卡牌列表不渲染） | 脚本引用 `kd-mask` 但实际 id 为 `kc-mask`，DOMContentLoaded 中断致 render() 未执行 | 改正 id |
| commerce 收益明细视图切换/导出点击报错 | `exportEarningsReport` 定义在 IIFE 内被外层引用（ReferenceError） | IIFE 尾部暴露 `window.LJEarn` 桥接 |
| wallet 同页 hash 跳转不响应 | 仅监听 DOMContentLoaded，goto 同页仅改 hash 不重载 | 加 `hashchange` 监听 |
| wallet 提现按钮点击无效 | balance-card `::before/::after` 装饰光斑拦截指针 | `pointer-events:none` |
| v17a 套件超时（V20-C 起测试债） | product-preview splash 把 tabbar 藏进 .hidden 容器 | 测试 add_init_script 预置 `lingjing_onboarding_done` |
| v20l #19 过期期望 | V20-M 新增「创作数据看板」第 4 入口 | 更新断言 |

### V20-M.4 回归台账

受影响 15 套中 **11 套绿**：v17a 9/9（修复）/ v17g_tier / v20e / v20f / v20g / v20i 13/13 / v20l 29/29（期望更新）/ v20m 43/43（新增）/ v514_commerce / v5172 / v519。
其余 4 套（v516_ux / v517 / v641_shell / v518_regression）为 **O-8 既有测试债**（选择器被 V17-G/V18.0/V20-C 重做超越，非本轮引入），维持登记不动。

### V20.x 工作包台账（累计 13 包）

V20-A 公版库 → B 收费点 → C 启动页 → D 钱包 → E tabbar → F 退出登录 → G 全局锁定 → H 真实语料 → I 接口审查 → J 游玩链路 → K 分类扩充 → L 功能区对照补齐 → **M 「我的」功能区完整重做（本轮）**

---

## 十三、V20-N · 「我的」Tab 全按键实测审计（2026-09-12 交付）

> 需求驱动：用户要求"挨个功能区挨个按键都做好了吗"，不能凭印象回。
> 测试脚本：`scripts/test_v20n_my_tab.py`（Playwright 真点击 + DOM 存在性断言）
> 报告：`docs/MY_TAB_AUDIT_2026-09-12.md`

### 交付：39 PASS / 0 FAIL / 0 PageError

10 张页面 39 项审计点全 PASS：
- me.html 七区块 + 6 个跳转入口（作品/角色/世界/卡牌/收藏/钱包）真点击 → URL 全部正确
- profile-edit 9 项编辑字段 + 保存
- my-works 4 状态 Tab / my-characters 10 角色 + [创]/[双]角标 / my-worlds 进度条 / my-cards 5 档稀有度 + 详情弹窗 + 设背景（写入 `lingjing_v52x_profile_bg`）
- wallet 8 Tab + 6 档充值 / settings 10 Tab / commerce `#earnings`/`#dashboard` 锚点

### 测试期间发现并修复的选择器笔误（4 类）

| 误用 | 实际 | 备注 |
|---|---|---|
| `#pe-sig` | `#pe-sign` | profile-edit 签名 |
| `#pe-region` | `#pe-location` | profile-edit 所在地 |
| `.mc-card` | `.mc-list / .mc-item` | my-characters 角色卡容器 |
| `.mw-progress` | `.wp-bar / .wp-fill` | my-worlds 进度条 |

> 设计文档 §十一验收的 11 条全部 PASS，0 pageerror，0 console error。
EOF\necho PRD-appended

## 十五、V20-Q · 三国演义·真人摄影风格小说世界（2026-09-12 13:30）

**背景**：V20-H 三国演义小说世界已交付文字版（574 行 / 49.8MB 公版语料），但 UI 仅用渐变+emoji 表达场景。用户要求升级视觉层为「真人摄影风格真实场景画面」。

**决策**：用本机 SD（majicMIX realisticv7）+ 24 张预生成图 + sanguo-world.html 视觉升级。

**SD 管线**：
- 模型：`majicMIX realisticv7`（真人写实 · 电影感 · 完全契合三国古风）
- 端点：SD WebUI 7860 `/sdapi/v1/txt2img`
- 尺寸：512×768 portrait
- 步数：22 / sampler DPM++ 2M Karras / cfg 7
- 平均 6.7s/张 · 24/24 成功 · 总耗时 160s · 总 13.8MB

**24 张图覆盖**：
- **12 卷封面**：桃园豪杰 / 诸侯会盟 / 王司徒献女 / 卧龙出山 / 官渡之战 / 赤壁火攻 / 西川攻略 / 关羽北伐 / 夷陵火海 / 五丈原 / 司马懿 / 三国归晋
- **12 关键回主图**：温酒斩华雄 / 三英战吕布 / 三顾茅庐 / 火烧乌巢 / 草船借箭 / 周瑜舞剑 / 华容道 / 赵云救主 / 刮骨疗毒 / 败走麦城 / 白帝托孤 / 空城计

**HTML 升级**（sanguo-world.html 574 → 658 行）：
1. Hero 横幅加卷一封面背景图（`.sg-hero-bg` + 暗色叠加层 + z-index 分层）
2. 12 卷每卷左侧 54×72 真人摄影缩略图（`.sg-vol-thumb` + 渐变蒙层）
3. 12 关键回阅读页顶部 320×200 主图 + 「— 真人摄影 · AI 写实场景 —」角标
4. `SG_SCENES` 映射表 + `sgSceneUrl()` 路径工具 + `sgFallbackGradient()` 12 色 fallback
5. 阅读流程、收费点（卷 20💎 / 全书券 128💎）、签到、阅读券、阅读进度 100% 保留

**测试**（scripts/test_v20q_sanguo_photoreal.py）：
- 静态：24/24 张图存在 · 总 13.8MB
- 主页：Hero 卷一背景图 + 12 卷缩略图全部含 sg_v URL
- 钱包：灵玉 100 + 灵晶 1000（充足买全书券）
- 签到：+10 灵玉 → 110
- 阅读券：兑换弹窗 + 兑 1 张 → tickets=1
- 买卷 2：扣 20 灵晶 → 980 + 已解锁
- 买全书券：扣 128 → 852 + 全解锁
- 关键回 5（温酒斩华雄）/ 95（空城计）章顶主图加载正确
- 非关键回无章顶主图（正确）

**回归**：v20q 38/38 + v20i 13 + v20l 29 + v20m 43 + v20n 39 = **162 PASS / 0 FAIL**

## 十六、V20-U · 通用实名门控（2026-09-13 08:50）

**背景**：用户原话：「客户点击世界功能区的小说介绍图片先看到这个介绍页。使命认证这个之前实名过不体现。心屿功能区创建角色和创作功能区创建智能体功能区点击后没有实名的用户也弹出实名操作对话框」

**铁律**：未实名前严禁直接进入创作类功能（合规要求）；已实名用户在 UI 中**不显示**实名元素。

**交付**：
1. **`output/preview/js/realname-gate.js`**（240 行 · 通用组件）— 提供 `window.LJRealname.gate(target, opts)` 接口
   - 已实名 → 直接跳转（不弹窗）
   - 未实名 → 弹通用 modal（实名认证通知 + 真实姓名 + 证件类型三选 + 证件号码 + 3 条注意事项 + 取消/提交）
   - 校验：姓名 2-20 字 / 身份证 18 位（含 X）/ 港澳台居住证 8-18 位字母数字 / 护照 5-20 位字母数字
   - 提交后写入 `lingjing_v519_realname_done=true` + `lingjing_v519_realname_info`（含 name/type/idLast4/ts）+ tries++
   - 每日上限 3 次（与 plot-runner 现有规则一致）
   - 暗色模式自适应（prefers-color-scheme）

2. **`heart-island.html`** — 引入 realname-gate.js；`#heart-create` 按钮 onclick 走 gate

3. **`creator-center.html`** — 引入 realname-gate.js；`a.big-btn.agent` 加 `onclick="event.preventDefault(); LJRealname.gate(this.href)"`

4. **`heart.js`** — bindEvents 内 createBtn.onclick 改走 `LJRealname.gate('character-create.html')`，未加载时降级直跳

**测试**（`scripts/test_v20u_realname_gate.py` · 20/20 PASS · 0 FAIL · 0 PageError）：
- A. 世界 Tab 30 张卡片 href 全指向 plot-detail.html · 点击成功跳转
- B. 心屿未实名 → 创建新角色 → modal 弹起 + 姓名长度校验拒绝 + 身份证格式校验拒绝 + 取消按钮关闭 + 提交写入 done + 跳 character-create.html
- C. 创作未实名 → 创建智能体 → modal 弹起 + 提交写入 done + 跳 character-create.html
- D. 心屿已实名 → 创建新角色 → modal 不弹 + 直跳 character-create.html
- E. 创作已实名 → 创建智能体 → modal 不弹 + 直跳 character-create.html

**沉淀坑**：
1. **测试 init 脚本不能用 `removeItem` 重置已设值**：add_init_script 在每次页面加载时跑（含目标页跳转后），会把刚刚写入的 done 重置掉。**正确写法**：`if(!localStorage.getItem('k')){localStorage.removeItem('k')}`
2. **首次进入弹窗遮挡测试按钮**：心屿页的 `.heart-dialog-mask` 拦截 #heart-create → 测试前手动 `querySelectorAll('.heart-dialog-mask,.heart-dialog').forEach(n=>n.remove())`
3. **门控 onclick 写法**：用 `event.preventDefault()` + `LJRealname.gate(this.href)`（保留 href 让右键/中键打开新窗口时仍可工作）

**回归**：v20u 20 + v20i 13 + v20m 43 + v20n 39 + v20q 38 = **153 PASS / 0 FAIL**

## 十七、V20-V · 通用小说世界引擎 MVP（2026-09-13 09:30）

**背景**：用户上传 50 张「田间记」参考图，明确要求「通用小说世界」：根据上传 txt 自动分章节 + 解析收费点 + 解析道具 + 自动生成玩法（作者可手动覆盖）。

**铁律**（V20-T + §十八）：
- 货币：灵晶/灵玉（绝不允许田间记的「丸子/铜钱」出现在 UI）
- 视觉：默认古风插画（田间记样板），保留 V20-Q 三国作为「真人写实」模板
- 场景可点击交互：所有道具/人物 hotzone 可点；选项按钮只在系统级菜单用

**交付**：
1. **`corpus/books/demo-taohuayuan.txt`** — 6 章示例小说（含全部 7 种标注）
2. **`output/preview/js/novel-game-parser.js`**（150 行 · 通用解析器）
   - 行内标注：`## 章名` / `### 场景：名` / `「角色」对话` / `{道具:name}` / `{人物:name}` / `[选项A|选项B]` / `【收费章节：N灵晶】`
   - 输出：`{title, chapters[{title, cost, scenes[{name, blocks[{type,...}]}]}]}`
3. **`output/preview/js/novel-game.js`**（320 行 · 控制器）
   - 模式：upload / chapters / stage
   - 上传：FileReader 读 txt → 解析 → 章节列表
   - 章节列表：6 章卡片网格（免费/付费标签 + 锁定状态）
   - 进入章节：检查 cost → 未付弹付费弹窗 → 付费扣灵晶 → 写 paidChaps → flatBlocks 逐 block 渲染
   - 主视图：场景图（letterboxed 古风渐变）+ hotzone（道具/人物）+ 上卷轴对话框 + 下选项按钮
   - 抽屉交互：点击 hotzone → 道具「🔍查看/放入背包/丢弃」+ 人物「💬对话/🎁赠送/🚶离开」
   - FAB：背包（实时显示物品）+ 存档（写 localStorage）
   - 钱包：💎灵晶 + 🟢灵玉（V20-Q 货币体系）
4. **`output/preview/novel-game.html`**（280 行 · 独立页 · letterboxed 古风视觉）
   - 顶栏 / 上传页 / 章节列表 / 主视图 / 付费弹窗 / 交互抽屉 / 状态浮动 / FAB / Toast
   - 暗色主题 + 古风金色（#E8C36A）+ 灵境红（#E94560）+ 心屿紫（#6C5CE7）

**测试**（`scripts/test_v20v_novel_game.py` · 26/26 PASS · 0 FAIL · 0 PageError）：
- A. 上传页 → 加载示例 → 章节列表（5 项）
- B. 第一章进 stage + 选项 + 道具识别 + NPC 识别（3 项）
- C. hotzone 出现 + 点击打开交互抽屉 + 关闭（3 项）
- D. 选项按钮推进 blockIdx（1 项）
- E. 付费弹窗 + 取消 + 付费扣灵晶 + 写 paidChaps + 再入不重复扣（7 项）
- G. 背包 FAB + 物品显示（2 项）
- H. 存档 FAB + localStorage 写入（1 项）
- I. 帮助弹窗（1 项）
- J. 解析器单元测试（2 项：5 类 block + cost 解析）

**累计回归**：v20v 26 + v20u 20 + v20i 13 + v20m 43 + v20n 39 + v20q 38 = **179 PASS / 0 FAIL**

**沉淀坑**：
1. **测试断言错位（不是产品 bug）**：测试代码推 N 次后断言第 N+1 块是什么时，必须**实际查文本**而不是凭推断
2. **hotzone click 超时**：场景层与对话框层在 flex column，hotzone 是 absolute 定位，但 selector click 偶尔被对话框挡住 → 用 `page.mouse.click(x, y)` 坐标点击绕开
3. **evaluate JS 字符串嵌套**：`localStorage.getItem(...)` 在 Python 字符串里嵌 `Math.abs(...)` 容易少括号 → 简化为 `Object.keys(localStorage).some(k=>k.includes('_progress'))`
