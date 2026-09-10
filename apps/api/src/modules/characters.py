"""角色模块：列表 / 创建（免费档 2 槽位，服务端强制付费墙）。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..core.security import CurrentUser, get_current_user
from .memory_store import store

router = APIRouter(prefix="/api/characters", tags=["characters"])

AVATAR_CHOICES = ["🧚", "🌻", "🐱", "🦊", "🌙", "⭐", "🐰", "🦉"]
GLOW_CHOICES = ["#8b7cf6", "#f6a6d8", "#6ec6ff", "#ffd166", "#7cf6c0", "#ff9e7d"]
RELATIONSHIP_TYPES = ["friend", "partner", "family", "custom"]


class CharacterOut(BaseModel):
    id: str
    name: str
    persona: str
    relationship_type: str
    avatar: str
    glow: str
    is_preset: bool


class CreateCharacterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=20)
    persona: str = Field(min_length=1, max_length=500)
    relationship_type: str = "friend"
    avatar: str = "🧚"
    glow: str = "#8b7cf6"


def _to_out(c) -> CharacterOut:
    return CharacterOut(
        id=c.id, name=c.name, persona=c.persona, relationship_type=c.relationship_type,
        avatar=c.avatar, glow=c.glow, is_preset=c.is_preset,
    )


@router.get("", response_model=list[CharacterOut])
async def list_characters(user: CurrentUser = Depends(get_current_user)):
    return [_to_out(c) for c in store.list_characters(user.user_id)]


@router.post("", response_model=CharacterOut, status_code=201)
async def create_character(payload: CreateCharacterRequest, user: CurrentUser = Depends(get_current_user)):
    if payload.relationship_type not in RELATIONSHIP_TYPES:
        raise HTTPException(status_code=422, detail="relationship_type 非法")
    # 免费档强制：超过 2 个自建槽位 → 402 付费墙（FR-BILL-05）
    if store.count_custom_characters(user.user_id) >= store.FREE_CHARACTER_LIMIT:
        raise HTTPException(
            status_code=402,
            detail={"code": "paywall_required", "message": "免费档最多拥有 2 位伙伴，升级后可创建更多"},
        )
    character = store.create_character(
        user_id=user.user_id, name=payload.name.strip(), persona=payload.persona.strip(),
        relationship_type=payload.relationship_type,
        avatar=payload.avatar if payload.avatar in AVATAR_CHOICES else "🧚",
        glow=payload.glow if payload.glow in GLOW_CHOICES else "#8b7cf6",
    )
    return _to_out(character)
