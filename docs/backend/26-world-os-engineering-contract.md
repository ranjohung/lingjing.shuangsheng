# 灵境 · 双生 — World OS 工程交接契约 v5.1

2026-09-09。用户已确认全部聊天记录提供完毕。来源S07与S05/S06完全相同；正文重复粘贴不增加重复任务。本文将原稿七项缺口转为开发交付项；接口字段、事务策略和测试方法属于本次工程设计，尚未实现。

## 七项缺口的落点

| 缺口 | 需求 | 交付物 | 开发包 |
| --- | --- | --- | --- |
| 类型/索引/外键/默认值 | DATA-01 | [9表原始DDL](27-world-os-source-ddl.md)+正式迁移与约束补强 | B0/B2/B3/B4/B7 |
| AI调用链 | WOS-09/13 | 八步骤输入输出、合法性校验、失败路径 | B3/B4 |
| 已有引擎集成 | WOS-14 | Memory/Relationship/Emotion/Avatar适配及事件版本 | B2/B3/B5/B10 |
| 成本和缓存 | WOS-08/ECON-07 | 模型次数、token、TTL、LOD、预算预占/结算 | B2/B8 |
| 一致性和回滚 | WOS-05/13/NOV-04 | revision、幂等、原子提交、分支恢复、故障注入 | B2/B3/B4 |
| 内容安全 | WOS-15/LEGAL-10 | 审核、有效举报临时下架、申诉、处罚审计 | B7/B11 |
| 可量化验收 | PLAN-01 | WS1–WS9证据表与环境/样本说明 | 对应各包 |

## 数据库交付边界

原稿九表：worlds、world_rules、world_characters、story_bible、chapters、world_events、timelines、player_actions、content_reports；此前S03的event_logs仍保留。所有原字段和CREATE INDEX见DDL附件，不遗漏原稿world_rules.rule_type、world_characters.current_location_id、player_actions.character_id等索引。

正式迁移需包含：

1. users/已有角色/locations等依赖核对；UUID默认值可用性验证；按依赖顺序创建，循环引用分次加约束；不重建现有users或重复创建已有表。
2. 世界模板、用户游玩实例、时间线状态分层。公开世界的原始设定不能被单个玩家行动直接修改。所有状态写入带user_id、world_instance_id、timeline_id与revision；同名NPC在不同玩家/分支有独立状态。
3. 补story_bible.timeline_id、地点引用、角色与事件的同世界/同实例约束；participants UUID[]原格式留兼容，正式设计以关联表确保引用合法。删除依赖明确，不让ON DELETE CASCADE误删另一用户的内容或依法需留存的交易。
4. 数值范围、非负库存/字数、章节号正数及唯一、角色重要度1–4、枚举状态CHECK；人格0–1存储与UI0–100转换；概率统一0–1。quality_score量纲需在正式模型中明确，不能凭浮点字段猜评分标准。
5. 业务时间和现实审计时间分开：current_time为世界历法，created_at/updated_at等为带时区现实时间；updated_at须更新机制，不能只设DEFAULT NOW()。原event start/end字段的世界时间含义需在迁移契约中明确。
6. 历史快照绑定内容/规则/模型输出契约版本；旧存档迁移失败可继续旧版或明确不可迁移，不静默重置。Alembic升级、回滚、保留数据升级及PostgreSQL真实联调通过后才算DATA-01实现。

## 八步AI链：程序裁决，模型生成受约束文本

公共上下文：request_id、user_id（认证取得）、world_instance_id、timeline_id、character_instance_id、expected_revision、content_version。重试使用同一幂等键；不接受模型或客户端自行指定用户身份、收费和成功结果。

