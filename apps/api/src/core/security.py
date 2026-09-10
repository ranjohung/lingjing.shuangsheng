"""认证占位（Phase 0）。

正式实现（Phase 4）：Supabase JWT 校验，客户端永不接触服务角色密钥。
当前：未配置 SUPABASE_URL/SUPABASE_ANON_KEY 时放行并返回固定本地 dev 用户，
便于无第三方密钥的本地真机测试；配置后将强制校验。
"""
from __future__ import annotations

from dataclasses import dataclass

from .config import settings


@dataclass
class CurrentUser:
    user_id: str
    is_dev: bool


async def get_current_user() -> CurrentUser:
    if not settings.supabase_configured:
        # 本地开发降级模式 —— 严禁用于生产
        return CurrentUser(user_id="local-dev-user", is_dev=True)
    # Phase 4：此处调用 Supabase Auth 校验 Bearer Token
    return CurrentUser(user_id="local-dev-user", is_dev=True)
