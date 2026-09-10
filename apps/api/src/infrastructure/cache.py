"""缓存客户端：Redis 优先，连不上时自动降级为进程内内存实现。

熔断器依赖的计数器接口两者一致：incr / get / set，支持 TTL。
"""
from __future__ import annotations

import time
from typing import Optional

try:
    import redis.asyncio as aioredis
except Exception:  # pragma: no cover - redis 包已在 requirements 中
    aioredis = None


class CacheBackend:
    async def incr(self, key: str, amount: float, ttl_seconds: int) -> float: ...
    async def get_float(self, key: str) -> float: ...
    async def set_float(self, key: str, value: float, ttl_seconds: Optional[int] = None) -> None: ...
    async def delete(self, key: str) -> None: ...
    async def ping(self) -> bool: ...

    @property
    def kind(self) -> str: ...


class MemoryCache(CacheBackend):
    """进程内缓存：值 + 过期时间戳。仅用于本地无 Docker 开发。"""

    def __init__(self) -> None:
        self._store: dict[str, tuple[float, Optional[float]]] = {}

    def _live(self, key: str) -> Optional[float]:
        item = self._store.get(key)
        if item is None:
            return None
        value, expire_at = item
        if expire_at is not None and expire_at < time.time():
            self._store.pop(key, None)
            return None
        return value

    async def incr(self, key: str, amount: float, ttl_seconds: int) -> float:
        current = self._live(key) or 0.0
        new_value = current + amount
        self._store[key] = (new_value, time.time() + ttl_seconds)
        return new_value

    async def get_float(self, key: str) -> float:
        return self._live(key) or 0.0

    async def set_float(self, key: str, value: float, ttl_seconds: Optional[int] = None) -> None:
        expire_at = time.time() + ttl_seconds if ttl_seconds else None
        self._store[key] = (value, expire_at)

    async def delete(self, key: str) -> None:
        self._store.pop(key, None)

    async def ping(self) -> bool:
        return True

    @property
    def kind(self) -> str:
        return "memory"


class RedisCache(CacheBackend):
    def __init__(self, client) -> None:
        self._client = client

    async def incr(self, key: str, amount: float, ttl_seconds: int) -> float:
        pipe = self._client.pipeline()
        pipe.incrbyfloat(key, amount)
        pipe.expire(key, ttl_seconds, nx=True)
        results = await pipe.execute()
        return float(results[0])

    async def get_float(self, key: str) -> float:
        value = await self._client.get(key)
        return float(value) if value is not None else 0.0

    async def set_float(self, key: str, value: float, ttl_seconds: Optional[int] = None) -> None:
        await self._client.set(key, value, ex=ttl_seconds)

    async def delete(self, key: str) -> None:
        await self._client.delete(key)

    async def ping(self) -> bool:
        return bool(await self._client.ping())

    @property
    def kind(self) -> str:
        return "redis"


async def create_cache(redis_url: Optional[str]) -> CacheBackend:
    """启动时探测 Redis；不可用则降级内存。"""
    if redis_url and aioredis is not None:
        try:
            client = aioredis.from_url(redis_url, decode_responses=True)
            await client.ping()
            return RedisCache(client)
        except Exception:
            pass
    return MemoryCache()
