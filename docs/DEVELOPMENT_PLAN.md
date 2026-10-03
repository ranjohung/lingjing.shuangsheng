> V7 统一需求与执行顺序见：[PRD-V7-CONSOLIDATED.md](PRD-V7-CONSOLIDATED.md)、[DEV_PLAN-V7-CONSOLIDATED.md](DEV_PLAN-V7-CONSOLIDATED.md)、[REQUIREMENTS_COVERAGE_V7.md](REQUIREMENTS_COVERAGE_V7.md)。

> 现行小说世界规格：[NOVEL_WORLD_CURRENT.md](NOVEL_WORLD_CURRENT.md)。已移除冲突的滚动阅读及货币禁用条款；历史完成记录不等于最新验收。

# 灵境 · 双生 — 开发计划 v5.1 + v5.6~v5.20 增量登记

> **当前最新版本**：v5.20（心屿陪伴功能区 · 官方命名落地）/ v5.19（知己 AI 陪伴功能区重建）/ v5.18（创作者中心设计系统重构）/ v5.17（商业化降级 + 小说辅助模拟器）/ v5.16（UX 修复）/ v5.15（代码审查）/ v5.14（商业化 4 大系统）/ v5.13（沉浸剧情 UI）/ v5.12（30 题材库）
>
> **🔵 V17.0 草案（2026-09-11）— 待用户审阅**：
>
> 6 个工作包（V17-A 全局底部 5 Tab / V17-B 世界功能区 / V17-C 心屿功能区 / V17-D 启动签到 / V17-E 数据表 / V17-F 回归测试），总计 ~5430 行代码 / 5 轮工作量。
>
> 详见 **[DEV_PLAN-v17.md](DEV_PLAN-v17.md)** + 配套 **[PRD-v17.md](PRD-v17.md)** + 原始需求 [sources/2026-09-11/S01](sources/2026-09-11/S01-v17-world-and-xinyu-redesign.txt)。
>
> 用户审阅 DEV_PLAN-v17 §11 的 Q1-Q10 后启动 V17-A~F；当前 DEVELOPMENT_PLAN.md 仅做指向，不替代既有 v5.20 内容。
>
> **v17.0 与 v5.20 的关系**：v17.0 是世界功能区 + 心屿功能区的全局重构（底部 5 Tab 整合 + 启动签到 + 角色来源角标 + 职业问答能力），规模显著大于 v5.20 的命名升级。
>
> **v5.20 关键变更**：
> - 4 张新数据表：`heart_island_characters` / `dual_soul_bringout_records` / `daily_interactions` / `proactive_behaviors`（17 → 21 张）
> - 4 页面正式以 **「心屿」** 命名：heart-island.html / chat.html / memory.html / profile.html
> - 设计系统组件骨架待新增：`ds-character-card`（角色大卡）/ `ds-relationship-meter`（7 维关系仪表）/ `ds-stage-progress`（6 阶段进度条）
> - 待新建页面：`character-create.html`（7 步角色创建 wizard）/ `character-detail.html`（角色详情 + 关系养成）
> - 双界穿梭：从心屿进入小说世界 / 从小说带角色回家
>
> **v5.19 关键变更**：
> - 4 个新页面：`companion.html` / `chat.html` / `memory.html` / `profile.html`
> - 设计系统扩展：`ds-mh` / `ds-bottom-tabs` / `ds-bottom-tab` / `ds-icon-btn`（1209 行总）
> - 修复 P0：library.html mobile 视图顶部 nav `hidden md:flex` 导致 AI 陪伴入口消失
>
> **v5.18 关键变更**：
> - 新建 `css/design-system.css`（710 行，含 25+ 组件 token）
> - 创作者中心整体重构：3 大功能区 + 0 重复入口 + ds-page-header 统一顶部
>
> **v5.17 关键变更**：
> - 商业化从顶级功能区降级为创作者中心内部按键
> - 新增小说辅助模拟器（28字段+12类提问+6维检测）
> - 数据表 11 → 17 张
>
> **配套文档**：[PRD.md](PRD.md) / [ONBOARDING.md](ONBOARDING.md) / [READING_GUIDE.md](READING_GUIDE.md) / [AUDIT_2026-09-10.md](AUDIT_2026-09-10.md) / [CREATOR_SYSTEM.md](CREATOR_SYSTEM.md)

---

## 2026-09-13 新增计划：v5.21 小说辅助模拟器增强与创作界面优化

> **本批开发计划旨在实现 PRD v5.21 中定义的小说辅助模拟器增强和创作界面优化，重点在于提升用户体验和创作效率。**

### 工作包列表

| ID | 工作包 | 交付物 | 验收/状态 |
| --- | --- | --- | --- |
| **B13-F01** | 前端：对话式引导框架 | `novel-ai-helper.html` 重构，实现分步向导和聊天式交互框架 | 待开发 |
| **B13-F02** | 前端：核心问题 UI/UX | 实现题材、主角、冲突 3 个核心问题的交互界面，包括选项、自由输入框、AI随机生成按钮 | 待开发 |
| **B13-F03** | 前端：深度定制模块 UI/UX | 实现世界观、配角、关系网络等深度定制模块的交互界面，支持随机生成和自由描述 | 待开发 |
| **B13-F04** | 前端：AI 辅助面板集成 | 在右侧辅助区实现 AI 辅助面板，展示 3-5 个候选答案，支持 [使用]、[换一批]、[我来说] 交互 | 待开发 |
| **B13-F05** | 前端：三栏布局实现 | `creator-center.html` 和 `novel-ai-helper.html` 调整为三栏布局，并实现章节列表、大纲、人物库、伏笔追踪等模块骨架 | 待开发 |
| **B13-F06** | 前端：摘要展示与创作简报 UI | 实现第一层问题回答后的摘要展示，以及最终的“创作简报”页面 | 待开发 |
| **B13-B01** | 后端：AI 生成逻辑优化 | 优化 `js/ai-question.js` 和 `js/novel-outline.js` 等模块，支持生成 3-5 个高质量候选答案 | 待开发 |
| **B13-B02** | 后端：对话式引导逻辑 | 实现系统逐个提问、反馈确认、提供建议的后端逻辑，与前端对话式界面配合 | 待开发 |
| **B13-B03** | 后端：创作简报生成逻辑 | 实现根据用户输入和 AI 生成内容，自动汇总生成“创作简报”的逻辑 | 待开发 |
| **B13-T01** | 测试：功能与体验测试 | 对 v5.21 所有新增和修改功能进行单元测试、集成测试和用户体验测试 | 待开发 |
| **B13-D01** | 文档同步 | PRD/DEVELOPMENT_PLAN/CREATOR_SYSTEM/产品预览 v5.21 增量登记 | 待开发 |

### 预计交付时间线

- **第一周**：完成 B13-F01、B13-F02 的前端界面开发。
- **第二周**：完成 B13-F03、B13-B01 的开发，并开始集成。
- **第三周**：完成 B13-F04、B13-F05、B13-B02 的开发。
- **第四周**：完成 B13-F06、B13-B03、B13-T01 的开发和测试，完成 B13-D01 文档更新。

### 模块依赖关系更新

```
novel-ai-helper.html (小说辅助模拟器)
   ├── js/novel-outline.js (28 字段模板 + AI 生成) ← 强化为对话式引导
   ├── js/character-profile.js (10 要素 + 语言指纹) ← 强化为对话式引导
   ├── js/scene-card.js (场景卡 + 对话卡) ← 强化为对话式引导
   ├── js/ai-question.js (12 类提问模板) ← 强化 AI 候选和交互
   ├── js/foreshadowing.js (伏笔台账)
   ├── js/quality-auto.js (6 维度自动检测)
   └── js/creation-briefing.js (新增：生成创作简报)
```

## 与 v5.17/v5.20 的兼容

- 现有“小说辅助模拟器”的底层数据结构和字段保持兼容，UI 和交互层进行升级。
- “心屿 · 陪伴功能区” (v5.20) 保持不变。

> **互斥/保守原则**：所有 v5.21 功能**不接真 LLM**（规则引擎+模板库 mock，保留 `window.AIHelper`/`window.LLMJudge` 钩子）；**不接真支付/提现**；**不抽卡/不卖确定性胜利**。所有金额以灵晶为单位计算。客户（玩家）永远看不到商业化界面。

## 2026-09-09 新增计划：资料收齐后的实施计划

正式品牌：灵境 · 双生 / Lingjing · Dual Souls。用户本次明确全部聊天记录已提供，资料接收阶段结束。当前交付是完整需求与开发计划整合；下列实现工作包仍待启动，桌面SD/Blender已打开不等于模型资产已交付。

新增范围详见[本批覆盖矩阵](UPDATE_2026-09-09.md)。保留原N01–N08成果、未完成项、全部功能和技术架构。旧周数是历史基线，不代表本轮新增全部功能仍能十周完成。资料已收齐；执行顺序以本节B0–B11依赖为准，日历排期依据实际产能估算。

