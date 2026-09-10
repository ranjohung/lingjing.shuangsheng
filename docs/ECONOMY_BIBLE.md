# 灵境 · 双生 — 经济工程手册（ECON-BIBLE） v5.2 + v5.14 增量登记

> **本批 v5.14 数据表增量已正式归入 PRD 与 db.js：**
> - 详见 [PRD.md §"数据表 v5.14 完整规格"](PRD.md)（11 张新表：`novel_copyright_tiers` / `adaptation_licenses` / `adaptation_revenue_records` / `creator_monetization_points` / `creator_earnings` / `novel_quality_reports` / `novel_review_records` / `content_reports` / `tax_records` / `aml_monitoring` / `ai_helper_usage`）
> - 详见 [db.js](../output/preview/js/db.js)（11 张表 DDL + 通用 CRUD + `lingjing_v514_*` 前缀）
>
> 基线：[ECONOMY_SYSTEM.md](../ECONOMY_SYSTEM.md)（v5.1 §ECON-01~08 范围与原则）/ [CREATOR_SYSTEM.md](../CREATOR_SYSTEM.md)（创作者与导出）/ [backend/26-world-os-engineering-contract.md](../backend/26-world-os-engineering-contract.md) §熔断 / [UPDATE_2026-09-09.md §C01-C20](../UPDATE_2026-09-09.md) 待裁决登记。

ECONOMY_SYSTEM 给出"原则 + 商品表 + 候选价格 + KPI 目标"。本文档（ECON-BIBLE）补强的是：**完整 DDL / 完整 API schema / 竞品对标 / 用户生命周期剧本 / 转化漏斗 / 单位经济测算 / 阶段收入目标**。所有数字若与 ECONOMY_SYSTEM 不一致，**以 v5.1 ECONOMY_SYSTEM 为准**；本文新增内容均作为"工程实施级"补强，不修改 v5.1 范围。

⚠ 本文出现的所有竞品数据、价格、付费率、ARPPU、收入测算，均为**用户提供的研究假设**，未自行核实；不作为承诺或财务预测。商业口径必须在 B8 上线闸门处完成核验后才生效。

---

## 一、基础经济数据表 DDL（11 张）

### 1.1 用户货币主表 user_currency

```sql
CREATE TABLE user_currency (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    -- 余额只缓存"当前可用"，历史记录在 currency_lots；这里不展示扣减顺序
    ling_yu_available INT DEFAULT 50 NOT NULL CHECK (ling_yu_available >= 0),
    ling_jing_available BIGINT DEFAULT 0  NOT NULL CHECK (ling_jing_available >= 0),
    -- 冻结（用于正在进行的下单/抽卡事务）
    ling_yu_frozen   INT DEFAULT 0 NOT NULL CHECK (ling_yu_frozen >= 0),
    ling_jing_frozen BIGINT DEFAULT 0 NOT NULL CHECK (ling_jing_frozen >= 0),
    last_checkin_at  TIMESTAMP,
    -- 月度清零提醒（用于订阅赠币月末清零）
    monthly_bonus_reset_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_currency_checkin ON user_currency(last_checkin_at);
```

**说明**：`user_currency` 只保留"当前可用 + 冻结"，真正决定每笔币有效期的是下面的 `currency_lots`。同理 [ECONOMY_SYSTEM §ECON-01](../ECONOMY_SYSTEM.md) "不能继续用单个 ling_jing 字段承载所有有效期"。

### 1.2 货币批次表 currency_lots（FIFO 扣减顺序）

```sql
CREATE TABLE currency_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency VARCHAR(10) NOT NULL,       -- ling_yu | ling_jing
    amount BIGINT NOT NULL CHECK (amount > 0),
    consumed BIGINT DEFAULT 0 NOT NULL CHECK (consumed >= 0 AND consumed <= amount),
    source VARCHAR(30) NOT NULL,         -- checkin | task | ad | recharge | subscription_bonus | creator_income | refund
    source_ref VARCHAR(255),             -- recharge 单号 / 订阅 ID / 任务 ID
    expires_at TIMESTAMP,                -- NULL = 永久（购买的）
    created_at TIMESTAMP DEFAULT NOW(),
    consumed_at TIMESTAMP
);

CREATE INDEX idx_currency_lots_user ON currency_lots(user_id, currency, expires_at);
CREATE INDEX idx_currency_lots_active ON currency_lots(user_id, currency, consumed) WHERE consumed < amount;
```

**消费规则**：FIFO（先过期先消）→ 同过期时间按 `created_at` 升序。月末清零订阅赠币自动遍历 `source = 'subscription_bonus' AND expires_at < NOW()` 的 lot。

### 1.3 订单与商品 orders / order_items

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_no VARCHAR(40) UNIQUE NOT NULL,          -- 幂等键
    channel VARCHAR(20) NOT NULL,                  -- wechat | alipay | apple | google | system
    product_type VARCHAR(30) NOT NULL,            -- recharge | subscription | item | card | export | service
    product_id VARCHAR(100) NOT NULL,
    amount_cents INT NOT NULL CHECK (amount_cents > 0),        -- 以分存储
    currency VARCHAR(8) NOT NULL DEFAULT 'CNY',
    status VARCHAR(20) DEFAULT 'created',         -- created | paid | cancelled | refunding | refunded | failed
    paid_at TIMESTAMP, refunded_at TIMESTAMP,
    payment_channel_txn VARCHAR(255),
    raw_payload JSONB,                             -- 渠道回调原文
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    quantity INT DEFAULT 1 NOT NULL CHECK (quantity > 0),
    unit_price_cents INT NOT NULL,
    grant_payload JSONB                            -- 实际授予用户的物品 / 灵晶 / 权益
);

