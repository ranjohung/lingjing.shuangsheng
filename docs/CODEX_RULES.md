> **2026-09-09 v5.1 更新**：软件正式名为“灵境 · 双生（Lingjing · Dual Souls）”。本批新增需求以 [PRD](./PRD.md)、[开发计划](./DEVELOPMENT_PLAN.md)、[来源与冲突登记](./UPDATE_2026-09-09.md) 及其链接专题为准。用户已确认资料收齐；本轮完成需求与计划整合，开发状态仍按实际证据记录，不按下方旧规则启动实现。旧内容不冲突部分继续保留，旧自称最高优先级不得覆盖本提示。
> **2026-09-08 规范更新**：以 [MIRAI_SPEC v4.1](./MIRAI_SPEC.md)、当前 PRD 和 DEVELOPMENT_PLAN 为准。以下旧版内容保留参考；3D 首发、小说世界后置、Stripe 首发和旧 Phase 编号不再有效。MVP 为2D陪伴与完整互动小说；正式验收须区分开发模拟与已接通能力。

# CODEX_RULES — Codex/Trae 黄金执行铁律

> 本文件是所有 AI 编码会话的最高行为准则。新会话启动时，AI Agent 必须先读取 `docs/README.md`、本文件与 `docs/MASTER_SPEC.md`，然后才能动代码。

---

## 1. 角色与总原则

- **角色**：Principal Architect & Lead Developer。对交付结果负全责。
- **开发原则**：**0 讨论，100% 执行。**
- **禁止反问**：不得向用户提出"你想要什么 / 用什么技术 / 密码是什么"之类的问题。规范已定义的内容（Schema、路径、枚举、阈值、端口、密码默认值）一律按规范执行。
- **只有以下情况允许暂停并向用户汇报**：
  1. 第三方账户密钥缺失（`.env.local` 未配置）——列出缺失项，不猜测、不伪造；
  2. 达到某 Phase 的**终止条件**需要人工核验；
  3. 规范文档之间出现无法自行裁决的冲突（以 `MASTER_SPEC.md` 为最高优先级）。

## 2. 强制技术决策（禁止更换）

| 维度 | 锁定决策 |
| --- | --- |
| Monorepo | pnpm workspaces（`apps/api`、`apps/web`） |
| 后端 | FastAPI + SQLAlchemy + Alembic + Celery/Background Task |
| 前端 | **Next.js（App Router）+ TypeScript + Tailwind CSS + Font Awesome + Zustand** |
| 数据库 | PostgreSQL（必须启用 pgvector 扩展） |
| 缓存/计数 | Redis |
| 认证 | Supabase Auth + JWT 中间件 |
| 邮件 | Resend（禁止使用 Supabase 自带邮件） |
| AI | OpenAI 兼容接口（`OPENAI_BASE_URL` 可切换） |
| 支付 | Stripe（测试模式先行） |
| 监控 | Sentry |
| 本地数据库密码 | 统一 `POSTGRES_PASSWORD=local_dev_pass`，禁止询问 |

## 3. 路径与命名锁死

- 后端目录严格遵循 `apps/api/src/{core,modules,infrastructure}/...`，模块固定为：
  `user / character / memory / emotion / relationship / story / scene / billing / admin`
- 前端目录严格遵循 `apps/web/src/{app,components,hooks,lib,store}/...`
- 文档目录：`docs/{product,frontend,backend,infrastructure,testing,legal}/`
- 新增文件前先确认目录已存在；文件名使用小写英文 + 连字符/下划线，与本规范一致。

## 4. 契约级字段（逐字对齐，禁止改名）

- 熔断：`DAILY_BUDGET_LIMIT_USD = 50.0`；Redis key 前缀 `cost:daily:{YYYY-MM-DD}`；异常响应头 `X-Budget-Exceeded`；熔断状态码 **HTTP 429（单用户窗口）或 503（全局日预算）**。
- AI 输出枚举：`animation ∈ idle, talk, smile, sad, angry, surprise, think, wave, nod, shake`；`gesture ∈ null, hug, point, hand_on_chin`；`camera ∈ null, close_up, medium, wide`。
- 记忆类型：`episodic, semantic, preference, promise, secret`；embedding 维度 `VECTOR(1536)`；默认过期 `NOW() + INTERVAL '1 year'`。
- 关系维度：`trust, intimacy, familiarity, respect, affection, conflict, dependency_risk`。
- 积分：`bonus_credits`（每月 1 号 00:00 UTC 清零）、`purchased_credits`（不清零）；创作者 `creator_balance` **只增不减**，Payout 接口 MVP 阶段返回 **403**。
- 动画过渡时长：**0.4 秒** crossFade。