| 工作包 | 需求 | 依赖与交付 | 验收/状态 |
| --- | --- | --- | --- |
| B0 需求冻结与契约 | BRAND-01/DATA-01/PLAN-01/IMPL-01 | B0 段步骤按 [NEXTJS_DEV_GUIDE §B0](NEXTJS_DEV_GUIDE.md)；全部文件接收→冲突统一→品牌替换清单、角色/章节/账本映射、API及迁移设计 | 资料接收与文档整合完成；剩余商业规则按登记定版，代码未开始 |
| B1 全框架与目录 | UI-01~04/UI-05~07/CONTENT-02 | B0 + [UI_DESIGN_GUIDE](UI_DESIGN_GUIDE.md)；设计令牌 / 12 个核心页面骨架 / 22 题材目录 / 全部状态组件 / 法律入口；原创设计规范 | 桌面/移动可导航、筛选空态正确、不用假内容显示可玩；所有页面状态有清单 |
| B2 世界核心 | WOS-01~08/DATA-01 | [NEXTJS_DEV_GUIDE §B2](NEXTJS_DEV_GUIDE.md) + 既有认证/持久化基建；World Bible/规则/地图势力/时间/离线日报/NPC目标日程/LOD | 世界规则冲突、三时间模式、5NPC决策、预算缓存；对应WS1/WS2 |
| B3 世界行动与剧情 | WOS-09~13 | [NEXTJS_DEV_GUIDE §B3](NEXTJS_DEV_GUIDE.md) + 已有STORY引擎；行动解析/概率/事件/因果/叙事引力/角色线/命运/时间线 | 三步可追溯因果、幂等、跨分支隔离、全部结局可达、离线主线推进；WS3/4/5/7 |
| B4 小说生成同步 | NOV-01~04/WOS-14 | [NEXTJS_DEV_GUIDE §B4](NEXTJS_DEV_GUIDE.md)；两创作模式、Bible/卷章场景纲、伏笔、十维质量、事件日志和五种文风 | 事件→章节→人工修改→新分支，旧线可恢复；无OOC重大冲突发布；WS6/8 |
| B5 角色陪伴与内容 | CHAR-03/COMP-01~04/CONTENT-02 | [NEXTJS_DEV_GUIDE §B5](NEXTJS_DEV_GUIDE.md) + Character/Memory/Relationship/Emotion；八层创建、语音、日记、朋友圈、共同活动、关怀 | 字段重载、关系防刷、日期/时区/通知开关、语音失败回到文字；13候选与模板/角色包分批内容验收 |
| B6 双界闭环 | DUAL-01~05 | [NEXTJS_DEV_GUIDE §B6](NEXTJS_DEV_GUIDE.md)；来源实例、带出条件、共享记忆、两个切换按钮、动画 | ≥80边界按定版、个人线/付款原子性、重复不扣、共享撤销、跨用户隔离 |
| B7 创作者工作台 | CREATE-02~06/WOS-15 | [NEXTJS_DEV_GUIDE §B7](NEXTJS_DEV_GUIDE.md)；上传解析预览、三栏编辑、全部校正、质量修复、自动保存/Diff/回滚/分支、定时审核发布 | 四格式导入、人工确认、错误恢复、版本追溯、举报/申诉；后期迁移格式列独立任务 |
| B8 经济体系 | ECON-01~08/ECON-BIBLE-01 | [NEXTJS_DEV_GUIDE §B8](NEXTJS_DEV_GUIDE.md) + [ECONOMY_SYSTEM.md](../ECONOMY_SYSTEM.md) + [ECONOMY_BIBLE](../ECONOMY_BIBLE.md)；双币批次、签到、全部商品/权益、订阅年付、抽卡广告、创作者账本看板；11 张经济表 DDL + 8 API schema + B8 上线闸门 | 余额/回调/退款/永久权益/到期/折扣/价格版本全链路；随机玩法和提现另过上线闸门 |
| B9 导出与商业服务 | EXPORT-01~03 | [NEXTJS_DEV_GUIDE §B9](NEXTJS_DEV_GUIDE.md) + 草稿核验；TXT/MD/DOCX/EPUB及PDF候选、版式/目录/版权附页、用途配额/导出/授权记录 | 中文文件可打开、内容/目录一致、失败返还、用途报价无歧义、下载隔离 |
| B10 视觉和3D | ASSET-01~05/UI-03/WOS-14 | [NEXTJS_DEV_GUIDE §B10](NEXTJS_DEV_GUIDE.md) + [ASSET_PRODUCTION_GUIDE](ASSET_PRODUCTION_GUIDE.md) 双向引用；SD人物/表情/服装/场景/CG→Blender模型材质绑定动作LOD→场景总线 | 源文件、模型、授权元数据、角色一致性、动作穿模、目标设备性能与2D降级；WS9，后期3D视频 |
| B11 法律和发布 | LEGAL-01~15/SAFE/OPS | [NEXTJS_DEV_GUIDE §B11](NEXTJS_DEV_GUIDE.md)；接入前核验主体/法规/热线/权利/退款；所有业务完成后全量发布验收 | 15文案链接/确认记录/变量/价格一致、隐私删除、投诉、实名安全；未核验不宣告上线 |

B6付费正式启用依赖B8已验收，B9商业收费依赖规则与法律核验；B11资料核验可与开发准备同步但最终验收在业务之后。世界、小说、陪伴沿用一个身份/记忆/关系体系，不重复造基础引擎。

### 开发交接顺序与退出条件

最终附件的七项缺口与九Sprint详细证据见 [工程交接契约](backend/26-world-os-engineering-contract.md)；[九表DDL参考](backend/27-world-os-source-ddl.md)仅供迁移设计，不是已执行SQL。

1. B0先交付数据实体/租户/时间线映射、API与版本契约；既有N05–N08缺口继续保留。不用重新初始化替代已有代码。
2. B1建导航/目录与设计规范；B2按WS1→WS2实现世界和NPC，随后B3按WS3→WS4→WS5构建事件、路线与存档。原WS7行动解析契约需在WS3前准备，WS7完整前端入世流程随后联调，避免依赖倒置。
3. B4按WS6生成小说；B7编辑能力就绪后完成WS8双向同步；B5陪伴与B6双界按稳定角色实例和账本接口集成。
4. B8商业化分为账本/权益基础、订阅充值、商品与抽卡、广告、创作者分成、后续交易提现。基础账本先供B6沙箱使用，冲突价格或权益仅以配置候选保存；未定版项目不影响无争议免费体验。
5. B9导出与B10/WS9视觉模型集成分别依赖编辑版本/资产规范；B11完成全流程发布核验。15份法律文案创建不是接入验收。

每一步提供实现文件、数据库迁移/回滚、正反例测试、接口结果、必要录屏或资产证据；对应退出条件未通过不标完成。世界子系统原估16周、经济两套旧周数、全产品旧32周属于不同范围，不能相加或宣称同一交付承诺。主计划以工作包依赖为准，正式起始日期在实现启动时记录。

### 原九个World Sprint完整保留（估算总16周，不与主计划直接相加）

| 原Sprint | 原估时 | 对应包 | 原验收目标 |
| --- | --- | --- | --- |
| WS1 World Core | 2周 | B2 | 一句话世界DNA30秒；≥5类规则冲突检测；三时间模式 |
| WS2 Character Simulation | 2周 | B2 | 5NPC每小时≥1决策；子目标随状态调整 |
| WS3 Event | 2周 | B3 | A→B→C三步因果及源头追溯 |
| WS4 Story | 2周 | B3 | 无玩家行动主线仍推进；第10次有效互动触发入门专属事件，完整个人线和带出单独判定 |
| WS5 Timeline | 1周 | B3 | 关键点存档，≥2平行分支，恢复 |
| WS6 Novel | 2周 | B4 | 1小时游玩≥1章；检测OOC/逻辑问题<3/章原观察指标 |
| WS7 Live Your Novel | 2周 | B3 | 选角入世<3分钟，各类自由输入有合法响应 |
| WS8 Novel Sync | 1周 | B4/B7 | 世界变化→小说；小说编辑→新世界分支 |
| WS9 3D | 2周 | B10 | 世界状态驱动场景、角色动作及同步 |

### 原经济排期全部留档，统一由B8及依赖控制

S03候选：第1–2周签到/月卡/充值；3–4周星卡/年付/抽卡；5–8周场景/皮肤/创作者；9–12周卡牌交易/提现。
S04候选：第1–8周签到/月卡P0、充值/抽卡P1、广告P2；第9–16周星卡/年付P0、皮肤/创作者P1、交易P2；第17–24周提现P0、IP合作P1、高级分析P2。
两套不是同时承诺；执行时按工作包依赖排期。创作者提现、卡牌交易、授权IP、React Native、多语言、海外、3D视频、记忆图谱/加密全部保留后续范围，未实现不勾选。

### 本批文档验收与后续验收区别

本批检查：7份源文件完整保存、S05/S06/S07哈希相同、15法律原稿完整拆分、PRD有全范围链接、计划覆盖全部新增ID、相对链接存在。只证明文档整理，不证明功能运行。后续每工作包给实现路径、实际测试、资产/画面证据和剩余缺口；基础安全/真实认证/存储/免费完整体验仍是发布闸门。

以下为保留的v4.1历史开发队列与证据，不得覆盖本节等待状态或据旧周数自动推进。

更新2026-09-08；按[PRD](./PRD.md)逐项交付。新排期替代旧Phase0–19编号，十周是目标，外部依赖和内容创作影响排期。

## 当前审计与执行原则
已有：Next.js导航/伙伴/记忆/聊天页面、FastAPI路由、规则回复、进程内角色记忆关系、成本熔断。实际缺口：JWT仍返回固定开发用户，数据库未接通，需求中的完整故事模块原本不存在。不能宣布已完成MVP。外部账户不阻止先开发规则引擎和接口；未通过的发布闸门继续保留。

状态只用待开发/开发实现/已测试/外部待接/发布验收通过；每项必须给文件和测试证据。

## Phase 0–1：MVP，第1–10周
| 周次 | 工作包（按顺序） | 完成标准 |
| --- | --- | --- |
| 1–2 | AUTH-01~04、OPS-01、COST-01：工程、数据库迁移、认证实名成年门槛、同意、冻结、配置预算 | 真JWT/实名沙箱成功及失败；未验证账户不能调用业务；PG/Redis/迁移/CI证据 |
| 3–4 | CHAR-01~02、CHAT-01~03、MEM-01~02、REL-01~02、EMO-01、SAFE-02 | 2D建角、真流式、重说回溯评价、记忆产品化、里程碑、时长提醒实际联调 |
| 5 | STORY-01~05、08：故事内容契约、身份、状态与路线 | 一个端到端开发切片；作者规则合法性、并发/隔离/回溯测试 |
| 6 | STORY-06~09：持久化存档、多结局、AI补充 | Alembic升级回滚；跨重启恢复；每结局可达、重试幂等、旧版本存档兼容 |
| 7 | 三部内容与阅读器、SHARE-01~02 | 吕布30/6、达西28/6、岳飞26/5；每条路径合格、内容审阅、图片和权限 |
| 8–10 | SAFE-01~05、OPS-01：四级安全、干预、制度、备案评估、部署看板、全量回归 | PRD发布闸门全部有证据；未接服务不得宣告合规或上线 |

