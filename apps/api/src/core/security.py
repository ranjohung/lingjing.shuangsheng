"""Bearer JWT authentication with an explicit development-only fallback."""
from __future__ import annotations

from dataclasses import dataclass
from fastapi import Header, HTTPException
import jwt

from .config import settings

@dataclass
class CurrentUser:
    user_id: str
    is_dev: bool

def _production() -> bool:
    return settings.environment.lower() in {"production", "prod"}

async def get_current_user(authorization: str | None = Header(default=None)) -> CurrentUser:
    token = authorization[7:].strip() if authorization and authorization.lower().startswith("bearer ") else None
    if token:
        if not settings.auth_jwt_secret:
            raise HTTPException(status_code=503, detail="服务端未配置 JWT 校验密钥")
        try:
            claims = jwt.decode(token, settings.auth_jwt_secret, algorithms=["HS256"], options={"require": ["exp"]})
        except jwt.PyJWTError as exc:
            raise HTTPException(status_code=401, detail="登录凭证无效或已过期") from exc
        user_id = claims.get("sub") or claims.get("user_id")
        if not isinstance(user_id, str) or not user_id.strip():
            raise HTTPException(status_code=401, detail="登录凭证缺少用户标识")
        return CurrentUser(user_id=user_id, is_dev=False)
    if settings.dev_auth_enabled and not _production():
        return CurrentUser(user_id=settings.dev_user_id, is_dev=True)
    raise HTTPException(status_code=401, detail="请先登录")
