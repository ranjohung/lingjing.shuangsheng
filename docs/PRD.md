# 灵境 · 双生 — 产品需求文档 v5.1 + v5.6~v5.20 增量登记

> **当前最新版本**：v5.20（心屿 · 陪伴功能区设计正式落地）/ v5.19（知己 → 心屿 过渡版）/ v5.18（创作者中心设计系统重构）/ v5.17（商业化降级 + 小说辅助模拟器）/ v5.16（UX 修复）/ v5.15（代码审查）/ v5.14（商业化 4 大系统）/ v5.13（沉浸剧情 UI）/ v5.12（30 题材库）
>
> **🔵 V17.0 草案（2026-09-11）— 待用户审阅**：
>
> 全局底部 5 Tab + 世界功能区 + 心屿功能区完整重构方案（不同于 v5.20 仅做命名升级，v17.0 是大改）。
> 详见 **[PRD-v17.md](PRD-v17.md)** + 配套 **[DEV_PLAN-v17.md](DEV_PLAN-v17.md)** + 原始需求 [sources/2026-09-11/S01](sources/2026-09-11/S01-v17-world-and-xinyu-redesign.txt)。
>
> 用户审阅 PRD-v17 §11 的 Q1-Q10 后启动实施；当前 PRD.md 仅做指向，不替代既有 v5.20 内容。
>
> **v5.20 关键变更**：
> - 陪伴功能区官方命名 **「心屿」**（Xin Yu / Heart Island）— 替换 v5.19 阶段性的"知己"称谓
> - 心屿与小说世界通过 **双界角色系统** 实现记忆贯通
> - 角色创建 7 层维度 / 6 阶段亲密度（初识→熟悉→朋友→亲密→知己→灵魂伴侣）/ 7 维关系状态（信任/亲密/熟悉/尊重/吸引/理解/共同历史）
> - 数据表 17 → **21 张**（heart_island_characters / dual_soul_bringout_records / daily_interactions / proactive_behaviors）
> - 8 个 REST 接口：`/api/v1/heart-island/characters/*` + 双界穿梭 + 共享记忆
>
> **v5.19 关键变更**（已被 v5.20 部分覆盖）：
> - 4 个过渡页面：companion.html → 已改名为 `heart-island.html`；chat/memory/profile 沿用
> - 设计系统扩展：`ds-mh` / `ds-bottom-tabs` / `ds-icon-btn`
>
> **v5.18 关键变更**：
> - 新增 `css/design-system.css`（710 行）：shadcn/ui + Aceternity UI + Apple HIG + Vercel + Notion 综合设计语言
> - 创作者中心重构：消除"创建新世界"与"创建你的第一个世界"重复入口
> - 6 页面（creator-center / creator-create / novel-ai-helper / commerce / novel-upload / novel-edit）全面重写
>
> **v5.17 关键变更**：
> - 商业化从顶级功能区降级为<b>创作者中心内部按键"上架与定价"</b>（只对作者可见）
> - 新增<b>小说辅助模拟器</b>（28 字段模板 + 12 类提问 + 6 维度自动检测）
> - 数据表 11 → 17 张
>
> **完整使用说明书**：[READING_GUIDE.md](READING_GUIDE.md)
>
> **代码审查报告**：[AUDIT_2026-09-10.md](AUDIT_2026-09-10.md)
>
> **更新登记**：[UPDATE_2026-09-10.md](UPDATE_2026-09-10.md)

## 更新日志（2026-09-09 → 2026-09-10）

| 版本 | 日期 | 主要交付 | 关联文档 |
|---|---|---|---|
| v5.6 | 09-09 晚 | 5 题材 3D 真机可测版 + 11 结局 | [v5.6-TEST-REPORT.md](v5.6-TEST-REPORT.md) |
| v5.7 | 09-09 晚 | 移动端适配 + FPS 监控 + 设置面板 | [v5.7-TEST-REPORT.md](v5.7-TEST-REPORT.md) |
| v5.8 | 09-09 晚 | 重设计（聊天视图）— 历史归档 | [v5.8-TEST-REPORT.md](v5.8-TEST-REPORT.md) |
| v5.10 | 09-09 末 | SD 真实立绘 + Blender .glb 模型 | [v5.10-TEST-REPORT.md](v5.10-TEST-REPORT.md) |
| v5.11 | 09-10 凌晨 | 9 题材 + GLTFLoader + AudioFX 重建 | [v5.11-TEST-REPORT.md](v5.11-TEST-REPORT.md) |
| v5.12 | 09-10 上午 | 30 题材库 + 上传即生成 + 5 demo | [v5.12-TEST-REPORT.md](v5.12-TEST-REPORT.md) |
| v5.13 | 09-10 下午 | 经典沉浸剧情对话样式（全屏场景+立绘+对话框） | （代码 review） |
| v5.14 | 09-10 晚 | 商业化 4 大系统（AI辅助/版权分层/收费点/质量审核） | [v5.14-TEST-REPORT.md](v5.14-TEST-REPORT.md) |
| v5.15 | 09-10 晚 | 全项目代码审查 + 死链修复 | [AUDIT_2026-09-10.md](AUDIT_2026-09-10.md) |
| v5.16 | 09-10 晚 | UX 修复（独立页面 + 返回箭头 + 选项弹窗） | [v5.16-TEST-REPORT.md](v5.16-TEST-REPORT.md) |
| v5.17 | 09-10 晚 | 商业化降级 + 小说辅助模拟器 + 6 张新表 | （v5.17 文档） |
| v5.18 | 09-10 深夜 | 创作者中心设计系统重构（design-system.css 710 行 · 6 页面重写） | [v5.18-REDESIGN-REPORT.md](v5.18-REDESIGN-REPORT.md) |
| **v5.19** | **09-10 深夜** | **知己 AI 陪伴功能区重建（4 子页 + 底部 tab bar + 心色调设计）** | **[v5.19-ZHIJI-REPORT.md](v5.19-ZHIJI-REPORT.md)** |

**关键里程碑**：6 天 12 个版本，从 5 题材单文件原型扩展到 30 题材 + 20+ 页面 + 12 JS 模块 + 商业化 4 大系统（11 张数据表 + 4 分层 + 22 收费点 + 5 维审核 + 3 级授权）+ 创作者中心设计系统（25+ 组件）+ 知己 AI 陪伴功能区（4 子页 + 移动底部导航）。

---

## 2026-09-09 本批新增范围（v5.1，资料已收齐）

正式名称改为 **灵境 · 双生（Lingjing · Dual Souls）**。口号：“一个角色，两种人生。在故事里经历命运，在现实中陪伴你。”定位：AI角色陪伴与小说世界模拟平台；同一角色在小说世界经历命运，在现实陪伴中共享人格和经历。World OS/无限世界是功能模块，MIRAI仅保留工程代号。

本轮只更新需求与计划、保存原稿和法律草稿；框架、角色形象、界面、场景与人物模型均已列入开发范围，本轮不启动框架实现和资产制作。下列规范及其来源附件共同组成产品需求，不得只读取旧功能表而遗漏新需求。v5.2 仅做结构补强（[DOCS_AUDIT_2026-09-09](DOCS_AUDIT_2026-09-09.md) / [ONBOARDING](ONBOARDING.md) / [UI_DESIGN_GUIDE](UI_DESIGN_GUIDE.md) / [ASSET_PRODUCTION_GUIDE](ASSET_PRODUCTION_GUIDE.md) / [NEXTJS_DEV_GUIDE](NEXTJS_DEV_GUIDE.md) / [INDEX](INDEX.md)），不动 v5.1 范围与冲突裁决。

