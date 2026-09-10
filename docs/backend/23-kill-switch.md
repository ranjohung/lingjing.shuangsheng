# 23 · 成本熔断器（kill_switch.py）

> 上级文档：[../MASTER_SPEC.md](../MASTER_SPEC.md) §1.2
> 铁律：**Phase 0 就必须存在**。没有熔断器，一旦被刷单，次日欠费停机。

## 1. 阈值与 Redis Key 设计

| 配置 | 默认值 | 环境变量 |
| --- | --- | --- |
| 全局日预算 | **$50.00** | `DAILY_BUDGET_LIMIT_USD` |
| 单用户 10 分钟窗口限额 | 建议 $2.00 | `PER_USER_WINDOW_LIMIT_USD` |
| 窗口长度 | 10 分钟 | `PER_USER_WINDOW_MINUTES` |

```text
cost:daily:{YYYY-MM-DD}              # 全局当日累计成本（USD, float），TTL 48h
cost:user:{user_id}:{window_10min}   # 单用户窗口累计，TTL 15 分钟（窗口 10min + 冗余）
```

窗口 key 按 10 分钟取整：`window = floor(epoch_minutes / 10)`。

## 2. 参考实现

```python
# apps/api/src/core/kill_switch.py
import math
import os
from datetime import datetime, timezone

DAILY_BUDGET_LIMIT_USD = float(os.getenv("DAILY_BUDGET_LIMIT_USD", "50.0"))
PER_USER_WINDOW_LIMIT_USD = float(os.getenv("PER_USER_WINDOW_LIMIT_USD", "2.0"))
PER_USER_WINDOW_MINUTES = int(os.getenv("PER_USER_WINDOW_MINUTES", "10"))


class BudgetExceededError(Exception):
    def __init__(self, scope: str, current: float, limit: float):
        self.scope = scope            # "daily" | "user"
        self.current = current
        self.limit = limit
        super().__init__(f"SYSTEM_SAFETY: {scope} budget exhausted ({current:.2f}/{limit:.2f}).")


def _daily_key() -> str:
    day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return f"cost:daily:{day}"


def _user_key(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    epoch_min = int(now.timestamp() // 60)
    window = epoch_min // PER_USER_WINDOW_MINUTES
    return f"cost:user:{user_id}:{window}"


async def check_budget(redis_client, user_id: str) -> None:
    """AI 调用前检查：日预算 + 单用户窗口，超限直接抛异常拒绝服务。"""
    daily = float(await redis_client.get(_daily_key()) or 0.0)
    if daily > DAILY_BUDGET_LIMIT_USD:
        raise BudgetExceededError("daily", daily, DAILY_BUDGET_LIMIT_USD)

    user_cost = float(await redis_client.get(_user_key(user_id)) or 0.0)
    if user_cost > PER_USER_WINDOW_LIMIT_USD:
        raise BudgetExceededError("user", user_cost, PER_USER_WINDOW_LIMIT_USD)


async def record_cost(redis_client, user_id: str, cost_usd: float) -> None:
    """AI 调用后记账（INCRBYFLOAT 原子累加），并设置 TTL。"""
    pipe = redis_client.pipeline()
    pipe.incrbyfloat(_daily_key(), max(cost_usd, 0.0)).expire(_daily_key(), 48 * 3600)
    pipe.incrbyfloat(_user_key(user_id), max(cost_usd, 0.0)).expire(
        _user_key(user_id), (PER_USER_WINDOW_MINUTES + 5) * 60)
    await pipe.execute()
```

FastAPI 异常映射（`core/errors.py`）：

```python
@app.exception_handler(BudgetExceededError)
async def budget_handler(request, exc: BudgetExceededError):
    if exc.scope == "user":
        return JSONResponse(
            status_code=429,
            content={"detail": "rate_limited", "scope": "user"},
            headers={"X-Budget-Exceeded": "user", "Retry-After": "600"},
        )
    return JSONResponse(
        status_code=503,
        content={"detail": "service_unavailable", "scope": "daily"},
        headers={"X-Budget-Exceeded": "daily"},
    )
```

> 硬性测试 2 接受 **429 或 503**，但**必须**带 `X-Budget-Exceeded` 响应头；本实现约定：单用户窗口 → 429，全局日预算 → 503。

## 3. 在对话链路中的位置

```text
check_budget(redis, user_id)     # 调用前：超限即拒，不产生 LLM 费用
  → （LLM 调用）
record_cost(redis, user_id, est) # 调用后：按 usage 估算 USD 入账
```

- 估算来源：Provider 返回的 token usage × 模型单价（`AIProvider.estimate_cost_usd`）。
- embedding 调用成本同样计入（可合并到当次请求总额）。
- 记账失败不得阻断用户响应，但必须 Sentry 告警（否则熔断器会失灵）。

## 4. Admin 看板与复位

- 看板数据源与熔断**同源**：直接读 `cost:daily:{today}`（GET `/admin/cost/today`），保证看到的数字就是熔断依据。
- 手动复位（POST `/admin/kill-switch/reset`，仅 admin）：
  - 重置当日 key 为 0（或删除），记录操作人与审计日志；
  - 复位后 AI 服务恢复。
- 阈值调整通过环境变量（重启生效），MVP 不做热更新。

## 5. 与积分系统的关系

- 熔断器是**平台成本安全网**（防破产）；积分是**用户级计量**（扣 bonus/purchased credits）。
- 两者独立判定：积分不足 → 402 引导充值；熔断触发 → 429/503 + `X-Budget-Exceeded`。
- 顺序建议：check_budget → 积分校验 → LLM → record_cost → 积分扣减。

## 6. 验收

- [ ] 熔断逻辑在 Phase 0 随项目骨架落地，阈值从环境变量读取
- [ ] 连续请求累计超 $50 后，下一次请求返回 503 且含 `X-Budget-Exceeded: daily`
- [ ] 单用户 10 分钟窗口超限返回 429 且含 `X-Budget-Exceeded: user`
- [ ] Admin 看板金额与 Redis key 值一致
- [ ] 记账异常有 Sentry 告警，不静默吞掉
