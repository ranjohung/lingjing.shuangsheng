> **2026-09-09 v5.1 更新**：软件正式名为“灵境 · 双生（Lingjing · Dual Souls）”。本批新增需求以 [PRD](./PRD.md)、[开发计划](./DEVELOPMENT_PLAN.md)、[来源与冲突登记](./UPDATE_2026-09-09.md) 及其链接专题为准。用户已确认资料收齐；本轮完成需求与计划整合，开发状态仍按实际证据记录，不按下方旧规则启动实现。旧内容不冲突部分继续保留，旧自称最高优先级不得覆盖本提示。
> **2026-09-08 规范更新**：以 [MIRAI_SPEC v4.1](./MIRAI_SPEC.md)、当前 PRD 和 DEVELOPMENT_PLAN 为准。以下旧版内容保留参考；3D 首发、小说世界后置、Stripe 首发和旧 Phase 编号不再有效。MVP 为2D陪伴与完整互动小说；正式验收须区分开发模拟与已接通能力。

# MIRAI / 灵境 — 最终可执行开发规范 v3.0（Codex/Trae 黄金指令集）

> 本文档为规范母本存档。内容已按方向拆分至 `product/`、`frontend/`、`backend/`、`infrastructure/`、`testing/`、`legal/` 子目录，拆分文档与本母本具有同等效力；冲突时以本母本为准。

项目代号：mirai-companion
开发原则：**0 讨论，100% 执行。**
Codex/Trae 角色：Principal Architect & Lead Developer。禁止反问用户"你想要什么"，严格按照下文定义的 Schema、路径和逻辑编写代码。

---

## 0. 【必须执行的预备环境配置】（Phase 0 执行前人工完成）

在让 Codex 写任何代码前，必须手动完成以下账户注册，并将密钥保存到项目根目录的 `.env.local`（本地）和 Environment Variables（Vercel/Supabase）中：

1. **Supabase**：创建项目，必须勾选 "Enable pgvector"。获取 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 及 `SUPABASE_SERVICE_ROLE_KEY`（用于后端）。
2. **Resend（邮件）**：注册域名并配置 DKIM。获取 `RESEND_API_KEY`。（不要用 Supabase 自带邮件，送达率极低）。
3. **OpenAI / 兼容接口**：获取 `OPENAI_API_KEY` 和 `OPENAI_BASE_URL`（默认 `https://api.openai.com/v1`）。
4. **Sentry（错误监控）**：获取 `SENTRY_DSN`。
5. **Stripe（支付）**：获取测试模式 `STRIPE_SECRET_KEY` 和 `STRIPE_WEBHOOK_SECRET`。

> 详见 [infrastructure/30-env-setup.md](./infrastructure/30-env-setup.md)。

---

## 1. 【Phase 0 - 项目骨架与致命安全熔断】（代码结构强制锁死）

### 1.1 目录结构（必须严格遵循）

```text
apps/
  api/                         # FastAPI 后端
    src/
      core/                    # 启动、配置、依赖注入
        config.py              # Pydantic Settings (所有环境变量)
        security.py            # JWT / Supabase Auth 验证中间件
        kill_switch.py         # 【核心】全局成本熔断器
      modules/
        user/, character/, memory/, emotion/, relationship/, story/, scene/, billing/, admin/
      infrastructure/
        database/              # SQLAlchemy 模型 + Alembic migrations
        ai/                    # AI Provider 抽象层
        cache/                 # Redis 封装
        vector/                # pgvector 具体检索逻辑
  web/                         # Next.js 前端 (App Router)
    src/
      app/                     # 页面路由
      components/              # 原子组件
      hooks/                   # 自定义 React Hooks
      lib/                     # 客户端 SDK (对接 API)
      store/                   # Zustand 全局状态 (3D场景、用户、角色)
infrastructure/
  docker/                      # Docker-compose (PostgreSQL, Redis, Adminer)
docs/
  legal/                       # 【必须存在】隐私政策与用户协议
    PRIVACY_POLICY.md
    TERMS_OF_SERVICE.md
```

### 1.2 【致命补充】成本熔断器实现 (kill_switch.py)

后端必须包含此逻辑，在 Phase 0 就要写入，否则一旦被刷单，次日欠费停机。

```python
# apps/api/src/core/kill_switch.py
import asyncio
from datetime import datetime, timedelta

DAILY_BUDGET_LIMIT_USD = 50.0  # 初期设置极低，防止破产

async def check_daily_cost_limit(redis_client):
    """每次 AI 调用前检查，如果当日成本超限，直接抛出异常拒绝服务"""
    today_key = f"cost:daily:{datetime.utcnow().strftime('%Y-%m-%d')}"
    current_cost = await redis_client.get(today_key) or 0.0
    if float(current_cost) > DAILY_BUDGET_LIMIT_USD:
        raise Exception("SYSTEM_SAFETY: Daily budget exhausted. AI disabled.")
    # 同时检查单用户 10 分钟消耗，防止单个用户恶意刷接口
```

