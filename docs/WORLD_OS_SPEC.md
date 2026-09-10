# 灵境 · 双生 — World OS / Story OS / Novel OS 需求 v5.1 + v5.12 增量登记

> **本批 v5.12 自动游戏化增量已正式归入 PRD：**
> - 详见 [PRD.md §"2026-09-10 新增范围"](PRD.md)（GENRE-30 / GAME-AUTO-01 / GAME-AUTO-02 共 3 项新需求）
> - 详见 [library.html](../output/preview/library.html) + [novel-upload.html](../output/preview/novel-upload.html) + [plot-runner.html](../output/preview/plot-runner.html)
>
> 2026-09-09；全量规划，未实现声明。来源：[S03](sources/2026-09-09/S03-world-additions.txt)、[S05](sources/2026-09-09/S05-world-engineering.txt)。原始完整JSON、SQL、Python、验收表均随来源保存，是本规范的需求附件；不得未经迁移设计直接执行。冲突见[登记](UPDATE_2026-09-09.md)。
>
> ⚠ **v5.12 与 v5.1 的差异**：v5.12 的"30 题材 + 上传即生成 + 覆盖审计"将 v5.1 中 WOS-12 / NOV-01 / NOV-02 的"创建角色/小说"路径**显式落地为可玩 Prototype**；rule/不接真 LLM 的约束对应 v5.1 的 WOS-14 工程适配。

## 产品闭环与分层

创建世界→创建小说→生成角色/世界/故事→进入世界→自由行动→世界/角色/关系改变→时间线分裂→记忆沉淀→继续生成个人小说。小说是世界历史记录，世界是小说运行状态。World OS独立模块复用现有Character DNA、Memory、Relationship、Emotion、Voice、Avatar基础设施。

| ID | 模块与完整范围 | 验收 |
| --- | --- | --- |
| WOS-01 | World CRUD、World State：world_id/name/current_time/weather/global_state/factions/characters/locations/active_events/history/rules/timeline_id | 用户/世界/时间线隔离；导入、修改、删除与版本一致 |
| WOS-02 | World Bible：基础、题材、主题、历史、地理、时间线、政治、经济、文化、宗教、科技、魔法、社会规则、势力、重要事件、秘密、未来威胁 | 17项均可编辑；秘密字段受可见性控制 |
| WOS-03 | 物理/社会/经济/政治/力量/魔法/科技/文化/叙事九类规则；冲突优先级 | 至少5类端到端规则演示，九类契约齐备；拒绝矛盾规则 |
| WOS-04 | 官方世界（都市/修仙/末日/科幻/校园/宫廷/武侠）、一句话AI创建、专业手动编辑 | 想法→题材→概念→Bible→规则→历史→地理→势力→角色→冲突→时间线→验证；每阶段可修改/重试 |
| WOS-05 | 世界验证：规则、时间、角色、地理、能力冲突 | 报告定位冲突并给修复建议；未确认不发布 |
| WOS-06 | 现实1小时=世界1小时；加速1小时=世界1天；小说事件驱动；World Tick | 三种模式切换不重复推进，离线3天Lazy Simulation只结算重要事件/关系变化，登录显示世界日报及详情 |
| WOS-07 | NPC自主状态：身份、人格、目标、欲望、恐惧、秘密、信念、关系、记忆、日程、位置、背包、能力 | 5个NPC运行，每世界小时各≥1个决策；目标可分解和失败后重规划，如赚钱→找店铺→学习→失败→改计划 |
| WOS-08 | 四级LOD：附近Full AI、重要Scheduled AI、普通Rule、背景Statistical | 原距离<50为候选阈值；远处不全量调用模型；日报可追溯真实事件 |
| WOS-09 | Story Director：世界/人物/关系/时间线/行动/故事目标→下一故事机会；主线/支线/角色线/世界线/涌现剧情的叙事引力 | 提供机会而不强推唯一选择；原稿Director正文职责冲突见C26 |
| WOS-10 | 角色路线：介绍→日常→信任事件→秘密→冲突→选择→个人线→结局；恋爱：吸引→兴趣→信任→亲密→冲突→承诺 | 不同角色独立路径；信任>0.7、3次危机、秘密条件及10次互动候选均保留，不能把付款当关系成功 |
| WOS-11 | Visible/Hidden/Free Choice；即时/延迟3–30天/隐藏后果；命运潜在未来：死亡、反派、离城、结婚、领导者 | 三步因果链A→B→C可追溯；隐藏后果不是固定30天公开；潜在未来随规则变化 |
| WOS-12 | 原著主角/原著角色/新角色/普通NPC/隐藏身份/观察者六入口；Canon Mode、Canon Lock、Canon Flexible、Alternate四模式 | 新角色姓名年龄性别身份背景人格目标→出生地/关系/资源/位置；能力/金钱/身份/装备受Balance Engine约束；选角入世目标<3分钟 |
| WOS-13 | 说话/行动/探索/移动/调查/战斗/工作/学习/休息/恋爱/交易/创建/自由输入；概率与事件；Save Point/恢复/平行分支 | 所有输入有合法结果或拒绝原因；关键点自动存档、同点≥2分支；好/坏/真/隐藏/角色/世界结局均保留 |
| NOV-01 | Author Mode辅助写作；Simulation Novel游玩记录；Novel Bible→World/Character/Story Bible→卷纲→章纲→场景纲→初稿→验证→修订 | 每阶段可编辑；1小时有效游玩后≥1章为原目标，事件不足应说明，不凭空捏造经历 |
| NOV-02 | Novel Bible：标题/题材/主题/读者/基调/视角/文风/长度/结局；Story Bible：标题/梗概/主题/世界/主角/目标/冲突/对手/谜题/恋爱/弧光/情节/结局 | 三幕/英雄之旅/起承转合/无限流/恋爱七阶段结构可选；题材可混合 |
| NOV-03 | 伏笔：id/description/introduced_chapter/importance/status/related_characters/planned_resolution；状态introduced/active/hinted/revealed/resolved | 跟踪埋设、提示、揭示、回收；检测OOC/重复/逻辑/时间线/规则/关系/伏笔/节奏/语言/一致性十维 |
| NOV-04 | Documentary/Novelized/Cinematic/Light Novel/Game Narrative五种生成风格；Event Log含时间/地点/参与者/行动/结果/情绪/重要度 | 世界→事件→小说；小说编辑→新时间线→新世界；先预览差异、确认并验证，保留旧线不覆盖 |
| WOS-14 | AI、记忆、关系、情绪、声音、2D/3D场景总线适配 | 记忆store/retrieve limit=5；关系delta；情绪event/intensity；scene_update含位置/天气/角色坐标动作表情/环境音/光照；未接服务明确降级 |
| WOS-15 | 内容审核、举报、下架、申诉与回滚 | 自动审核→人工队列→发布/拒绝；有效举报处置、7天申诉、累计3次违规封禁为原候选；处理记录、通知、权限和证据齐备 |