## 当前逐项开发队列
- [x] N01 文档来源裁决、需求补齐与旧规范冲突消除。
- [x] N02 （吕布开发切片，非全作品验收）故事定义、六章分路、玩家状态、身份槽位、结局裁决与规则验证。
- [x] N03 （开发身份）开发API、原著/自建身份、选择revision校验、回溯、命运卡、用户隔离。
- [x] N04 故事库与2D阅读页面、状态/路线/日志、继续/回溯/新周目。
- [ ] N05 作者内容：先吕布完整开发故事；再达西和岳飞正式故事；不能用卡片占位算完成。
- [ ] N06 PostgreSQL/SQLAlchemy/Alembic替换内存存档；事务、幂等键、存档槽、版本升级。
- [ ] N07 实名/JWT/安全审核、AI润色、立绘与图片分享接入，完成主链路E2E。
- [ ] N08 对照全部PRD补齐剩余MVP项，正式发布闸门逐项核验。

该队列是补缺的依赖顺序；叙事开发切片不代表前面认证/基础设施已验收。每次完成后在[进度记录](./IMPLEMENTATION_STATUS.md)记录证据与下一项。

## Phase 2：内容与生态，第11–18周
第11–14周：CONTENT-01新增隋唐/呼啸/老残/德古拉/水浒5部；每作25+点、5–8结局、评价系统。第15–18周：UGC-01~02角色广场、记忆广场、创作者等级分润；MEM-03~04编辑锁定卡牌、CHAT-04、WORLD-01原创世界生成器及完整关系功能。版权、审核、举报流程随发布一起验收。

## Phase 3：付费与增长，第19–24周
第19–21周：BILL-01微信/支付宝、订阅积分及退款/取消/验签；余下5部正式上线后总计13部。第22–24周：GROWTH-01推荐、分享归因、增长活动；审核权益和数据可删除性。价格Free0/Plus68/Pro168/Creator98元及Credits为原记录候选，配置并核算成本后启用，不硬编码承诺。

## Phase 4：深度叙事，第25–32周
第25–28周：CREATE-01原创上传、可视化章节/节点/路线/条件编辑器。第29–32周：DEEP-01蝴蝶效应因果链、命运报告、社区共创。多结局基础能力已在MVP，不得再次后置。

## Phase 5+：持续扩展
React Native移动端、多语言、语音、世界日程/离线演进（无主动推送）、3D可选、AI Director、授权IP、记忆图谱/加密、海外合规。保留原愿景但以当前核心体验和留存证据排优先级。

---

## v5.17 工作包：商业化降级 + 小说辅助模拟器（依据用户最新反馈）

### 核心反馈（用户原文）
> "商业化这个单独一个功能区合适吗？客户打开软件是为了玩游戏体验陪伴功能，这个商业化功能区只对作者有关系应该放到创作者中心功能区里以一个功能按键体现，点击这个按键是这个商业化详细介绍，名字改个作者以看就知道是什么的，里面除了作品要求和分成产权等还应该有作者可以做什么，比如上架小说设置于自己收入有关的收费点道具等及设置区间，这个给过你文档了，创建新世界点击进去应该是作者选择自己写的或者ai辅助生成小说和设置收费点作品审核等等内容具体你查看文档有详细介绍，除了创建新世界还应该有小说辅助模拟器（名字你起个有水平一看就知道作用的）功能按键，点击后是..."

### 工作包列表

| ID | 工作包 | 交付物 | 验收/状态 |
| --- | --- | --- | --- |
| **B12-W01** | 商业化降级 | commerce.html 改为 creator-center.html 内部子页；library.html 主导航加"创作者中心"按钮 | v5.17 ✅ |
| **B12-W02** | 创作者中心主页 | creator-center.html 3 大核心按键（创建新世界/小说辅助模拟器/上架与定价）+ 数据看板 | v5.17 ✅ |
| **B12-W03** | 创建新世界三入口 | creator-create.html（🤖 AI 辅助/✍️ 自己写/📤 上传 TXT） | v5.17 ✅ |
| **B12-W04** | 小说辅助模拟器 | novel-ai-helper.html 6 张表 Tab + AI 弹窗 + 12 类提问入口 + 自动质量检测 | v5.17 ✅ |
| **B12-W05** | db.js 扩展到 17 张表 | novel_outline / character_profiles / scene_cards / dialogue_cards / ai_questions / foreshadowing_tracker | v5.17 ✅ |
| **B12-W06** | 6 个新 JS 模块 | novel-outline.js / character-profile.js / scene-card.js / ai-question.js / foreshadowing.js / quality-auto.js | v5.17 ✅ |
| **B12-W07** | 文档同步 | PRD/DEVELOPMENT_PLAN/CREATOR_SYSTEM/产品预览 v5.17 增量登记 | v5.17 ✅ |

### 商业化降级对比

| 维度 | v5.14 错误做法 | v5.17 正确做法 |
| --- | --- | --- |
| 入口位置 | 顶级独立页（与小说世界/陪伴/创作中心并列） | 创作者中心内部按键 |
| 客户可见性 | ❌ 客户可见 | ✓ 仅作者可见 |
| 文件路径 | commerce.html 作为顶级页 | creator-center.html → commerce.html |
| 名称 | "商业化设置"（晦涩） | "上架与定价"（作者一眼看懂） |

### 小说辅助模拟器核心交付

```
novel-ai-helper.html (核心新增)
├── 6 张表 Tab
│    ├── 基础信息表 (7 字段)
│    ├── 世界格局表 (7 字段)
│    ├── 主线情节表 (6 字段)
│    ├── 章节细纲表 (8 字段)
│    ├── 人物小传 (核心10 + 语言指纹5)
│    └── 场景对话 (场景卡12 + 对话卡7)
├── 🤖 AI 弹窗（每个字段都有）
│    ├── 2-5 选项动态控制
│    ├── 换一批
│    └── 我来说（自由输入）
├── AI 格外提问（12 类模板）
│    ├── 场景类 3（描写/过渡/氛围）
│    ├── 角色类 4（出场/内心/成长/关系）
│    ├── 对话类 3（重写/设计/金句）
│    └── 情节类 4（转折/伏笔/升级/节奏）
└── 自动质量检测报告
     ├── 6 维度（角色一致性/语言指纹/伏笔状态/时间线/世界规则/场景完整度）
     ├── pass / warn / fail + 具体位置 + 修复建议
     └── 数据看板
```

### 与 v5.14 数据迁移

| 旧 key | 新 key | 说明 |
| --- | --- | --- |
| `lingjing_v514_*` | `lingjing_v517_*` | 自动迁移；旧数据保留，访问 fallback 到新 key |
| `window.DB.copyright` | `window.DB.copyright` | 不变（别名保留） |
| `window.DB.monetization` | `window.DB.monetization` | 不变 |
| `window.DB.aiUsage` | `window.DB.aiUsage` | 不变 |
| 新增 | `window.DB.outline` | 大纲要素表 |
| 新增 | `window.DB.profile` | 人物小传 |
| 新增 | `window.DB.scene` | 场景卡 |
| 新增 | `window.DB.dialogue` | 对话卡 |
| 新增 | `window.DB.question` | AI 提问 |
| 新增 | `window.DB.foreshadow` | 伏笔台账 |

### 不接真 LLM 原则

所有 v5.17 AI 功能**不接真 LLM**：
- 28 字段模板 + 6 人物模板 + 6 场景模板 + 12 提问模板 = 规则引擎 + 模板库 mock
- 保留 `window.AIHelper` / `window.LLMJudge` 钩子供日后接真 LLM
- 选项数量动态控制（≤5→2-3；5-20→3-4；>20→4-5）

---

## 2026-09-10 新增计划：v5.6 ~ v5.15 6 大阶段实施记录

> **本批针对"30 题材库 + 自动游戏化 + 沉浸剧情对话 UI + 商业化 4 大系统"的需求。** v5.6 起的开发采用**纯前端 HTML/JS prototype**路线（不使用 Next.js），保留 `window.DB` 抽象层供日后切真后端。所有交付均已落地并通过真机模拟测试。

| 工作包 | 需求 | 状态 | 文件/脚本 | 测试报告 |
| --- | --- | --- | --- | --- |
| **B-V5.6-01** | 5 题材 3D 真机可测版 + 11 结局 | ✅ | `output/preview/game-3d.html` | [v5.6-TEST-REPORT.md](v5.6-TEST-REPORT.md) |
| **B-V5.7-01** | 移动端适配 + FPS 监控 + 设置面板 | ✅ | `output/preview/game-3d.html` + FPS HUD | [v5.7-TEST-REPORT.md](v5.7-TEST-REPORT.md) |
| **B-V5.8-01** | 重设计（聊天视图）— 历史归档 | ✅ | `output/preview/redesign.html` 加归档 banner | [v5.8-TEST-REPORT.md](v5.8-TEST-REPORT.md) |
| **B-V5.10-01** | SD 真实立绘 + Blender .glb 模型替换占位 | ✅ | `output/preview/assets/portraits/*.png` + `scenes/*.glb` | [v5.10-TEST-REPORT.md](v5.10-TEST-REPORT.md) |
| **B-V5.11-01** | 9 题材扩展 + GLTFLoader 集成 + AudioFX 重建 | ✅ | `output/preview/game-3d.html` v5.11 | [v5.11-TEST-REPORT.md](v5.11-TEST-REPORT.md) |
| **B-V5.12-01** | 30 题材库 + 上传即生成 + 5 demo + 覆盖审计 | ✅ | `js/genres.js` + `js/novel-parser.js` + `js/novel-store.js` + `js/plot-schema.js` + `js/plot-engine.js` + `js/demo-seed.js` + `library.html` + `novel-upload.html` + `novel-edit.html` + `plot-runner.html` | [v5.12-TEST-REPORT.md](v5.12-TEST-REPORT.md) |
| **B-V5.13-01** | 沉浸剧情 UI + 自动剧情游戏完整化 | ✅ | `plot-runner.html`（重写）+ `js/plot-engine.js`（重写）+ `js/audiofx.js`（新建）| [v5.14-TEST-REPORT.md §1](v5.14-TEST-REPORT.md) |
| **B-V5.14-01** | 商业化 4 大系统（DB/版权/收费/质量/AI辅助）| ✅ | `js/db.js` + `js/copyright-tier.js` + `js/monetization.js` + `js/quality-review.js` + `js/ai-helper.js` + `commerce.html` | [v5.14-TEST-REPORT.md](v5.14-TEST-REPORT.md) |
| **B-V5.15-01** | 全项目代码审查 + 死链修复 + 说明书 | ✅ | [AUDIT_2026-09-10.md](AUDIT_2026-09-10.md) + [READING_GUIDE.md](READING_GUIDE.md) | [AUDIT_2026-09-10.md](AUDIT_2026-09-10.md) |