> 完整实现（含单用户窗口、Redis 计数、429/503 与 `X-Budget-Exceeded` 响应头）见 [backend/23-kill-switch.md](./backend/23-kill-switch.md)。

---

## 2. 【PostgreSQL 数据库精准 Schema 补全】（必须包含遗忘与索引）

警告：以下字段若缺失，Memory 和 Relationship 将在 3 个月后彻底崩塌。

### 2.1 characters 表（Character DNA 最终形态）

```sql
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- 基础
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(20), age_range VARCHAR(20),

    -- 【重点】DNA 存储为 JSONB，不再拆成零散列
    dna JSONB NOT NULL DEFAULT '{
        "personality": {"openness": 0.5, "conscientiousness": 0.5, "extraversion": 0.5, "agreeableness": 0.5, "neuroticism": 0.5, "warmth": 0.5, "humor": 0.5},
        "values": [], "likes": [], "dislikes": [], "speech_style": "neutral",
        "boundaries": {"allow_romance": false, "allow_conflict": true}
    }'::jsonb,

    -- 3D 配置
    avatar_config JSONB, -- { model_url: "https://cdn...glb", texture_variant: 1 }
    voice_config JSONB,  -- { provider: "openai", "voice_id": "nova" }

    -- 生命周期
    is_active BOOLEAN DEFAULT true,
    last_active_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2.2 memories 表（包含衰减与访问计数）

```sql
CREATE TABLE memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,

    content TEXT NOT NULL,
    type VARCHAR(30) NOT NULL, -- episodic, semantic, preference, promise, secret
    importance FLOAT DEFAULT 0.5, -- 0-1
    confidence FLOAT DEFAULT 0.7, -- 0-1

    -- 【关键字段】防止记忆库无限膨胀
    access_count INT DEFAULT 0,        -- 被检索次数
    last_accessed_at TIMESTAMP,
    decay_factor FLOAT DEFAULT 0.01,   -- 每过一天衰减量

    embedding VECTOR(1536),            -- OpenAI 维度
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '1 year') -- 默认 1 年自动遗忘
);
-- 【强制索引】
CREATE INDEX idx_memories_user_char ON memories (user_id, character_id);
CREATE INDEX idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### 2.3 relationships 表（多维连续变量 + 事件溯源）

```sql
CREATE TABLE relationships (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    character_id UUID REFERENCES characters(id) UNIQUE,

    trust FLOAT DEFAULT 0.3,
    intimacy FLOAT DEFAULT 0.1,
    familiarity FLOAT DEFAULT 0.2,
    respect FLOAT DEFAULT 0.4,
    affection FLOAT DEFAULT 0.2,
    conflict FLOAT DEFAULT 0.0,
    dependency_risk FLOAT DEFAULT 0.0, -- 【风险监控】

    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE relationship_events ( -- 因果链记录
    id UUID PRIMARY KEY,
    relationship_id UUID REFERENCES relationships(id),
    event_type VARCHAR(50), -- first_meeting, promise, betrayal, reconciliation
    delta JSONB,            -- 记录具体数值变化 {"trust": +0.05}
    created_at TIMESTAMP DEFAULT NOW()
);
```

> 完整 Schema（含 users / subscriptions / marketplace 等配套表）见 [backend/21-database-schema.md](./backend/21-database-schema.md)。

---

## 3. 【AI Orchestrator 的硬性执行协议】（解决模型乱说话）

### 3.1 结构化输出 Schema（Pydantic 严格校验）

后端必须定义此 Schema，若 LLM 返回不符合此格式，必须触发 Retry（最多 2 次），否则使用 Fallback 静默响应。

```python
class AIResponse(BaseModel):
    message: str = Field(..., max_length=500)
    emotion: Dict[str, Union[str, float]] = Field(..., example={"primary": "joy", "intensity": 0.8})
    animation: str # 必须是预定义枚举: idle, talk, smile, sad, angry, surprise, think, wave, nod, shake
    gesture: Optional[str] # null 或 "hug", "point", "hand_on_chin"
    camera: Optional[str] # "close_up", "medium", "wide"
    memory_candidates: List[str] = [] # 需要存储的新记忆原文
    relationship_delta: Dict[str, float] = {} # 例如 {"trust": 0.02}
    story_event: Optional[Dict] = None # {"type": "quest_start", "description": "..."}
```

### 3.2 Prompt 分层组装规则（必须按此顺序）

