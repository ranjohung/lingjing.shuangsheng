# 灵境 · 双生 — Next.js 实施指南 v5.2

基线：[DEVELOPMENT_PLAN](../DEVELOPMENT_PLAN.md) §B0-B11 / [PRD](../PRD.md) / [UI_DESIGN_GUIDE](UI_DESIGN_GUIDE.md) / [ASSET_PRODUCTION_GUIDE](ASSET_PRODUCTION_GUIDE.md) / [backend/26](../backend/26-world-os-engineering-contract.md)。本指南为工程师在不动功能范围的前提下，按 **现状 → B0 → B1 → … → B11** 的顺序，到 MVP 上线全过程的**实施级步骤**。

## 当前现状（2026-09-09）

```
apps/
├── api/                            # FastAPI 后端
│   ├── src/
│   │   ├── core/
│   │   │   ├── config.py           # Pydantic Settings
│   │   │   ├── security.py         # JWT 中间件
│   │   │   └── kill_switch.py      # ✅ 已实现
│   │   ├── modules/
│   │   │   ├── user/ character/ memory/ emotion/ relationship/ story/ scene/ billing/ admin/
│   │   ├── infrastructure/
│   │   │   ├── database/           # SQLAlchemy + Alembic
│   │   │   ├── ai/                 # AI Provider
│   │   │   ├── cache/              # Redis
│   │   │   └── vector/             # pgvector
│   ├── tests/
│   └── story-development.db        # SQLite 开发版
└── web/                            # Next.js 前端
    └── src/
        ├── app/                    # 页面路由
        ├── components/
        ├── hooks/
        ├── lib/
        └── store/                  # Zustand
infrastructure/
└── docker/
    ├── docker-compose.yml          # Postgres+pgvector, Redis
    └── ...
docs/                               # 已就位全部 v5.1 + v5.2 文档
assets/
├── source/                         # 原稿
└── blender/                        # Blender 源
output/
└── playwright/                     # 测试截图
```

- `pnpm dev` 一键起全栈（前端 3000 / 后端 8000 或 8011）
- Next.js App Router；前端无界面框架选择（保留 Radix + 自研 Tailwind 风格 token）
- FastAPI 已被 [PRD §1.2 后端结构](../PRD.md) 锁死
- 已存在吕布篇阅读 + 命运卡 + 存档（开发身份）

## 总体工程原则

1. **不重建**：B0 永远先复用已有 N01-N08 成果；不要重写已有模块。
2. **可逆**：所有迁移必须有回滚脚本；不要破坏现有数据。
3. **可测**：每一步落地前先写正反例测试。
4. **可观测**：每个外部依赖的接口调用必须带 `request_id` 与日志。
5. **零硬编码**：价格 / 模型 / 配置 / 阈值都不写在代码里，全在配置。
6. **真实接通才算完成**：模拟通过 = 未完成。

## B0 需求冻结与契约（1 周）

目标：把 v5.1 → 工程实现层之间的 gap 全部冻结。

### 步骤

| 序号 | 任务 | 产出 |
| --- | --- | --- |
| B0-1 | 创建 git 默认分支 `main` + `dev` + `feature/*`；设置保护 | branch-protection.json |
| B0-2 | 建立 `.env.local`（后端 + 前端）；从 `.env.example` 复制所有 key | `.env.local` |
| B0-3 | Supabase：开 pgvector 项目；拿到 `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SERVICE_ROLE_KEY` | 三组凭证入库 |
| B0-4 | Resend 邮件：注册 + DKIM + 拿到 `RESEND_API_KEY` | 凭证 |
| B0-5 | OpenAI / 兼容：拿到 `OPENAI_API_KEY` 和 `OPENAI_BASE_URL` | 凭证 |
| B0-6 | Sentry / Stripe 测试模式 / Redis / 阿里云绿网（可选） | 凭证 |
| B0-7 | 数据模型映射：把 v5.1 DATA-01 的 9 张表 → SQLAlchemy 模型 + Alembic 迁移起点 | `apps/api/src/infrastructure/database/models/world*.py` + `alembic/versions/0001_world_os.py` |
| B0-8 | 实体 ID 映射表：Character DNA <-> world_characters.id / dual_soul / instance_id | 文档 `apps/api/docs/id_mapping.md` |
| B0-9 | 冻结 API 路由前缀 `/api/v1/<resource>/<action>`（每个 B 包后追加） | `apps/api/src/main.py` |
| B0-10 | 品牌显示名替换清单（MIRAI → 灵境·双生），代码内仍有 MIRAI 是工程代号 OK，UI 上必须显示新品牌 | PR |