| 新增需求ID | 规范 | 完成判断 |
| --- | --- | --- |
| BRAND-01、UI-01~04、ASSET-01、CONTENT-02 | [全题材目录/全软件框架/原创资产](product/06-world-directory-and-ui.md) | 全题材可扩展分类、多模式页面、SD立绘与Blender模型各自验收 |
| UI-05、UI-06、UI-07 | [UI 设计指南](UI_DESIGN_GUIDE.md) | 设计令牌 + 12 个核心页面（含 22 题材目录页）规范 + 通用组件 + 状态/验收 |
| ASSET-02~05 | [资产生产指南](ASSET_PRODUCTION_GUIDE.md) | 命名 / SD 立绘 / Blender 模型 / 版本与合规 / 流水线 |
| WOS-01~15、NOV-01~04、DATA-01 | [WORLD_OS_SPEC](WORLD_OS_SPEC.md) | 世界/角色自主运行、事件因果、剧情、分支、小说生成与双向同步、预算审核、数据接口 |
| CHAR-03、COMP-01~04、DUAL-01~05 | [DUAL_SOUL_SPEC](DUAL_SOUL_SPEC.md) | 八层建角、日常互动、两套养成、关怀、资格/带出/切换/共享记忆 |
| CREATE-02~06、EXPORT-01~03 | [CREATOR_SYSTEM](CREATOR_SYSTEM.md) | 三种来源、人工矫正、质量版本、工作台发布、全部导出和商业服务候选 |
| ECON-01~08 | [ECONOMY_SYSTEM](ECONOMY_SYSTEM.md) | 四大收费维度、双币、订阅/充值/抽卡/广告/分润、全部价格效果、幂等交易 |
| ECON-BIBLE-01 | [ECONOMY_BIBLE](ECONOMY_BIBLE.md) | 11 张经济表完整 DDL / 8 API schema / 5 家竞品对标 / 生命周期 7 节点 / 10 万 MAU 测算 / B8 上线闸门 |
| LEGAL-01~15 | [法律接入计划](legal/LEGAL_INTEGRATION_PLAN.md) | 15原稿已存档；法律核验和前端接入未完成 |
| ONBOARD-01 | [产品速读](ONBOARDING.md) | 5 分钟定位灵境·双生 / 不同角色引读指引 |
| IMPL-01 | [Next.js 实施指南](NEXTJS_DEV_GUIDE.md) | B0-B11 实施级步骤 + 全局工程规范 |
| AUDIT-01 | [文档审计](DOCS_AUDIT_2026-09-09.md) | 当前覆盖度 + 缺口清单 + 补强方案 |
| PLAN-01 | [开发计划](DEVELOPMENT_PLAN.md) | 新增工作包有依赖、验收和等待状态 |

本批全部来源、逐项覆盖和26项冲突见[更新登记](UPDATE_2026-09-09.md)。确定原则：生存免费、完整免费主线、不售确定性胜利；矛盾定价/门槛保留候选，按冲突登记完成定版后启用。未核验的竞品说法、法规、版权和营收数字仅作为提供的资料，不作平台承诺。

### World OS最终工程补充（资料收齐）

最后附件S07已逐项核对，与S05/S06相同。新增 [工程交接契约](backend/26-world-os-engineering-contract.md) 与 [九表完整DDL参考](backend/27-world-os-source-ddl.md)，作为DATA-01、WOS-05/08/09/13/14/15、NOV-04、PLAN-01的规范组成部分。

七项缺口全部有交付定义：数据库字段约束及迁移、八步AI链输入输出、四引擎集成、预算/LOD/缓存、一致性回滚、审核举报申诉、九Sprint量化验收。工程基线：程序提交世界结果，AI补充受约束叙事；10次互动触发入门专属事件，完整个人线与带出使用独立门槛；重大质量问题未修复不发布。其余商业口径不因附件重复而视作已确认。

### 与已有需求的关系

- 原AUTH/CHAT/MEM/REL/EMO/STORY/SAFE/OPS及发布闸门继续保留，新增模块复用已有基础设施。
- 旧WORLD-01扩展到完整WOS/NOV；旧CREATE-01扩展CREATE-02~06/EXPORT；旧BILL-01扩展ECON；旧CHAR-01扩展CHAR-03；旧EXT-01保留语音/移动/3D方向并明确资产交付。
- 旧“禁止主动推送”是未接新关怀机制时默认状态，不删掉新主动关怀需求。旧3部首发与本批大规模官方内容目标分列，原路径/结局质量不降低。
- 以下v4.1正文保留既有需求和证据语境；冲突以本批登记的候选/待裁决状态为准，不按旧排期自动启动开发。

2026-09-08；依据两份DeepSeek聊天记录及用户最新指令。当前权威见[MIRAI_SPEC](./MIRAI_SPEC.md)。本文件列需求，不代表实现完成。

## 产品与完整体验
让用户创建或选择人物，在既有小说世界中生活，通过日常互动、事件、路线抉择改变命运。玩法参考业内沉浸剧情对话范式：章节阅读、人物对话、变量养成、多角色路线、多结局、多周目。陪伴模式保留长期记忆与关系；创造模式分阶段交付。

成年验证及知情同意 → 选故事 → 查看世界/人物/路线说明 → 原著人物或自建人物入世 → 2D场景阅读/NPC互动 → 连续选择 → 共通路线/分歧/个人路线 → 结局 → 命运卡 → 存档回溯/新周目。MVP不做大型开放世界，日常生活必须体现在可游玩的事件和状态变化中。

## 功能与验收追踪
P0=MVP第1–10周，P1=第11–24周，P2=第25–32周或后续。日期为排期目标，不是进度证明。