### v5.6~v5.15 关键技术决策

- **路线**：纯前端 HTML/JS prototype + localStorage（不依赖 Next.js/Supabase）
- **持久化**：`window.DB` 抽象层 → `lingjing_v514_*` 前缀 localStorage；11 张表全部按规范落字段
- **真实 LLM**：不接；所有 AI 辅助/质量审核走规则引擎 + 模板库 mock，保留 `window.AIHelper.generate()` / `window.LLMJudge.score()` 钩子
- **真实支付**：不接；所有金额以灵晶为单位计算；月流水 <10 万时仅平台消费，不开放提现
- **沉浸剧情 UI 优先级**：所有新增页面沿用 v5.13 沉浸剧情对话样式（黑底金边 + 打字机 + 选项悬浮 + 数值跳动）
- **不抽卡/不卖确定性胜利**：保持世界观严肃性
- **真机模拟**：Chromium swiftshader 软渲染跑全套验证

### v5.6~v5.15 验收状态

- ✅ 30 题材全渲染（library.html 通过 `?genre=xxx` URL 参数自动筛选）
- ✅ 5 demo 小说（古言/悬疑/奇幻/科幻/校园）覆盖审计 5/5 章节 + 12/12 角色 + 5/5 高光全覆盖
- ✅ 沉浸剧情对话 UI（40 张真机截图，0 console error）
- ✅ 商业化 4 大系统（14 张 commerce 截图，0 console error）
- ✅ 全项目代码审查（9 页面 + 12 模块 + 10 交互 + 22 文档，0 ERR）

### 后续候选工作包

| 编号 | 任务 | 状态 | 关联 |
| --- | --- | --- | --- |
| **B-V5.16-01** | 剩余 25 题材 demo 补齐 | 待办 | READ [READING_GUIDE.md §12](READING_GUIDE.md) |
| **B-V5.16-02** | 接真 LLM 增强对话生成 | 待办 | 钩子已留，优先 Qwen Turbo/Plus/Max 接入 |
| **B-V5.16-03** | IndexedDB 替代 localStorage 5MB 限制 | 待办 | 大于 5MB 数据迁移 |
| **B-V5.16-04** | 22 子文档（backend/frontend/infrastructure/testing/legal）同步 v5.14 | 待办 | AUDIT §八已列 |
| **B-V5.16-05** | 海外合规（GDPR / COPPA / 日韩 / 韩国）| 待办 | 法律子目录扩容 |
| **B-V5.16-06** | 创作者维权（抄袭检测 + 法律资源对接）| 待办 | LEGAL-13 延伸 |



`r`n`r`n## 世界演出交互验收补充（2026-09-16）`r`n- Canon 主线正文按句播放；点击继续先推进当前锚点句子，句子结束后才进入下一个画面。`r`n- 场景变化由 Scene/Presentation 数据驱动，背景、人物和镜头变化时切换演出画面。`r`n- 地点、家具、道具、人物必须是可点击热点；点击后显示查看、使用、前往、交谈等对象对应操作。`r`n- 世界探索结果标记为【世界探索】，不得冒充原著正文；世界功能区不使用聊天气泡。`r`n


---

## 2026-09-19 新增计划：V27 编辑我的作品 — 修复与增强（已交付）

### 工作包列表

| ID | 工作包 | 交付物 | 状态 |
| --- | --- | --- | --- |
| V27-A | my-works：P1 返回修复 + 卡片 6 操作按钮 + 删除作品（确认弹窗/持久化/列表过滤） | scripts/v27_fix_my_works.py | ✅ |
| V27-B | work-editor 结构与样式：图片管理三区面板 + 弹窗/候选/反馈 CSS | scripts/v27_fix_work_editor_p1.py | ✅ |
| V27-C | work-editor JS：P2 收费弹窗（六字段+编辑删除）、P3 续写（候选使用/换一批/我来说/字数/章节保存）、P5 预览发起与反馈面板 | scripts/v27_fix_work_editor_p2.py | ✅ |
| V27-D | canon-reader：preview=1 接收端（预览悬浮条 + 章末"← 返回编辑器"） | scripts/v27_fix_canon_reader.py | ✅ |
| V27-E | 引导时序修复（DOMContentLoaded）+ 版本 V1 入账修复 + 反馈默认跳转修复 | scripts/v27_fix_we_bootstrap.py / v27_fix_we_version.py / v27_fix_we_feedback.py | ✅ |
| V27-F | 全链路回归 + 截图 + 文档登记 | scripts/test_v27_edit_works.py · screenshots/v27/（13 张） | ✅ 39/39 |

### 验收对照（需求文档 8 条）
1. ✅ 作品卡片六按钮：继续续写 / 收费 / 数据 / 预览 / 图片管理 / 删除（审核中/已下架卡按状态显示申诉、质检等）
2. ✅ 右上角返回可点击，返回上一级（弹栈实测：my-works → 创作中心）
3. ✅ 添加收费道具弹窗六字段可填写、图片三方式、保存后入列并持久化；支持编辑/删除
4. ✅ 续写与小说辅助模拟器一致：4 候选 [使用] 写入正文、换一批、我来说、润色/重写/场景/对话、字数实时
5. ✅ 图片管理：背景/人物/道具三区，上传/AI 生成 4 候选/预设库，版本管理可回滚
6. ✅ 预览：可选章节，真实小说世界 Runtime 呈现（花果山背景 + Canon Lock），悬浮条返回
7. ✅ 预览反馈面板：三组满意度，不满意直接跳转对应修改区（实测跳收费 Tab）
8. ✅ 布局保持现状、0 console error、0 未捕获异常（39/39 断言通过）

### 技术要点
- 单 HTML 架构：全部改动经由 LJ_PAGES JSON 解析/写回（锚点 assert 幂等），页面内 JS 保持 ES5 function 风格、不使用反引号模板
- 预览链路：work-editor `previewChapter` → `parent.LJ.go('novel-canon-reader','?book=<映射>&preview=1&chapter=<n>')` → 悬浮条/章末按钮 `postMessage {lj:'back'}` 弹栈回编辑器 → `checkPreviewPending` 弹反馈面板
- 作品→公版书映射 LJ_BOOK_MAP：changye/taohua→xiyouji、saibo→sanguoyanyi、shenhai/hlmrev/jiuri→hongloumeng


---

## V28 工作包（2026-09-19，全部 ✅）

| 任务 | 内容 | 状态 |
| --- | --- | --- |
| V28-A | 壳层 #stage 桌面 letterbox（>480px 视口锁 480px 居中 + 暗边光晕），全页统一 | ✅ |
| V28-B | 新增 novel-detail 橙光式小说详情页（三 Tab/评分/人气值/灵晶值/付费信息/角色/互动/底部操作栏）+ 路由（书卡→详情→游戏→返回链） | ✅ |
| V28-B-fix | 壳层 novel-game 映射删除 ×2 / ngQS 参数规范化 / back 栈 __noPush 防死循环 / loadEmbedded 内嵌公版 / world-view showToast 补头 / world-hub tabbar-embed 路径 | ✅ |
| V28-C | Playwright 回归 32/32 + 截图 9 张 + PRD/DEV_PLAN 登记 | ✅ |

### 验收对照
1. 桌面 1108px 横屏：舞台 480px 居中、两侧暗色留边 ✅（S0a/S0b）
2. 世界页书卡 → 小说详细介绍页 ✅（S3a）
3. 详情页含：作品ID/作者/评分/人气值/灵晶值/标签/简介/更新日志/付费信息/特别参演/角色/互动/底部操作栏 ✅（S1a~i）
4. 货币=灵晶，无第三方名 ✅（grep 校验）
5. 开始阅读 → 游戏页（书名正确）✅（S3b/S3c）
6. 游戏页返回 → 详情页 ✅（S3d）
7. 详情页返回 → 世界页 ✅（S3e）
8. 点赞/收藏/评论持久化 ✅（S2i~k）；pageerror/console 全零 ✅（S4）

### 技术要点
- 壳层 letterbox 用纯 CSS 媒体查询（min-width:481px），iframe fixed + margin:auto 居中，无 JS 参与
- LJ_PAGES 65 页：novel-detail 经 json 解析/写回注入（锚点 assert 幂等），页面 JS 保持 ES5 function 风格
- back 栈语义修正：LJ.go(id,qs,hash,__noPush)，postMessage back 弹栈路由不再压栈（影响全局返回链，回归通过）
- novel-game 在 srcdoc 下取参必须走 __LJ_PARAMS__（location.search 恒空）——ngQS() 统一规范化

## V2.0 小说世界流程修复开发计划（2026-09-22）

- [x] 统一世界功能区小说卡片入口到小说详情页。
- [x] 详情页“开始阅读”进入全屏剧情封面。
- [x] 剧情封面增加协议门槛及“剧情开始 / 打开书签”双入口。
- [ ] 四类角色及命名、形象、属性确认完整流程，按最新规格重新验收。
- [x] 游戏返回锚定小说详情页，详情页返回世界功能区。
- [ ] 将存档列表完全按 3×2 槽位、本地/云端、多页规格重构，并仅渲染实际存档。
- [ ] 将游戏菜单 12 项统一为独立可操作面板并补齐衣柜、福利、设置。
- [ ] 使用浏览器完成端到端验收并保留运行截图：世界→详情→封面→角色/存档→游戏→详情→世界。

