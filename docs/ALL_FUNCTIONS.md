# 灵境 · 双生 — 完整功能清单 ALL_FUNCTIONS（单一权威文档）

> **本文件是项目唯一权威功能清单**。所有需求来自下述规范，任何代码/UI 改动必须在此文件登记，未登记 = 未实现。
>
> **生成时间**：2026-09-11 00:24
> **生成原因**：用户反馈之前文档分散、漏功能，要求一个 all-in-one 文档
> **基线**：[PRD.md](PRD.md) / [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) / [UI_DESIGN_GUIDE.md](UI_DESIGN_GUIDE.md) / [WORLD_OS_SPEC.md](WORLD_OS_SPEC.md) / [DUAL_SOUL_SPEC.md](DUAL_SOUL_SPEC.md) / [CREATOR_SYSTEM.md](CREATOR_SYSTEM.md) / [ECONOMY_SYSTEM.md](ECONOMY_SYSTEM.md) / [ONBOARDING.md](ONBOARDING.md)

---

## 0. 一句话定位

**灵境 · 双生**是一个手机优先的 AI 沉浸剧情游戏 + AI 角色陪伴 App：
- **游戏侧**：30 题材 × N 子类的小说世界（视觉小说式沉浸剧情）
- **陪伴侧**：AI 角色双界穿梭（小说世界 ↔ 心屿）
- **创作侧**：创作者中心（小说辅助模拟器 + 上架定价）
- **核心叙事**：一个角色，两种人生

---

## 1. 用户旅程（10 步全链）

```
[合规] 成年验证 + 知情同意 + 隐私政策
   ↓
[1] 进入主页（5 Tab 底部导航）
   ├─ 小说世界 — 浏览/选/入小说
   ├─ 心屿 — 我的 AI 角色
   ├─ 创作中心 — 仅作者可见
   ├─ 发现 — 角色/记忆/世界广场
   └─ 我的 — 背包/图鉴/钱包/订阅/隐私
   ↓
[2] 选故事（30 题材目录 + 4 维筛选）
   ↓
[3] 选角（6 入口：原著主角/原著角色/新角色/NPC/隐藏身份/观察者）
   ↓
[4] 进入小说世界（3D 场景 + 角色立绘）
   ↓
[5] 章节 / 选项（视觉小说式：黑底金边 + 打字机 + 悬浮选项 + 数值跳动）
   ├─ 自动存档（每作品 5 本地 + 5 云）
   ├─ CG 画廊（自动收录）
   └─ 命运卡（结局分享）
   ↓
[6] 共通线 → 分歧点（命运 5 类：HE/NE/BE/TE/hidden）
   ↓
[7] 个人线 + 养成（6 阶段亲密度 + 7 维关系 + 4 类互动）
   ↓
[8] 结局 + 命运卡 + 周目/存档/共享
   ↓
[9] 攻略成功 → "带 TA 走出小说"（3 重验证：亲密度 ≥ 80 + 个人线 + 灵晶 800-3000）
   ↓
[10] 双界穿梭：心屿（陪伴）↔ 小说世界（继续冒险）+ 周年纪念 + 留言
```

---

## 2. 12 个核心页面（UI_DESIGN_GUIDE §UI-06 完整版）