| 步骤 | 输入 | 输出契约 | 失败处理 |
| --- | --- | --- | --- |
| 1 Action Parser / cheap | 原始输入+可见场景目标 | intent/target/style/risk；校验类型及允许值 | 不可解析给澄清/合法选项，禁止直接改变世界 |
| 2 Rule Check / 程序 | 意图+世界规则+目标位置+玩家状态 | allowed、reason_codes、合法行动成本 | 目标不在场/状态不允许则拒绝，不扣行动资源 |
| 3 Probability / 程序 | 能力+环境−目标抵抗+风险修正 | probability、seed、rule_version、success/failure/partial | 31.5%样例可复现；非法数值拒绝，不把自由输入当必成 |
| 4 Event / 程序 | 裁决结果、前状态 | event_id、cause、effects、延迟/隐藏后果 | 与第5步同事务准备，不提前公开未提交事件 |
| 5 World Update / 程序 | 事件及effects | committed_revision、state_delta、event_log、outbox | revision冲突拒绝旧请求；失败全回滚，不留下半个事件 |
| 6 Story Director / medium | 已提交世界/人物/事件/关系/目标 | opportunities、route_candidate、narrative_brief | 原稿“叙事文本”归为导演叙事提纲；合法路线条件由程序再次裁决 |
| 7 Narrative Generator / medium | 导演提纲+世界摘要+最近对话 | narrative_text、source_event_ids、允许的表现指令 | 不更改步骤3结果或步骤5状态；失败返回作者/规则文本 |
| 8 Editor / cheap | 草稿+人设+历史+规则 | issues、corrected_text、pass | OOC/历史/规则冲突修正后复检，最多2次修正重试；仍失败使用已审定文本 |

确定工程口径C26：Director可输出叙事提纲，Generator输出正式正文；两个职责均保留，避免重复生成和冲突。Editor重试同样计费记账，不重放前五步。用户原文“<3次问题/章”为初次检测指标，发布前严重冲突须归零。

## 引擎适配与事件可靠性

Memory：保留store(user_id, character_id, content, type=world_event, importance, embedding)和retrieve(...query, limit=5)原接口意图；world_event作为可迁移类型或事件子类型显式适配。内容来自已提交事件；embedding失败时文本已保存、索引任务可重试。召回限定用户/角色实例/时间线/可见权限，不能用limit=5代替权限过滤。

Relationship：update(...delta={trust,affection})和get(...)；Emotion：update(character_id,event,intensity)和get(...)；适配层补实例与revision，用户间NPC不能共享可变关系/情绪。状态变化进同一事务，若已有服务不能同库事务则以唯一event_id消费、重试和可观测同步状态保证幂等。

Avatar：scene_update保留location/time/weather、characters[id/position/animation/expression]、ambient_sound、lighting[intensity/color]；外层增加schema_version/world_instance_id/timeline_id/revision/event_id。事件通过事务outbox发布；消费端丢弃旧revision/重复事件，断线重连获取快照。Three.js/Unity为可选接收器，现有Web框架不迁移到Unity；3D未加载时保留2D阅读。

失败恢复：事务前故障零副作用；提交后推送失败重发outbox；AI后处理失败展示已提交结果的替代文本；客户端超时按幂等键查询原结果；延迟事件以唯一计划事件ID执行一次；读档/分支创建新活动时间线，旧延迟任务不误投新线。

## 预算、LOD与缓存的执行要求

每世界每日次数初始配置：cheap500、medium100、premium10；单响应生成上限500/2000/8000。原token估算Parser200–500、Director500–1500、Narrator800–3000、Editor300–800、世界生成3000–10000全部保留为工作量估算；超上限需拆分任务或限长，每段和重试仍计额度，不绕过预算。

调用前原子预占次数与估计token/费用，调用后结算实际用量并释放余量；超时但计费不明记录待对账，不当作零成本。世界次数预算、用户额度、全局货币预算分别约束，只有全部允许才调用；不在世界副本之间重复享用本应属于同一用户的总额度。原Qwen分级名称作配置候选，不表示已验证当前模型ID或价格。