### 验收

- `docker-compose up -d` 起 Postgres(5432) + Redis(6379)
- `alembic upgrade head` 成功，最少包含现有 users / characters / memories / relationships / story / world_tables
- 现有 N01-N08 测试不回归（`pytest apps/api/tests/` 通过）
- 前端首页能看到 "灵境·双生"

---

## B1 全框架与目录（1-2 周）

目标：把 [UI_DESIGN_GUIDE](UI_DESIGN_GUIDE.md) §UI-06 12 个核心页面的**框架与空态**全部铺出来。

### 步骤

| 序号 | 任务 | 关键文件 |
| --- | --- | --- |
| B1-1 | 主题 token 接入（颜色 / 字号 / 间距 / 圆角 / 阴影） | `apps/web/tailwind.config.ts` + `apps/web/src/app/globals.css` |
| B1-2 | 顶部 / 底部导航 + 全局搜索 + 余额显示 | `apps/web/src/components/Layout/*` |
| B1-3 | 12 个页面各一个"空骨架页面"，含标题与空态卡 | `apps/web/src/app/<page>/page.tsx` |
| B1-4 | 22 主类题材目录，按 [UI_DESIGN_GUIDE §2.2](../docs/UI_DESIGN_GUIDE.md) 实现 | `apps/web/src/app/stories/page.tsx` + 数据 mock |
| B1-5 | 跨类标签筛选、排序、内容来源筛选 | 同上 |
| B1-6 | 每页 loading / empty / error / unauthorized / quotaExhausted / offline 状态组件 | `apps/web/src/components/States/*` |
| B1-7 | 法律中心入口接入 15 份文案（先静态可读） | `apps/web/src/app/legal/*` |

### 验收

- 桌面 1440 / 平板 768 / 手机 390 三档视口无横向溢出
- 主页 / 小说世界 / 双生陪伴 / 创作中心 / 发现 / 我的 6 个底部 Tab 都可达
- 题材目录页点 22 个主类、所有子类、跨类标签均可筛选
- 至少 1 个作品详情页、阅读器页能打开（用已有吕布开发稿）

---

## B2 世界核心（2-3 周，对应 WS1+WS2）

目标：实现 [WORLD_OS_SPEC](../WORLD_OS_SPEC.md) §WOS-01~08。

### 步骤

| 序号 | 任务 | 关键文件 |
| --- | --- | --- |
| B2-1 | World CRUD API：POST/GET/PATCH/DELETE `/api/v1/worlds` + World State JSONB 字段 | `apps/api/src/modules/world/router.py` |
| B2-2 | World Bible：17 项可编辑（含秘密字段可见性） | `apps/api/src/modules/world/bible.py` |
| B2-3 | 世界规则 9 类（physical/social/economic/political/power/magic/technology/cultural/narrative）+ 冲突检测 | `apps/api/src/modules/world/rules.py` |
| B2-4 | 一句话创建世界（接入 Action Parser Step 1） | 复用 `ai/action_parser.py` |
| B2-5 | 三种时间模式（real/accelerated/novel）+ World Tick 调度 | `apps/api/src/modules/world/tick.py` |
| B2-6 | NPC 自主状态 11 字段 + 调度（每世界小时 ≥1 决策） | `apps/api/src/modules/world/npc_simulation.py` |
| B2-7 | LOD 四级（full/scheduled/rule/statistical）按距离+重要度 | 复用 `ai/lod.py` |
| B2-8 | 离线日报：3 天离线后结算重要事件 | `apps/api/src/modules/world/offline_report.py` |
| B2-9 | 预算与缓存接入（cheap500 / medium100 / premium10） | 复用 `core/kill_switch.py` + `infrastructure/cache/` |
| B2-10 | 前端：世界创建向导 + 大纲编辑器 | `apps/web/src/app/worlds/*` |