| ID | 功能 | 阶段 | 验收标准 |
| --- | --- | --- | --- |
| AUTH-01 | 注册登录、JWT、手机号/邮箱验证 | P0 | 无凭证401；凭证校验服务端执行；开发身份不可进入生产 |
| AUTH-02 | 实名与年龄硬拦截 | P0 | 服务商核验而非自填年龄；pending/active/frozen；未成年冻结；成年重新核验解冻 |
| AUTH-03 | 协议、知情同意、账号借用声明 | P0 | 记录版本/时间；未签署不得游玩；设备异常/家长举报进入二次验证处置 |
| AUTH-04 | 数据控制与注销 | P0 | 对话/记忆/游玩记录查看删除、JSON导出；注销期限与硬删除一致；实名信息最小化 |
| CHAR-01 | 角色DNA创建编辑与已有角色选择 | P0 | 身份/背景/性格/价值观/喜恶/语言/边界保存；角色槽位服务端约束 |
| CHAR-02 | AI立绘及表情 | P0 | 描述生成2D图、审核、下载、设头像；失败可重试；无密钥明确不可用 |
| CHAT-01 | 流式聊天与编排 | P0 | 真流式、取消/错误恢复；结构化输出校验与最多2次重试；成本日志 |
| CHAT-02 | 重说/回溯/评价 | P0 | 重说3–4版本可选；回溯撤销对应副作用；点赞点踩持久化 |
| CHAT-03 | 灵感灯泡 | P0 | 空输入5秒、每会话最多3次；基于场景/记忆/关系 |
| CHAT-04 | 编辑记忆/重启/事件簿摘要 | P1 | 重启保留DNA关系；摘要可追溯来源 |
| MEM-01 | 四层记忆 | P0 | 工作/情景/语义/关系；pgvector召回；计数/衰减/失效正确 |
| MEM-02 | 记忆产品化 | P0 | 提示条、时间线、搜索、单条删除和定向遗忘；删除后不可召回 |
| MEM-03 | 编辑/锁定/私密/导出 | P1（导出P0） | 锁定不衰减、私密不入库；无软删除冒充物理删除 |
| MEM-04 | 记忆卡牌 | P1 | 重要记忆转卡、收藏、皮肤、分享权限、撤销 |
| REL-01 | 六维关系与风险 | P0 | trust/intimacy/familiarity/respect/affection/conflict；dependency_risk独立；事件记录与衰减 |
| REL-02 | 等级和4里程碑 | P0 | 初见/首次命运选择/百次对话/等级提升；不可重复领奖 |
| EMO-01 | 连续情绪及2D表情 | P0 | 持久化、衰减、注入对话；叙事NPC情绪随会话隔离 |
| STORY-01 | 作品库及世界设定 | P0 | 3部正式作品目标；时代/地点/势力/人物/内容版本/版权来源齐全 |
| STORY-02 | 原著人物/自建人物入世 | P0 | 原著身份列表；姓名背景编辑；已有自建角色选择；故事兼容身份槽位说明；越权角色拒绝 |
| STORY-03 | 六章多路线引擎 | P0 | 共通序章→事件→分歧→深入→冲突→解决→结局；2–4路线；每路径20–30点、每点2–4选项 |
| STORY-04 | 日常与世界生活 | P0 | 行军/宴会/拜访/休整等连续场景；时间地点/NPC关系可见；每选项有状态或剧情后果 |
| STORY-05 | 多维玩家状态 | P0 | wisdom/courage/charm/strength为0–100；NPC独立关系、flags、hidden_affinity；会话隔离 |
| STORY-06 | 多结局 | P0 | 每作5–8可达结局；规则优先级确定、兜底；隐藏未解锁不剧透；提供每结局可达测试 |
| STORY-07 | 存档/读档/回溯/多周目 | P0 | 正式跨重启恢复；绑定内容版本；回溯恢复全部状态；新周目不污染旧周目 |
| STORY-08 | 选择记录与并发 | P0 | 当前节点/选项/revision校验；重复请求不重复扣数；篡改/跨用户拒绝；事件有前后状态 |
| STORY-09 | AI叙事补充 | P0 | 审核前后文；只能使用合法状态；失败有作者文本，不凭空推进路线 |
| SHARE-01 | 命运卡/抉择卡 | P0 | 来自真实选择与结局；图片可下载、水印；默认私密；分享由用户触发 |
| SHARE-02 | 分享落地页与统计 | P0 | 权限/撤销、二维码链接、预览、归因；不能假称已接通所有平台一键分享 |
| SAFE-01 | 四级安全管线 | P0 | 输入输出审核→意图路由→高风险处置→审计；角色扮演终止且无亲密奖励 |
| SAFE-02 | 时长与依赖提醒 | P0 | 每连续2小时提醒、显著AI身份提示；风险阈值配置化；不作诊断 |
| SAFE-03 | 紧急联系处置 | P0 | 联系人授权、核验、触发审核、失败重试与审计；不得自动向未授权联系人发消息 |
| SAFE-04 | 反迎合/反操纵/禁止主动推送 | P0 | 输入输出及失败路径测试；禁止诱导消费/替代现实关系 |
| SAFE-05 | 发布合规材料 | P0 | 备案/安全评估适用性核验及五项制度、隐私/协议；法务审核留证 |
| COST-01 | 成本熔断及配置 | P0 | AI调用前后用量、估算和实际成本；并发预算；429/503和响应头；无硬编码价格 |
| OPS-01 | 工程与部署 | P0 | Monorepo/Docker/CI/Alembic/境内部署/Sentry/日志/管理员鉴权/性能报告 |
| UGC-01 | 角色广场/记忆广场 | P1 | 搜索分类/领养/共鸣评论/审核/举报下架 |
| UGC-02 | 创作者等级及分润 | P1 | 创作者后台、等级权益、使用收入分配；比例配置；MVP提现403 |
| WORLD-01 | 原创世界生成器 | P1 | 描述生成世界/NPC/场景/连续选择，经编辑确认才能游玩；不可三点冒充完整作品 |
| CONTENT-01 | 故事扩充和评价 | P1 | 新增5部后共8部；再补5部到13部；每部独立内容验收和用户评分 |
| BILL-01 | 微信/支付宝/订阅/Credits | P1 | 国内支付验签、幂等、防重放、退款/取消、权益；赠送月清/购买保留；原价格仅候选配置 |
| GROWTH-01 | 推荐/裂变/活动 | P1 | 归因与退出；以完整游玩率为核心，不能靠沉迷时长 |
| CREATE-01 | 原创上传/可视化编辑器 | P2 | 导入/编辑/校验/预览/版本发布/版权承诺/举报 |
| DEEP-01 | 因果链/命运报告/共创 | P2 | 从真实事件生成蝴蝶效应图、人生回顾；基础多结局已在P0 |
| EXT-01 | 语音/移动端/语言/3D/海外 | 后续 | STT/TTS失败不阻断文字；React Native；3D独立评估；保留世界日程/离线演进/AI Director/授权IP/记忆图谱方向 |

---

## 2026-09-10 新增范围（v5.6 ~ v5.15，依据用户4段DeepSeek讨论结论）

> **本节内容已优先纳入主需求追踪，与 v5.1 同步进入实施序列。** 在 v5.1 "AI 陪伴 + 小说世界模拟" 基础上，新增了"**30 题材库**""**自动游戏化**""**沉浸剧情对话 UI**""**商业化 4 大系统**" 4 条主线。