LOD顺序：同场景可计算距离且<50→full；否则重要度≤2→scheduled；否则=3→rule；否则背景→statistical。50为场景坐标单位，2D逻辑地图通过位置/邻接适配而不冒称米；不同地图不得直接比较坐标。切换不丢目标与状态，full仍受预算，重要NPC只在关键事件用模型，rule/statistical不调用LLM。

缓存TTL世界300秒/角色60秒/上下文600秒；键含租户/实例/分支/版本，关键变更主动失效。非关键变化60秒合批，任务有检查点、重试和去重；支付、选择、世界状态、存档和事件日志即刻持久化，不受批写周期影响。

## UGC审核/举报/申诉

原候选自动服务阿里云绿网+关键词过滤。创建及修改世界、人物、小说、章节均走审核；自动通过可发布，疑似进入人工队列并限可见，明确违规拒绝。服务不可用则待审核，不当作通过。

有效举报与任意点击举报区分：content_reports记录目标/理由/举报人/审核人/状态/说明/创建和处理时间；材料校验或审核认定有效后自动临时下架并通知作者；7天申诉→人工复核→解除限制或永久下架+警告；累计3次确认违规封禁，重复举报不重复计违规，申诉撤销后撤销对应计次。原pending/reviewed/resolved/rejected状态保留，处罚与作品发布状态单独记录。

下架需要覆盖目录、搜索、CDN公开资源、下载/分享与新购入口；已购用户和私密存档处理按权益/法律规则执行，不能通过搜索缓存继续传播。举报正文可能含敏感信息，仅有关人员可读；审核权限和处理日志可审计。

## 九个Sprint的证据清单

原周期2/2/2/2/1/2/2/1/2周保留，总16周为World子系统估时，不代表全产品16周上线。

| Sprint | 原量化要求 | 必交证据与负例 |
| --- | --- | --- |
| WS1 | 世界DNA≤30秒；≥5类规则；三时间模式 | 定义完整DNA必填项并验证；记录模型/设备/输入/P50/P95/失败率；切换无重复tick；冲突规则被拒 |
| WS2 | 5NPC每小时各≥1决策；目标随状态调整 | 明确为世界小时并演示现实时间模式；每NPC带时间的决策日志；失败目标重新规划；LOD不同但均有状态结算 |
| WS3 | A→B→C三步因果；任意事件追源 | 给定固定种子触发链，查询cause根事件；循环因果被拦、同事件重试不重复执行 |
| WS4 | 无用户行动仍推进；与特定NPC≥10次互动触发专属剧情 | 9次不触发/10次触发入门专属事件、重复请求不计次；完整个人线与带出仍按各自条件，付款不代替关系 |
| WS5 | 关键点自动保存；任意Save Point恢复；同点≥2分支 | 跨重启恢复两分支的关系/库存/记忆/位置/延迟任务；未选分支保持原状态 |
| WS6 | 游玩1小时≥1章；OOC/逻辑检测<3次/章 | 固定完整游玩事件样本、章文本/事件引用、原始检测及修复报告；文本太少标失败不硬填；重大冲突修复后才发布 |
| WS7 | 选角入世<3分钟；任意行动能响应 | 实测流程录屏与耗时；说话/探索/战斗/交易/恋爱合法与非法样本；无法执行给解释而非无条件成功 |
| WS8 | 世界与小说双向同步 | 世界事件生成章→改章预览→确认分支→世界状态对应变化；冲突修改拒绝；旧分支可恢复 |
| WS9 | World State驱动3D场景/动作 | 背景/地点/角色坐标/动画/表情/天气/光照/声音逐项对照；重连/乱序/缺资源降级；交付模型文件及实测性能 |

WS4的10次互动作为免费入门专属剧情触发点；信任>0.7、3次危机、秘密为更深路线条件；亲密度/个人线付费/带出独立。这是兼容原需求的工程分层，具体作品可附加自己的路线条件；不据此宣称整条个人线免费。C05其余60/61及首次双界阶段等商业边界仍列待决。