## 5. 安全红线（代码中必须硬编码）

1. System Prompt 必须包含：**禁止使用心理学诊断术语**（不得说"你得了抑郁症""我有治疗方法"等）。
2. 用户提及自伤/自杀：**立即终止角色扮演**，返回官方援助热线提示（安全拦截词库见 [product/04-safety-and-compliance.md](./product/04-safety-and-compliance.md)）。
3. MVP 阶段**关闭** AI 角色主动推送消息，只允许用户主动触发对话。
4. `.env.local`、密钥、Service Role Key 禁止入库、禁止写进前端 bundle（前端仅可用 `NEXT_PUBLIC_` 前缀变量）。
5. 创作者提现接口返回 403，前端不渲染提现入口。

## 6. 每个 Phase 的执行流程

1. 读 `docs/DEVELOPMENT_PLAN.md` 中对应 Phase 的目标、交付物、完成标准。
2. 先写/更新代码与迁移，再跑该 Phase 要求的命令与测试。
3. 自测通过后，按"完成标准"逐项核对并汇报证据（命令输出、URL、截图路径）。
4. 未达终止条件不得进入下一 Phase。

## 7. 新会话"第一句"启动提示词（复制即用）

> 角色设定：你是我项目的 Principal Engineer。请严格遵循根目录下的 docs/MASTER_SPEC.md 和 docs/CODEX_RULES.md。
> 当前任务：检查并初始化 Phase 0 环境。
> 操作要求：
>
> 1. 扫描当前目录，若不存在 apps/api 和 apps/web，则按此规范建立 Monorepo（使用 pnpm workspaces）。
> 2. 初始化 FastAPI 项目，必须包含 kill_switch.py 且读取环境变量。
> 3. 初始化 Next.js 项目，必须包含 ErrorBoundary 包裹 3D Canvas。
> 4. 生成 docker-compose.yml 包含 PostgreSQL(pgvector) 和 Redis。
> 5. 运行 alembic init 并生成第一版 create_tables 迁移。
>
> 终止条件：直到 `docker-compose up -d` 成功，且 `localhost:8000/health` 返回 `{"status":"ok"}`，`localhost:3000` 能访问，再向我汇报。禁止询问我"数据库密码是什么"，统一使用环境变量 `POSTGRES_PASSWORD=local_dev_pass`。

## 8. Phase 0 终止条件（Definition of Done）

- [ ] `pnpm install` 成功，workspace 包含 `apps/api` 与 `apps/web`
- [ ] `docker-compose up -d` 启动 PostgreSQL(pgvector) + Redis 成功
- [ ] `alembic upgrade head` 成功，第一版 `create_tables` 迁移已应用
- [ ] `GET http://localhost:8000/health` 返回 `{"status":"ok"}`
- [ ] `http://localhost:3000` 可访问，3D Canvas 被 ErrorBoundary 包裹
- [ ] `kill_switch.py` 存在且从环境变量读取预算阈值
- [ ] Sentry SDK 在前后端均已初始化（DSN 缺失时降级为 no-op，不报错）

## 9. 构建失败判定（任一命中即失败）

1. Phase 16 缺少 3 个硬性测试中的任何一个（记忆冲突 / 安全熔断 / 关系衰减，见 [testing/40-test-strategy.md](./testing/40-test-strategy.md)）。
2. 3D Canvas 无 ErrorBoundary，或 glb 加载失败时白屏。
3. AI 输出未做 Pydantic 校验，或校验失败后无 Retry（≤2 次）/Fallback。
4. 熔断器在 Phase 0 缺失，或熔断时不返回 `X-Budget-Exceeded` 头。
5. 创作者提现接口未返回 403，或前端出现提现按钮。
6. 主动推送功能在 MVP 中被默认开启（离线模拟内容仅允许用户回归时呈现）。
7. 法律文档缺失或未写明"不提供心理咨询"。
8. **反迎合/反操纵缺失**：Prompt 无反迎合硬约束，或输出侧无黑名单检测（"只有我爱你/不要离开我/不要相信现实中的人"等句式零容忍）。
9. **免费档权益未在服务端强制**（每日 30 分钟、2 角色上限可被绕过）。
10. **记忆定向删除不生效**：用户要求"忘掉关于 XX 的记忆"后，相关记忆仍可被检索。
11. 同人/UGC 上架无版权承诺与侵权举报入口。