CREATE INDEX idx_orders_user ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_status ON orders(status, created_at);
CREATE INDEX idx_orders_channel_txn ON orders(payment_channel_txn);
```

### 1.4 权益表 entitlements

```sql
CREATE TABLE entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,          -- subscription | item_unlock | card | cg | skin | voicepack | title | route_unlock | cosmetic
    ref_id VARCHAR(100) NOT NULL,       -- item_id / route_id / pack_id
    status VARCHAR(20) DEFAULT 'active',-- active | consumed | expired | revoked
    source VARCHAR(30) NOT NULL,        -- purchase | subscription_grant | creator_grant | admin_grant | bring_out_bonus
    source_ref VARCHAR(255),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_entitlements_user ON entitlements(user_id, type, status);
CREATE INDEX idx_entitlements_expiry ON entitlements(expires_at) WHERE expires_at IS NOT NULL;
```

权益与"用户能看到该物品"挂钩；前置检查永远走 `entitlements`，不下放到客户端可信。

### 1.5 价目表 price_versions

```sql
CREATE TABLE price_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) NOT NULL,
    version INT NOT NULL,
    currency VARCHAR(8) NOT NULL DEFAULT 'CNY',
    unit_price_cents INT NOT NULL,
    -- 赠额（如充值 30 元送 100 灵晶，对应赠送率 103/100）
    bonus_lot_template JSONB,           -- {currency: 'ling_jing', bonus: 100, source: 'recharge_bonus', ttl_days: 365}
    promo JSONB,                        -- 折扣 / 满减 / 限时活动
    active_from TIMESTAMP NOT NULL,
    active_to TIMESTAMP,
    enabled BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(sku, version)
);

