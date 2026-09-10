# 30 · 预备环境配置（Phase 0 前人工完成）

> 上级文档：[../MASTER_SPEC.md](../MASTER_SPEC.md) §0
> 以下 5 项账户注册必须在 Codex 写代码**之前**由人工完成；密钥写入项目根目录 `.env.local`（本地）与 Vercel/Supabase 环境变量（线上）。AI Agent 不得猜测或伪造密钥。

## 1. 服务清单

### 1.1 Supabase（数据库 + 认证）

- 创建项目时**必须勾选 "Enable pgvector"**；
- 获取：
  - `SUPABASE_URL`（Project URL）
  - `SUPABASE_ANON_KEY`（可公开，前端使用）
  - `SUPABASE_SERVICE_ROLE_KEY`（仅后端，严禁入前端/入库）

### 1.2 Resend（邮件）

- 注册发送域名并配置 **DKIM**（SPF/DKIM/DMARC 按 Resend 指引）；
- 获取 `RESEND_API_KEY`；
- 用途：6 位登录验证码、订阅凭证邮件。
- 禁止使用 Supabase 自带邮件（送达率极低）。

### 1.3 OpenAI / 兼容接口

- 获取 `OPENAI_API_KEY`；
- `OPENAI_BASE_URL`（默认 `https://api.openai.com/v1`，使用兼容服务时替换）；
- embedding 维度固定 **1536**（更换模型若维度不同，需同步修改 memories.embedding 与索引——默认锁死 1536）。

### 1.4 Sentry（错误监控）

- 分别创建前端（Next.js）与后端（FastAPI）项目，获取 `SENTRY_DSN`；
- 前端变量使用 `NEXT_PUBLIC_SENTRY_DSN`；DSN 缺失时 SDK 静默降级。

### 1.5 Stripe（支付）

- 先使用**测试模式**：`STRIPE_SECRET_KEY`（sk_test_...）、`STRIPE_WEBHOOK_SECRET`（whsec_...，由 `stripe listen` 或 Webhook 配置生成）；
- 上线前切换生产密钥并重新配置 Webhook 端点。

## 2. 环境变量总表（.env.local 模板）

```bash
# ---- 本地数据库（统一密码，禁止询问）----
POSTGRES_USER=mirai
POSTGRES_PASSWORD=local_dev_pass
POSTGRES_DB=mirai
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
REDIS_URL=redis://localhost:6379/0

# ---- Supabase ----
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# ---- Resend ----
RESEND_API_KEY=
RESEND_FROM_EMAIL=login@your-domain.com

# ---- OpenAI 兼容 ----
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1

# ---- Sentry ----
SENTRY_DSN=

# ---- Stripe（测试模式）----
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# ---- 成本熔断 ----
DAILY_BUDGET_LIMIT_USD=50.0
PER_USER_WINDOW_LIMIT_USD=2.0
PER_USER_WINDOW_MINUTES=10

# ---- 前端（Next.js，仅 NEXT_PUBLIC_ 可入 bundle）----
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SENTRY_DSN=
```

## 3. 密钥安全规则

1. `.env.local` 必须加入 `.gitignore`，仓库中只提供 `.env.example`（无真实值）。
2. `SUPABASE_SERVICE_ROLE_KEY`、`RESEND_API_KEY`、`OPENAI_API_KEY`、`STRIPE_SECRET_KEY`、`STRIPE_WEBHOOK_SECRET` 仅服务端读取。
3. 前端只允许 `NEXT_PUBLIC_` 前缀变量；构建后需检查 bundle 无密钥泄漏。
4. 线上环境变量分别配置在 Vercel（前端）与后端托管平台（Render/Railway/Fly/VPS 等）；Supabase 侧仅配置其集成所需变量。

## 4. 本地 Stripe Webhook（开发用）

```bash
stripe listen --forward-to localhost:8000/billing/webhook
# 输出的 whsec_xxx 写入 STRIPE_WEBHOOK_SECRET
```

## 5. 完成判定（人工自检）

- [ ] Supabase 项目已建且 pgvector 已启用
- [ ] Resend 域名 DKIM 通过验证，可发出测试邮件
- [ ] OpenAI 兼容接口可用（chat + embedding）
- [ ] Sentry DSN 已获取（前后端）
- [ ] Stripe 测试密钥与 webhook secret 就绪
- [ ] `.env.local` 位于项目根目录且未被 git 跟踪