验收禁止项：不得直达旧游戏页；不得把原章节列表当存档列表；不得用“开发中”代替按钮功能；平台购买不得出现丸子货币名。

## 现实世界货币系统补充开发计划 V1.0（2026-09-22）

### 本次已完成

- [x] 在钱包充值区明确人民币（CNY）为结算币种，灵晶为到账虚拟货币。
- [x] 增加 1 元 = 100 灵晶的演示汇率提示，并明确当前不会扣除真实人民币。
- [x] 充值演示生成唯一订单号，记录 CNY 金额、灵晶数量、订单状态、支付模式和时间。
- [x] 对同一充值档位的已完成演示订单做幂等拦截，避免重复点击重复发放的产品逻辑。
- [x] 保留灵玉、铜钱、银两的既有语义，不把小说世界货币与平台充值混用。

### 上线前待开发

- [ ] 服务端价格版本、订单表、支付渠道回调验签和幂等锁。
- [ ] 微信支付、支付宝、Apple/Google 内购的真实支付适配；完成前不得显示“已上线”。
- [ ] 退款、未使用余额扣回、发票/税务、实名与未成年人保护、风控和对账。
- [ ] 订单与余额流水后台审计，客户端只读服务端余额，不信任本地到账结果。
- [ ] 端到端验收：金额篡改、重复回调、重复点击、支付失败、退款和跨设备同步。

## 小说世界持续迭代计划 V2.1（2026-09-22 起）

本计划作为后续多轮开发顺序，未完成项不得标记为完成。

### Wave 1：入口与可玩性阻塞修复

- [x] 详情页 → 全屏剧情封面 → 协议同意 → 剧情开始/打开书签。
- [x] 修复旧全屏点击层遮挡封面按钮的问题。
- [x] 移除子 iframe 反向调用父级路由造成的重复重载闪烁。
- [ ] 浏览器实测入口、角色创建、存档读取和退出链路，并保留截图证据。

### Wave 2：世界场景互动

- [x] 保留现有人物与道具热点系统。
- [ ] 场景热点数据化：背景、人物、动物、家具、药物、庄稼、可拾取道具。
- [ ] 每类热点提供对应操作：查看、交谈、喂食、采集、使用、装备、种植、收获、前往。
- [ ] 互动结果写入玩家状态、背包、任务、历史对话和存档。
- [ ] 使用 SD/Blender 生成并接入可追踪的场景与对象素材；素材元数据保留提示词、版本和来源。

### Wave 3：游戏系统面板

- [ ] 存档/读档：只显示真实游戏存档，不把原章节当存档。
- [ ] 属性、背包/仓库、好感度、任务、地图、商城、历史对话全部独立可操作。
- [ ] 商城平台购买只使用灵晶，小说世界资产继续使用铜钱/银两。
- [ ] 菜单返回严格回到小说详情页，详情页返回世界功能区。

### Wave 4：验收与质量

- [ ] 每轮修改后解析 `index.html` 内嵌 LJ_PAGES JSON。
- [ ] 页面脚本无新增未捕获异常；关键按钮逐项可点击。
- [ ] 桌面与窄屏各完成一轮入口、互动、存档、退出回归。
- [ ] 未接入真实服务的 SD、Blender、支付、云存档能力必须明确标注演示或待接入。
# 2026-09-26 进度补充：菜单地图入口去重并完成浏览器验收；地图面板仅展示当前原文场景状态，未提供原文节点时不伪造可前往地点。云端存档入口保持禁用并标注未接入。详见 docs/MENU_HONEST_STATE_TEST_2026-09-26.md。
# 2026-09-26 进度补充：商城已从静态商品卡改为本地运行时购买；灵晶可单向兑换西游记世界的铜钱/银两、行动值和疗伤药，并写入本地存档快照。真实钱包、交易流水与云端同步仍未接入。详见 docs/SHOP_PURCHASE_TEST_2026-09-26.md。

### 2026-09-26 UI 回归修复

- [x] 修复小说详情页返回世界主页后底部主功能区 button 默认白底问题。
- [x] 同步 `index.html`、`product-preview.html` 与 `output/preview/css/shell-v64.css`。
- [x] 在 `AGENTS.md` 固化底部导航透明按钮防回归约束。详见 `docs/UI_REPAIR_REPORT_2026-09-26.md`。
# 2026-09-26 进度补充：移除场景快捷历史入口的硬编码《红楼梦》对白，统一读取运行时最近 50 句真实记录，并完成浏览器验收。详见 docs/HISTORY_SHORTCUT_TEST_2026-09-26.md。
# 2026-09-26 进度补充：福利入口已改为每日一次的本地持久化领取，实际增加灵玉并阻止重复领取，完成浏览器验收。服务端签到和活动服务仍未接入。详见 docs/BENEFIT_CLAIM_TEST_2026-09-26.md。
# 2026-09-26 进度补充：设置面板已支持本地持久化恢复，未接入的全屏 API、自动播放调度、音频引擎和云端同步保持明确未完成。详见 docs/SETTINGS_PERSIST_TEST_2026-09-26.md。
# 2026-09-26 进度补充：场景 NPC 对话、赠礼、物品采集/收获/使用现在会实际写入历史、背包、关系和本地存档，并回归热点来源测试。服务端事件流水和素材对象数据库仍未接入。详见 docs/HOTSPOT_STATE_INTERACTION_TEST_2026-09-26.md。
# 2026-09-26 关键回归修复：恢复完整 LJ_PAGES 页面映射（72 页），重新注入小说世界代码并完成商城/历史回归。详情见 docs/PAGES_MAPPING_RECOVERY_TEST_2026-09-26.md。
# 2026-09-26 进度补充：陪伴 AI 记忆页已支持本地新增、锁定、解锁、删除和持久化，并完成浏览器验收；服务端四层记忆、AI 提取/衰减、向量检索与跨设备同步仍未接入。详见 docs/MEMORY_RUNTIME_TEST_2026-09-26.md。
# 2026-09-26 进度补充：聊天页已把明确偏好表达联动到本地记忆库，并通过真实输入浏览器验收；AI 候选提取、确认卡、敏感检测和服务端记忆仍未接入。详见 docs/CHAT_MEMORY_LINK_TEST_2026-09-26.md。
# 2026-09-26 进度补充：聊天记忆写入前已增加敏感信息拦截并完成浏览器验收；服务端安全 Pipeline、加密存储与审计仍未接入。详见 docs/CHAT_MEMORY_SAFETY_TEST_2026-09-26.md。
# 2026-09-26 进度补充：菜单章节跳转已改为只读取真实本地存档槽，禁止选择未存档原章节，并完成浏览器验收。云端存档仍未接入。详见 docs/SAVED_CHAPTER_JUMP_TEST_2026-09-26.md。
# 2026-09-26 进度补充：修复游戏菜单返回按钮，严格回到小说详情页并完成浏览器路由验收；自由上传模式和云端会话仍保持本地边界。详见 docs/MENU_EXIT_DETAIL_TEST_2026-09-26.md。
# 2026-09-26 进度补充：核心路由冒烟测试通过，真实 Chromium 已切换 8 个核心页面且无 pageerror；该测试不替代小说世界端到端验收。详见 docs/CORE_ROUTES_SMOKE_TEST_2026-09-26.md。
# 2026-09-26 进度补充：完成小说世界入口回归，真实浏览器完成角色创建、游戏、手动存档、打开书签和真实存档读取，空槽保持“暂无剧情”，无 pageerror。详见 docs/ENTRY_ROUNDTRIP_TEST_2026-09-26.md。
# 2026-09-26 进度补充：仓库补齐使用、装备、赠送三类实际操作，分别写入背包、角色装备、关系/历史并完成浏览器验收。详见 docs/INVENTORY_ACTIONS_TEST_2026-09-26.md。
# 2026-09-26 进度补充：衣柜换装与福利领取现在立即写入当前本地存档，并完成衣柜、福利、设置浏览器回归；服务端同步仍未接入。详见 docs/WARDROBE_BENEFIT_PERSIST_TEST_2026-09-26.md。
# 2026-09-26 需求冲突修正：移除旧长滚动阅读入口与可切换分支，玩家小说世界固定使用视觉小说点击推进舞台，并完成入口、角色、存档和菜单回归。详见 docs/REMOVE_SCROLL_READER_TEST_2026-09-26.md。
# 2026-09-26 进度补充：地图读取当前章节真实原文场景节点，支持点击切换并写入场景标题、历史和本地存档；无节点时不伪造地点。详见 docs/MAP_SCENE_SWITCH_TEST_2026-09-26.md。
# 2026-09-26 进度补充：场景热点扩展覆盖原文中的动物、家具、药物、庄稼，并接入对应互动动作；点击推进与存档回归通过。详见 docs/SCENE_OBJECT_HOTSPOT_TEST_2026-09-26.md。
# 2026-10-01 进度补充：场景热点进一步数据化；当前原文段落编译出的热点按“章节:段落”保存稳定位置和类型，并随自动/手动存档读档恢复，避免场景重绘时热点漂移；服务端热点事件流水仍未接入。
# 2026-10-01 进度补充：热点交互现在记录 `view/feed/talk/gift/collect/harvest/use` 等最后动作、使用次数和时间，并随热点状态存档恢复；真实游戏菜单与四书存档回归通过。
# 2026-10-01 进度补充：重新开始或重新选择角色时清空本轮热点运行态；继续游戏/读档保留原存档热点，避免新角色继承旧世界互动数据。
# 2026-09-26 进度补充：动物喂食现在实际更新好感、喂食次数、历史和本地存档，并完成场景点击与赠礼回归。详见 docs/ANIMAL_FEED_INTERACTION_TEST_2026-09-26.md。
# 2026-09-26 进度补充：地图场景名称纳入自动存档、手动槽位和读档恢复，入口与地图回归通过。详见 docs/SCENE_SAVE_RESTORE_TEST_2026-09-26.md。
# 2026-09-26 进度补充：场景地图快捷入口统一复用真实地图面板，避免与主地图行为分叉；地图与菜单唯一性回归通过。详见 docs/SCENE_MAP_SHORTCUT_TEST_2026-09-26.md。
# 2026-09-27 进度补充：真实 Chromium 逐项点击游戏菜单 12 个功能及“返回小说详情页”，全部打开对应面板或完成退出路由，无 pageerror。详见 docs/ALL_GAME_MENU_ACTIONS_TEST_2026-09-27.md。
# 2026-09-27 进度补充：好感度面板补充展示动物喂食次数，读取真实关系状态；完整菜单回归通过。详见 docs/RELATIONSHIP_FEEDING_DISPLAY_TEST_2026-09-27.md。
# 2026-09-27 后端验收：FastAPI 真实 HTTP Phase 0 冒烟 8/8 通过，覆盖健康、聊天、记忆、安全拦截和用户熔断；测试支持 MIRAI_API_BASE。当前仍为内存/开发身份/规则回复，生产数据库与 LLM Gateway 未接入。详见 docs/API_PHASE0_HTTP_SMOKE_TEST_2026-09-27.md。

