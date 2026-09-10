"""用户档案模块：昵称、引导完成状态、初始伙伴选择（FR-ONB-01）。

Phase 5 迁移到 PostgreSQL users 表；当前进程内存储。
"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from ..core.security import CurrentUser, get_current_user

router = APIRouter(prefix="/api/profile", tags=["profile"])

# user_id -> profile
_profiles: dict[str, "Profile"] = {}


class Profile(BaseModel):
    nickname: str = ""
    onboarded: bool = False
    companion_id: str = "preset_ling"


class ProfileUpdate(BaseModel):
    nickname: str | None = Field(default=None, max_length=20)
    onboarded: bool | None = None
    companion_id: str | None = None


@router.get("", response_model=Profile)
async def get_profile(user: CurrentUser = Depends(get_current_user)):
    return _profiles.get(user.user_id, Profile())


@router.post("", response_model=Profile)
async def update_profile(payload: ProfileUpdate, user: CurrentUser = Depends(get_current_user)):
    current = _profiles.get(user.user_id, Profile())
    data = current.model_dump()
    patch = {k: v for k, v in payload.model_dump().items() if v is not None}
    if patch.get("nickname") is not None:
        patch["nickname"] = patch["nickname"].strip()
    data.update(patch)
    profile = Profile(**data)
    _profiles[user.user_id] = profile
    return profile