| 新增需求ID | 名称 | 阶段 | 验收标准 | 对应规范/模块 |
| --- | --- | --- | --- | --- |
| **GENRE-30** | 30 题材全分类覆盖 | v5.12 ✅ | 30 个题材（玄幻/仙侠/都市/校园/历史/军事/游戏/体育/科幻/灵异/悬疑/二次元/古言/现言/浪漫青春/仙侠言情/玄幻言情/科幻空间/悬疑推理/同人/武侠/古武/网游/末世/赛博/无限流/童话/剧本杀/其他）；空仓显示+一键上传 | [`js/genres.js`](output/preview/js/genres.js) |
| **GAME-AUTO-01** | 上传即自动游戏化 | v5.12 ✅ | 客户贴文本 → 规则引擎分章/抽角色/识别场景/标记高光 → 生成 plotTree → 即刻可玩 | [`js/novel-parser.js`](output/preview/js/novel-parser.js) + [`js/plot-engine.js`](output/preview/js/plot-engine.js) |
| **GAME-AUTO-02** | 覆盖审计保不漏主线/角色/高光 | v5.12 ✅ | `runAudit` 自动核查 chaptersCovered / charsCovered / highlightsCovered；未覆盖角色自动并入首章主节点 | `runAudit()` |
| **IMM-UI-01** | 沉浸剧情对话视觉语言 | v5.13 ✅ | 全屏场景（9 张 SD）+ 角色立绘（左右/居中）+ 底部对话框（半透明黑底）+ 打字机（10-120ms 可调）+ 悬浮选项（hover 偏移 + 高亮 + fx 数值标签）+ 数值实时跳动 + 角色名条 + 章节标题过场 | [`js/plot-engine.js`](output/preview/js/plot-engine.js) + [`plot-runner.html`](output/preview/plot-runner.html) |
| **ORANGE-UI-02** | 结局模态 + 存档/历史 | v5.13 ✅ | LEGENDARY/EPIC/RARE/COMMON 4 稀有度 + 标题 + 引用 + 5 槽位存档 + 最近 50 句历史 | [`js/plot-engine.js`](output/preview/js/plot-engine.js) |
| **AI-HELPER-01** | AI 辅助填表 + 多选项生成 | v5.14 ✅ | 字段旁 🤖 → 弹 2-5 选项 → 换一批/我来说；选项数动态（<5→2-3；5-20→3-4；>20→4-5） | [`js/ai-helper.js`](output/preview/js/ai-helper.js) |
| **AI-HELPER-02** | 22 字段模板库 | v5.14 ✅ | 基础(4) + 世界(4) + 人物(5) + 场景(3) + 对话(3) + 收费(3)；不接真 LLM，规则+模板 | [`js/ai-helper.js`](output/preview/js/ai-helper.js) |
| **CR-01** | 版权分层 L1-L4 | v5.14 ✅ | L1 AI辅助 / L2 人机协作 / L3 作者主导 / L4 纯人工；4 种证书文本 | [`js/copyright-tier.js`](output/preview/js/copyright-tier.js) |
| **MONE-01** | 收费点 22 种 5 类 | v5.14 ✅ | 剧情锁(5) + 道具(5) + 卡牌(4) + 外观(5) + 功能(3)；10-5000 灵晶，平台建议 50-500 | [`js/monetization.js`](output/preview/js/monetization.js) |
| **MONE-02** | 作者分润 5 档 + 月阶梯 | v5.14 ✅ | L1 青铜 50% · L2 白银 60% · L3 黄金 70% · L4 钻石 75% · L5 传奇 80% + 月收入阶梯 | [`js/monetization.js`](output/preview/js/monetization.js) |
| **MONE-03** | MVP 不开放提现 | v5.14 ✅ | 月流水 <10 万 收益仅可平台消费；403 Forbidden | [`js/monetization.js`](output/preview/js/monetization.js) |
| **ADAPT-01** | 改编授权 A/B/C | v5.14 ✅ | A 全版权 60% / B 单品类 70% / C 自主 90%；5 类：影视/动漫/游戏/有声/海外 | [`commerce.html`](output/preview/commerce.html) |
| **ADAPT-02** | 改编合同 5 条核心 | v5.14 ✅ | ①含 AI 仿真人/动画/配音 ②实质修改审批 ③反 AI 训练 ④收益追溯 ⑤质量否决 | [`commerce.html`](output/preview/commerce.html) |
| **QUALITY-01** | 5 维质量评估 | v5.14 ✅ | 叙事 30% + 角色 25% + 文学 20% + AI 味 15% + 合规 10%；硬门槛 (合规/AI味≤40/伏笔≥60%/字数8000) | [`js/quality-review.js`](output/preview/js/quality-review.js) |
| **QUALITY-02** | S/A/B/C/D 等级上架 | v5.14 ✅ | S≥4.5 · A≥4.0 · B≥3.5 · C≥3.0 · D<3.0；3 级审核 (自动→AI→人工) | [`js/quality-review.js`](output/preview/js/quality-review.js) |
| **LEGAL-12** | 用户协议 v2.0 | v5.14 ✅ | 删除"永久免费授权"条款 + AI 训练单独勾选 + 撤回机制 | [`legal/TERMS_OF_SERVICE.md`](legal/TERMS_OF_SERVICE.md) |
| **LEGAL-13** | 侵权投诉分级 | v5.14 ✅ | 普通/紧急/重复侵权 7 工作日处理 | [`legal/COPYRIGHT_COMPLAINT_PROCESS.md`](legal/COPYRIGHT_COMPLAINT_PROCESS.md) |
| **LEGAL-14** | 版权证书 | v5.14 ✅ | 4 级证书动态生成 + 时间戳 + 平台不主张版权声明 | [`legal/COPYRIGHT_CERTIFICATE.md`](legal/COPYRIGHT_CERTIFICATE.md) |
| **AUDIT-01** | 全项目代码审查 | v5.15 ✅ | 9 页面 + 12 JS 模块 + 10 关键交互 + 22 文档全部审查；P0/P1/P2 分级 + 修复 | [AUDIT_2026-09-10.md](AUDIT_2026-09-10.md) |

> **互斥/保守原则**：所有 v5.14 功能**不接真 LLM**（规则引擎+模板库 mock，保留 `window.AIHelper`/`window.LLMJudge` 钩子）；**不接真支付/提现**；**不抽卡/不卖确定性胜利**。所有金额以灵晶为单位计算。

---

## 数据表（v5.14 完整规格）

新增 11 张 localStorage 数据表 + 持久化层 `window.DB`：

| 表 ID | 表名 | 来源需求 |
| --- | --- | --- |
| `novel_copyright_tiers` | 小说版权分层记录 | CR-01 |
| `adaptation_licenses` | 改编授权 | ADAPT-01 |
| `adaptation_revenue_records` | 改编收益分成 | ADAPT-01 |
| `creator_monetization_points` | 作者收费点 | MONE-01 |
| `creator_earnings` | 作者收益 | MONE-02 |
| `novel_quality_reports` | 质量报告 | QUALITY-01 |
| `novel_review_records` | 审核记录 | QUALITY-02 |
| `content_reports` | 侵权举报 | LEGAL-13 |
| `tax_records` | 税务记录 | MONE-03 |
| `aml_monitoring` | 反洗钱监控 | MONE-03 |
| `ai_helper_usage` | AI 辅助填表使用 | AI-HELPER-02 |

完整 DDL + CRUD API 见 [`js/db.js`](output/preview/js/db.js)。

---

## 测试报告清单（v5.6 ~ v5.15）

| 版本 | 报告 | 主要交付 |
| --- | --- | --- |
| v5.6 | [v5.6-TEST-REPORT.md](v5.6-TEST-REPORT.md) | 5 题材 3D 真机可测版 + 11 结局 |
| v5.7 | [v5.7-TEST-REPORT.md](v5.7-TEST-REPORT.md) | 移动端适配 + FPS 监控 + 设置面板 |
| v5.8 | [v5.8-TEST-REPORT.md](v5.8-TEST-REPORT.md) | 重设计（聊天视图）— 历史归档 |
| v5.10 | [v5.10-TEST-REPORT.md](v5.10-TEST-REPORT.md) | SD 真实立绘 + Blender .glb 模型 |
| v5.11 | [v5.11-TEST-REPORT.md](v5.11-TEST-REPORT.md) | 9 题材 + GLTFLoader + AudioFX 重建 |
| v5.12 | [v5.12-TEST-REPORT.md](v5.12-TEST-REPORT.md) | 30 题材库 + 上传即生成 + 5 demo + 覆盖审计 |
| v5.13 | ([v5.13 含 v5.14-TEST-REPORT.md 第 1 节](v5.14-TEST-REPORT.md)) | 沉浸剧情对话 UI |
| v5.14 | [v5.14-TEST-REPORT.md](v5.14-TEST-REPORT.md) | 商业化 4 大系统 |
| **v5.15** | **[AUDIT_2026-09-10.md](AUDIT_2026-09-10.md)** | **全项目代码审查 + 死链修复** |

## 内容规模与质量
正式目标：吕布每路径30点/6结局；达西28点/6结局；岳飞26点/5结局。不同路线可复用共通章节；分别统计总节点与每路径节点。选项必须有意义，不用同一占位事件重复凑数。原著NPC不要求一次实现所有视角；未支持的角色不得显示为可玩。

13部候选：三国、隋唐、东周列国志、史记项羽本纪、傲慢与偏见、呼啸山庄、简爱、老残游记、说岳、水浒、德古拉、庄子/山海经、二十年目睹之怪现状。第11–14周先扩隋唐/呼啸/老残/德古拉/水浒。原著公版不能推导现代译本/插图/音频自由使用，发布须逐版本授权审核。