CREATE INDEX idx_price_versions_sku ON price_versions(sku, enabled, active_from);
```

**规则**：
- 客户端永远只读 `enabled=true AND NOW() BETWEEN active_from AND active_to` 的最新有效版本
- 历史订单以创建时的 `price_version_id` 锁定为准
- 价格变更不静默覆盖已有 SKU；管理员发布新版（version+1）

### 1.6 订阅表 subscriptions

```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(20) NOT NULL,         -- free | monthly_plus | monthly_star | yearly_plus | yearly_star
    status VARCHAR(20) DEFAULT 'pending',   -- pending | active | grace | expired | cancelled | refunded | frozen
    started_at TIMESTAMP,
    expires_at TIMESTAMP,
    auto_renew BOOLEAN DEFAULT false,
    payment_channel VARCHAR(20),
    external_sub_id VARCHAR(255),           -- 微信支付协议号 / Apple subscription ID
    -- 权益版本（防止订阅权益变动后旧用户丢失/获得新权益）
    benefit_version_id UUID REFERENCES price_versions(id),
    -- 赠币
    bonus_credits_monthly BIGINT DEFAULT 0,  -- 当前周期赠币
    bonus_credits_consumed BIGINT DEFAULT 0,
    -- 取消 / 退款窗口
    cancel_at TIMESTAMP,
    cancel_reason VARCHAR(255),
    refund_state VARCHAR(20),                -- none | requested | approved | rejected | done
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id, status);
CREATE INDEX idx_subscriptions_expires ON subscriptions(expires_at) WHERE status IN ('active', 'grace');
```

**关键约束**：
- 一个用户同一时间最多一张 active 订阅（升级需先 cancel）
- 续费前先 check `auto_renew=true` + `expires_at <= NOW()`
- 取消 ≠ 退款；退订走退款接口独立审核

### 1.7 退款 refunds

```sql
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    user_id UUID NOT NULL REFERENCES users(id),
    amount_cents INT NOT NULL CHECK (amount_cents > 0),
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',  -- pending | reviewing | approved | rejected | done | failed
    reviewer_id UUID REFERENCES users(id),
    decided_at TIMESTAMP,
    channel_refund_id VARCHAR(255),
    -- 反向流水：退款成功后写一条 consumed currency_lots 翻转记录到 ledger
    ledger_entry_id UUID REFERENCES currency_lots(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refunds_user ON refunds(user_id, created_at DESC);
CREATE INDEX idx_refunds_status ON refunds(status);
```

### 1.8 抽卡与卡牌表 destiny_cards / card_pulls

```sql
CREATE TABLE destiny_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    world_id UUID REFERENCES worlds(id),
    story_session_id UUID REFERENCES story_sessions(id),
    chapter_id UUID REFERENCES chapters(id),
    event_id UUID REFERENCES world_events(id),
    name VARCHAR(255) NOT NULL,
    rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common','uncommon','rare','epic','legendary','limited')),
    image_url TEXT,
    story_snapshot TEXT,                -- 这张卡记录的那一帧叙事
    source VARCHAR(30) NOT NULL,        -- free_pull | paid_pull | quest_reward | creator_grant
    source_ref VARCHAR(255),
    -- 收藏与展示
    is_pinned BOOLEAN DEFAULT false,
    is_tradable BOOLEAN DEFAULT false,  -- 二期卡牌交易开通
    -- 类型与时期
    set_id VARCHAR(100),               -- 例如 "destiny_2026_autumn"
    serial_no INT,                     -- 集卡内序号
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_destiny_cards_user ON destiny_cards(user_id, rarity);
CREATE INDEX idx_destiny_cards_world ON destiny_cards(world_id);
CREATE INDEX idx_destiny_cards_set ON destiny_cards(set_id, serial_no);

CREATE TABLE card_pulls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pull_type VARCHAR(20) NOT NULL,    -- single | ten_pull
    cost_ling_jing BIGINT NOT NULL,    -- 单抽 200 / 十连 1800
    source VARCHAR(20),                -- event | character | world | system
    source_ref VARCHAR(255),
    -- 抽卡结果在 destiny_cards 中以 pull_batch_id 关联
    pull_batch_id UUID,
    pulled_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_card_pulls_user ON card_pulls(user_id, pulled_at DESC);
CREATE INDEX idx_card_pulls_batch ON card_pulls(pull_batch_id);
```

**抽卡概率 / 保底占位**（E-CONF，在 B8 实施时定版，详见 §五）：
| 稀有度 | 概率 / 单抽 | 保底 |
|---|---|---|
| common (白) | 60% | — |
| uncommon (蓝) | 25% | — |
| rare (紫) | 12% | — |
| epic (金) | 2.7% | — |
| legendary (彩) | 0.3% | 90 抽必出彩 |
| limited (限定) | 季度活动 | 取决于活动 |

**未实施前，禁止承诺具体概率 / 保底数字**。

### 1.9 命运卡分享 / 抉择卡 share_records / choice_cards

```sql
CREATE TABLE share_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    share_type VARCHAR(20) NOT NULL,        -- destiny_card | choice_card | ending | world | character
    ref_id UUID NOT NULL,
    -- 分享落地页短链
    short_url VARCHAR(500),
    qrcode_url TEXT,
    -- 隐私 / 权限
    visibility VARCHAR(20) DEFAULT 'private', -- private | unlisted | public
    -- 访问次数、撤回
    view_count INT DEFAULT 0,
    revoked_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_share_records_user ON share_records(user_id, created_at DESC);
CREATE INDEX idx_share_records_ref ON share_records(share_type, ref_id);
```

### 1.10 创作者 creators / creator_earnings / payouts

```sql
CREATE TABLE creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    level INT DEFAULT 1 NOT NULL CHECK (level BETWEEN 1 AND 5),
    -- 等级与权益版本（防止规则变动让旧创作者降级或被锁定权益）
    level_policy_version INT DEFAULT 1,
    published_worlds INT DEFAULT 0 NOT NULL,
    total_plays BIGINT DEFAULT 0 NOT NULL,
    rating FLOAT DEFAULT 0,
    -- 累计收入（灵晶 = 仅可消费；提现另外统计）
    creator_balance BIGINT DEFAULT 0 NOT NULL CHECK (creator_balance >= 0),
    pending_payout_cents BIGINT DEFAULT 0 NOT NULL CHECK (pending_payout_cents >= 0),
    -- 提现开关：MVP 强制 false；月流水 ≥10 万元走审核开通
    payout_enabled BOOLEAN DEFAULT false,
    payout_lock_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_creators_level ON creators(level, total_plays DESC);

CREATE TABLE creator_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    world_id UUID REFERENCES worlds(id),
    chapter_id UUID REFERENCES chapters(id),
    -- 来源与金额
    source VARCHAR(30) NOT NULL,    -- world_purchase | skin_purchase | cg_purchase | route_unlock | subscription_share | card_trade
    source_ref UUID,                -- order_id
    gross_ling_jing BIGINT NOT NULL,
    platform_fee_ling_jing BIGINT NOT NULL,
    net_ling_jing BIGINT NOT NULL,
    -- 反向流水（退款扣回）
    reversed BOOLEAN DEFAULT false,
    reversed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_creator_earnings_creator ON creator_earnings(creator_id, created_at DESC);

CREATE TABLE creator_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
    status VARCHAR(20) DEFAULT 'pending',  -- pending | reviewing | approved | paid | failed | rejected
    channel VARCHAR(20),                   -- wechat | alipay | bank
    channel_account VARCHAR(255),
    reviewer_id UUID REFERENCES users(id),
    decided_at TIMESTAMP,
    paid_at TIMESTAMP,
    failure_reason TEXT,
    -- 返佣
    platform_commission_cents BIGINT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_creator_payouts_creator ON creator_payouts(creator_id, status);
CREATE INDEX idx_creator_payouts_status ON creator_payouts(status);
```

**创作者铁律**：
- MVP 阶段 `creator_balance` 只增不减（与 v5.1 ECONOMY_SYSTEM §ECON-06 一致）
- 提现接口在 MVP 阶段一律返回 `403 Forbidden`
- 前端隐藏"提现"按钮
- 月流水 ≥10 万元（用户研究假设）走风控审计后才能开启 `payout_enabled = true`
- 退款发生时必须写一条 `reversed=true` 的反向 `creator_earnings`，不静默扣回

### 1.11 交易对账 settlements

```sql
CREATE TABLE settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_start DATE NOT NULL,
    period_end   DATE NOT NULL,
    -- 渠道汇总
    channel VARCHAR(20) NOT NULL,
    gross_cents BIGINT NOT NULL,
    fee_cents BIGINT NOT NULL,
    net_cents BIGINT NOT NULL,
    currency VARCHAR(8) NOT NULL DEFAULT 'CNY',
    -- 与渠道对账的明细
    raw_payload JSONB,
    -- 校验
    internal_orders_count INT,
    channel_txn_count INT,
    matched BOOLEAN DEFAULT false,
    matched_at TIMESTAMP,
    UNIQUE(period_start, period_end, channel)
);