### 验收（WS1+WS2 量）

- 用户一句话生成世界 DNA ≤ 30 秒（P95，含 token 预算）
- 9 类规则至少 5 类端到端演示；冲突规则被拒并提示
- 三时间模式切换无重复 tick，世界小时和现实小时解耦
- 5 个 NPC 在加速模式下 1 世界小时各产 ≥1 决策
- LOD：玩家距离 <50 → full；重要 NPC ≤2 → scheduled；普通 NPC → rule；背景 → statistical

---

## B3 世界行动与剧情（2-3 周，对应 WS3+WS4+WS5+WS7）

目标：实现 [WORLD_OS_SPEC §WOS-09~13](../WORLD_OS_SPEC.md) + 行动链。

### 步骤

| 序号 | 任务 | 关键文件 |
| --- | --- | --- |
| B3-1 | 八步 AI 链（parser/rule/probability/event/world_update/director/generator/editor） | `apps/api/src/modules/world/action_chain.py` 复用 [backend/26 §八步AI链](../backend/26-world-os-engineering-contract.md) |
| B3-2 | `revision` + 幂等键 + 事务提交；失败回滚 | `apps/api/src/infrastructure/database/transactions.py` |
| B3-3 | Probability Engine：成功率=技能+环境-抵抗，规则乘数，seed 锁定 | `apps/api/src/modules/world/probability.py` |
| B3-4 | Event Engine：可见 / 隐藏 / 自由选择三类；3-30 天延迟 | `apps/api/src/modules/world/events.py` |
| B3-5 | 因果链可视化（A→B→C）+ 回溯 | `apps/api/src/modules/world/causality.py` |
| B3-6 | Story Director：机会而不强推；输出 `opportunities / route_candidate / narrative_brief` | `apps/api/src/modules/world/story_director.py` |
| B3-7 | 角色路线：10 次互动触发入门专属事件（不代替个人线/带出门槛） | `apps/api/src/modules/world/route.py` |
| B3-8 | Save Point 自动存档 + 平行分支 + 任意分支恢复 | `apps/api/src/modules/world/timeline.py` |
| B3-9 | 自由输入响应（说话/行动/探索/移动/调查/战斗/工作/学习/休息/恋爱/交易/创建）合法与非法样本 | `apps/api/src/modules/world/actions.py` |
| B3-10 | 前端：阅读器集成选项 + 概率展示 + 关系值实时条 | `apps/web/src/app/worlds/[id]/play/page.tsx` |

### 验收（WS3+4+5+7）

- A→B→C 三步因果链可追溯到根事件
- 给定 seed 触发链，每次结果稳定
- 跨重启恢复任意 Save Point（包括世界时间 / NPC 状态 / 关系 / 延迟任务）
- 10 次互动触发入门专属事件；9 次不触发；重复请求不重复
- 选角入世 <3 分钟（含 AI 生成全身立绘）

---

## B4 小说生成与同步（2 周，对应 WS6+WS8）

目标：实现 [WORLD_OS_SPEC §NOV-01~04](../WORLD_OS_SPEC.md)。

### 步骤

| 序号 | 任务 | 关键文件 |
| --- | --- | --- |
| B4-1 | Novel Bible + Story Bible + 章节大纲（可编辑） | `apps/api/src/modules/novel/bible.py` |
| B4-2 | 5 种风格（Documentary/Novelized/Cinematic/Light Novel/Game Narrative） | `apps/api/src/modules/novel/style.py` |
| B4-3 | 伏笔管理（introduced/active/hinted/revealed/resolved） | `apps/api/src/modules/novel/foreshadowing.py` |
| B4-4 | 十维质量检测（OOC/重复/逻辑/时间线/规则/关系/伏笔/节奏/语言/一致性） | `apps/api/src/modules/novel/quality.py` |
| B4-5 | Event Log（时间/地点/参与者/行动/结果/情绪/重要度） | `apps/api/src/modules/novel/event_log.py` |
| B4-6 | 每游玩小时 ≥1 章节；检测冲突 <3/章（仅首检指标） | 调度任务 |
| B4-7 | 双向同步：世界修改 → 章节预览 → 确认分支 → 新世界 | `apps/api/src/modules/novel/sync.py` |
| B4-8 | 前端：创作中心三栏编辑器（卷 / 章 / 大纲） | `apps/web/src/app/creator/novel/*` |