## 正式发布闸门
实名与年龄服务端真实拦截；三部完整内容可达测试；存档跨重启；全流程E2E；记忆冲突/预算熔断/关系衰减回归；用户隔离；安全管线与紧急联系核验；删除导出；成本/性能/运维及法律材料。任一开发模拟不可被勾成上线完成。
完整游玩率定义：有效开局到达合法结局并生成命运卡的会话占比。启动率30%、完整率20%、分享率15%、叙事D7留存25%为待验证目标，不能承诺。

---

## 2026-09-10 新增范围（v5.17 · 商业化降级 + 小说辅助模拟器）

> **本节是 v5.14 商业化系统的延续与重构**：商业化已从顶级功能区降级为创作者中心内部按键；同时新增小说辅助模拟器，为不懂写作的作者提供"填表+提问"完整工具链。

### 关键变更

#### 变更 1：商业化降级（架构调整）

| 项目 | v5.14 错误做法 | v5.17 正确做法 |
| --- | --- | --- |
| 商业化入口位置 | 顶级功能区（与"小说世界""双生陪伴""创作中心"并列） | 创作者中心内部按键"上架与定价" |
| 客户可见性 | 客户（玩家）打开 App 能看到商业化按钮 | **客户（玩家）看不到**任何商业化相关界面 |
| 入口文件 | `commerce.html` 作为顶级独立页 | `creator-center.html` → `commerce.html` |
| 商业化本身功能 | 版权分层/收费点/收益/审核 4 大系统 | **不变**，仅入口位置改变 |

**用户原始反馈**：
> "商业化这个单独一个功能区合适吗？客户打开软件是为了玩游戏体验陪伴功能，这个商业化功能区只对作者有关系应该放到创作者中心功能区里以一个功能按键体现，点击这个按键是这个商业化详细介绍，名字改个作者以看就知道是什么的"

#### 变更 2：新增"小说辅助模拟器"（核心新增）

| 新增需求ID | 名称 | 阶段 | 验收标准 | 对应规范/模块 |
| --- | --- | --- | --- | --- |
| **CREATE-CENTER-01** | 创作者中心主页 | v5.17 ✅ | 3 大核心按键（创建新世界 / 小说辅助模拟器 / 上架与定价）+ 数据看板（作品数/完成度/收益/版权分级）+ 我的作品列表 + 入门指引 | [`creator-center.html`](../output/preview/creator-center.html) |
| **CREATE-CENTER-02** | 创建新世界三入口 | v5.17 ✅ | 🤖 AI 辅助（→ 小说辅助模拟器）/ ✍️ 自己写 / 📤 上传 TXT/MD/DOCX | [`creator-create.html`](../output/preview/creator-create.html) |
| **AI-NOVEL-01** | 小说辅助模拟器 | v5.17 ✅ | 6 张表 Tab（基础信息/世界格局/主线情节/章节细纲/人物小传/场景对话）+ 14 字段旁 🤖 帮我写 + 选项弹窗 + 换一批/我来说 + 自动保存 + 完成度追踪 | [`novel-ai-helper.html`](../output/preview/novel-ai-helper.html) + [`js/novel-outline.js`](../output/preview/js/novel-outline.js) |
| **AI-NOVEL-02** | 28 字段模板 | v5.17 ✅ | 基础信息表 7 字段 + 世界格局表 7 字段 + 主线情节表 6 字段 + 章节细纲表 8 字段；每字段都有 AI 生成规则 | `js/novel-outline.js` |
| **AI-NOVEL-03** | 人物小传系统 | v5.17 ✅ | 核心 10 要素（姓名/性别/年龄/外形/性格/家庭/感情/阶层/习惯/成长）+ 语言指纹（风格/口癖/句长/常用词/绝不说的词） | [`js/character-profile.js`](../output/preview/js/character-profile.js) |
| **AI-NOVEL-04** | 场景卡+对话场景卡 | v5.17 ✅ | 场景卡 12 字段（编号/地点/时间/人物/目标/冲突/类型/情绪曲线/关键细节/结尾/伏笔）；对话卡 7 字段；场景三要素+对话五原则 | [`js/scene-card.js`](../output/preview/js/scene-card.js) |
| **AI-NOVEL-05** | AI 格外提问（12 类模板） | v5.17 ✅ | 场景类 3（描写/过渡/氛围）+ 角色类 4（出场/内心/成长/关系）+ 对话类 3（重写/设计/金句）+ 情节类 4（转折/伏笔/升级/节奏）；每类返回 3 版本选项 + 推荐版本 + 区别说明 | [`js/ai-question.js`](../output/preview/js/ai-question.js) |
| **AI-NOVEL-06** | 选项数量动态控制 | v5.17 ✅ | 使用次数 ≤5 给 2-3 选项；5-20 给 3-4 选项；>20 给 4-5 选项 | `js/novel-outline.js` + `js/character-profile.js` + `js/scene-card.js` |
| **AI-NOVEL-07** | 伏笔台账 | v5.17 ✅ | 编号/内容/埋设章节/回收章节/类型（5 种）/重要度（0-1）/状态（4 种）+ 自动提醒算法（按章节推进 + 重要度排序） | [`js/foreshadowing.js`](../output/preview/js/foreshadowing.js) |
| **AI-NOVEL-08** | 自动质量检测（6 维度） | v5.17 ✅ | 角色一致性（25%）+ 语言指纹（20%）+ 伏笔状态（20%）+ 时间线（15%）+ 世界规则（10%）+ 场景完整度（10%）；pass/warn/fail + 具体位置 + 修复建议 | [`js/quality-auto.js`](../output/preview/js/quality-auto.js) |
| **COMMERCE-DOWNGRADE-01** | 商业化降级 | v5.17 ✅ | commerce.html 不再作为顶级入口，改为 creator-center.html 内部子页；library.html 主导航增加"✍️ 创作者中心"按钮；客户（玩家）看不到任何商业化界面 | [`creator-center.html`](../output/preview/creator-center.html) + [`library.html`](../output/preview/library.html) + [`commerce.html`](../output/preview/commerce.html) |

### 数据表 11 → 17 张

新增 6 张表（小说辅助模拟器）：

| 表 ID | 表名 | 来源需求 |
| --- | --- | --- |
| `novel_outline` | 大纲要素表（基础信息/世界格局/主线情节/章节细纲 4 大类 28 字段） | AI-NOVEL-01/02 |
| `character_profiles` | 人物小传（核心 10 要素+次要 5 要素+语言指纹） | AI-NOVEL-03 |
| `scene_cards` | 场景卡（场景三要素+目标/冲突/情绪曲线/关键细节） | AI-NOVEL-04 |
| `dialogue_cards` | 对话场景卡（双方/场景/目标/关系/基调/关键信息） | AI-NOVEL-04 |
| `ai_questions` | AI 格外提问记录（12 类模板 + 多版本选项） | AI-NOVEL-05 |
| `foreshadowing_tracker` | 伏笔台账（编号/埋设/回收/类型/重要度/状态） | AI-NOVEL-07 |

完整 DDL + CRUD API 见 [`js/db.js`](../output/preview/js/db.js)。新版 key 前缀 `lingjing_v517_`。

### 模块依赖关系