CREATE INDEX idx_settlements_period ON settlements(period_start, period_end);
CREATE INDEX idx_settlements_unmatched ON settlements(period_start) WHERE matched = false;
```

> ⚠ 11 张表名第一次新增独立表 / 不同 schema 命名空间。建议先在 Schema `economy` 里跑过半年再决定是否合入主 public schema。

---

## 二、8 个核心 API schema（Pydantic + TypeScript 双版本）

### 2.1 货币余额 GET /api/v1/currency/balance

**Python Pydantic (response)**

```python
from pydantic import BaseModel, Field
from typing import Literal

CurrencyType = Literal["ling_yu", "ling_jing"]

class CurrencyBalance(BaseModel):
    user_id: str
    ling_yu_available: int = Field(..., ge=0, description="可用灵玉")
    ling_yu_frozen: int = Field(0, ge=0, description="冻结灵玉")
    ling_jing_available: int = Field(0, ge=0, description="可用灵晶")
    ling_jing_frozen: int = Field(0, ge=0, description="冻结灵晶")
    last_checkin_at: str | None = None
    monthly_bonus_reset_at: str | None = None
    # 即将过期提醒
    ling_yu_expiring_in_7d: int = 0
    ling_jing_expiring_in_30d: int = 0
```

**TypeScript (SDK 类型)**

```ts
export type CurrencyType = 'ling_yu' | 'ling_jing';

export interface CurrencyBalance {
  user_id: string;
  ling_yu_available: number;
  ling_yu_frozen: number;
  ling_jing_available: number;
  ling_jing_frozen: number;
  last_checkin_at: string | null;
  monthly_bonus_reset_at: string | null;
  ling_yu_expiring_in_7d: number;
  ling_jing_expiring_in_30d: number;
}
```

**速率限制**：60/min/user。余额变动通过 SSE/WebSocket 推送。

### 2.2 充值 POST /api/v1/currency/recharge

**Request**

```python
class RechargeRequest(BaseModel):
    sku: str                               # "recharge_30" / "recharge_68" 等
    channel: Literal["wechat", "alipay", "apple", "google"]
    client_ip: str | None = None
    idempotency_key: str = Field(..., min_length=8, max_length=64)
```

**Response**

```python
class RechargeOrder(BaseModel):
    order_no: str
    amount_cents: int
    currency: str = "CNY"
    channel: str
    channel_payload: dict                  # 让前端打开 SDK 收银台的参数
    expires_in_seconds: int                # 二维码 / 收银台有效时间
```

**错误码**

| Code | HTTP | 含义 |
|---|---|---|
| 40001 | 400 | SKU 不存在 / 下架 |
| 40002 | 400 | idempotency_key 重复（返回原订单） |
| 40101 | 401 | 未登录 |
| 40301 | 403 | 未成年人 / 风控拒绝 |
| 42901 | 429 | 60 秒内重复下单 |

**重要**：回调落库前必须 `SELECT … FOR UPDATE` 锁单 + 校验签名 + 校验幂等 + 比对金额 + 发放 `currency_lots`。**支付回调不重不漏不重复发币**是 B8 上线闸门的第一条。

### 2.3 订阅购买 POST /api/v1/subscription/purchase

```python
class SubscriptionPurchaseRequest(BaseModel):
    plan_type: Literal["monthly_plus", "monthly_star", "yearly_plus", "yearly_star"]
    channel: Literal["wechat", "alipay", "apple", "google"]
    auto_renew: bool = False
    coupon_code: str | None = None
    idempotency_key: str

class SubscriptionPurchaseResponse(BaseModel):
    subscription_id: str
    order_no: str
    started_at: str
    expires_at: str
    auto_renew: bool
    # 当前生效权益版本（防止 UI 与服务端不一致）
    benefit_version_id: str
    channel_payload: dict
```

**服务端前置**：检查 `existing_active_subscriptions → cancel in same tx`。未成年人 + 风控黑名单直接拒。`yearly_*` 强制二次确认弹窗。

### 2.4 订阅状态 GET /api/v1/subscription/status

```python
class SubscriptionStatus(BaseModel):
    has_active: bool
    plan_type: str | None
    expires_at: str | None
    auto_renew: bool
    in_grace_period: bool
    grace_period_ends_at: str | None
    monthly_bonus_remaining: int
    monthly_bonus_used: int
    monthly_bonus_reset_at: str | None
    benefit_version_id: str | None
    cancel_pending: bool
```

### 2.5 抽卡 POST /api/v1/cards/draw

```python
class CardDrawRequest(BaseModel):
    pull_type: Literal["single", "ten_pull"]
    source: str | None                      -- "event:<id>" | "character:<id>" | "world:<id>"
    idempotency_key: str
    use_free_quota: bool = True            -- 每日 1 次免费是否优先