### 验收

- 游玩 1 小时 ≥1 章（仅真实游玩事件样本）
- 重大冲突修复才允许发布（检测 <3/章 是初检指标，不是发布门槛）
- 世界改 → 章节预览 → 旧分支可恢复

---

## B5 角色陪伴与内容（2 周）

目标：实现 [DUAL_SOUL_SPEC](../DUAL_SOUL_SPEC.md) §CHAR-03 / §COMP-01~04。

### 步骤

| 序号 | 任务 | 关键文件 |
| --- | --- | --- |
| B5-1 | 八层角色创建 API + UI（8 个步骤分页） | `apps/api/src/modules/character/create.py` + `apps/web/src/app/companion/new/page.tsx` |
| B5-2 | 五维人格 + 7 维扩展 + DNA 持久化 | 复用 Character DNA |
| B5-3 | 流式聊天 + 六控制权（重说 / 回溯 / 评价 / 灵感 / 编辑 / 重启） | `apps/api/src/modules/chat/router.py` |
| B5-4 | 互动计数 + 亲密度 0-100，独立存储 | `apps/api/src/modules/relationship/intimacy.py` |
| B5-5 | 互动模式：语音通话 / 朋友圈 / 共同活动 / 日记 | `apps/api/src/modules/companion/modes.py` |
| B5-6 | 主动关怀：站内信 + 用户授权（时区/静默/频率上限） | `apps/api/src/modules/companion/care.py` |
| B5-7 | 13 公版候选验收 + 30-50 官方角色包 | `apps/api/scripts/seed_characters.py` |
| B5-8 | Voice / TTS 接入（Voice ID 候选 nova / alloy），STT 失败兜底文字 | `apps/api/src/infrastructure/voice/*` |

### 验收

- 八层每一步可存可加载；UI 显示 0-100 与模型 0-1 显式转换
- 50/200/500/1000/2000 互动次数达阶段时显示解锁
- 语音 / 视频通话失败降级到文字
- 主动关怀通知受用户开关控制

---

## B6 双界闭环（1-2 周）

目标：实现 [DUAL_SOUL_SPEC §DUAL-01~05](../DUAL_SOUL_SPEC.md)。

### 步骤

| 序号 | 任务 | 关键文件 |
| --- | --- | --- |
| B6-1 | dual_soul_characters + bring_out_transactions 表（B0 已建） | `apps/api/src/modules/dual/router.py` |
| B6-2 | 三重验证：亲密度 ≥80 + 个人线已完成（含付费解锁） + 一次性带出付款 | `apps/api/src/modules/dual/eligibility.py` |
| B6-3 | 共享记忆：world/specific/user toggle + 撤销 | `apps/api/src/modules/dual/memory_share.py` |
| B6-4 | 两按钮 + 穿越动画 + 台词（"长夜城的风，我回来了。"） | `apps/web/src/app/companion/[id]/page.tsx` |
| B6-5 | 自创角色免费带出 + 槽位限制 | `apps/api/src/modules/dual/self_created.py` |
| B6-6 | 重复 / 越权 / 余额不足 / 跨用户 / 撤销测试 | 测试 |

### 验收

- 自创角色创建完成即可"带出"
- 普通 NPC 亲密度 ≥80 + 个人线 + 800 灵晶；重要 1500；核心 3000
- 重复带出不重复扣款；撤销共享后不可恢复共享层

---

## B7 创作者工作台（2 周）

目标：实现 [CREATOR_SYSTEM](../CREATOR_SYSTEM.md)。

### 步骤