| # | 页面 | 文件 | 必含功能 | 状态 |
|---|---|---|---|---|
| 1 | **首页** | `product-preview.html` | 我的世界（最近游玩 3 卡 + 当前陪伴大卡 + 日签到）+ 推荐横滑 + 进入目录主按钮 + 进入陪伴次按钮 + **5 Tab 底部** + 顶栏（搜索/灵晶/头像） | v6.1 重做中 |
| 2 | **小说世界目录** | `library.html` / `catalog.html` | 22 主类 × N 子类 + 跨类标签 + 4 维筛选 + 3 列网格 + 封面卡规范 | ✅ v5.12 |
| 3 | **作品详情** | `redesign.html` 内嵌 | 封面 + 5 Tab（详情/人物/路线/攻略/评价）+ 评论区 | ⚠ 需独立成页 |
| 4 | **沉浸剧情阅读器** | `plot-runner.html` | 全屏场景 + 立绘 + 打字机 + 选项 + 数值跳动 + 5 段存档 + CG 画廊 + 命运卡 + 回溯/跳过已读/自动播放 | ✅ v5.13 |
| 5 | **心屿主页** | `heart-island.html` | 主角色大卡（7 维关系 + 6 阶段进度条）+ 双界穿梭 CTA + 我的角色 + 今日动态 + 共享记忆 | ✅ v6.1 |
| 5a | 心屿陪聊 | `chat.html` | 主区消息流 + 输入（文本/语音/表情/图片/共同活动）+ 顶部角色状态 + 右侧抽屉（日记/朋友圈/关系/记忆） | ⚠ 仅基础聊天 |
| 5b | 心屿记忆 | `memory.html` | 共享记忆时间线 + 情绪曲线 + 记忆宫殿 | ⚠ 时间线基础版 |
| 5c | 心屿我的 | `profile.html` | 个人主页 + AI 偏好 + 订阅 + 关于 | ✅ v5.20 |
| 6 | **角色详情** | （待建）`character-detail.html` | "进入 TA 的世界"+"带 TA 回到身边"+ 资格进度 + 共享记忆偏好 | ❌ 缺失 |
| 7 | **创作中心** | `creator-center.html` | 3 大功能区：小说辅助 + 我的作品 + 上架与定价 + 创建新世界 3 步 wizard | ✅ v5.18 |
| 7a | 创建新世界 | `creator-create.html` | 3 步 wizard：选路径 → 基础信息 → 确认 | ✅ v5.18 |
| 7b | 小说辅助模拟器 | `novel-ai-helper.html` | 6 张表（基础信息/世界格局/主线情节/章节细纲/人物小传/场景卡）+ AI 弹窗（28 字段）+ 12 类提问 + 6 维检测 + 伏笔台账 | ✅ v5.17 |
| 7c | 上架与定价 | `commerce.html` | 版权分层 L1-L4 + 22 收费点 + 收益分成 5 档 + 3 级改编授权 + 5 维质量审核 | ✅ v5.14 |
| 7d | 上传即生成 | `novel-upload.html` | TXT/MD/DOCX 上传 → 自动分章/抽角色/识场景/标高光 → 覆盖率审计 | ✅ v5.12 |
| 7e | 小说编辑 | `novel-edit.html` | 节点/角色/选项/实时预览 | ✅ v5.12 |
| 8 | **3D 世界** | `game-3d.html` | 3D 场景 + 9 题材 + WebGL + FPS 监控 + 3D 降级 ErrorBoundary → 2D 纸片人模式 | ✅ v5.11 |
| 9 | **沉浸剧情运行** | `plot-runner.html` | （同 #4 沉浸剧情阅读器） | ✅ v5.13 |
| 9a | 存档管理 | `plot-save.html` | 5 槽位存档 | ✅ v5.13 |
| 9b | 历史回放 | `plot-history.html` | 50 句对话列表 | ✅ v5.13 |
| 9c | 剧情设置 | `plot-settings.html` | 4 张设置 card | ✅ v5.13 |
| 9d | 场景选择 | `scene-select.html` | 9 场景选择 | ✅ v5.13 |
| 10 | **发现社区** | （待建）`discover.html` | 角色广场 / 记忆广场 / 世界广场 + 搜索 + 排序 + 收藏 + 举报 | ❌ 缺失 |
| 11 | **我的** | `me.html` | 头像 + 会员标识 + 余额 + 入口（背包/图鉴/订阅/钱包/交易记录/隐私/注销/安全/关于）+ 实名/年龄核验状态 + **账号区（当前登录方式 + 退出登录 · V20-F）** | ✅ v6.4.1 + V20-F |
| 11a | 启动页 | `product-preview.html` splash | 品牌 logo + slogan + 3s 加载条 + 进入灵境/跳过 | ✅ V20-C |
| 11b | 注册登录 | `product-preview.html` login | 手机/邮箱 tab + 微信/Apple/QQ/访客 4 快登 + 3 项协议勾选 + 18+ 拦截 | ✅ V20-C |
| 11c | 新手引导 | `product-preview.html` onb | 4 步 wizard（称呼/性别/年龄段/陪伴类型）+ 进度点 + 跳过/上一步/下一步 | ✅ V20-C |
| 11d | 退出登录 | `me.html` 账号区 | 当前登录方式展示 + 退出确认弹窗（dialog）+ 清登录态回启动页 + 可换账号 | ✅ V20-F |
| 12a | **公版库（真实语料）** | `corpus/books/*.txt` 40 本 + `corpus/manifest.json` | 25 中文（4 大名著 + 21 公版明清/子部，共 987 万字）+ 15 外文（Gutenberg 公版英文原版，共 284 万词），49.8MB 全文入库 | ✅ V20-H |
| 12b | **三国演义小说世界** | `sanguo-world.html` | 120 回卷制（卷一 1-10 免费 / 卷二-十二 20💎 / 全书券 128💎 省 42% / 阅读券 10 灵玉兑 1 张）+ 沉浸式阅读（夜色鎏金赤焰主题 / 衬体 17px / 阅读进度条 / 上下回 / 字号切换）+ 双轨道具（灵玉免费签到送 + 灵晶付费）+ localStorage 进度与钱包 | ✅ V20-H |
| 11e | 手机版全局锁定 | `css/mobile-lock.css`（31 页全量引入） | body max-width:480px 居中 + desktop 手机屏观感（阴影/边框）；杜绝任何页面铺满宽度的"网页版"布局 | ✅ V20-G |
| 11f | 法律阅读页 | `legal-view.html?doc=XXX` | 手机版壳（返回+标题）+ fetch docs/legal/*.md + 极简 md 渲染（h1-h3/列表/粗体/引用）；16 份法律文书统一入口 | ✅ V20-G |
| 11g | 全项目接口审查（V20-I） | `docs/AUDIT_2026-09-12.md` + `AUDIT-ISSUES_2026-09-12.md` | 32 页 + 29 JS 全量审查：链接/资源/fetch/参数/存储五维交叉比对 + 35 入口 230+ 点击动态审计；修复 4 项（commerce 渲染中断 / plot-runner 参数名 / 公版书错误跳转 / plot-detail 购买 404），登记 7 项遗留（O-1 通用引擎缺口等） | ✅ V20-I |
| 11h | 审查工具链 | `scripts/audit_links.py` + `audit_runtime.py` + `test_v20i_audit_fixes.py` | 静态扫描（链接/资源/键交叉）+ 动态运行时审计（pageerror/404/点击异常）+ 修复回归，可重复执行 | ✅ V20-I |
| 12c | **小说世界「卡片→详情→游玩」链路** | `plot-detail.html`（hero 介绍大图版） | 世界页瀑布流卡片 / banner 图书位 / 首页推荐卡点击 → 详细介绍页（封面大图 + 标题作者标签 + 数据 + 简介）；「▶ 游玩」→ 正式游戏：三国系（sanguoyanyi/pd2）→ sanguo-world，长夜城/深海回声 → plot-runner，其余 → 运行器「暂未接入」提示页；详情数据三级回退（内置 → world-data 卡片 → 占位，不再错误显示长夜城） | ✅ V20-J |
| 12d | **分类功能区全量扩充** | `world-data.js` + `world.js`（筛选页/排行榜） | 题材分类 10→16 一级（+科幻/悬疑灵异/游戏竞技/二次元/热血爽文/免费专区）/ 二级 38→88+（星际文明、本格推理、赘婿逆袭、乙女向等市面题材全覆盖）；筛选 5→6 维：状态（连载/完结/新书）+ 字数 8 档区间 + 价格 6 档（含免费/200+）+ **热门属性 10 种**（热血/爽文/重生/穿越/系统/无敌流/扮猪吃虎/治愈/群像，30 卡片全量标注）+ 年份（含 2023 及更早）；排序 2→8 种（灵韵/人气/收藏/评分/字数/更新/发布/评论）；排行榜 2→10 榜 Tab（人气/灵韵/新书/完本/收藏/热搜/更新/口碑/付费/免费，新书·完本·付费·免费榜为过滤型榜单） | ✅ V20-K |
| 12e | **全应用功能区对照补齐**（设计文档 V1.0） | 全 5 Tab + 游戏（24 项缺口全补，详见 `docs/PRD-v20.md` §V20-L） | **首页**：签到中心完整界面（7 天格子 + 看视频领灵晶 + 4 快捷入口）+ 陪伴动态→角色聊天 + 世界更新→世界详情；**世界**：排行榜 10→16 榜（+Fans/综合/同人/新晋完结/勤更/稀有卡）+ 卡片一句话简介 + 分类命名对齐（明星同人/完结）；**心屿**：创建角色→character-create + 故事区专属剧情入口 + 记忆查看/编辑/删除 + 聊天页 ?cid= 动态角色 + AI 主动开场 + 底部免责小字 + 首次完整免责弹窗 + 职业问答（13 职业）+ 敏感问题三通道引导（120/12348/12356）+ 双生[进入 TA 的世界]；**创作**：顶栏关闭+草稿箱 + 创建智能体/灵境工坊两大按钮 + 视频/图片/声音 3 按钮 + 动态/音色/灵念/Agent 4 更多创建 + 工作台 5 入口（编辑器/AI/收费点/封面/发布）；**我的**：创作数据区（作品/收益/提现，仅创作者可见）+ 侵权投诉 + 订阅权益说明；**游戏**：工具栏灵境标识 + 属性面板 6→9（+体魄/智谋/好感度）+ 地图建筑进子场景 + 地图人物互动菜单（对话/送礼/邀约/攻略） | ✅ V20-L |
| 12f | **「我的」功能区完整重做**（设计文档 V1.0） | `me.html`（七区块重构）+ 6 新页 `profile-edit` / `favorites` / `my-works` / `my-characters` / `my-worlds` / `my-cards` + `wallet.html`（6 Tab→8 Tab）+ `settings.html`（9→10 Tab）+ `commerce.html`（看板+三视图明细），详见 `docs/PRD-v20.md` §V20-M | **七区块**：个人信息（头像/ID/签名/实名状态/编辑资料）/ 资产三卡（灵晶·灵玉→钱包、收藏→收藏页）/ 我的内容四入口（作品·角色·世界·卡牌）/ 创作者中心（等级 L1-L5 进度 + 收益总览 4 格 + 看板 5 指标 + 提现，`lingjing_is_creator` 门控）/ 订阅与消费（计划+续费+升级/取消/历史+消费记录）/ 设置 10 Tab（+数据管理：导出 JSON/清缓存/记忆/对话历史）/ 法律帮助（法律 5 + 帮助 4 + 关于 4）+ 底部退出/注销（30 天后悔期弹窗）；**编辑资料** 9 项（头像/用户名/签名/性别/生日/所在地/手机/邮箱/实名）写 `lingjing_user_profile`；**钱包** 6 档充值（6/30/68/128/328/648）+ 消费记录 50 条 + 充值记录 + 灵玉获取 + 提现区（余额/申请/记录/规则）+ `#tab-N`/`#sub`/`#withdraw` hash 路由（含 hashchange）；**收藏页** 四 Tab（世界/角色/卡牌/动态）+ 筛选 + `<dialog>` 确认取消收藏；**我的作品** 4 状态 Tab；**我的角色** [创]/[双]角标+筛选；**我的世界** 进度条+继续游玩；**我的卡牌** 稀有度 5 档+来源筛选+详情（分享/设为背景写 `lingjing_v52x_profile_bg`）；**收益明细**三视图（作品/收费点/时间）+ CSV 导出（window.LJEarn 桥接） | ✅ V20-M |
| 12g | **「我的」Tab 按键实测审计** | `scripts/test_v20n_my_tab.py` + `docs/MY_TAB_AUDIT_2026-09-12.md` | 真点击测试：me.html 七区块 + 6 跳转入口 + profile-edit 9 字段 + 4 张子页（收藏/作品/角色/世界/卡牌）+ wallet 8 Tab 6 档 + settings 10 Tab + commerce `#earnings`/`#dashboard` 锚点。39 PASS / 0 FAIL / 0 PageError | ✅ V20-N |
| 12h | **三国演义·真人摄影风格小说世界** | `assets/scenes/sg_*.jpg`（24 张 · 13.8MB · 512×768 · SD majicMIX realisticv7）+ `sanguo-world.html` 视觉升级（574→658 行）+ `scripts/gen_sanguo_photoreal.py` + `scripts/test_v20q_sanguo_photoreal.py`（38/38 PASS） | Hero 横幅加卷一封面背景图 + 12 卷每卷左侧 54×72 真人摄影缩略图 + 12 关键回阅读页顶部 320×200 主图 + 「— 真人摄影 · AI 写实场景 —」角标；`SG_SCENES` 映射表 + `sgSceneUrl()` + `sgFallbackGradient()` 12 色 fallback；阅读流程、收费点（卷 20💎 / 全书券 128💎）、签到、阅读券、阅读进度 100% 保留。SD 批量生成 6.7s/张 · 总 160s | ✅ V20-Q |
| 12i | **通用实名门控** | `output/preview/js/realname-gate.js`（240 行通用组件） + `heart-island.html` 创建按钮 + `creator-center.html` 创建智能体 + `scripts/test_v20u_realname_gate.py`（20/20 PASS） | `window.LJRealname.gate(target)` 接口：已实名直跳；未实名弹 modal（姓名 2-20 字 / 身份证 18 位 / 港澳台居住证 / 护照 三选一 + 3 条注意事项 + 取消/提交）；校验失败 toast 提示；提交后写 `lingjing_v519_realname_done=true` + `lingjing_v519_realname_info` + tries++；每日 3 次上限；暗色模式 `prefers-color-scheme` 自适应。世界 Tab 小说卡片点击 → `plot-detail.html` 介绍页（V20-A 已实装，本轮验证 30 张卡片 href 全对） | ✅ V20-U |
| 12j | **通用小说世界引擎 MVP** | `output/preview/novel-game.html`（280 行 · letterboxed 古风视觉 · 独立页 · 上传即玩）+ `output/preview/js/novel-game-parser.js`（150 行 · 行内标注解析）+ `output/preview/js/novel-game.js`（320 行 · 控制器）+ `corpus/books/demo-taohuayuan.txt`（6 章示例）+ `scripts/test_v20v_novel_game.py`（26/26 PASS） | **行内标注 7 类**：`## 章名` / `### 场景：名` / `「角色」对话` / `{道具:name}` / `{人物:name}` / `[选项A|选项B]` / `【收费章节：N灵晶】`。**三模式**：upload（选择 txt）/ chapters（6 章卡片网格）/ stage（场景图 + 上卷轴对话框 + 下选项按钮 + hotzone 可点击）。**场景可点击**：道具/人物 hotzone → 抽屉交互（道具：🔍查看/放入背包/丢弃；人物：💬对话/🎁赠送/🚶离开）。**付费门控**：未付弹付费弹窗 → 扣灵晶 → 写 paidChaps → 再入不重复扣。**FAB**：🎒背包（实时物品）+ 💾存档（localStorage）。**货币**：💎灵晶 + 🟢灵玉（V20-Q 体系）。**货币铁律**：UI 中只准出现灵晶/灵玉，禁用田间记的丸子/铜钱 | ✅ V20-V |
| 12 | **钱包** | （待建）`wallet.html` | Tab：灵玉/灵晶/订阅/充值/交易记录/退款申请 | ❌ 缺失 |
| 13 | **设置 + 法律中心** | （待建）`settings.html` | 9 Tab：账号/安全/通知/隐私/显示/声音/AI 偏好/法律（15 份接入）/关于/注销 | ❌ 缺失 |

**状态统计**：
- ✅ 完成：11 页面
- ⚠ 基础版：3 页面（chat / memory / 作品详情嵌入）
- ❌ 缺失：4 页面（角色详情 / 发现社区 / 我的 / 钱包 / 设置法律）

---

## 3. 5 大关键体验（ONBOARDING.md §三）

| # | 体验 | 实现入口 |
|---|---|---|
| 1 | **代入感** | 选题材（30 主类 + 子类 + 跨类标签）→ 选角（6 入口）→ 进入 3D 世界 |
| 2 | **掌控感** | plot-runner 选项 + 多结局（5 类）+ 多周目存档（5 槽）+ 回溯 |
| 3 | **关系攻略** | 6 阶段亲密度 + 7 维关系（信任/亲密/熟悉/尊重/吸引/理解/共同历史） |
| 4 | **自由成长** | 心屿陪伴：聊天 / 朋友圈 / 日记 / 共同活动 / 早安晚安 / 主动关怀 |
| 5 | **收集 / 共享** | 命运卡 + CG 画廊 + 周目 + 共享记忆 + 收藏 + 评论 |

---

## 4. 30 题材库（product/06 / UI_DESIGN_GUIDE §UI-06.2）

22+ 主类 + 子类 + 跨类标签：玄幻 / 仙侠 / 武侠 / 奇幻 / 都市 / 现实 / 历史 / 军事 / 科幻 / 末日 / 悬疑 / 惊悚 / 现代言情 / 古代言情 / 幻想言情 / 青春校园 / 游戏 / 体育 / 无限流 / 轻小说 / 女性群像 / 多元情感 / 儿童文学 / 其他

每个题材：专属 icon + 专属主色 token（不要全用紫色）+ 封面图 + 题材 tag + 简述 + 作者标签 + 收费标识 + 当前可玩状态

---

## 5. 双界角色系统（DUAL_SOUL_SPEC）

### 5.1 CHAR-03 八层角色创建
1. 基础：姓名 / 性别 / 年龄（18-99，默认25+）/ 种族 / 身份
2. 外貌：脸型 / 发型 / 发色 / 瞳色 / 体型 / 服装 / 立绘（AI/上传/模板）
3. 人格：5 大 + 7 扩展 = **12 维度 0-100**（开放性/尽责性/外向性/宜人性/神经质 + 幽默/共情/独立/浪漫/支配/耐心/好奇）
4. 声音：音色 / 语速 / 语调 / 方言
5. 背景：身世 / 重要经历 / 当前目标 / 内心秘密 / 恐惧 / 渴望 / 信念
6. 关系：与用户关系 / 起始状态 / 发展速度
7. 能力：特长 / 弱点 / 技能列表
8. 归属：现实世界 / 小说世界 / 双界；来源：新建 / AI 一键 / 模板 / 小说导入

### 5.2 6 阶段亲密度（interaction_count 与 intimacy_score 独立）

| 互动次数 | 阶段 | 解锁 |
|---|---|---|
| 0 | 初识 | 基础聊天 |
| 50 | 熟悉 | 语音通话、日记 |
| 200 | 朋友 | 朋友圈、日常动态 |
| 500 | 亲密 | 专属剧情、主动关心 |
| 1000 | 知己 | 深度秘密、专属CG |
| 2000 | 灵魂伴侣 | 专属结局、双界穿越 |

### 5.3 7 维关系（trust/intimacy/familiarity/respect/attraction/understanding/shared_history）

每维 0-100，依赖 risk 独立监控（0.7 触发提醒）

### 5.4 4 类角色来源
- **用户自创**：天然属于用户，**免费**带出
- **小说 NPC**：需 3 重验证（亲密度 ≥ 80 + 个人线 + 800-3000 灵晶）
- **小说主角**：3000 灵晶
- **官方预设**：免费/订阅

### 5.5 6 类互动方式
- 文字聊天（免费 50 轮/日，订阅无限）
- 语音通话（免费 30 分钟/日，订阅无限）
- 视频通话（后期 3D 实时视频，订阅专属）
- 朋友圈（每日 1-3 条）
- 角色日记（每日 1 篇）
- 共同活动（看电影/听音乐/读书/散步/做饭/打游戏，每日 3 次）

### 5.6 5 类主动行为
早安/晚安 / 关心提醒 / 分享日常 / 纪念日提醒 / 主动邀请（**默认关闭**，用户授权开启）

### 5.7 DUAL-01~05 双界闭环
- DUAL-01：小说角色 → "带 TA 走出小说" → 陪伴 AI
- DUAL-02：共同记忆主动引用；小说选择影响后续态度
- DUAL-03：自创角色免费带出，NPC 三重验证 + 灵晶
- DUAL-04：已带出角色拥有完整陪伴功能
- DUAL-05：角色详情双按钮："进入 TA 的世界"+"带 TA 回到身边"

---

## 6. 商业化系统（v5.14 + v5.17 已降级为创作者内部）

### 6.1 三模式
- **会员订阅**：月卡 18 元（300 灵晶）/ 星卡 58 元（800 灵晶）/ 年付
- **增值商品**：身份包 / 属性丹 / 剧情包 / 外观（CG/服装/语音/称号）
- **创作者市场**：世界/角色/剧情/CG/语音 30%-70% 分润

### 6.2 22 种收费点 5 类
剧情锁 / 道具 / 卡牌 / 外观 / 功能性解锁

### 6.3 版权分层 L1-L4
L1 全 AI / L2 混合 / L3 主导 / L4 纯人

### 6.4 改编授权 3 级 × 5 类
A 全版权 60% / B 单品类 70% / C 自主 90%
影视 / 动漫 / 游戏 / 有声 / 海外

### 6.5 5 维质量审核 + 3 级审核流
角色一致性 / 语言指纹 / 伏笔状态 / 时间线 / 世界规则
S/A/B/C/D 等级

### 6.6 核心原则
- ❌ **不出售"必定被爱 / 必定成功 / 直接满级"**
- ✅ **付费只买"更好开局 / 更快成长 / 更多剧情 / 更美外观"**
- ✅ **生存免费 / 体验付费**

---

## 7. 创作者中心（CREATOR_SYSTEM）

### 7.1 三大入口
- 创建新世界（3 步 wizard）
- 小说辅助模拟器（6 表 + AI 弹窗 + 12 类提问 + 6 维检测）
- 上架与定价

### 7.2 6 张表单
1. **基础信息表**（7 字段）
2. **世界格局表**（7 字段）
3. **主线情节表**（6 字段）
4. **章节细纲表**（8 字段）
5. **人物小传**（核心 10 要素 + 语言指纹 5 要素）
6. **场景卡**（11 字段）+ 对话场景卡（7 字段）

### 7.3 AI 辅助
- 28 字段模板 + 2-5 候选动态生成
- 12 类提问模板（场景/角色/对话/情节 4 类）
- 6 维自动质量检测
- 伏笔台账（编号/埋设/回收/类型/重要度/状态）

### 7.4 导出系统 EXPORT-01~03
- TXT / MD / DOCX / EPUB
- 4 种导出用途：个人存档 / 外部发布 / 商业用途 / 商用
- 商用定价：非独家 500 / 独家 2000
- 商用服务费 15%

---

## 8. 21 张数据表（db.js v5.20）

| # | 表名 | 别名 | 来源版本 |
|---|---|---|---|
| 1-11 | novel_copyright_tiers / adaptation_licenses / adaptation_revenue_records / creator_monetization_points / creator_earnings / novel_quality_reports / novel_review_records / content_reports / tax_records / aml_monitoring / ai_helper_usage | - | v5.14 商业化 |
| 12 | novel_outline | outline | v5.17 |
| 13 | character_profiles | profile | v5.17 |
| 14 | scene_cards | scene | v5.17 |
| 15 | dialogue_cards | dialogue | v5.17 |
| 16 | ai_questions | question | v5.17 |
| 17 | foreshadowing_tracker | foreshadow | v5.17 |
| 18 | heart_island_characters | heartIsland | v5.20 |
| 19 | dual_soul_bringout_records | bringOut | v5.20 |
| 20 | daily_interactions | interaction | v5.20 |
| 21 | proactive_behaviors | proactive | v5.20 |

---

## 9. 设计系统 v6（design-system.css 1720 行 / 70+ 组件）

**10 个核心组件**：ds-shell / ds-empty-state / ds-stat-row / ds-search-input / ds-fab / ds-skeleton / ds-stepper / ds-segmented / ds-progress-linear / ds-tag

**心屿专属**：ds-protagonist-card / ds-pc-* / ds-stage-progress / ds-relationship-meter / ds-source-tag / ds-dual-portal-card / ds-mood-banner / ds-character-grid

**主页专属**：ds-pp-nav / ds-pp-hero / ds-pp-section / ds-pp-feature / ds-pp-genre-grid / ds-pp-footer / ds-pp-cta-banner

**动效**：ds-anim-shine / ds-anim-pulse / ds-anim-press / ds-hover-lift

**响应式**：ds-mh（移动 header）/ ds-bottom-tabs（5 Tab 移动底部）/ ds-icon-btn / ds-back-arrow

---

## 10. 8 大页面状态（UI_DESIGN_GUIDE §UI-07）

每个页面必须有：**加载 / 空态 / 错误 / 无权限 / 额度不足 / 未接服务 / 成功 / 离线恢复**

未声明视为缺口。

---

## 11. 6 大不做什么（铁律）

- ❌ **不出售"必定被爱 / 必定成功 / 直接满级"**
- ❌ **不主动推送骚扰消息**（关怀走用户授权 + 时区 + 静默时段控制）
- ❌ **不做心理健康诊断**（心理模型只用来提升理解，不做诊断结论）
- ❌ **不做"只有我爱你"**（避免迎合/操纵/替代现实关系）
- ❌ **不做违反公序良俗 / 涉未成年人 / 涉政治敏感**
- ❌ **不把 AI 输出"重新改写"成没失败过的命运**

---

## 12. 合规与法律（legal/ · v6.1.2 已拆分）

**23 份法律 / 合规文书**（详见 [`docs/LEGAL_INTEGRATION_PLAN.md`](LEGAL_INTEGRATION_PLAN.md)）按"读者是谁"拆分到 5 卷目录里：

### 12.1 通用法律（10 份）→ 附录·第五章 settings.html

| # | 文件 | 说明 |
|---|---|---|
| 1 | USER_AGREEMENT.md / TERMS_OF_SERVICE.md | 用户协议 |
| 2 | PRIVACY_POLICY.md | 隐私政策 |
| 3 | INFORMED_CONSENT.md | 知情同意 |
| 4 | MINOR_BAN_NOTICE.md | 未成年人禁入 |
| 5 | AI_DISCLAIMER.md / NOVEL_AI_DISCLAIMER.md | AI 免责声明 |
| 6 | ENTER_WORLD_RISK_NOTICE.md | 入世风险提示 |
| 7 | LINGJING_USER_GUIDE.md / EXPORT_USER_PROMPT.md | 用户指南 |
| 8 | COPYRIGHT_COMPLAINT_PROCESS.md（用户举报入口） | 侵权投诉流程 |
| 9 | 自伤援助与紧急资源 | 待建 |
| 10 | 注销协议 / 退款规则 / 社区公约 | 待建 |

### 12.2 创作者专属法律（13 份）→ 第三卷·第五章 creator-center.html#creator-legal

| # | 文件 | 说明 |
|---|---|---|
| 1 | AI_COPYRIGHT_NOTICE.md | AI 创作版权声明 |
| 2 | UPLOAD_THIRD_PARTY_NOTICE.md | 第三方素材上传声明 |
| 3 | EXPORT_COPYRIGHT_PAGE.md | 导出版权附页 |
| 4 | COPYRIGHT_CERTIFICATE.md | 版权证书模板 |
| 5 | DUAL_SOUL_CHARACTER_NOTICE.md | 双生角色告知 |
| 6 | 待建 · 著作权授权协议 | 作品版权归属 |
| 7 | 待建 · 改编授权协议 | 改编权益分配 |
| 8 | 待建 · 收益分成协议 | 双币种 / 订阅 / 抽成 |
| 9 | 待建 · 内容审核标准（创作者必读） | 5 维 6 级 |
| 10 | 待建 · 创作者实名认证规则 | 创作前必读 |
| 11 | 待建 · 创作者税务与发票 | 收入结算 |
| 12 | 待建 · 创作者侧投诉与申诉 | 维权流程 |
| 13 | LEGAL_INTEGRATION_PLAN.md | 法律接入总方案 |

### 12.3 主页 footer 法律链接收敛（v6.1.2 已执行）

| 修复前 | 修复后 |
|---|---|
| footer 堆 7 个文档链接（PRD / UI / CODEX / LEGAL / ...） | footer 只剩"站点目录 + 完整功能清单" 2 个文档链接 |
| 法律全部混在一起 | 法律按归属拆到两个卷次 |

### 12.4 站点目录（v6.1.2 立）

详见 [`docs/SITE_MAP.md`](SITE_MAP.md)：

```
📕 灵境 · 双生
├─ 【总章·灵境概览】主页
├─ 【第一卷·灵界万象】小说世界
├─ 【第二卷·心屿之约】陪伴
├─ 【第三卷·创世者手册】创作（含创作者法律指南章五）
├─ 【第四卷·寻幽探胜】发现
└─ 【附录·灵境法则】我的（含通用法律中心章五）
```

---

## 13. 已知缺口（按优先级登记）

> 2026-09-12 V20-I 审查更新：新增 O 系列缺口（详证据见 [AUDIT-ISSUES_2026-09-12.md](AUDIT-ISSUES_2026-09-12.md)）

| P | 缺口 | 说明 |
|---|---|---|
| **P1** | **O-1 通用小说世界引擎** | 作者上传小说（n_* ID）无法在 plot-runner 播放（NOVELS 硬编码 4 本）；plot-schema → 运行时场景树转换 + 即点即玩，v5.21+ 工作包（当前已显示「暂未接入」提示页，不再错误加载） |
| P0 | 角色详情页 character-detail.html | 双按钮（进入 TA 的世界 / 带 TA 回到身边）+ 资格进度 + **入站链接接入（O-4：plot-detail 同为孤儿页）** |
| P0 | 我的页 me.html | ~~5 入口 + 实名/年龄核验~~（v6.4.1 已建 · V20-F 加退出登录）→ 剩余：背包/图鉴入口补全 |
| P0 | 钱包页 wallet.html | 灵玉/灵晶/订阅/充值/交易记录/退款申请 6 Tab |
| P0 | 设置+法律中心 settings.html | 9 Tab 接入 18 份法律 |
| P1 | 发现页 discover.html | 角色广场/记忆广场/世界广场 + 排序 + 举报 |
| P1 | chat.html 扩展 | 输入栏加：语音/表情/图片/共同活动触发按钮 |
| P1 | memory.html 扩展 | 情绪曲线 + 记忆宫殿 |
| P1 | 主页 mobile-first | 顶部 nav + 5 Tab 底部 + 我的世界区 + 推荐横滑 |
| P2 | 主页接入真 LLM | 角色主动发消息 |
| P2 | 主动行为推送 | 早安/晚安/关心/分享/邀请 5 种（默认关） |
| P2 | O-2 redesign 存档无读取 | `ljss_save_v5_8` 写后无「继续游戏」路径（历史归档页） |
| P2 | O-3 创作者协议准入 | `creator_legal_ack` 键写后无入口校验（creator-create 提交前应检查） |
| P3 | O-5 plot-engine.js 死模块 | 826 行 v5.16 引擎无页面引用，待通用引擎立项时复活或删除 |
| P3 | O-6 归档页 demo_palace 死链 | games/redesign 历史横幅内（现落「暂未接入」提示页，可接受） |
| P3 | O-7 alert/confirm 整改 | 工具页 ~20 处原生弹窗违反铁律 #10，单列批量整改工作包 |
| P3 | 视频通话 | 3D 实时视频（订阅专属） |

---

## 14. 验收原则

1. **不漏功能**：任何实现必须对照本表 1-13 节
2. **all-in-one**：本文件是唯一权威，新增功能必须登记在本表
3. **不可砍功能**：未实现 ≠ 不显示，要在 UI 上明确告知"v5.21+ 即将开放"
4. **手机优先**：所有页面 mobile-first，5 Tab 底部导航
5. **设计系统统一**：所有页面调用 `css/design-system.css`，page-level ≤ 30 行
6. **`<dialog>` 优先**：替代 alert/confirm
7. **8 大状态齐全**：每个页面必须 8 状态声明

---

**任何代码/UI 改动必须先回到本表登记，再动手实现。**

v5.1 各规范为准；v5.6-v6.1 是增量登记。冲突时本表最终裁决。

---

## 15. V21.0 小说辅助模拟器（2026-09-13 登记）

> PRD：[PRD-v21-novel-sim.md](PRD-v21-novel-sim.md) · 开发计划：[DEV_PLAN-v21-novel-sim.md](DEV_PLAN-v21-novel-sim.md)
> 需求原文：sources/2026-09-13/S01（问卷式引导改造）+ S02（实现方案与界面设计，永不修改）
> 工作包：V21-A 数据中枢 / V21-B 引导问卷 / V21-C 大纲+章节规划 / V21-D 三栏创作台 / V21-E 入口+回归

### 15.1 新增功能清单

| ID | 功能 | 页面 | 说明 |
|---|---|---|---|
| NS-01 | 引导式创作问卷（3 必答 + 5 选答） | novel-ai-helper.html 引导模式 | 对话式分步；每问 chips + 🤖AI随机生成 + ✏️自由描述 + 跳过 |
| NS-02 | 创作简报摘要确认 | novel-ai-helper.html | "这就是我的故事" → 写入 lingjing_v521_novsim_v1.brief |
| NS-03 | 大纲编辑 + AI 候选 + 锁定 | novel-outline.html | 5 字段；每字段 AI 给 3-5 候选；确认后 🔒 锁定/解锁 |
| NS-04 | 章节规划（依大纲自动生成） | novel-outline.html | 章节目标/冲突/出场人物/关键事件/承接；增删改排序后锁定 |
| NS-05 | 三栏逐章创作台 | novel-writer.html | PC 20/55/25：章节列表+大纲+人物库+伏笔追踪 / 正文 / AI 辅助面板 |
| NS-06 | AI 辅助面板 | novel-writer.html 右栏 | 场景/对话/过渡/心理 4 类型；3-5 候选 + 使用/换一批/我来说 + 上下文引用 |
| NS-07 | 章节质量检查 | novel-writer.html | 5 维（大纲一致/人物一致/时间线/伏笔/衔接）+ 颜色标记 + 质量分 + 一键修复 |
| NS-08 | 数据中枢（镜像 S02 五表） | js/novel-sim-store.js | lingjing_v521_novsim_v1：brief/outline/chapter_plans/chapters/characters/foreshadows/ai_logs |
| NS-09 | AI mock + 真钩子 | js/novel-sim-ai.js | 本地 mock 生成器；window.AIHelper.generate 存在则优先（不接真 LLM） |

### 15.2 保留功能（不砍）

- novel-ai-helper.html **专家模式**：6 表 28 字段 + 12 类提问模板 + 6 维自动检测，
  以页签「引导模式（推荐）/专家模式」切换；专家模式 localStorage（lingjing_v514_*）不变，
  大纲页提供「从专家模式导入简报」兼容入口
- novel-edit.html（互动剧编辑器）用途不同，本轮不动

### 15.3 布局豁免登记

`novel-writer.html` 为工作台类页面：PC 视口（≥1024px）解除 mobile-lock 480px
锁定以实现用户指定的三栏 20/55/25；≤900px 回归堆叠（左栏横滚 + 右栏底部弹出面板）。
问卷页与大纲页保持全手机锁定。豁免依据：V21 需求 S02 "PC端主编辑器（三栏布局）"。

### 15.4 实名门控

创作 Tab 内 novel-ai-helper / novel-outline / novel-writer 入口一律
`window.LJRealname.gate()`（V20-U 铁律：未实名不得直入创作类功能）。

---

## 16. V22-1 真机就绪冲刺：子页 Tab 统一 + 死胡同修复（2026-09-13 登记）

> 背景：全站 40 页 390×844 真机审计（`scripts/audit_mobile_ready.py`，独立端口 8793）。
> 审计结论：40 页 blocking=0；豁免 3 页（novel-game / sanguo-world 为并行开发线，redesign 为 v5.9 归档孤儿 0 引用）。
> chat 页 tabbar label 在 Playwright is_mobile 截图中偏移为截图 artifact（DOM 几何 bottom=844 贴底、
> lblRect 818-836 视口内、桌面模式对照图 label 完整），真机无碍。

| ID | 变更 | 涉及文件 | 说明 |
|---|---|---|---|
| MR-01 | 8 子页底栏统一为 tabbar.js 规范 | character-create / character-detail / chat / discover / memory / profile / settings / wallet .html | 删旧 `<nav class="ds-bottom-tabs">`，接 tabbar.js 自动挂载 + active 推断 |
| MR-02 | tabbar 零破坏嵌入样式 | css/tabbar-embed.css（新） | 自包含 .tabbar 样式 + body padding-bottom 占位；不引整套 shell-v64.css 避免全局 reset 破坏子页 |
| MR-03 | catalog 归沉浸页豁免 | catalog.html | 只删旧 nav（铁律 #4：沉浸页不挂 5 Tab）；header 加移动端 [← 返回 library] 按钮 |
| MR-04 | legal-view 无参访问目录化 | legal-view.html | 无 ?doc= 参数时渲染 16 法律文档目录（原为死胡同）；fetch 失败态加 [← 返回目录] |
| MR-05 | 真机审计脚本 | scripts/audit_mobile_ready.py（新） | 40 页 × (pageerror/console.error/≥400/mobile-lock/空白页/tabbar 存在/返回元素)；自起 8793 隔离并行线 |
| MR-06 | 测试端口可覆盖 | scripts/test_v21_novel_sim.py | LJ_TEST_PORT 环境变量（默认 8767 不变）；并行会话改根时用 8794 隔离 |

配套开发工具：`scripts/apply_tabbar_embed.py`（幂等批处理：删旧 nav + 插 link/script，已执行完毕留档）。
