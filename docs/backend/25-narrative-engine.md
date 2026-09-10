# 互动小说引擎契约
六章可玩结构：common_prologue/common_event/branch/route_deep/route_conflict/route_resolution，ending独立展示。每作2–4路线，每条完整路径20–30选择点，每点2–4选项，每作5–8可达结局。

## 内容和存档边界
正式表：story_library（版本、版权与世界）、story_characters（原著身份及自建槽位）、story_chapters、story_routes、story_choices（内容）、story_endings、story_sessions、player_state（一会话一状态）、story_choice_events（埋点及前后快照）、story_saves、destiny_cards。
使用UUID、所属作品/版本外键、顺序唯一约束；session.user_id外键；choice_events(session_id,revision)唯一。每次推进事务锁定会话并校验revision，状态和事件一起提交。迁移必须Alembic；当前开发适配器不建立正式表。

## API（开发切片）
GET /api/stories 目录（含content_status）；GET /api/stories/{id}详情。
GET/POST /api/story-sessions 会话列表/开局；GET /api/story-sessions/{id}读当前状态。
POST /api/story-sessions/{id}/choices 提交choice_id、option_id、expected_revision。
POST /api/story-sessions/{id}/rewind 提交target_count（保留前几个选择）、expected_revision。
GET /api/story-sessions/{id}/destiny 仅完成会话生成私有命运卡数据。
每次查询按当前用户隔离；客户端不提交effects或ending；只返回当前节点的合法选项，不泄露隐藏结局规则。

## 回溯和结局
回溯从初始状态重放保留选择，删除后续活动历史、清除结局、revision单调递增，避免旧标签页重复提交。正式库保留不可变审计日志及分支谱系。结局优先级明确，同优先级不得匹配多个，始终存在普通结局兜底。
开发内存API在响应中标记storage_mode=development_memory；进程重启丢失，前端不得假称永久存档。正式替换后必须跨进程/跨重启测试。


## 2026-09-09 已实现的存储切片
SQLAlchemy适配器见database.py，迁移0001创建story_sessions（带版本的完整快照）及story_choice_events（不可变审计）。user_id暂为字符串，正式users表/外键、内容规范化表、手动存档槽和幂等响应缓存仍待后续迁移。当前不把这两张表称作完整数据库模型。

设置STORY_DATABASE_URL后才启用数据库，不自动降级或自动建表。正式使用postgresql+psycopg URL；本机验证使用SQLite显式测试URL。先在apps/api执行`.venv/Scripts/python.exe -m alembic upgrade head`，再启动服务。未配置保持development_memory。

测试证据：test_story_database.py验证迁移升降级、重开数据库恢复、旧revision拒绝、审计记录保留及跨用户删除隔离。PostgreSQL真实实例尚未联调，不冒充已验证。

实现依据：[SQLAlchemy事务更新](https://docs.sqlalchemy.org/en/20/tutorial/data_update.html)、[Alembic迁移流程](https://alembic.sqlalchemy.org/en/latest/tutorial.html)。