class CardItem(BaseModel):
    card_id: str
    name: str
    rarity: Literal["common", "uncommon", "rare", "epic", "legendary", "limited"]
    image_url: str
    story_snapshot: str | None
    is_new: bool                            -- 收藏中是否首次获得
    duplicate_compensation: int = 0         -- 重复卡返还灵晶数量

class CardDrawResponse(BaseModel):
    pull_batch_id: str
    cost_ling_jing: int
    cost_ling_yu: int = 0
    used_free_quota: bool
    # 抽卡概率与保底信息（必须对前端可见，但禁止用于"刷保底"）
    pity_progress: dict                     -- {legendary: <int>, limited: <int>}
    next_legendary_pity_in: int             -- 还有 N 抽出彩
    items: list[CardItem]
```

**风控**：连续 N 次免费抽 / 跨账号抽同一卡集，触发人工审核。

### 2.6 收藏 GET /api/v1/cards/collection

```python
class CardCollection(BaseModel):
    total_unique: int
    total_owned: int
    by_rarity: dict[str, int]              -- {"epic": 12, "rare": 30, ...}
    # 按页返回卡牌
    cards: list[CardItem]
    next_cursor: str | None

class CardQueryParams(BaseModel):
    rarity: str | None
    set_id: str | None
    pinned_only: bool = False
    limit: int = Field(20, le=100)
    cursor: str | None
```

### 2.7 创作者发布 POST /api/v1/creator/publish

```python
class CreatorPublishRequest(BaseModel):
    world_id: str
    visibility: Literal["draft", "private", "unlisted", "public"]
    scheduled_at: str | None                -- ISO 时间，定时发布
    changelog: str | None

class CreatorPublishResponse(BaseModel):
    publish_id: str
    world_id: str
    status: Literal["submitted", "auto_approved", "needs_review", "rejected"]
    review_deadline: str | None              -- 自动审核最长多久出结果
    review_notes: list[str] | None           -- 拒绝原因（如有）
    effective_at: str                        -- 真正生效时间
```

**前置条件**：
- `creator.level >= 1`
- `world.quality_score >= 0` + 未含 P0 类型违规
- 上一次 submit 仍在 review → 拒绝

### 2.8 创作者看板 GET /api/v1/creator/dashboard

```python
class CreatorDashboard(BaseModel):
    level: int
    level_progress: dict                    -- {next_level: 2, plays_to_next: 80, current_plays: 20}
    published_worlds: int
    published_characters: int
    published_chapters: int
    # 30 天收入
    earnings_30d: dict                      -- {gross, platform_fee, net, by_source: {...}}
    # 90 天趋势
    plays_90d: list[dict]                   -- [{date, plays, new_users, retention_d1}]
    # 待审
    pending_review: int
    # 余额
    creator_balance: int                    -- 灵晶
    pending_payout_cents: int
    payout_enabled: bool
    # 公告
    announcements: list[dict]
