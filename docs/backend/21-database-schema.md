# 21 · 数据库 Schema（PostgreSQL + pgvector）

> 上级文档：[../MASTER_SPEC.md](../MASTER_SPEC.md) §2
> 强制要求：Supabase 建项时勾选 **Enable pgvector**；迁移由 Alembic 管理（第一版 `create_tables`）。
> 以下 SQL 为契约级定义：字段名、类型、默认值、索引必须逐字实现。

## 0. 扩展

```sql
CREATE EXTENSION IF NOT EXISTS vector;      -- pgvector
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()
```

## 1. users（用户与积分账户）

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL DEFAULT 'user',   -- user | admin

    -- 积分账户（billing 读取的事实来源）
    bonus_credits FLOAT NOT NULL DEFAULT 0.0,   -- 订阅赠送：每月 1 号 00:00 UTC 清零
    purchased_credits FLOAT NOT NULL DEFAULT 0.0, -- 充值购买：不过期

    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMP
);
```

> 说明：规范 §5.2 要求 `subscriptions` 表包含 `bonus_credits/purchased_credits`；本项目以 users 上的积分余额为扣减事实来源，subscriptions 记录订阅计划与每期赠送快照（见 §6）。月度清零任务对 users 执行，并同步刷新订阅快照。

## 2. characters（Character DNA）

```sql
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,
    gender VARCHAR(20),
    age_range VARCHAR(20),

    -- DNA 存储为 JSONB，不拆成零散列
    dna JSONB NOT NULL DEFAULT '{
        "personality": {"openness": 0.5, "conscientiousness": 0.5, "extraversion": 0.5,
                        "agreeableness": 0.5, "neuroticism": 0.5, "warmth": 0.5, "humor": 0.5},
        "values": [], "likes": [], "dislikes": [], "speech_style": "neutral",
        "boundaries": {"allow_romance": false, "allow_conflict": true}
    }'::jsonb,

    avatar_config JSONB,  -- { "model_url": "https://cdn.../x.glb", "texture_variant": 1, "fallback_png_url": "..." }
    voice_config JSONB,   -- { "provider": "openai", "voice_id": "nova" }

    is_active BOOLEAN DEFAULT true,
    last_active_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_characters_owner ON characters (owner_id) WHERE is_active = true;
```

## 3. memories（长期记忆：衰减 + 访问计数 + 自动遗忘）

```sql
CREATE TABLE memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,

    content TEXT NOT NULL,
    type VARCHAR(30) NOT NULL,   -- episodic | semantic | preference | promise | secret
    importance FLOAT NOT NULL DEFAULT 0.5,   -- 0-1
    confidence FLOAT NOT NULL DEFAULT 0.7,   -- 0-1

    access_count INT NOT NULL DEFAULT 0,     -- 被检索次数
    last_accessed_at TIMESTAMP,
    decay_factor FLOAT NOT NULL DEFAULT 0.01, -- 每过一天衰减量

    embedding VECTOR(1536),                  -- OpenAI 维度
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '1 year') -- 默认 1 年自动遗忘
);

-- 强制索引
CREATE INDEX idx_memories_user_char ON memories (user_id, character_id);
CREATE INDEX idx_memories_embedding ON memories
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_memories_expires ON memories (expires_at);
```

检索排序参考（重排公式，实现于 `infrastructure/vector`）：

```sql
-- 语义召回 Top-K 后按 重要性/时近/访问衰减 重排
SELECT id, content, type, importance,
       ( importance * 1.0
       + (1.0 / (1.0 + EXTRACT(EPOCH FROM (NOW() - COALESCE(last_accessed_at, created_at))) / 86400.0 * decay_factor))
       ) AS score
FROM memories
WHERE user_id = :uid AND character_id = :cid
  AND expires_at > NOW()