```
creator-center.html (创作者中心主页)
   ├── creator-create.html (创建新世界三入口)
   │    ├── novel-ai-helper.html (🤖 AI 辅助) ← 新增
   │    ├── 写作编辑器 (✍️ 自己写 — 暂未实现)
   │    └── novel-upload.html (📤 上传 TXT)
   └── commerce.html (上架与定价 — 原 v5.14 商业化降级)
        ├── 版权分层 (L1-L4)
        ├── 收费点 (22 种)
        ├── 收益分成 (5 档)
        └── 改编授权 (3 级)

novel-ai-helper.html (小说辅助模拟器)
   ├── js/novel-outline.js (28 字段模板 + AI 生成)
   ├── js/character-profile.js (10 要素 + 语言指纹)
   ├── js/scene-card.js (场景卡 + 对话卡)
   ├── js/ai-question.js (12 类提问模板)
   ├── js/foreshadowing.js (伏笔台账)
   └── js/quality-auto.js (6 维度自动检测)
```

### 与 v5.14 的兼容

- 11 张 v5.14 表完整保留（数据迁移：新 key 前缀 `lingjing_v514_` → `lingjing_v517_`）
- commerce.html 4 大系统功能不变，仅入口位置改变
- 原有 AI 辅助填表（22 字段模板）逻辑被新 28 字段 + 12 类提问系统增强

> **互斥/保守原则**：所有 v5.17 功能**不接真 LLM**（规则引擎+模板库 mock，保留 `window.AIHelper`/`window.LLMJudge` 钩子）；**不接真支付/提现**；**不抽卡/不卖确定性胜利**。所有金额以灵晶为单位计算。客户（玩家）永远看不到商业化界面。

---

## v5.20 心屿 · 陪伴功能区正式落地

**功能命名**：「**心屿**」（Xin Yu / Heart Island）— 心灵的岛屿，每个角色都是用户心中的一座岛屿，可以随时停靠、休憩、生活。

**功能定位**：AI 角色陪伴 × 双界角色系统。心屿是灵境 · 双生的陪伴功能模块；与小说世界构成"双界"——角色在心屿中是你日常的伴侣，在小说世界中是故事的一部分。两者通过带出机制产生交集。

**替换关系**：v5.19 阶段性的"知己"是过渡称谓；自 v5.20 起统一为「心屿」。底层 data model 也叫 `heart_island_*`，对标实现与文案全部统一。

### 一、双界角色系统（核心差异化）

**一个角色，两种存在形态**：

- **心屿中**：日常伴侣 — 聊天 / 关心 / 共同成长
- **小说世界中**：故事的一部分 — 经历命运 / 面临选择 / 改变剧情

**4 类来源**：

| 来源 | 创建方式 | 是否可带出 | 费用 |
|---|---|---|---|
| 用户自创角色 | 在心屿中直接创建 | 天然属于 | 免费 |
| 小说 NPC | 在小说世界中遇到 | 需满足条件 | 800-3000 灵晶 |
| 小说主角 | 扮演/遇到 | 需满足条件 | 3000 灵晶 |
| 官方预设角色 | 平台提供 | 可直接使用 | 免费/订阅 |

**带出条件（三重验证）**：①亲密度 ≥ 80（羁绊阶段）②已完成该角色的个人线（已付费解锁）③支付带出费用。设计逻辑：用户已经投入了时间和情感，付费意愿最高。

**双界穿梭**：
- 心屿 → 小说世界：点击"进入 TA 的世界"，角色保留心屿中的记忆
- 小说 → 心屿：点击"带 TA 回到身边"，角色保留小说世界中的记忆
- 双界记忆贯通：心屿对话 / 小说剧情 / 小说选择 / 关系值 / CG 全部互通

### 二、7 层角色创建

| 层 | 关键字段 |
|---|---|
| 1. 基础信息 | 姓名 / 性别 / 年龄（合规默认 25+）/ 种族 / 身份 |
| 2. 外貌形象 | 脸型 / 发型 / 发色 / 瞳色 / 体型 / 服装风格 / 立绘 |
| 3. 人格与性格（10 维 0-100） | 开放性 / 尽责性 / 外向性 / 宜人性 / 神经质 / 幽默感 / 共情力 / 独立性 / 浪漫倾向 / 支配性 |
| 4. 声音与语音 | 音色 / 语速 / 语调 / 方言 |
| 5. 背景故事 | 身世 / 重要经历 / 当前目标 / 内心秘密 / 恐惧 / 渴望 / 信念 |
| 6. 关系设定 | 与用户的关系 / 起始状态 / 发展速度 |
| 7. 能力与特长 | 特长 / 弱点 / 具体技能 |

支持 **AI 一键生成**（一句话描述 → 完整角色 DNA，用户可改）+ **从小说带出**（保留性格 / 记忆 / 关系值 / 关键经历）。

### 三、6 阶段亲密度（7 维关系）

**6 阶段**：

| 阶段 | 亲密度 | 解锁内容 |
|---|---|---|
| 初识 | 0-20 | 基础聊天 |
| 熟悉 | 21-40 | 语音通话、角色日记 |
| 朋友 | 41-60 | 朋友圈、动态 |
| 亲密 | 61-80 | 专属剧情、主动关心 |
| 知己 | 81-95 | 深度秘密、专属 CG |
| 灵魂伴侣 | 96-100 | 角色专属结局、双界穿越 |

**7 维关系**：信任 / 亲密 / 熟悉 / 尊重 / 吸引 / 理解 / 共同历史。每维独立 0-100，记录日常互动累积。

**关系健康监测**：依赖风险（0.7 阈值）/ 单日使用时长（2h 休息提醒）/ 现实社交平衡（连续 7 天无其他社交触发提醒）。

### 四、6 种日常互动

文字聊天 / 语音通话 / 视频通话（后期）/ 朋友圈 / 角色日记 / 共同活动（看电影 / 听音乐 / 读书 / 散步 / 做饭 / 打游戏）

**角色主动行为**（默认开启，可关闭）：
- 早安 / 晚安（按作息时间）
- 关心提醒（情绪低落检测）
- 分享日常（角色"经历"事件）
- 纪念日提醒（生日 / 相识纪念日）
- 主动邀请（角色"想"和用户互动）

**不构成情感勒索**（不说"你为什么不回来"）。

### 五、4 张新数据表（17 → 21）

```sql
-- 18. 心屿角色主表（含 7 维关系 + 双界来源）
heart_island_characters (id, user_id, character_id, character_name,
  source_type, source_world_id, source_novel_id, dual_status,
  intimacy_level, intimacy_stage,
  trust, intimacy, familiarity, respect, attraction, understanding, shared_history,
  is_active, last_interaction_at, created_at, updated_at)

-- 19. 双界带出记录
dual_soul_bringout_records (id, user_id, character_id,
  brought_out_at, bring_out_cost, intimacy_at_bringout,
  dual_status, unlocked_skins, unlocked_cg, unlocked_voicepacks)

-- 20. 日常互动记录
daily_interactions (id, user_id, character_id, interaction_type,
  content, duration_seconds, intimacy_gain, mood_before, mood_after, location)

-- 21. 角色主动行为
proactive_behaviors (id, character_id, user_id, behavior_type,
  content, is_read, trigger_source, created_at)
```

完整 schema 见 `output/preview/js/db.js`（21 张表，前缀 `lingjing_v520_`）。

### 六、8 个 REST 接口（`/api/v1/heart-island/*`）

| Method | Endpoint | 说明 |
|---|---|---|
| GET/POST | `/characters` | 心屿角色列表 / 创建 |
| GET/PATCH/DELETE | `/characters/{id}` | 角色详情 / 更新 / 删除 |
| POST | `/characters/{id}/chat` | 发送消息 |
| POST | `/characters/{id}/voice` | 语音通话 |
| GET | `/characters/{id}/moments` | 朋友圈动态 |
| GET | `/characters/{id}/diary` | 角色日记 |
| POST | `/characters/{id}/activity` | 发起共同活动 |
| GET | `/characters/{id}/relationship` | 关系状态 |
| POST | `/characters/{id}/bringout` | 从小说带出 |
| POST | `/characters/{id}/enter-world` | 进入小说世界 |
| GET | `/characters/{id}/memories` | 双界共享记忆 |

