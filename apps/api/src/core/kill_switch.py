"""成本熔断器（Phase 0 必须存在）。

两级窗口：
- 全局日窗口：UTC 自然日，累计成本超 DAILY_BUDGET_LIMIT_USD → 503 + X-Budget-Exceeded: daily
- 用户窗口（演示）：同一用户短窗口内请求过多 → 429 + X-Budget-Exceeded: user

阈值从环境变量读取；本地默认演示每次请求计入 DEMO_COST_PER_REQUEST_USD。
"""
from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum

from ..infrastructure.cache import CacheBackend

DAY_SECONDS = 24 * 3600
# 演示用用户窗口：60 秒内 6 次请求触发 429（对齐规范"第 6 次熔断"硬测试）
USER_WINDOW_SECONDS = 60
USER_WINDOW_LIMIT_REQUESTS = 6


class DenyReason(str, Enum):
    DAILY = "daily"
    USER = "user"


def _today_key() -> str:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return f"cost:daily:{today}"


def _user_key(user_id: str) -> str:
    return f"cost:user:{user_id}:window"


class KillSwitch:
    def __init__(self, cache: CacheBackend, daily_limit_usd: float) -> None:
        self._cache = cache
        self._daily_limit = daily_limit_usd

    async def check(self, user_id: str) -> DenyReason | None:
        """返回拒绝原因；None 表示放行。"""
        if await self._cache.get_float(_today_key()) >= self._daily_limit:
            return DenyReason.DAILY
        if await self._cache.get_float(_user_key(user_id)) >= USER_WINDOW_LIMIT_REQUESTS:
            return DenyReason.USER
        return None

    async def record_request(self, user_id: str, cost_usd: float) -> None:
        """放行后调用：累加日成本与用户窗口计数。"""
        await self._cache.incr(_today_key(), cost_usd, DAY_SECONDS)
        await self._cache.incr(_user_key(user_id), 1.0, USER_WINDOW_SECONDS)

    async def daily_cost(self) -> float:
        return await self._cache.get_float(_today_key())

    async def reset(self) -> None:
        await self._cache.delete(_today_key())

    @property
    def daily_limit(self) -> float:
        return self._daily_limit

    @property
    def cache_kind(self) -> str:
        return self._cache.kind