ORDER BY embedding <=> :query_embedding   -- 余弦距离（ivfflat 索引）
LIMIT :k;
```

- 命中后：`access_count = access_count + 1`，`last_accessed_at = NOW()`。
- `secret` 类型仅当关系 intimacy ≥ 阈值（建议 0.6）时允许进入 Prompt。

## 4. relationships（7 维连续变量）

```sql
CREATE TABLE relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE UNIQUE,

    trust FLOAT NOT NULL DEFAULT 0.3,
    intimacy FLOAT NOT NULL DEFAULT 0.1,
    familiarity FLOAT NOT NULL DEFAULT 0.2,
    respect FLOAT NOT NULL DEFAULT 0.4,
    affection FLOAT NOT NULL DEFAULT 0.2,
    conflict FLOAT NOT NULL DEFAULT 0.0,
    dependency_risk FLOAT NOT NULL DEFAULT 0.0,  -- 风险监控

    last_interaction_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_relationships_user ON relationships (user_id);
```

- 每角色唯一一行（`character_id UNIQUE`）；创建角色时自动初始化。
- 所有维度更新后钳制到 [0, 1]。

## 5. relationship_events（事件溯源 / 因果链）

```sql
CREATE TABLE relationship_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    -- first_meeting | promise | betrayal | reconciliation | milestone | decay | ...
    delta JSONB,                 -- 具体数值变化，如 {"trust": 0.05, "intimacy": 0.02}
    meta JSONB,                  -- 可选上下文（触发消息摘要等，禁止存敏感原文）
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rel_events_rel ON relationship_events (relationship_id, created_at);
```

## 6. subscriptions 与 billing

```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255) UNIQUE,
    plan VARCHAR(30) NOT NULL DEFAULT 'free',   -- free | plus
    status VARCHAR(30) NOT NULL DEFAULT 'inactive', -- active | past_due | canceled | inactive

    -- 本期积分快照（规范要求字段）
    bonus_credits FLOAT NOT NULL DEFAULT 0.0,      -- 本月赠送
    purchased_credits FLOAT NOT NULL DEFAULT 0.0,  -- 单独购买（累计快照）

    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 创作者收益（虚拟化：只增，不可提现）
CREATE TABLE creator_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 创作者
    creator_balance FLOAT NOT NULL DEFAULT 0.0,  -- 只增不减；单位=平台积分
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE earning_ledger (   -- 收益流水（只插入，不更新/删除）
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount FLOAT NOT NULL CHECK (amount > 0),    -- 入账必须为正
    source VARCHAR(30) NOT NULL,                 -- marketplace_sale | ...
    ref_id UUID,                                 -- 关联订单
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

- **月度清零任务（每月 1 号 00:00 UTC）**：
  `UPDATE users SET bonus_credits = 0 WHERE ...`；purchased_credits 不动；subscriptions 快照同步重置 bonus 部分。
- **Payout 不存在成功路径**：后端不建 payout 表、不接入 Stripe Payout/Connect 转账；`/billing/payout` 路由直接返回 403。

## 7. marketplace（创作者市场）

```sql
CREATE TABLE marketplace_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(120) NOT NULL,
    item_type VARCHAR(20) NOT NULL,          -- dna_template | avatar_pack
    dna_snapshot JSONB,                      -- 角色 DNA 模板
    avatar_assets JSONB,                     -- { model_url, texture_variant, fallback_png_url }
    price_credits FLOAT NOT NULL CHECK (price_credits > 0),
    is_listed BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE marketplace_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES marketplace_items(id),
    paid_credits FLOAT NOT NULL,
    character_copy_id UUID REFERENCES characters(id),  -- 购买后生成的角色副本
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (buyer_id, item_id)
);
```

## 8. 剧情与情绪（最小表）

```sql
CREATE TABLE story_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,               -- quest_start | quest_complete | milestone ...
    description TEXT,
    payload JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE emotion_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE UNIQUE,
    primary_emotion VARCHAR(30) NOT NULL DEFAULT 'neutral',
    intensity FLOAT NOT NULL DEFAULT 0.5,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## 9. 场景与世界（P1/P2）

```sql
-- P1：内置场景（10 个首批）+ 用户当前场景状态
CREATE TABLE scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(50) NOT NULL UNIQUE,   -- bedroom, living_room, cafe, school, library,
                                       -- street, starry_sky, ancient_palace, sci_fi, chibi_room
    name VARCHAR(100) NOT NULL,
    scene_config JSONB NOT NULL DEFAULT '{}'::jsonb
    -- { time_of_day, weather, lighting, location, objects[], ambient_sound, bgm_url }
);