### 七、与现有系统的集成

| 调用系统 | 调用方式 |
|---|---|
| Character DNA | 角色的性格 / 语言风格 / 背景故事 |
| Memory Engine | 存储 + 检索互动记忆 |
| Relationship Engine | 管理关系值 + 亲密度 |
| Emotion Engine | 角色情绪状态 |
| 3D Avatar | 角色立绘 + 动画 |
| Voice Engine | 语音通话 |
| **小说世界** | 双界穿梭接口（心屿 ↔ 小说） |

**与小说世界的接口**：
- 从小说带出角色（小说 → 心屿，灵晶消费）
- 进入小说世界（心屿 → 小说）
- 双界记忆同步（两个世界的记忆互通）
- 关系值同步（两个世界的关系值相互影响）

### 八、验收标准

1. 用户在心屿中创建角色时，可填写 7 层维度的全部字段
2. 用户可给角色发消息 / 语音通话
3. 角色主动问候 / 关心 / 分享日常
4. 亲密度随互动提升；升级阶段时解锁新互动内容
5. 用户可从小说带出角色到心屿（带出条件三重验证）
6. 用户可带角色回到小说世界
7. 双界记忆贯通，角色会主动提起小说中的经历
8. 用户可邀请角色从心屿回到自己的小说主线（双界穿梭）

### 九、视觉与命名规则

- **功能名**：心屿（Xin Yu / Heart Island）— 不再使用"知己 / 陪伴 / 数字伴户"等代称
- **主页文件名**：`heart-island.html`（v5.19 的 companion.html 已重命名）
- **视觉延续**：沿用 v5.19 沉淀的"心色调"（粉紫渐变 + 暖光琥珀，移动优先 520px）
- **底部 tab bar emoji**：🏝️（岛屿意象，对应"心屿"）

### 十、与 v5.19 关系

v5.19 的 4 个"知己"页面（companion / chat / memory / profile）作为心屿的骨架存在；v5.20 在此基础上：
1. 改名 + 重新承载「心屿」官方语义
2. 接入 db.js 4 张新表（21 张）
3. 后续 v5.21+：新增 `character-create.html`（7 步 wizard）/`character-detail.html`（关系养成）

---

## 2026-09-13 新增范围（v5.21 · 小说辅助模拟器增强与创作界面优化）

> **本节是基于用户最新反馈，对 v5.17 中“小说辅助模拟器”的深度优化，并结合了创作界面的全新设计理念。**

### 关键变更

#### 变更 1：问卷式引导的保留与改造

为了提升用户体验，将问卷式引导从“填空题”升级为“引导式选项 + 自由输入”的混合模式，并引入对话式引导。

| 项目 | 现有 v5.17 | v5.21 优化后 |\
| --- | --- | --- |\
| 核心必答项 | 6 张表 Tab，多个字段 | **精简为 3 个核心问题**：题材与创意概要、主角设定、核心冲突与驱动力 |\
| 第二层问题 | 所有问题一次性展示 | **改为“深度定制”模块（选答）**：世界观、配角、关系网络、故事长度、情感基调等，每个问题提供“随机生成”选项 |\
| AI 生成 | 字段旁 🤖 帮我写 + 选项弹窗 | 每个问题旁增加 **“AI随机生成”按钮**，点击后 AI 根据已有信息生成合理答案 |\
| 自由输入 | 现有字段输入 | 每个问题保留 **“自由描述”入口**，允许作者自由输入 |\
| 呈现方式 | 表格化展示 | **分步向导**（每步完成后展示摘要）+ **对话式引导**（系统以聊天方式逐个提问） |\
| 摘要确认 | 无明确摘要确认机制 | 完成第一层后，系统自动生成一份 **“摘要展示”**，让作者确认 |\

#### 变更 2：创作界面的布局建议（PC 端三栏布局）

PC 端主编辑器将采用三栏布局，优化创作工作流。

| 区域 | 宽度 | 内容 |\
| --- | --- | --- |\
| 左侧栏 | 20% | 章节列表、大纲入口、人物库、伏笔追踪 |\
| 中间编辑区 | 55% | 正文写作区，最主要的操作区域 |\
| 右侧辅助区 | 25% | AI 辅助面板、当前章目标、出场人物、未回收伏笔 |\

#### 变更 3：AI 辅助面板的关键设计

AI 辅助面板将提供更智能、更灵活的交互方式。

| 项目 | 现有 AI 辅助 | v5.21 优化后 |\
| --- | --- | --- |\
| 候选答案数量 | 2-5 选项 | AI 必须给 **3-5 个候选**，不能只给一个答案 |\
| 交互按钮 | 换一批/我来说 | 每个候选旁边有 **[使用] 和 [换一批]** 按钮 |\
| 自由输入 | 无明确入口 | 底部有 **[我来说]**，作者可直接输入想法，AI 格式化 |\

#### 变更 4：从“填表”到“对话式引导”

将问卷做成一种对话式体验，降低使用门槛。

- 系统以聊天的方式逐个提问，而不是一次性展示所有表单。
- 作者回答后，系统给出反馈和确认，再进入下一个问题。
- 如果作者卡住了，系统主动提供选项和建议。
- 最终形成一份“创作简报”，作为后续章节生成的基准。

---

## 模块依赖关系更新

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





`r`n`r`n## 世界演出交互验收补充（2026-09-16）`r`n- Canon 主线正文按句播放；点击继续先推进当前锚点句子，句子结束后才进入下一个画面。`r`n- 场景变化由 Scene/Presentation 数据驱动，背景、人物和镜头变化时切换演出画面。`r`n- 地点、家具、道具、人物必须是可点击热点；点击后显示查看、使用、前往、交谈等对象对应操作。`r`n- 世界探索结果标记为【世界探索】，不得冒充原著正文；世界功能区不使用聊天气泡。`r`n


---

## V27.0 编辑我的作品 — 修复与增强（2026-09-19 · PRD 增量登记）

> 来源需求：《创作功能区「编辑我的作品」完整开发文档 V1.0》+《作品卡片操作按钮修复文档》（用户原文，针对 trae 反复未修复的问题由本轮一次性收口）。承接 V26 工作台（my-works 历史全集 + workshop 工作台），覆盖 my-works / work-editor / novel-canon-reader 三页。

### 需求清单（P1-P5 全部受理并交付）

| 优先级 | 需求 | 交付裁决 |
| --- | --- | --- |
| P1 Bug | 右上角返回按键点击没反应 | 根因：`history.back()` 在 iframe srcdoc 路由下无自身历史。修复：改 `LJBack()`（postMessage `{lj:'back'}` → shell 弹 LJ_BACK_STACK） |
| P2 Bug | 点击"添加收费道具"不能添加 | 根因：旧弹窗 innerHTML 引号嵌套截断导致按钮失效。重写六字段弹窗：类型 5 pill / 名称 / 描述 / 价格 / 图片三方式 / 触发条件；支持编辑与删除，按 wid 分组持久化 |
| P3 Bug | 续写功能不能续写 | 根因：候选只高亮无[使用]动作 + aiAssist 找错编辑器。对齐小说辅助模拟器：4 候选 + [使用]写入正文 + 🔄换一批 + ✍️我来说 + AI 润色/重写/场景描写/对话优化 + 字数状态栏实时更新 + 章节内容保存恢复 |
| P4 缺失 | 作者上传/修改背景图、人物立绘、道具图标 | 命名「图片管理」（素材 Tab 重写）：背景图/人物立绘/道具图标三区；三方式 = 上传本地（JPG/PNG ≤5MB）/ AI 生成（4 候选 + 换一批）/ 系统预设库；版本管理自动保留旧版，可一键回滚（含默认样式 V1） |
| P5 缺失 | 预览支持选择章节 + 真实小说世界效果 + 反馈闭环 | 预览弹层列全部章节（含"从第一章开始预览"）→ 跳真实小说世界 Runtime（八层舞台：背景/立绘/对话框/热点）→ 顶部预览悬浮条一键返回 → 反馈面板三组满意度（背景图/人物立绘/收费道具，默认不满意显示跳转按钮）→ 直跳对应修改区 |