---

## 2026-10-01 本轮完成：影视化生活模拟层

- 在 `novel-game` 原著点击推进舞台上增加持久化生活状态：日期/时段、精力、饱腹、心情、健康。
- 增加场景内动作牌：休息、进食、劳作、散步；动作会真实消耗行动值、改变状态、产出铜钱（劳作）、写入历史对话并进入存档/读档。
- 保留原著文本零删减、热点互动、背包、关系、地图、商城和严格退出链路；未接服务端的同步/支付仍明确为本地演示。
- 回归：入口、存档读取、核心路由测试通过；多作品测试已确认原著角色路径不应点击随机/自定义向导的隐藏 CTA，测试断言需按角色类型分支修正。
- 多作品回归已完成：红楼梦/贾宝玉、三国演义/刘备、水浒传/宋江、聊斋志异/书生均通过“角色→舞台→存档→读档→详情→世界”真实 Chromium 流程；详见 [MULTI_BOOK_ENTRY_TEST_2026-10-01.md](MULTI_BOOK_ENTRY_TEST_2026-10-01.md)。
- 生活模拟第二轮：动作推进清晨/上午/午后/黄昏/夜里时段，夜间休息进入下一日；劳作创建并推进真实支线任务“日常劳作”，任务状态随存档读档保留。
- 生活模拟验收：真实 Chromium 点击劳作后由“第 1 日·清晨”变为“第 1 日·上午”，精力 80→62、饱腹 80→68、心情 70→67、铜钱 +3，并生成 1 条任务；新角色初始行动值修正为 62。 
- 属性面板补充展示生活状态（时段、精力、饱腹、心情、健康、行动值）；游戏菜单全功能回归保持通过。
- 核心回归保持通过：核心路由、入口往返、四部公版存档读档、全部游戏菜单动作均完成真实浏览器测试；未接服务端能力仍未标记为完成。
- 后端基础补充：新增 `/api/v1/notifications`、通知已读接口和 `/api/v1/recommendations`；10 个 API 单元测试通过。当前返回明确标记 `local-dev` / `bundled-catalog`，推荐尚未宣称个性化，通知尚未宣称生产持久化。
- 2026-10-01：商业化 API 新增商城目录与购买接口；灵晶扣款、小说世界货币/行动值/道具到账和交易流水均可测试，返回 `local-demo`，未接真实支付与持久化钱包，不标记为生产完成。
- 2026-10-01：小说世界菜单商城改为 API 优先；成功连接时显示 API 商品目录/余额并使用服务端购买结果，连接失败时回退本地演示并明确提示接口未连接。核心路由与菜单回归通过。
- 2026-10-01：新增 `/api/v1/world-saves/{novel_id}` 服务端存档 API，支持按用户/小说隔离的槽位列表、写入、读取、删除；返回 `local-dev`，尚未宣称生产云同步。定向 API 回归 `12 passed`。
- 2026-10-01：API 定向回归 `11 passed`；全量 `pytest tests -q` 目前因环境未安装 `alembic` 在 `test_story_database.py` 收集阶段失败，已记录为环境缺口，未将全量标记为通过。
- 2026-10-01：新增 `apps/api/requirements-dev.txt`，固定完整 API 回归所需的 pytest；当前工作区 `.venv` 的 pip 指向另一份 MIRAI 环境，仍需在本项目环境重建依赖后再宣称全量回归通过。
- 2026-10-01：唯一入口首页与世界主页接入通知/推荐接口探测；在线时更新未读数，离线时明确显示“本地内置目录”，通知中心展示接口返回并支持标记已读；未接后端的在线能力仍不标记完成。

## 2026-10-01 开发计划：创作功能区 7 项功能深化 + 心屿社交功能（v4 文档落地）

> 需求来源与范围限定见 [PRD.md](PRD.md) 同日章节。仅修改 LJ_PAGES 中 8 个页面键的值（create-video / create-image / create-sound / create-post / voice-clone / create-card / agent-create / heart-island），其余 64 键与壳层零改动；不改动各页既有 topbar、返回路由与样式基调。

### 工作包

| ID | 工作包 | 页面 | 关键交付 | 状态 |
|---|---|---|---|---|
| V26-A1 | 创建图片 6 模式 | create-image | 文生/图生/角色一致性/定妆照/局部重绘/扩图、负面描述、关联角色+形象版本、数量 1/2/4、灵晶计价 10(+5)、进度模拟、一致性评分、设为头像/定妆照/重绘/扩图 | 待开发 |
| V26-A2 | 创建声音 3 模式 | create-sound | TTS（情感 9 种+滑块+BGM+字数）、角色配音（批量台词队列）、AI 写歌（两步流程+曲风/情绪/语言/时长） | 待开发 |
| V26-A3 | 创建视频 4 模式 | create-video | 文生 30/图生 25/关键帧 35/漫剧 15 每镜头、时长/画幅/BGM/运镜、对口型 +10、漫剧 10 步+分镜编辑器+模板库 5 套、进度模拟 | 待开发 |
| V26-A4 | 创建动态 3 方式 | create-post | AI 自动生成（角色+场景+主题+附带媒体+基调+长度）、手动（保留）、定时发布+审核队列（编辑/跳过）、动态类型 5 种、评论角色回复 | 待开发 |
| V26-A5 | 复刻音色 7 步 | voice-clone | 版权同意书、参考文案引导、预处理+三项校验、训练进度、试听、微调滑块、音色库+绑定角色 | 待开发 |
| V26-A6 | 创建灵念 6 步 | create-card | Big5 人格滑块、主动行为频率约束表、情感系统 6 情绪、记忆成长、测试对话+激活、好感度首级「初识」 | 待开发 |
| V26-A7 | Agent 创建 7 步 | agent-create | 领域 10 域+婉拒路由、知识库、开场白/告别语、高级设置、角色资产、测试发布、工具 8 种、Character.AI 导入演示 | 待开发 |
| V26-B1 | 心屿精选社交 | heart-island | 推荐流、榜单 4 种、点赞/收藏/分享/评分/关注（localStorage 持久化）、角色详情弹窗、动态广场+评论角色回复、话题标签、热度分公式 | 待开发 |
| V26-T1 | 回归验证 | 全部 | LJ_PAGES 仍 72 键可解析；全部内联脚本可编译；浏览器逐页冒烟；其余页面零 diff | 待开发 |

### 边界约束（硬性）

- 只通过 dump→改→set 管线替换上述 8 个页面键；禁止直接编辑 index.html 其他区域。
- 不改底部导航、首页/世界/我的 Tab、创作中心入口卡片、收益体系、灵晶经济。
- 各页内嵌 `data-bundled-source="js/creator-store.js"` 捆绑脚本保持原样，仅通过其公开 API（getCoins/consume/toast/addMedia/addCard/…）交互。
- JS 字符串中出现 `</script>` 必须写作 `<\/script>`；页面需在 srcdoc iframe 中独立可渲染。

## 2026-10-01 本轮修正记录

- 角色创建入口收敛：删除重复的“自定义角色”独立卡片；“随机路人”进入统一向导，在向导内选择姓名、形象、职业、技能和更丰富的性格属性。
- 游戏舞台收敛：生活动作不再常驻遮挡剧情画面，改为菜单中的“日程与生活”功能键，点击后展开当天可执行的休息、进食、劳作、散步。
- 小说详情角色卡已接入点击交互：显示好感度，达到 80 后可用 1200 灵晶登记为心屿陪伴 AI；未接真实支付时仅使用本地演示状态，不标记为生产交易完成。
- 修复交流群二维码资源路径：复制到 `output/preview/assets/community/`，避免 srcdoc iframe 以 `output/preview/` 为基址时图片 404。
- “我的”页创作者中心改为所有用户可进入，收益与作品数据仍按当前用户展示；创作、视频、图片、声音等页面补充纵向滚动和底部安全区，避免功能按钮被固定导航遮挡。
## 2026-10-01 继续修复与回归记录