| 序号 | 任务 | 关键文件 |
| --- | --- | --- |
| B7-1 | 三类内容来源：官方 / AI / 上传 | 已有 + 完善 |
| B7-2 | 上传解析：TXT/MD/DOCX/EPUB + 错误处理 | `apps/api/src/modules/creator/upload.py` |
| B7-3 | 三栏编辑器（卷/章/树；正文/AI 工具；质量/角色面板） | `apps/web/src/app/creator/workbench/*` |
| B7-4 | AI 工具：润色 / 续写 / 重写 / 风格切换 / 去 AI 味；差分预览 | `apps/web/src/components/AIPanel/*` |
| B7-5 | 质量检测一键修复；每次修改自动保存版本 | 复用 B4-4 |
| B7-6 | 发布审核 + 定时发布 | `apps/api/src/modules/creator/publish.py` |
| B7-7 | 内容审核管道（绿网 + 关键词 + 人工） | `apps/api/src/infrastructure/content_moderation/*` |
| B7-8 | 审核 / 举报 / 申诉 / 下架 / 累计违规封禁 | `apps/api/src/modules/admin/moderation.py` |

### 验收

- 用户上传 TXT 自动提取角色 / 场景 / 事件 / 关系，可人工确认后再进入世界
- 创建过程全部自动版本化，可任意回滚
- 发布前必经审核；自动通过 / 人工 / 拒绝三种结果

---

## B8 经济体系（2 周）

目标：实现 [ECONOMY_SYSTEM §ECON-01~08](../ECONOMY_SYSTEM.md)。

### 步骤

| 序号 | 任务 | 关键文件 |
| --- | --- | --- |
| B8-1 | 双币（灵玉 / 灵晶）+ 账本（currency_lots / orders / entitlements / price_versions） | `apps/api/src/modules/billing/currency.py` |
| B8-2 | 订阅（月卡 / 星卡 / 年付）+ 权益版本化 | `apps/api/src/modules/billing/subscription.py` |
| B8-3 | 充值（微信 + 支付宝）+ 回调验签 + 幂等 | `apps/api/src/modules/billing/recharge.py` |
| B8-4 | 全部商品（身份 / 成长 / 剧情 / 外观） | `apps/api/src/modules/billing/catalog.py` |
| B8-5 | 抽卡（5 级稀有度 + 概率 / 保底） | `apps/api/src/modules/billing/gacha.py` |
| B8-6 | 广告（横幅 / 激励视频 / 插屏） | `apps/api/src/modules/billing/ads.py` |
| B8-7 | 创作者账本 + 30-70% 分润 + 提现（先 403） | `apps/api/src/modules/billing/creator_payout.py` |
| B8-8 | 退款 + 撤销 + 月清订阅赠币 | `apps/api/src/modules/billing/refund.py` |

### 验收

- 6 档充值档（下单 / 回调 / 验签 / 到账 / 幂等）全链路通过
- 抽卡保底可验证；伪造回调、重复回调、余额不足有测试
- 创作者提现在 MVP 返回 403，前端隐藏按钮

---

## B9 导出与商业服务（1 周）

目标：[CREATOR_SYSTEM §EXPORT-01~03](../CREATOR_SYSTEM.md)。

### 步骤

| 序号 | 任务 | 关键文件 |
| --- | --- | --- |
| B9-1 | TXT/MD/DOCX/EPUB 导出，异步任务 | `apps/api/src/modules/export/runner.py` |
| B9-2 | 配额 + 订阅折扣 + 个人存档 50 灵晶 | 同上 |
| B9-3 | 版权附页 + AI 辅助标注 | 同上 |
| B9-4 | 商业授权 / 独家 / 改编（先沙箱） | `apps/api/src/modules/export/commercial.py` |

---

## B10 视觉与 3D（与内容并行，2-3 周）

目标：[ASSET_PRODUCTION_GUIDE](ASSET_PRODUCTION_GUIDE.md)。

### 步骤