```

---

## 三、竞品经济数据档案（5 家对标）

⚠ 全部为用户提供的研究假设，未独立核实；上线前如需对外引用需重新核验。

| 产品 | 用户规模 | 付费率 | ARPPU | 续费率 | 关键打法 | 警示 |
|---|---|---|---|---|---|---|
| **星野**（国内 AI 陪伴 TOP1） | 月活 488 万 | ~7% | ~$5/月 | — | 12 元月卡 + 35 元星辰卡 + 6-98 元钻石 + 2 元抽卡 + 120 元年卡 | 母公司 2022-2025 累计净亏 12.5 亿美元，**流量大不赚钱** |
| **Talkie**（星野海外版） | 合并月活 ~1517 万（含星野） | ~7% | ~$10/月 | — | $9.99/$24.99/$89.99 + $1.99-$99.99 星钻 + 50 钻/10 分钟 AI 通话 | 重度 AI 通话按分钟收费 |
| **筑梦岛**（阅文女性向） | 注册 500 万 | ~20% | ~$3/月 | ~55% | 16 元 VIP + SVIP + 贝壳 1-3 元道具 | 90% 年轻女性，用户窄 |
| **Character.AI** | 2.33 亿月活 | <1% | $0.72/年 | — | $9.99 c.ai+，无内购 | **2.33 亿用户 ARPU 仅 $0.72/年，证明纯订阅无内购必死** |
| **Enjoy-AI Town** | 月流水 7→98 万美元 | — | — | — | 模拟人生 + 沉浸剧情对话融合；分层变现阶梯 | 增长最猛的黑马 |

**对灵境·双生的借鉴**：
1. ✅ 多层订阅 + 游戏化内购（**避免 Character.AI 错误**）
2. ✅ 围绕"剧情 + 卡牌 + 服装"做小额高频（**参考筑梦岛 1-3 元道具**）
3. ✅ 通话 / 语音按阶梯额度（**避免无限免费**）
4. ✅ 多档位充值 + 赠额梯度（**鼓励大额**）
5. ❌ 不学星野的纯抽卡为主要收入（**抽卡是补充，不是主菜**）
6. ❌ 不学 Talkie 默认按分钟收费通话（**先免费额度，再阶梯付费**）

---

## 四、订阅三层权益对照表（v5.1 候选 → E-CONF 候选）

| 权益 | 免费 | 月卡 18 元/月 | 星卡 58 元/月 |
|---|---|---|---|
| 价格 | 0 | 18 元 / 月（年付 168 约 22% off） | 58 元 / 月（年付 528 约 24% off） |
| 世界数 | 1 | 3 | 10 |
| 角色数 / 角色带出 | 3 / 0 | 10 / 1 | 无限 / 无限 |
| 每日灵玉（签到） | 10（C02 旧值 50 待定） | 50（C02 旧值 200 待定） | 100（C02 旧值 500 待定） |
| 每日对话额度 | 50 轮 / 后续灵玉 | 无限（公平使用待定） | 无限（公平使用待定） |
| 小说 / 月 | 基础 1 部 | 高级 3 部 | 专业 10 部 |
| 场景 | 5 基础 | 全基础 | 全部含付费 |
| 记忆容量 | 不定 | 500 条 | 2000 条 |
| 广告 | 有 | 无 | 无 |
| 语音 | 待定 | 30 分钟 / 日 | 无限（公平使用待定） |
| 模型 / 模拟 | 基础 | 标准 | 高级模型 + 深度模拟 |
| 每月赠灵晶 | 0 | 300 | 800 |
| 修炼加速符 | 0 | 1 张（7 天） | 3 张（各 7 天） |
| 折扣 | 无 | 外观 9 折；带出 9 折（C07） | 全商品 8 折（例外待定，C07） |
| 永久解锁候选 | 无 | 上帝视角（C08） | 全部角色个人线（C08） |
| 展示权益 | 基础 | 未提供 | 专属头像框 / 称号 / 昵称特效 |

**对照 v5.1 ECONOMY_SYSTEM §ECON-02 完全相同**。冲突仍在 [UPDATE_2026-09-09.md §C02-C08](../UPDATE_2026-09-09.md)。本批不改。

---

## 五、内购详细定价（4 大类 + 抽卡概率）

### 5.1 充值档位

| 档位 | 价格 | 灵晶 | 赠送 | 总额 | 单价（送/元） |
|---|---|---|---|---|---|
| 小包 | 6 元 | 600 | 0 | 600 | 100 |
| 中包 | 30 元 | 3000 | 100 | 3100 | 103 |
| 大包 | 68 元 | 6800 | 500 | 7300 | 107 |
| 超值包 | 128 元 | 12800 | 1500 | 14300 | 112 |
| 至尊包 | 328 元 | 32800 | 5000 | 37800 | 115 |
| 传说包 | 648 元 | 64800 | 10000 | 74800 | 115 |

**展示精确总额 600/3100/7300/14300/37800/74800**（原稿"1 元 ~103/107/112/115"为近似说明，不用于结算）。

### 5.2 内购商品（4 类）

详细表格与 v5.1 ECONOMY_SYSTEM §ECON-03 完全相同；本节按用户新稿补充按"心理价位档"分类：

| 心理价位 | 商品 | 灵晶 |
|---|---|---|
| **尝鲜档（1-3 元）** | 修炼加速符 100 / 好感可视化 150 / 上帝视角 200 / 表白卡 100 | — |
| **身份档（3-8 元）** | 属性重置丹 200 / 贵族开局 300 / 隐藏剧情包 300 / 资质提升丹 500 / 个人线 500 | — |
| **重度档（8-15 元）** | 隐藏身份开局 800 / 自定义开局 1000 / 真结局 800 / 天赋觉醒石 1000 / CG 图鉴 300-1000 | — |
| **收藏档（10-30 元）** | 服装 200-800 / 立绘变体 500 / 语音 400 / 头像框 200-500 / 双界 CG 300-1000 / 卡牌皮肤 300-800 / 称号 300-1000 | — |
| **带出档（8-30 元）** | 普通 NPC 800 / 重要 NPC 1500 / 核心 NPC 3000 | — |

⚠ 销售额**最高单价不超过 15 元**（一说）：C01 冲突 — 单个商品仍有 3000（30 元） NPC 带出。带出是**真正情感独占的强心智**，可接受上限。在 C01 决议前，按原值入表。

### 5.3 抽卡（命运卡）

| 档位 | 单抽 | 十连 | 保底 | 频率 |
|---|---|---|---|---|
| 免费 | 每日 1 次 | — | — | 受签到控制 |
| 付费灵晶 | 200 / 次 | 1800 / 次（9 折） | 90 抽必出彩 | — |

抽卡概率初始候选（**E-CONF，上线前需法务合规**）：

| 稀有度 | 概率 / 单抽 | 同色保底 |
|---|---|---|
| common（白） | 60% | — |
| uncommon（蓝） | 25% | — |
| rare（紫） | 12% | — |
| epic（金） | 2.7% | — |
| legendary（彩） | 0.3% | 90 |
| limited（限定） | 季度活动 | 不定 |

**重复卡补偿**：rare=50、epic=200、legendary=1000、limited=5000 灵晶。

---

## 六、用户生命周期 7 节点（剧本化）

```
【第 1 天】免费用户：体验世界
  入口：成年验证 → 注册 → 选择世界 → 创建 / 选择角色
  体验：完整核心 30 分钟内可走完开局 + 一次选项
  关键触点：第一次命运卡生成
  触发付费：（没有）