- 角色创建入口按最新反馈收敛：保留原著主角、原著配角与随机路人，随机路人进入同一个四步创建向导；职业、技能、初始形象和扩展性格均在向导内完成，不再保留重复的独立“自定义角色”入口。
- 游戏舞台的日程/生活操作默认隐藏，正式游戏画面不再被操作条遮挡；通过游戏菜单的“日程与生活”按需打开，保留每日开始时的行动选择逻辑。
- 小说详情页主演卡片已接入好感度弹层：展示本地好感度、达标条件和灵晶带出陪伴 AI 的本地演示状态；未达到条件时明确提示，不伪造真实支付。
- 交流群二维码改为稳定的 `assets/community/lingjing-shuangsheng-group.jpg`，并同步到 `output/preview/assets/community/`；`product-preview.html` 同步同一逻辑。
- “我的”页创作者中心改为所有用户可进入，作品与收入数据仅展示当前用户；创作中心、视频/图片/声音/动态/卡牌/Agent/克隆页面补充独立纵向滚动安全样式，并同步到产品预览页。
- 已验证：`test_core_routes_smoke.py` 通过 8 条核心路由；`test_multi_book_entry.py` 通过 hongloumeng、sanguoyanyi、shuihuzhuan、liaozhai 四本书；`test_all_game_menu_actions.py` 已启动真实浏览器回归但旧脚本无终态输出，需继续重写为当前菜单选择器验收。
- 待处理：重写 `test_v28_desktop.py` 中仍引用旧 `#nd-*` 详情页选择器的部分；补充当前详情角色卡、二维码自然宽度、个人页创作者入口、创作页底部滚动和随机角色向导的真实浏览器截图回归。
- 创作中心“上架与定价”完成信息架构收敛：主卡只保留选择作品、收费点配置、保存定价与提交审核；移除创作中心的收益明细入口，收益明细统一从“我的”进入；版权分成改为独立“版权分成规则”卡片。
- `creator-center-edit-source.txt` 已同步至 `index.html` 与 `product-preview.html`，核心路由回归 `core_routes_smoke_ok 8`。
- 发现并修复详情页“游玩”绕过全屏剧情封面的流程缺陷：`plot-detail` 的公版小说入口统一改为 `novel-cover-entry`，必须先同意适龄协议，再由“剧情开始”进入角色选择。
- 真实 Chromium 回归 `scripts/test_current_novel_world_flow.py` 通过：详情页 → 全屏封面 → 角色选择；角色选项包含孙悟空、猪八戒、随机路人且无独立“自定义角色”；随机路人向导包含姓名、形象、身份、技能和至少 5 项性格属性；无 pageerror，并生成 `screenshots/current-flow/01-detail.png`、`02-random-wizard.png`。
- 已发现并修正首次入口的另一处绕过：详情页不再直接跳 `novel-game`，统一先跳 `novel-cover-entry`；封面同意协议后再写入 `start_mode=new` 并进入角色创建。当前回归已确认详情封面和随机角色向导截图生成；角色确认后游戏菜单的长流程仍需下一轮继续定位，未标记为完成。
- 修复视觉小说舞台被旧 `#ng-stage #ng-reader{display:none!important}` 规则整体隐藏的问题；现在只隐藏旧读者正文，视觉小说容器和原文文字框正常显示。
- 修复游戏菜单遮罩在视觉小说入口被设置为内联 `display:none` 后无法重新打开的问题；打开菜单时显式恢复 `display:flex`，关闭时再隐藏。
- `test_current_novel_world_flow.py` 真实 Chromium 已通过：详情 → 全屏封面 → 随机角色四步向导 → 视觉小说舞台 → 游戏菜单；无 pageerror，生成 `03-game-menu.png`。
- 2026-10-02：补齐世界退出链兜底；从游戏菜单返回小说详情后，详情页顶部返回在无历史来源时固定回到 `world-hub`，不再落到首页。`test_current_novel_world_flow.py` 已扩展并通过详情 → 世界回归，生成 `04-return-detail.png`、`05-return-world.png`；本地静态测试服务器对通知/推荐 API 的 404 仅记录为测试环境缺口，未将在线接口标记为通过。
- 2026-10-02：完成创作端创建图片六模式 UI：文生图、图生图、角色一致性、定妆照、局部重绘、扩图；保留现有免费额度/灵晶扣减、候选图确认入素材库逻辑，并同步 `index.html` 与 `product-preview.html`。真实 Chromium `CREATOR_IMAGE_MODES_PASS` 通过并生成 `screenshots/creator-image-modes.png`。实际 AI 图片生成服务仍未接入，页面继续按本地演示边界运行。
- 2026-10-02：完成创作端创建声音三模式 UI：TTS 配音、角色配音、AI 写歌；保留现有额度扣减、候选结果确认入素材库和滚动安全区，并同步两份入口。真实 Chromium `CREATOR_SOUND_MODES_PASS` 通过并生成 `screenshots/creator-sound-modes.png`；真实 TTS/配音/作曲服务仍未接入，未标记为生产生成完成。
- 2026-10-02：创建动态页补齐发布方式选择：AI 自动生成、手动发布、定时审核；切换模式会改变 AI 辅助区与审核队列提示，并同步两份入口。核心路由回归通过；真实审核服务、定时任务和角色回复服务仍未接入，未标记为生产发布完成。
- 2026-10-02：创作端页面同步后重新执行小说世界真实 Chromium 回归；详情→封面→随机角色向导→视觉小说舞台→游戏菜单→详情→世界链路通过，无 pageerror。静态服务器对通知/推荐 API 的 404 仍仅作为离线测试环境缺口记录。
- 2026-10-02：修复 V22 视觉小说舞台未初始化生活面板的问题；现在游戏菜单“日程与生活”可打开按需显示的动作面板，不会常驻遮挡剧情。真实 Chromium 回归输出 `LIFE_PANEL_VISIBLE`、`EXIT_CHAIN_PASS`、`CURRENT_NOVEL_FLOW_PASS`，并生成 `screenshots/current-flow/03-life-actions.png`；通知/推荐 API 在静态离线服务器中的 404 仍未伪装为在线通过。
- 2026-10-02：重新运行现有 `test_entry_roundtrip.py`，真实点击角色、游戏菜单存档、封面打开书签和读档入口，进程退出码为 0 并生成 `screenshots/entry-repair/game.png`、`bookmark.png`、`restored.png`；菜单中存档/读档、任务、地图、生活、商城、仓库、设置、衣柜、福利、历史和返回详情均可见。云端同步仍未接入。
- 2026-10-02：补充菜单回归脚本的逐项记录逻辑；真实 Chromium 已再次验证角色创建→游戏→菜单→生活面板，以及任务、地图弹窗（输出 `LIFE_PANEL_VISIBLE`、`MENU_ACTION_OK ng-menu-quests`、`MENU_ACTION_OK ng-menu-map`）。商城及后续动态弹窗仍需下一轮稳定逐项复测，当前不标记为全部菜单完成。`python -m py_compile scripts/test_current_novel_world_flow.py` 与 `core_routes_smoke_ok 8` 通过。
- 2026-10-02：修复动态菜单弹窗的统一生命周期：运行时弹窗增加 `data-runtime-modal` 标记，菜单关闭时清理残留弹窗；真实 Chromium 已完整验证任务、地图、商城、仓库、设置、衣柜、福利、历史对话、人物关系、道具面板均可打开，随后返回详情页并回到世界主页，输出 `MENU_ACTION_OK` 全项、`DETAIL_BACK_HASH #/world-hub`、`EXIT_CHAIN_PASS`、`CURRENT_NOVEL_FLOW_PASS`，且 `page_errors: []`。商城 API 在静态离线测试服务器返回 404，界面明确回落到本地演示，未伪装为在线服务。
- 2026-10-02：复核 `apps/api` 的通知/推荐真实路由：使用项目虚拟环境 `TestClient` 实测 `/api/v1/notifications` 返回 200、`mode=local-dev`、未读数 2；`/api/v1/recommendations?limit=3` 返回 200、`mode=bundled-catalog`、`personalized=false`。当前 API 为开发态进程内存储/公版目录，尚未接入生产数据库、登录态和个性化事件流；静态 GitHub 页面因此继续显示明确的离线回退状态。
- 2026-10-02：将通知 API 从进程内存改为 SQLite 开发持久化，与钱包账本共用 `story-development.db`；按 `user_id` 隔离通知、支持已读状态重启后保留。TestClient 实测 GET/POST/再次 GET 为 `200 sqlite-dev`、未读数从 2 变 1；推荐仍保持 `bundled-catalog`、`personalized=false`，生产推送与个性化排序未宣称完成。
- 2026-10-02：复核陪伴 AI API：角色、记忆与关系模块已使用 SQLiteStore；在 FastAPI lifespan 上下文中实测 `/api/chat` 返回 200 规则引擎响应并写入偏好记忆，`/api/memories` 返回 200 且可读到 1 条，危机文本返回 200 且 `safety_blocked=true`。当前未配置 OPENAI_API_KEY，规则引擎与安全前置明确标记为开发模式，未宣称接入生产模型。
- 2026-10-02：启动真实 Uvicorn 服务并运行 `apps/api/tests/phase0_smoke.py`（设置本机 `NO_PROXY` 避免代理干扰），8/8 通过：健康检查、正常聊天、记忆写入/召回/冲突覆盖、反迎合、自伤危机拦截、用户窗口熔断 429 与 `X-Budget-Exceeded: user`。
- 2026-10-02：补齐管理员 API 权限边界：`/admin/cost/today` 与 `/admin/kill-switch/reset` 接入 `require_admin`；生产只接受 JWT `role=admin`，开发管理员必须同时显式配置 `dev_admin_enabled` 与 `dev_admin_user_id`，默认请求均为 403。TestClient 实测默认 403/403，显式开发管理员配置后 200/200；普通 `/health` 仍 200。
- 2026-10-02：新增 SQLite 管理操作日志：熔断复位写入 `audit_events`，新增受 `require_admin` 保护的 `/admin/audit-log`；实测未授权读取 403，显式开发管理员复位 200，审计读取 200 且返回 `kill_switch.reset`。日志不含真实身份数据，生产仍需接入正式用户表与审计留存策略。
- 2026-10-02：补充 UGC 举报 API：新增 `/api/reports` POST/GET，SQLite 持久化 `reporter_id/target_type/target_id/reason/status/created_at`，支持 novel、character、post、memory、comment 五类目标并按用户隔离。TestClient 实测创建 201、初始状态 `pending`，列表 200。审核队列、管理员处理和前端入口尚未接通，未标记为完整举报系统。
- 2026-10-02：补齐举报后端审核闭环：新增管理员保护的 `/api/reports/admin/queue` 与 `/api/reports/admin/{id}/review`，支持 `reviewed/resolved/rejected` 状态，并为审核写入 `content_report.review` 审计事件。实测普通用户队列 403，显式开发管理员队列/审核/审计读取均成功；前端审核界面与生产通知仍未接通。
- 2026-10-02：接通玩家侧“我的 → 法律与帮助 → 举报入口”：内嵌页面新增举报面板，支持小说/角色/动态/记忆/评论目标、理由提交、本人记录列表；请求 `/api/reports`，接口不可用时明确显示离线/未提交，不冒充已进入审核队列。Chromium 实测 `REPORT_ENTRY_UI_PASS`、`page_errors=[]`；管理员审核界面、生产鉴权与通知仍待后续接入。
- 2026-10-02：修复视觉小说入口回归：角色向导完成后，`enterScene` 之后强制收敛 `#ng-v22-container/#ng-stage` 的显示状态，避免旧遮罩/读档回调把游戏舞台再次隐藏。完整浏览器流程复测 `CURRENT_NOVEL_FLOW_PASS`，包含角色创建、VN 舞台、菜单/生活面板、全部菜单项与游戏→详情→世界退出链，`page_errors=[]`。
- 2026-10-02：核验商业化后端商城闭环：`GET /api/v1/currency/mall/items` 与 `POST /api/v1/currency/mall/purchase` 已由 SQLite 账本提供，商品目录、灵晶扣减、小说世界货币/道具入账和 `mall-purchase` 流水均实测 HTTP 200；更新经济模块测试期望为 `mode=sqlite`。静态离线浏览器仍会显示接口未连接降级，这是部署环境未启动 API，不标记为线上已接通。
- 2026-10-02：补充并复核玩家存档 API：`/api/v1/world-saves/{novel_id}` 的空列表、写入槽位、读取、跨小说隔离、删除均走 SQLite 持久化；实测 `mode=sqlite`，保存状态可原样读回，更新 `test_world_saves.py` 的旧 `local-dev` 断言。前端本地存档与云端 API 的自动同步仍需独立接入。
- 2026-10-02：为游戏内商城和云端存档增加可配置 API 基址：读取 `localStorage.lingjing_api_base` 后拼接 `/api/v1/currency/*` 与 `/api/v1/world-saves/*`，部署到独立前端域名时可指向真实 API；未配置或请求失败仍明确降级到本地功能。同步 72 个内嵌页面并通过 `node --check` 与 `CURRENT_NOVEL_FLOW_PASS`，`page_errors=[]`。
- 2026-10-02：修复真实前端接入的 CORS 缺口：API 新增环境变量 `CORS_ORIGINS`（逗号分隔，默认开发端口与当前 GitHub Pages 域名），保留显式来源校验和凭据支持；预检请求从 GitHub Pages Origin 实测 200 并返回正确 `access-control-allow-origin`。生产部署仍需通过环境变量覆盖为实际域名。
- 2026-10-02：陪伴聊天页新增真实 API 调用分支：配置 `lingjing_api_base` 时向 `/api/chat` 发送 `message/character_id`，展示后端回复与安全阻断标记；接口未配置或失败才使用本地规则回复。源码已同步到两个入口并保留本地降级；跨进程 UI 联调因当前浏览器入口仍受启动遮罩阻断，暂标记为“实现未完成最终浏览器验收”，未宣称全链路完成。
- 2026-10-02：聊天页同步后的 6 段内联脚本全部通过 `node --check`；当前仍只把“代码语法正确”记为完成，跨进程 API 聊天 UI 验收继续单独追踪。
- 2026-10-02：陪伴 AI 聊天页增加真实状态提示：配置 API 基址后探测 `/health`，显示“API 在线 · 模型网关/安全降级”；未配置显示“本地规则”，探测失败显示“接口离线 · 本地规则”。同步入口并对 7 段内联脚本逐段 `node --check`，全部通过；跨进程浏览器联调仍待验收。
- 2026-10-02：修复多书存档面板回归：视觉小说 `enterScene` 会给进度遮罩留下内联 `display:none`，后续仅加 `open` 类仍不可见；`showProgressMask/showLegacyProgressMask` 现在先清除内联显示状态再打开。多书真实浏览器回归通过：`PASS hongloumeng`、`PASS sanguoyanyi`、`PASS shuihuzhuan`、`PASS liaozhai`，未报告页面错误。
- 2026-10-02：修复“打开书签→历史存档→继续游戏”读取后落入退役长文 reader 的回归：`loadProgress` 现在重建当前书数据中枢并调用 `NovelWorldVN.enterScene` 恢复视觉小说舞台与存档位置；更新 `test_reading_restore.py` 使用当前 VN 选择器。真实 Chromium 通过 390/1100 两种视口，保存槽内容保持不变、角色名恢复、二级退出链通过、`page_errors=[]`。
- 2026-10-02：新增内部 `admin-console` 页面并同步两个入口：管理员审核队列调用真实 `/api/reports/admin/queue`，处理/驳回调用真实 review API；401/403、接口离线和未配置 API 均明确提示，不渲染本地假审核数据。使用显式开发管理员配置启动 API 后，Chromium 实测在线状态 `sqlite-dev`、队列记录可见、`page_errors=[]`，截图 `screenshots/admin-console.png`；生产 JWT 与正式身份系统仍未宣称完成。
- 2026-10-02：新增持久化媒体生成任务 API `/api/v1/generation/tasks`（图片/视频/声音/动态/灵念/Agent 类型校验，SQLite 任务状态与用户隔离）；未配置生产生成服务时返回 `provider_unconfigured` 和明确错误，不伪造媒体。创建图片页配置 `lingjing_api_base` 后已接入真实 POST，并在任务面板展示任务号/未生成原因；API 单测通过，真实 Chromium `GENERATION_UI_PASS` 通过并生成 `screenshots/generation-task.png`。生产图像/音视频供应商仍未接入，未标记为生成完成。
- 2026-10-02：玩家场景交互回归发现并修复两个真实视觉缺口：VN `showSpeaker` 未显式打开文字框，导致原文字幕写入但不可见；动作确认遮罩仅加 class、未清除旧的 `display:none`，导致点击场景动作无法确认。现在无动作标注的公版场景提供明确标注的“观察当前场景”灵境原创动作；真实 Chromium `VN_SCENE_INTERACTION_PASS` 通过，热点点击后文本推进可见，核心世界流程复测 `CURRENT_NOVEL_FLOW_PASS`、`page_errors=[]`。
- 2026-10-02：完成陪伴聊天跨进程联调并修正真实缺口：聊天页的本地角色 ID `c04` 与 API 预置角色 ID 不一致，导致浏览器请求被后端 404 后静默回落本地规则；预置 `preset_ling/preset_xiaoman` 现在在前端稳定映射，真实 Uvicorn `POST /api/chat` 返回 200。Chromium `CHAT_API_UI_PASS` 通过，状态显示“API 在线 · 安全降级”，聊天气泡来自后端响应，截图 `screenshots/chat-api-ui.png`；LLM 未配置时仍明确是规则引擎，不宣称生产模型。
- 2026-10-02：创建声音页接入统一生成任务 API：TTS、角色配音和 AI 写歌模式提交 `kind=sound` 及对应 mode；供应商未配置时按钮显示“任务已记录（未生成）”，不弹假成功提示。真实 Uvicorn `POST /api/v1/generation/tasks` 返回 201，Chromium `SOUND_GENERATION_UI_PASS` 通过，截图 `screenshots/sound-generation-task.png`。
## 2026-10-02 创建视频任务接入
- 完成：`create-video` 页接入 `/api/v1/generation/tasks` 的视频任务提交，携带类型、描述、比例和时长；任务状态明确显示“任务已记录（未生成）”，不再把本地候选卡片冒充真实生成结果。
- 完成：无 API 配置时保留本地演示，但明确标注为界面预览；空描述、接口失败均给出可见错误反馈。
- 验证：`scripts/test_video_generation_ui.py` 通过，真实浏览器 iframe 填写并提交任务，截图 `screenshots/video-generation-task.png`；后端持久化任务接口返回成功。
- 未完成：仍需配置生产媒体供应商并实现异步回调、媒体存储和候选视频真实预览。