| 序号 | 任务 |
| --- | --- |
| B10-1 | SD 立绘流水线：`scripts/generate_realistic_portrait.py` 完善，扩多表情多服装 |
| B10-2 | 资产违规检查：`scripts/asset_safety_check.py`（已有 partial） |
| B10-3 | Blender 拓扑 / UV / 蒙皮 / 骨骼 / blendshape 流水线 |
| B10-4 | Web 端 `<Avatar>` 组件，表情/动作平滑过渡 |
| B10-5 | 场景总线集成：World OS `scene_update` → Three.js |
| B10-6 | 3D 降级：WebGL 失败 → SD 立绘 + 文字气泡 |
| B10-7 | 性能：移动端 ≥30 FPS；LOD 自动切换 |

---

## B11 法律与发布（1 周）

目标：[LEGAL_INTEGRATION_PLAN](../legal/LEGAL_INTEGRATION_PLAN.md)。

### 步骤

| 序号 | 任务 |
| --- | --- |
| B11-1 | 法务核验：主体资格 / 法规适用 / 热线 / 退款 / 实名 |
| B11-2 | 15 份文案接入应用（带版本号 + 变量替换） |
| B11-3 | 隐私 / 删除 / 导出 / 注销 完整流程 |
| B11-4 | 15 份文案每条都有：内容审核 / 法务确认记录 / 现行版本号 |
| B11-5 | 备案材料 + 安全评估预案（适用性核验） |
| B11-6 | 最终发布闸门验证：真实身份 + 完整故事 + 真实支付 + 全部 E2E |

### 发布闸门

每一项必须给出**证据**：

- 实名 / 年龄硬拦截（真实服务商成功 + 失败 2 类）
- 存档跨重启恢复两分支
- 三部作品完整内容可达测试（每结局）
- 记忆冲突 / 预算熔断 / 关系衰减三类回归
- 用户隔离 / 跨用户 / 删除 / 导出 全部通过
- 安全管线 4 级全在线
- 紧急联系核验
- 成本 / 性能 / 运维看板
- 15 份法律文案每条都有核验签字 + 版本号

未达到以上不宣告上线。

---

## 全局工程规范

### 命名

- 文件：kebab-case
- 组件：PascalCase
- Hook：use*
- 函数：动词开头
- 数据库：snake_case
- API：/api/v1/<resource>/<action>
- 工作包：B + 数字 + 段号（B0-1, B0-2, ...）

### 提交与 PR

- 提交信息：`<B-id>: <动词> <对象>`（如 `B2-3: add rule conflict detection`）
- PR 必须关联一个 B 段 ID；未关联不合并

### Code Review

- 至少 1 名主程 + 1 名 AI（建议）
- Critical（数据库迁移 / 资金 / 隐私）需 2 名
- 不通过 lint / 不通过测试 / 不带录屏 = 自动不通过

### 测试要求

- 新功能 ≥ 80% 覆盖率
- 资金 / 隐私 / 关系 / 记忆必经测试覆盖
- E2E 测试在 B7 完成后开始全量

### 文档同步

每个 B 段交付：
- 更新对应章节 PRD / DEVELOPMENT_PLAN
- 在 [IMPLEMENTATION_STATUS](../IMPLEMENTATION_STATUS.md) §本轮已交付 添加
- 在 docs/sources/ 存对话 / 决策 / 反对意见的原始记录

### 安全

- 不准在前端 log 输出 JWT / API key
- 不准在生产环境返回数据库 password
- 所有外部写入必须 schema 校验（zod / pydantic）
- 所有上传内容必经审核才可被他人看到
- 实名 / 银行卡 / 验证码须走专门服务，禁止走 LLM

---

## 待解决问题（每个 B 段开始前重新检查）

| 编号 | 问题 | 责任段 |
| --- | --- | --- |
| Q01 | 微信 / 支付宝 / Resend 是否可在本地沙箱接通？ | B0 |
| Q02 | 数据迁移是否能保留吕布篇已有 SQLite 故事？ | B0 / B6 |
| Q03 | 模型选择：默认 Qwen vs OpenAI 兼容？ | B2 / B5 |
| Q04 | pgvector 是否需要换 Qdrant / Milvus？ | B0 |
| Q05 | 创作者提现是否上线？ | B8 |
| Q06 | 3D 是否一开始就要？ | B10 |

---

v5.2 补强文档；任何内容冲突以 v5.1 各规范为准。
