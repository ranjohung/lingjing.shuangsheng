# 20 · 后端架构（FastAPI）

> 上级文档：[../MASTER_SPEC.md](../MASTER_SPEC.md) ｜ 关联：[21-database-schema.md](./21-database-schema.md)、[22-ai-orchestrator.md](./22-ai-orchestrator.md)、[23-kill-switch.md](./23-kill-switch.md)、[24-billing-and-subscription.md](./24-billing-and-subscription.md)

工程位置：pnpm workspace `apps/api`，Python 3.11+，FastAPI + SQLAlchemy 2.x + Alembic + Celery（或 ARQ/Background Tasks，定时任务需持久化调度）。

## 1. 目录结构（强制锁死）

```text
apps/api/src/
  core/
    config.py            # Pydantic Settings：所有环境变量集中定义
    security.py          # JWT / Supabase Auth 验证依赖
    kill_switch.py       # 全局成本熔断器（Phase 0 必须存在）
    errors.py            # 异常类型与全局 exception handler
  modules/
    user/                # 注册、登录验证码、资料、注销
    character/           # 角色 CRUD、DNA JSONB、avatar/voice 配置
    memory/              # 记忆写入、embedding、pgvector 检索、衰减
    emotion/             # 情绪状态机
    relationship/        # 7 维关系、事件溯源、衰减任务
    story/               # story_event 剧情事件
    scene/               # 场景/镜头配置
    billing/             # Stripe、订阅、积分、Webhook
    admin/               # 成本看板、熔断复位
  infrastructure/
    database/            # SQLAlchemy models、session、Alembic migrations
    ai/                  # AIProvider 抽象层（OpenAI 兼容）
    cache/               # Redis 封装（成本计数、限流、验证码）
    vector/              # pgvector 检索具体实现
  main.py                # FastAPI 应用装配、中间件、路由注册、/health
```

## 2. 配置（core/config.py）

- 使用 `pydantic-settings` 的 `BaseSettings` 从环境变量 / `.env.local` 读取；
- 关键配置项（完整清单见 [../infrastructure/30-env-setup.md](../infrastructure/30-env-setup.md)）：
  `SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY`、`RESEND_API_KEY`、
  `OPENAI_API_KEY / OPENAI_BASE_URL`、`SENTRY_DSN`、
  `STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET`、
  `POSTGRES_*`、`REDIS_URL`、`DAILY_BUDGET_LIMIT_USD=50.0`、`PER_USER_WINDOW_LIMIT_USD`。
- 缺失可选配置（如 SENTRY_DSN）时降级 no-op；缺失关键配置时启动失败并明确报错。

## 3. 认证（core/security.py）

- 依赖注入 `get_current_user`：解析 Bearer JWT，校验 Supabase 签发声明；
- Service Role 仅用于服务端管理任务（admin 模块），禁止下发前端；
- 管理员判定：users.role = 'admin'，`require_admin` 依赖保护 admin 路由。

## 4. 请求处理管线（/chat 为例）

```
请求 → CORS/日志中间件
     → get_current_user（401 拦截）
     → kill_switch.check(redis, user_id)   # 日预算 + 单用户窗口，超限直接 429/503 + X-Budget-Exceeded
     → memory.retrieve(user_id, character_id, input)   # pgvector Top-K + 重排，access_count++
     → relationship / emotion / character DNA 装载
     → safety.pre_check(input)            # 自伤词库 → 安全拦截（热线回复，不写记忆/关系）
     → prompt.assemble(七层)              # SYSTEM/SAFETY/MEMORY/RELATIONSHIP/EMOTION/CONTEXT/USER_INPUT
     → AIProvider.chat → AIResponse 校验（Retry≤2 → Fallback）
     → 成本记账 redis.incr(cost keys)     # 估算 USD
     → 落库：memory_candidates(+embedding)、relationship_delta(+events)、emotion、story_event
     → 积分扣减（billing）
     → 返回 AIResponse JSON
```

## 5. 异常与状态码约定

| 场景 | 状态码 | 响应头/体 |
| --- | --- | --- |
| 未认证 | 401 | `{"detail":"unauthorized"}` |
| 无权限（含创作者提现） | **403** | Payout 固定 403 |
| 单用户窗口超限 | **429** | `X-Budget-Exceeded: user` |
| 全局日预算耗尽 | **503** | `X-Budget-Exceeded: daily` |
| 积分不足 | 402/403（二选一，建议 402） | 引导充值错误码 |
| AI 输出非法且重试用尽 | 200 | Fallback 静默友好响应（不向用户暴露错误） |

全局 exception handler 统一把 `BudgetExceededError` 映射为上表响应并加头。

## 6. 后台定时任务（Celery beat / 持久化调度）

| 任务 | 周期 | 内容 |
| --- | --- | --- |
| 关系衰减 | 每日 1 次 | 7 天未互动 intimacy 降 5%–10%，写 relationship_events(decay) |
| 记忆遗忘 | 每日 1 次 | 清理 `expires_at < NOW()` 的记忆；衰减排序分由查询时计算 |
| 积分清零 | **每月 1 号 00:00 UTC** | `UPDATE users SET bonus_credits = 0`（不动 purchased_credits） |
| 成本 key 生命周期 | 写入时设置 | `cost:daily:*` 设 48h TTL，窗口 key 设 15min TTL |
| Stripe 对账 | 每小时（建议） | 拉取订阅状态同步，防 Webhook 丢失 |

**禁止实现**：AI 角色主动给用户发消息的任何定时任务（MVP 反骚扰硬规则）。

## 7. 可观测性

- Sentry SDK 初始化（DSN 缺失 no-op）；
- 结构化日志关键事件：`budget_exceeded`、`ai_retry`、`ai_fallback`、`safety_intercept`、`credits_deducted`、`stripe_webhook`；
- `/health` 返回 `{"status":"ok"}`，并可选检查 DB/Redis 连通性（Phase 0 最简版返回 ok 即可）。

## 8. 模块职责速查

| 模块 | 核心职责 | 关键文档 |
| --- | --- | --- |
| user | 验证码、JWT、注销级联 | 21、../infrastructure/30 |
| character | DNA JSONB、形象/声音配置 | 21 |
| memory | embedding、向量检索、衰减遗忘 | 21、22 |
| emotion | 情绪持久化与注入 | 22 |
| relationship | 7 维数值、事件溯源、衰减 | 21 |
| story/scene | 剧情事件、镜头手势 | 22、../frontend/11 |
| billing | Stripe、积分、创作者收益虚拟化 | 24 |
| admin | 成本看板、熔断复位 | 23 |