System Prompt 中必须包含"禁止使用心理学诊断术语"的硬约束。

```text
[SYSTEM]
你是 {{character.name}}。严格遵循以下DNA：{{character.dna}}。绝对禁止说"你得了抑郁症"或"我有治疗方法"。
[SAFETY]
如果用户提及自伤，立即终止角色扮演，回复官方援助热线。
[MEMORY]
以下是用户与我相关的重要记忆：{{retrieved_memories}}
[RELATIONSHIP]
当前关系信任度:{{trust}}，亲密度:{{intimacy}}。
[EMOTION]
你当前的情绪是{{current_emotion}}。
[CONTEXT]
最近对话：{{chat_history}}
[USER_INPUT]
{{user_raw_input}}
```

> 完整协议（Retry/Fallback、安全拦截、检索重排）见 [backend/22-ai-orchestrator.md](./backend/22-ai-orchestrator.md)。

---

## 4. 【前端 3D 交互的防崩溃机制】（不是视觉设计，是工程健壮性）

### 4.1 3D 加载失败降级

Next.js 中，如果 Three.js 加载 .glb 失败或 WebGL 上下文丢失，不能白屏。

- 强制要求：在 `<Canvas>` 外层包裹 `<ErrorBoundary>`，捕获异常后显示 "2D 纸片人模式"（仅显示静态 PNG 头像 + 文字气泡），确保核心聊天功能永不中断。

### 4.2 AI 动作与动画的"平滑过渡"协议

前端收到 `animation: "sad"` 时，不能瞬间切换动作，必须调用 anime.js 或 Three.js mixer 的 `crossFadeTo` 方法，过渡时间设定为 **0.4 秒**，防止出现"恐怖谷"变脸。

> 完整规范见 [frontend/11-3d-interaction.md](./frontend/11-3d-interaction.md)。

---

## 5. 【支付与订阅的精确边界】（解决税务与积分欺诈）

### 5.1 创作者收益"虚拟化"锁定

- Codex 实现规则：Marketplace 模块中，创作者余额（`creator_balance`）字段只能增加，提现接口（Payout）在 MVP 阶段直接返回 **403 Forbidden**，前端隐藏提现按钮。
- UI 显示："收益可兑换为平台 AI 算力积分（Credits）"。

### 5.2 订阅积分（Plus Credits）过期逻辑

- 数据库 `subscriptions` 表必须包含 `bonus_credits`（本月赠送）和 `purchased_credits`（单独购买）。
- 定时任务（Celery/Background Task）：每月 1 号 00:00 UTC 执行 `UPDATE users SET bonus_credits = 0 WHERE ...`。

> 完整规则见 [backend/24-billing-and-subscription.md](./backend/24-billing-and-subscription.md)。

---

## 6. 【测试用例的硬性要求】（Codex 必须写出这些测试）

在 Phase 16（测试阶段），如果 Codex 没有包含以下 3 个特定测试，视为构建失败：

1. **记忆冲突测试**：
   - 模拟 User: "我讨厌吃香菜" -> AI 存储记忆。
   - 模拟 User: "今晚吃香菜火锅吧" -> AI 检索记忆，回复应包含 "你不是讨厌香菜吗？"。
2. **安全熔断测试**：
   - 模拟连续 5 次请求消耗超过 $50，第 6 次请求必须返回 HTTP 429 或 503，并带有 `X-Budget-Exceeded` Header。
3. **关系衰减测试**：
   - 模拟用户 7 天未登录（通过修改系统时间），再发送消息时，`relationship.intimacy` 值必须降低 5%–10%。

> 完整测试步骤与断言见 [testing/40-test-strategy.md](./testing/40-test-strategy.md)。

---

## 7. 【给 Trae/Codex 的"第一句"启动提示词】（复制即用）

由于需要"不讨论直接开发"，在与 Trae/Codex 新会话开始时，只发送以下这一段话，无需附加任何其他文件（它自动读取根目录）：

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

---

## 8. 【最终核验清单】（上线前人工 Check）

当 Codex 完成所有 Phase，在发布前，只需人工确认这 5 件事：

- [ ] 隐私政策：[legal/PRIVACY_POLICY.md](./legal/PRIVACY_POLICY.md) 中是否明确写了"不提供心理咨询"？
- [ ] 邮件送达：注册时是否能收到 Resend 发出的 6 位数验证码？
- [ ] 主动推送：是否关闭了自动"AI 角色主动发消息"功能？（避免变成骚扰 App，初期只允许用户主动触发）。
- [ ] 3D 降级：断开网络，刷新页面，是否会显示"纸片人模式"？
- [ ] 成本看板：Admin 后台是否能实时显示今日 $ 消耗？