### 红线遵守
- 界面布局保持现状，只补功能；全部按钮实际可点击（Playwright 39/39 断言），无"开发中"占位
- 不接真 LLM / 真支付（候选池轮换 mock + AIHelper 钩子）；货币只用灵晶；Toast/自绘弹窗替代 alert/confirm
- 删除作品走确认弹窗 + 隐藏名单持久化，收益记录保留

### 存储键（V27 新增）
- `lingjing_v527_hidden_works`：已删除作品名单（my-works 过滤）
- `lingjing_v527_monet_items`(+`_hidden`)：收费道具按作品 wid 分组
- sessionStorage `lingjing_v527_preview_pending`：预览上下文（10 分钟有效，返回后弹反馈面板）

### 关联修复（回归中发现并一并修复）
- work-editor 引导时序：`initWorkEditor()` 同步执行时 V27 后置脚本块函数未定义（`renderMonetItems is not defined`）→ 延迟至 DOMContentLoaded
- `applyAsset` 首次替换默认资产未记录版本 → 系统默认样式自动记为 V1，保证可回滚


---

## V28.0 桌面 letterbox + 小说详细介绍页（2026-09-19）

### 背景（用户反馈）
- 截图 A：小说世界游戏页在电脑端 1108px 宽横屏下全屏拉伸、空旷难看——本产品是手机 App 形态，桌面必须锁定手机竖屏比例
- 截图 B：从游戏返回进入的是「灵境·小说世界」书目选择页（world-hub），不符合预期——应进入类似橙光的小说详细介绍页，且软件货币是灵晶（禁止出现第三方产品名）

### 交付范围（V28-A / V28-B / V28-C 全部完成）

#### V28-A 桌面横屏 letterbox（壳层）
- 壳层 `#stage` 新增 `@media (min-width:481px)` 媒体查询：舞台固定 480px 宽水平居中（left:0;right:0;margin:auto），加 1px 描边 + 大范围暗色投影；`body.stage-on` 背景加深为 #06060f 并叠加红紫径向光晕装饰（::before，pointer-events:none）
- 手机端（≤480px）不受影响；全部 65 页统一生效

#### V28-B 新增 novel-detail 小说详细介绍页（橙光式，货币=灵晶）
- **页面结构**：顶栏（返回 + 标题 + 作品ID）→ 封面 hero（渐变封面 + 徽章 + 书名/作者/章节信息）→ 数据行（评分 / 人气值 / **灵晶值**）→ 标签行 → 三 Tab：
  - 详情：作品简介 / 更新日志时间线 / 付费信息卡（前 X 章免费 · 后续 X 灵晶/章，收益归创作者）/ 特别参演（角色胶囊）
  - 角色：主要角色卡列表（头像 + 名 + 一句话人设）
  - 互动：点赞/收藏大按钮 + 读者评论列表 + 评论输入框（发布置顶、Enter 提交）
- **底部操作栏**（fixed）：♡点赞 / ☆收藏 / 世界游客 / ▶ 开始阅读
- **书目数据 BOOKS**：6 本，与世界页 WORLDS、剧情页 BOOK_META 对齐——西游记/红楼梦/三国演义/水浒传（生成中徽章）/聊斋志异/桃花源记（短篇体验、隐藏世界游客按钮、开始阅读走 demo=1）
- **持久化**：`lingjing_v528_detail`（按 bookId 分组：liked/collected/mine 评论），刷新保持
- **路由改造**：
  - world-hub `enterWorld()`：`LJ.go('world-view',…)` → `LJ.go('novel-detail','book=…')`（fallback 同步）
  - novel-game 顶部「↩」与入口遮罩「‹ 返回」：带 `?book=` 进入时 → `LJBack()` 退出游戏回详情页；自由模式保持原逻辑（铁律 #7：游戏内返回=退出游戏）

#### V28-B 关联修复（探查中发现的产品级断链，一并修复）
1. **壳层 novel-game→world-view 旧映射删除（2 处）**：`LJ.go` 内 `if (id==='novel-game'){id='world-view'}` 与 LJEnter 三元式——该映射导致单 HTML 架构下 V20-V 游戏引擎彻底不可达（plot-detail ▶ 游玩也被劫持），用户看到的"游戏页"实为 world-view
2. **novel-game 参数获取修复**：srcdoc 下 `location.search` 恒空 → 新增 `ngQS()`（优先 `__LJ_PARAMS__`/LJSearch 并规范化 `?` 前缀），init 的 `?demo=1`/`?book=` 分支与两处返回检测全部改用
3. **壳层 back 栈死循环修复**：`LJBack` 弹栈后调 `LJ.go(prev)` 会把当前页压回栈，导致 详情↔游戏 返回链死循环 → `LJ.go` 增加第 4 参 `__noPush`，message back 弹栈路径传 `true`（back 触发的路由不再压栈）
4. **novel-game `?book=` 走内嵌公版**：新增 `loadEmbedded(bookId)`，bootstrap 的 book 分支改调——完整 corpus txt 与 parseOriginalNovel 体例不匹配（title 解析为「第1」、1104 碎章）且原路径在 srcdoc 下 404，内嵌文本才是 V20-X 实际验收路径；消除 404 console error，书名正确显示
5. **world-view `showToast` 函数头补回**：并行提交（R18 ESC 面板）吞掉函数声明行导致 `showToast is not defined`，scene/chapter toast 全部失效
6. **world-hub tabbar-embed.css 路径修复**：页面内硬编码 `output/preview/css/...` 在 base href 下重复拼接 404 → 改相对路径 `css/tabbar-embed.css`

### 红线自查
- 货币一律灵晶，页面无「丸子」等第三方名（grep 校验）✅
- 5 Tab 不动、novel-detail 为功能页不带全局 tabbar、有返回箭头（铁律 #4/#7）✅
- 未砍任何功能：world-view 保留（详情页「世界游客」入口 + 直链）✅
- 纯前端 mock 数据（评分/人气/灵晶值为演示数据，页面已标注）✅

### 存储
- localStorage `lingjing_v528_detail`：`{ [bookId]: { liked, collected, mine: [{t}] } }`

### 验收（scripts/test_v28_desktop.py，32/32 通过）
- S0 桌面 letterbox：1150×800 下 stage 宽=480、x=335 居中
- S1 详情内容 9 项（书名/作者/作品ID/评分/人气值/灵晶值/标签/开始阅读/付费含灵晶）
- S2 交互 11 项（角色 4 卡、评论 2→3、点赞 8643、收藏态、刷新持久化 ×3）
- S3 全链路 5 项：world-hub 书卡 → novel-detail → novel-game（书名含西游）→ 遮罩返回 → 详情 → 返回 → world-hub
- S4 pageerror=0 + console.error=0（404 已清零）
- S5 手机对照：390×844 下 stage 全宽、红楼梦详情正常
- 截图 9 张 → screenshots/v28/s00~s08