【第 3 天】感受到"世界在运转"
  证据：3 天内用户登录 ≥2 次，世界日报出现 NPC 事件
  关键触点：额度提示（免费用户 50 轮 / 日）
  触发付费：
    - 弹窗："今日额度已用完，升级月卡解锁无限对话（18 元）"
    - 弹窗："观看 1 个激励视频 +50 灵玉"
  预期转化：2-5%

【第 7 天】轻度付费（18 元月卡）
  入口：连续 3 天看到付费页 / 朋友推荐 / 完成第一个个人线
  体验：无限对话 + 去广告 + 月度灵玉翻倍
  预期转化：3-5%

【第 14 天】进入深度沉浸
  证据：人均对话轮次达日 100+
  关键触点：第一次双界角色探索 / 第一次个人线
  触发付费：
    - 弹窗："你与 TA 的故事还可以更深——解锁 TA 的个人线（5 元）"
    - 弹窗："解锁 TA 的专属 CG 收藏（10 元）"
  预期转化：5-8%

【第 30 天】重度付费
  入口：累计 6 次付费 / 完成个人线 / 收藏 ≥ 5 个角色
  触发付费：
    - 弹窗："想要无限世界 + 高级模型？星卡 58 元/月"
    - 弹窗："命运卡皮肤（3-8 元）"
  预期转化：2-5%

【第 60 天】创作者倾向
  入口：创作中心使用 ≥3 次 / 世界评分 ≥4 星
  触发付费：
    - 弹窗："你的世界已被游玩 100 次！查看收益（创作者等级 L2）"
    - 不付费（创作者路径）

【第 90 天】稳定留存 / 共享裂变
  入口：分享命运卡 / 分享世界 / 朋友圈
  触发：
    - 分享：命运卡 + 二维码 + 落地页
    - 邀请：双向奖励（被邀请 +50 灵玉，邀请者 +5 灵玉/人）
  目标：K 因子 ≥ 1.1
