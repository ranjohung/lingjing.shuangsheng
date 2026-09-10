> **2026-09-08 规范更新**：以 [MIRAI_SPEC v4.1](../MIRAI_SPEC.md)、当前 PRD 和 DEVELOPMENT_PLAN 为准。以下旧版内容保留参考；3D 首发、小说世界后置、Stripe 首发和旧 Phase 编号不再有效。MVP 为2D陪伴与完整互动小说；正式验收须区分开发模拟与已接通能力。

# 24 · 支付、订阅与创作者收益边界

> 上级文档：[../MASTER_SPEC.md](../MASTER_SPEC.md) §5
> 两个设计目标：**创作者收益虚拟化规避税务/套现风险**；**赠送积分月度清零控制预付负债**。

## 1. Stripe 订阅（Plus）

- 使用测试模式密钥开发：`STRIPE_SECRET_KEY`（sk_test_...）、`STRIPE_WEBHOOK_SECRET`（whsec_...）。
- 流程：
  1. 前端请求 `/billing/subscription` → 后端创建 Stripe Checkout Session（订阅价）→ 返回 URL；
  2. 支付成功 → Stripe 发送 Webhook → 后端用 `STRIPE_WEBHOOK_SECRET` **验签**；
  3. 处理事件：`checkout.session.completed` / `customer.subscription.updated/deleted` / `invoice.paid`；
  4. 更新 subscriptions（plan=plus、status、current_period_*）并发凭证邮件（Resend）。
- Customer Portal：`/billing/portal` 用于取消/管理，自动续费在支付前明示。
- Webhook 必须幂等：以 event id 去重，重复投递不重复发积分。

## 2. 积分体系（Credits）

| 积分 | 来源 | 过期规则 |
| --- | --- | --- |
| `bonus_credits` | Plus 订阅每月赠送 | **每月 1 号 00:00 UTC 清零**（定时任务） |
| `purchased_credits` | 单独充值购买 | **不过期** |

- 余额以 `users` 表为事实来源，`subscriptions` 表保留本期快照（字段定义见 [21-database-schema.md §6](./21-database-schema.md)）。
- **月度清零任务（Celery beat / 持久化调度）**：

```sql
-- 每月 1 号 00:00 UTC 执行
UPDATE users SET bonus_credits = 0.0
WHERE id IN (SELECT user_id FROM subscriptions WHERE status = 'active');
-- 同步重置 subscriptions.bonus_credits 快照；purchased_credits 绝对不动
```

- 扣减规则：
  - AI 调用按 `estimate_cost_usd` 折算积分扣减；扣减顺序**先 bonus 后 purchased**；
  - 余额不足 → 返回 402（建议）+ 充值引导，不发起 LLM 调用；
  - 每笔扣减写流水（建议 ledger 表，只插入不更新），便于对账。

## 3. 创作者收益"虚拟化"锁定（硬性）

- Marketplace 销售入账：`creator_earnings.creator_balance` **只增不减**；
  - 每笔销售写 `earning_ledger`（amount > 0，CHECK 约束），流水只插入；
  - 不接入 Stripe Payout/Connect 转账，**不创建提现表**。
- **Payout 接口在 MVP 阶段直接返回 403 Forbidden**：

```python
# apps/api/src/modules/billing/routes.py
@router.post("/billing/payout", status_code=403)
async def payout():
    return JSONResponse(status_code=403, content={
        "detail": "payout_disabled",
        "message": "MVP 阶段创作者收益仅可兑换为平台 AI 算力积分（Credits），暂不支持提现。"
    })
```

- **前端**：不渲染任何"提现 / Withdraw"按钮；收益页固定文案：
  > "收益可兑换为平台 AI 算力积分（Credits）。"
- 用户协议必须写明：创作者收益为平台虚拟积分额度，**无现金价值、不可提现、不可转让**（见 [../legal/TERMS_OF_SERVICE.md](../legal/TERMS_OF_SERVICE.md)）。

## 4. Marketplace 交易

- 商品：`marketplace_items`（dna_template / avatar_pack），价格 `price_credits > 0`；
- 购买（`/marketplace/purchase`）在一个事务内：
  1. 校验买家积分（bonus 优先）→ 扣减；
  2. 创作者 `creator_balance += 分成额`（写 earning_ledger，amount 正）；
  3. 生成角色副本（拷贝 DNA 快照与 avatar_assets 到 characters，归属买家）；
  4. 写 marketplace_purchases（buyer+item 唯一，防重复购买）。
- 退款/争议走 Stripe 争议流程；积分交易 MVP 不支持逆向退款（协议明示）。

## 5. 对账与异常

- 每小时（建议）拉取 Stripe 订阅状态对账，防 Webhook 丢失导致积分错发；
- Webhook 验签失败一律 400 并记录 `stripe_webhook_invalid`；
- 所有金额/积分为服务端权威，前端显示仅作展示；
- 密钥：`STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` 仅服务端环境变量，禁止入前端 bundle。

## 6. 验收

- [ ] 测试模式下：订阅 → webhook 验签 → 积分到账 → 取消，全链路通
- [ ] 模拟跨月（或直接执行任务）后 bonus_credits 清零、purchased_credits 不变
- [ ] `/billing/payout` 任何请求均返回 403；前端无提现入口
- [ ] creator_balance 全链路只增（代码无扣减路径）
- [ ] 余额不足时不调用 LLM，返回充值引导