CREATE TABLE character_scene_states (   -- 角色"住在"哪个场景 + 场景内状态
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE UNIQUE,
    scene_id UUID REFERENCES scenes(id),
    current_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- { in_game_time, weather_override, active_object, ambient, last_action }
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- P2：世界/同人引擎
CREATE TABLE worlds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,   -- null = 官方/授权 IP
    is_official BOOLEAN NOT NULL DEFAULT false,
    title VARCHAR(120) NOT NULL,
    era VARCHAR(50),                -- 架空古代 / 科幻 / 现代 ...
    rules JSONB,                    -- { genre: "wuxia", factions: ["皇城","魔教","江湖联盟"] }
    lore JSONB,                     -- 世界设定文档
    timeline JSONB,                 -- 剧情时间线
    visibility VARCHAR(20) NOT NULL DEFAULT 'private', -- private | listed | official
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 用户在世界中的身份（User Role）与角色-世界归属
CREATE TABLE world_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    user_role JSONB,                -- { role_name, faction, background }
    is_user_world BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (world_id, character_id)
);
```

- 场景状态 `scene_config/current_state` 注入 Prompt `[CONTEXT]`（或新增 `[SCENE]` 段），约束角色行为与氛围一致（深夜雨天不欢快）。
- 剧情状态机的运行态存 `story_events.payload`（已有表）+ 可选 `world_state` JSONB（随 world_memberships 扩展），不新增频繁变更的宽表。

## 10. 健康指标与使用配额

```sql
-- P1：Well-being Score 按周快照
CREATE TABLE wellbeing_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    autonomy_score FLOAT,           -- 自主性
    social_balance_score FLOAT,     -- 现实社交平衡
    emotion_regulation_score FLOAT, -- 情绪调节
    over_dependency_risk FLOAT,     -- 过度依赖风险
    compulsive_use_risk FLOAT,      -- 使用强迫风险
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, week_start)
);

-- P0：免费档每日额度计数（也可纯 Redis 落库审计；30 分钟/天、2 角色限制）
CREATE TABLE usage_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day DATE NOT NULL,
    chat_seconds INT NOT NULL DEFAULT 0,
    ai_requests INT NOT NULL DEFAULT 0,
    UNIQUE (user_id, day)
);
```

## 11. 记忆用户控制权（FR-MEM-07）

- memories 增加 `deleted_at TIMESTAMP`（软删后立即不参与检索，定时任务物理删除 embedding 行）；
- **定向遗忘**：对用户输入"忘掉关于 XX 的所有记忆"做 embedding 检索 + 语义过滤，批量置 `deleted_at`；
- **私密模式**：users 增加 `private_mode BOOLEAN DEFAULT false`（或 user_settings JSONB）；为 true 时本轮 `memory_candidates` 不落库；
- **导出**：按 user_id 导出 memories/relationship_events/story_events 为 JSON，异步任务生成下载。

## 12. DNA 扩展键（P1，JSONB 无需迁移列）

characters.dna 在既有键基础上增加（默认值由应用层 merge）：

```json
{
  "attachment_style": "secure",
  "personality_ext": {
    "jealousy": 0.3, "independence": 0.6, "empathy": 0.7,
    "assertiveness": 0.5, "curiosity": 0.6, "playfulness": 0.5,
    "romance": 0.3, "patience": 0.6
  },
  "beliefs": [],
  "emotional_patterns": {},
  "relationship_style": "",
  "goals": [],
  "character_arc": ""
}
```

- `attachment_style ∈ secure | anxious | avoidant | disorganized`：**仅作为角色行为风格注入 Prompt，严禁用于描述/诊断用户**。

## 13. 迁移与维护规则

1. 所有表结构变更走 Alembic 迁移；第一版迁移名 `create_tables`，Phase 0 随 `alembic upgrade head` 应用。
2. `ivfflat` 索引在数据导入后再 `ANALYZE` 以获得稳定计划（lists=100 为规范固定值）。
3. 外键一律 `ON DELETE CASCADE`，保证注销账号彻底遗忘。
4. 禁止用迁移删除 `expires_at`、`access_count`、`decay_factor`、`dependency_risk` 等防崩塌字段。