```

每个节点的弹窗必须遵守：
- ❌ 不在情绪低谷强推付费
- ❌ 不制造"角色会离开"的焦虑
- ❌ 不连续强弹（同一入口 24h 最多 1 次）
- ✅ 单次付费不超过 ¥30
- ✅ 关闭按钮永远可见且一眼即达

---

## 七、5 大转化节点 / 5 大留存机制

### 7.1 转化节点（按 v5.1 §ECON-05 + 新稿补强）

| 节点 | 触发 | 弹窗 | 候选价格 |
|---|---|---|---|
| 第一次额度耗尽 | 50 轮用完 | "升级月卡（¥18）解锁无限" | 18 元 |
| 第一个命运卡 | 关键节点 | "高级命运报告 ¥2" | 200 灵晶 |
| 第一次付费抽 | 免费抽完 | "再来一次，仅需 2 元" | 200 灵晶 |
| 第一次开世界 | 玩家开 1 个世界 | "升级创建更多（3/10）" | 18 / 58 元 |
| 第一次功能深度 | NPC 互动 ≥ 5 次 | "解锁个人线 / 专属 CG" | 5 / 10 元 |

### 7.2 留存机制（5 大）

| 机制 | 频率 | 目的 |
|---|---|---|
| 每日签到 | 每天 | 习惯 |
| 世界日报 | 每次登录 | "世界还在运转" |
| 命运卡分享 | 每次生成 | 炫耀 + 裂变 |
| 成就系统 | 持续 | 收集欲 |
| 角色生日 / 节日 | 节日 | 情感连接 |

**注意**：所有留存**默认关闭主动推送**。用户主动开启 + 时区 + 静默时段 + 频率上限才生效（与 [DUAL_SOUL_SPEC §COMP-04](../DUAL_SOUL_SPEC.md) 一致）。

---

## 八、单位经济（10 万 MAU）

⚠ 全部为研究假设，**仅用于内部目标和定价压力测试**，不作为承诺。

| 用户类型 | 占比 | 人数 | 月均收入 | 月均成本 | 月利润（人） |
|---|---|---|---|---|---|
| 免费用户 | 80% | 80,000 | 0 | 1 | -80,000 |
| 月卡用户 | 15% | 15,000 | 18 | 3 | +225,000 |
| 星卡用户 | 3% | 3,000 | 58 | 8 | +150,000 |
| 内购用户 | 2% | 2,000 | 50 | 5 | +90,000 |
| **合计** | 100% | 100,000 | — | — | **+385,000** |

> 假定可变成本 15.9 万元、收入 54.4 万元、毛利率约 70.8%（原稿）。**口径与审核 / 营销等固定成本分离**，因此 70.8% 不是净利率。

**敏感性**：
- 若付费率掉到 5%（仅月卡 3%、星卡 1%、内购 1%）：亏损约 -15 万
- 若付费率升到 10%（月卡 7%、星卡 2%、内购 1%）：盈利约 +50 万
- 若 ARPPU 升 25%、付费率维持 5%：盈利约 +30 万

**对照组（不科学但好理解）**：
- 星野：488 万月活 × ARPPU ¥35 = 1.7 亿 / 月（但亏 12.5 亿美元）
- 筑梦岛：500 万注册 × ARPPU ¥20 × 12% 付费 = 120 万 / 月（用户基盘小）

**结论**：
- 不烧营销走自然增长，目标毛利率 ≥ 30% 上线
- 内购 ARPPU 是关键变量；订阅是基础但**不能超过月收入的 50%**

---

## 九、长期收入目标（5 阶段）

| 阶段 | 时间 | MAU | 月收入目标 | 关键动作 |
|---|---|---|---|---|
| MVP | 0-3 月 | 1 万 | 5 万 | 验证付费意愿，优化转化 |
| 增长期 | 4-6 月 | 10 万 | 50 万 | 完善创作者生态 |
| 扩张期 | 7-12 月 | 50 万 | 250 万 | 规模化运营，IP 合作 |
| 成熟期 | 13-24 月 | 200 万 | 1000 万 | 全生态运转 |
| 持续 | 24 月+ | 200 万+ | 1000 万+ | 海外 + 跨题材运营 |

> 与 v5.1 §ECON-07 3/6/12/24 月目标 5/50/250/1000 万元基本一致（用户新稿加了 MVP 阶段细分）。

---

## 十、关键指标看板（9 项）

| 指标 | 计算 | MVP 目标 | 健康候选 |
|---|---|---|---|
| 付费转化率 | 付费用户 / 活跃用户 | 5% | 10% |
| 月卡订阅率 | 月卡 / 活跃用户 | 3% | 8% |
| 星卡订阅率 | 星卡 / 活跃用户 | 1% | 3% |
| 月 ARPPU | 付费用户月均收入 | 15 元 | 25 元 |
| 到期续费率 | 续费 / 上期订阅到期 | 40% | 60% |
| 毛利率 | (收入-可变成本) / 收入 | 20% | 40% |
| 抽卡用户占比 | 付费抽卡 / 活跃用户 | 2% | 5% |
| 创作者活跃率 | 周活创作者 / 周活用户 | 0.5% | 2% |
| 7 日留存 | D7 活跃 / D0 新增 | 25% | 40% |

注：D7 留存 25% 是参考对标的 **待验证目标**，与 v5.1 §PRD §正式发布闸门 一致。

---

## 十一、与 World OS 的集成点（已编程位）

`WorldEvent` 在刷出**关键命运节点**时（如分歧点、入世、重大决策、结局）会发出 `world_event_key_decision` 事件，由 `destiny_cards` 服务自动尝试生成一张卡（受 LLM 审核）。具体链路见 [`backend/26 §引擎适配`](../backend/26-world-os-engineering-contract.md)。

World OS 发出的 `success_probability / actual_result` 同时作为命运卡的 `story_snapshot` 与 `rarity` 依据：
- success → 至少 uncommon
- partial → rare
- failure → 仍可生成 rare / epic（强叙事张力）

---

## 十二、与 v5.1 ECONOMY_SYSTEM 的关系

| 本文 | v5.1 对应位置 | 关系 |
|---|---|---|
| §一 DDL | ECONOMY_SYSTEM §ECON-08 | **新增**：v5.1 只有表名与字段指引 |
| §二 API | ECONOMY_SYSTEM §ECON-08 | **新增**：v5.1 只有 endpoint 名称 |
| §三 竞品 | ECONOMY_SYSTEM §ECON-07 | **细化**：v5.1 只有段落摘要 |
| §四 订阅 | ECONOMY_SYSTEM §ECON-02 | **同源**：原表完全一致 |
| §五 内购 | ECONOMY_SYSTEM §ECON-03 + §ECON-04 | **同源**：原表完全一致 |
| §六 生命周期 | ECONOMY_SYSTEM §ECON-05 | **细化**：v5.1 简化为 5 节点 |
| §七 转化 / 留存 | ECONOMY_SYSTEM §ECON-05 | **细化**：5 + 5 标准化 |
| §八 单位经济 | ECONOMY_SYSTEM §ECON-07 | **同源**：含 10 万 MAU 测算 |
| §九 收入目标 | ECONOMY_SYSTEM §ECON-07 | **新增**：5 阶段细化到 MVP |
| §十 看板 | ECONOMY_SYSTEM §ECON-07 | **新增**：扩展到 9 项 |
| §十一 World OS 集成 | WORLD_OS_SPEC §WOS-13/NOV-04 | **新增链路**，不修改 v5.1 范围 |

---

## 十三、上线闸门（B8 必须满足）

| 闸门 | 验收 |
|---|---|
| 充值回调不重不漏 | 伪造/重复回调、回调金额不符、签名失败、回调超时 — 全部测试 |
| 余额对账 | 任何时刻 `sum(currency_lots.amount - consumed) == user_currency.ling_jing_available + ling_yu_available + frozen` |
| 退款事务原子性 | 退款成功 = 撤回 `entitlements` + 写 `reversed=true` 的 `creator_earnings` + 写 `refunds.ledger_entry_id`，全失败则全不回滚 |
| 订阅续费 | 到期前 72h 提醒，到期 24h 后降级，月卡赠币月末清零 |
| 提现关闭 | MVP `creator_payouts` API 一律 403，前端按钮不渲染 |
| 风控 | 单用户充值单日封顶、单日抽卡上限、未成年人禁用付费 |
| 价格版本 | 客户端永远读最新有效 `price_versions`，订单绑定 version_id |
| 法务 | 抽卡概率 / 保底 / 退款政策获得法务核验签署 |

---

v5.2 补强文档；任何内容冲突以 v5.1 ECONOMY_SYSTEM 为准。冲突项继续在 [UPDATE_2026-09-09.md §C01-C20](../UPDATE_2026-09-09.md) 跟踪。