主题：成长、救赎、爱情、复仇、权力、战争、孤独、友情、自由、文明、生存。收藏：角色/剧情/CG/回忆/结局/成就/世界秘密。保留“救下必死角色”“被角色记住共同经历”“每人专属命运”的体验目标。

## 行动链和一致性

Action Parser（cheap，输出intent/target/style/risk）→程序World Rule Check→Probability Engine→Event Engine→World Update→Story Director（medium）→Narrative Generator（medium）→Editor（cheap）。原例：潜行45+遮蔽20−警觉30=35%，中风险×0.9=31.5%。实现需归一化并夹限0–1、保存随机种子/规则版本，AI不能把失败改写成成功。

工程补充建议：revision+幂等键+事务提交事件和状态；失败回滚/补偿；叙事失败使用已审定作者文本；已提交行动重试不得重新掷骰。跨分支和跨用户记忆不能相互污染，失效/删除/撤销共享后检索不可返回。

## 性能候选参数（原稿值保留）

| 项目 | 候选 |
| --- | --- |
| 单世界每日模型次数 | cheap500 / medium100 / premium10 |
| 单响应token上限 | cheap500 / medium2000 / premium8000 |
| 阶段token估算 | Parser200–500；Director500–1500；Narrator800–3000；Editor300–800；世界生成3000–10000 |
| 缓存TTL秒 | world_state300 / character_state60 / narrative_context600 |
| 批写秒 | 60；仅非关键衍生状态，支付/关键行动/存档不得延迟以免丢失 |
| 生成性能 | 世界DNA30秒目标；记录硬件、模型、样本和P95后验收，不作已有能力承诺 |

原稿Qwen Turbo/Plus/Max只是模型分级候选；预算上限与估算冲突时先按调用预算裁剪或分段，待实际配置核算。缓存键包含用户/世界/时间线/版本，关键提交时失效。

## 数据契约 DATA-01

完整原DDL见S03§1.10/3.11与S05§2.1/2.5。规划表：worlds、world_rules、world_characters、story_bible、chapters、world_events、timelines、player_actions、event_logs、content_reports。

必须补齐locations/factions及引用实体、timeline外键、用户/实例复合约束、状态枚举CHECK、非负计数/概率范围、时间戳带时区与更新时间机制；genre单值与多题材目录适配。world_characters与现有Character DNA稳定ID映射；chapters与novel_chapters分别是模拟输出与编辑版本或统一投影，迁移前定版，不建两个互相漂移正文源。导出/删除范围涵盖衍生记忆、缓存、文件和索引。

S05的“直接执行SQL”仅为原稿内容，本轮只规划；数据库须Alembic升级/回滚、租户隔离、并发、重试、跨重启、分支恢复验收。


## v5.1最终工程交接补充

用户已确认资料齐全，最终S07与S05/S06一致。详见 [工程契约](backend/26-world-os-engineering-contract.md) 和 [九表原始DDL](backend/27-world-os-source-ddl.md)。上述“建议/候选”中事务回滚、幂等、作用域隔离、预算预占与缓存失效按工程契约作为开发基线；价格和订阅权益的商业争议仍按登记处理。

Director输出机会与叙事提纲，Generator输出正式正文；原稿Director叙事能力保留为提纲。10次互动触发入门专属剧情，不等于完成付费个人线或获得带出资格。审核采用原稿阿里云绿网+关键词过滤候选，失败进入待审核；有效举报临时下架、7天申诉、确认违规处罚、累计3次确认违规封禁，具体防重复和撤销机制见工程契约。