## 2026-10-03 通知与推荐真实接口联调
- 完成：主页/世界页通知徽标与通知弹层接入 `/api/v1/notifications`，推荐区接入 `/api/v1/recommendations`；在线接口失败时明确回落本地内置目录，不伪造在线数据。
- 验证：`scripts/test_discovery_ui.py` 通过，真实 Chromium 经 iframe 进入主页，看到“接口已连接”，打开通知中心并读取 SQLite 通知，截图 `screenshots/discovery-api-ui.png`。
- 未完成：正式账户鉴权、推送通道和推荐策略仍需生产服务配置；当前开发环境为 SQLite/规则推荐降级。

## 2026-10-03 角色广场最小闭环
- 完成：角色服务增加作者主动公开/下架、广场搜索列表和角色举报接口；公开列表只返回 `status=published`，不暴露拥有者身份，举报进入统一管理员审核表。
- 修复：SQLite 自建角色写入缺少 `commit()`，导致创建后无法被后续请求读取；现已补提交并通过接口测试。
- 完成：`我的`功能区增加“角色广场”入口，接入真实 `/api/characters/plaza`，在线为空时显示“暂无作者公开角色”，接口离线时不伪造数据。
- 验证：`tests/test_character_plaza.py` 与 `scripts/test_character_plaza_ui.py` 通过，Chromium 截图 `screenshots/character-plaza-api-ui.png`。
- 未完成：正式账号体系、图片审核、举报自动下架和社区评论/共鸣仍需后续生产化。
- 完成：`my-characters` 作者管理页接入真实角色 API；自建角色显示“公开到广场/已公开”控制，调用公开/下架接口，API 未连接时明确不修改状态。
- 验证：`scripts/test_character_publish_ui.py` 通过真实 Chromium，成功读取服务端角色并显示公开控制；截图 `screenshots/character-publish-ui.png`。
- 完成：聊天 API 响应补充四级安全管线标识 `input_scan → intent_route → risk_action → output_scan`；高风险自伤输入固定转介并阻断，反迎合输入降级处理，安全事件写入 SQLite 审计表，前端可区分 `clear/deescalated/high_risk_blocked`。
- 验证：新增 `tests/test_chat_safety_pipeline.py`，与角色广场及通知接口测试合计 4 项通过；未配置生产 LLM 时仍明确使用规则引擎，不宣称模型已接通。
