"""角色模块：列表 / 创建（免费档 2 槽位，服务端强制付费墙）。"""
from __future__ import annotations

import sqlite3
import time
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
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


class PublishRequest(BaseModel):
    summary: str = Field(default="", max_length=300)


class PlazaReportRequest(BaseModel):
    reason: str = Field(min_length=2, max_length=300)


def _plaza_db():
    db_path = getattr(store, "_db_path", None)
    if not db_path:
        raise HTTPException(status_code=503, detail="角色广场存储未配置")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("CREATE TABLE IF NOT EXISTS character_plaza (character_id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, summary TEXT NOT NULL, published_at REAL NOT NULL, status TEXT NOT NULL DEFAULT 'published')")
    return conn


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


@router.get("/plaza")
async def list_plaza(query: str = Query(default="", max_length=80), limit: int = Query(default=20, ge=1, le=50), _user: CurrentUser = Depends(get_current_user)):
    """只返回作者主动公开且未下架的角色；不暴露拥有者身份。"""
    conn = _plaza_db()
    try:
        pattern = f"%{query.strip()}%"
        rows = conn.execute("SELECT c.id,c.name,c.persona,c.relationship_type,c.avatar,c.glow,p.summary,p.published_at FROM character_plaza p JOIN companion_characters c ON c.id=p.character_id AND c.user_id=p.owner_id WHERE p.status='published' AND (c.name LIKE ? OR p.summary LIKE ?) ORDER BY p.published_at DESC LIMIT ?", (pattern, pattern, limit)).fetchall()
        return {"items": [dict(row) for row in rows], "mode": "sqlite", "policy": "owner-opt-in"}
    finally:
        conn.close()


@router.post("/{character_id}/publish")
async def publish_character(character_id: str, payload: PublishRequest, user: CurrentUser = Depends(get_current_user)):
    character = store.get_character(user.user_id, character_id)
    if character is None or character.is_preset:
        raise HTTPException(status_code=404, detail="只能公开自己的自建角色")
    conn = _plaza_db()
    try:
        conn.execute("INSERT INTO character_plaza(character_id,owner_id,summary,published_at,status) VALUES(?,?,?,?,?) ON CONFLICT(character_id) DO UPDATE SET summary=excluded.summary,published_at=excluded.published_at,status='published'", (character_id, user.user_id, payload.summary.strip(), time.time(), "published"))
        conn.commit()
        return {"success": True, "character_id": character_id, "status": "published", "mode": "sqlite"}
    finally:
        conn.close()


@router.delete("/{character_id}/publish")
async def unpublish_character(character_id: str, user: CurrentUser = Depends(get_current_user)):
    conn = _plaza_db()
    try:
        changed = conn.execute("UPDATE character_plaza SET status='unpublished' WHERE character_id=? AND owner_id=?", (character_id, user.user_id)).rowcount
        conn.commit()
        if not changed:
            raise HTTPException(status_code=404, detail="未找到本人公开角色")
        return {"success": True, "character_id": character_id, "status": "unpublished", "mode": "sqlite"}
    finally:
        conn.close()


@router.post("/plaza/{character_id}/report", status_code=201)
async def report_plaza_character(character_id: str, payload: PlazaReportRequest, user: CurrentUser = Depends(get_current_user)):
    conn = _plaza_db()
    try:
        row = conn.execute("SELECT character_id FROM character_plaza WHERE character_id=? AND status='published'", (character_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="角色未公开或已下架")
    finally:
        conn.close()
    # 通过统一内容举报接口的持久化表写入，保持管理员审核队列一致。
    reports_db = getattr(store, "_db_path", None)
    with sqlite3.connect(reports_db) as reports:
        reports.execute("CREATE TABLE IF NOT EXISTS content_reports (id TEXT PRIMARY KEY, reporter_id TEXT NOT NULL, target_type TEXT NOT NULL, target_id TEXT NOT NULL, reason TEXT NOT NULL, status TEXT NOT NULL, created_at REAL NOT NULL, resolved_at REAL)")
        item_id = uuid.uuid4().hex
        reports.execute("INSERT INTO content_reports VALUES (?,?,?,?,?,?,?,?)", (item_id, user.user_id, "character", character_id, payload.reason.strip(), "pending", time.time(), None))
        reports.commit()
    return {"success": True, "report_id": item_id, "status": "pending", "mode": "sqlite"}
