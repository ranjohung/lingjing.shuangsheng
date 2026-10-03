"""Persisted media-generation task API.

The endpoint records an explicit development-mode task when no provider is
configured. It never pretends that a bitmap/audio/video was produced.
"""
from __future__ import annotations

import sqlite3
import time
import uuid
from contextlib import closing
from pathlib import Path
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..core.config import settings
from ..core.security import CurrentUser, get_current_user

router = APIRouter(prefix="/api/v1/generation", tags=["generation"])

def _db() -> str:
    raw = urlparse(settings.story_database_url or "sqlite:///./story-development.db").path or "./story-development.db"
    if raw.startswith("/./"):
        raw = raw[1:]
    path = Path(raw)
    if not path.is_absolute():
        path = Path(__file__).resolve().parents[2] / path
    path.parent.mkdir(parents=True, exist_ok=True)
    return str(path.resolve())

DB_PATH = _db()

def _ensure() -> None:
    with closing(sqlite3.connect(DB_PATH)) as conn:
        conn.execute("""CREATE TABLE IF NOT EXISTS generation_tasks (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL, kind TEXT NOT NULL,
            mode TEXT NOT NULL, prompt TEXT NOT NULL, ratio TEXT,
            status TEXT NOT NULL, provider TEXT NOT NULL, created_at REAL NOT NULL,
            updated_at REAL NOT NULL, error TEXT
        )""")
        conn.execute("CREATE INDEX IF NOT EXISTS ix_generation_user ON generation_tasks(user_id, created_at)")
        conn.commit()

class GenerationRequest(BaseModel):
    kind: str = Field(pattern="^(image|video|sound|post|card|agent)$")
    mode: str = Field(min_length=1, max_length=80)
    prompt: str = Field(min_length=1, max_length=4000)
    ratio: str | None = Field(default=None, max_length=20)

@router.post("/tasks", status_code=201)
async def create_task(payload: GenerationRequest, user: CurrentUser = Depends(get_current_user)):
    _ensure()
    now = time.time()
    provider = "openai-gateway" if settings.llm_configured else "development-queue"
    status = "queued" if settings.llm_configured else "provider_unconfigured"
    task = {"id": "gen_" + uuid.uuid4().hex, "user_id": user.user_id,
            "kind": payload.kind, "mode": payload.mode, "prompt": payload.prompt,
            "ratio": payload.ratio, "status": status, "provider": provider,
            "created_at": now, "updated_at": now,
            "error": None if settings.llm_configured else "未配置生产生成服务；任务已持久化，未生成媒体"}
    with closing(sqlite3.connect(DB_PATH)) as conn:
        conn.execute("INSERT INTO generation_tasks VALUES (?,?,?,?,?,?,?,?,?,?,?)", tuple(task.values()))
        conn.commit()
    return {"task": task, "mode": "sqlite-dev"}

@router.get("/tasks")
async def list_tasks(user: CurrentUser = Depends(get_current_user)):
    _ensure()
    with closing(sqlite3.connect(DB_PATH)) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT * FROM generation_tasks WHERE user_id=? ORDER BY created_at DESC LIMIT 50", (user.user_id,)).fetchall()
    return {"items": [dict(row) for row in rows], "mode": "sqlite-dev"}

@router.get("/tasks/{task_id}")
async def get_task(task_id: str, user: CurrentUser = Depends(get_current_user)):
    _ensure()
    with closing(sqlite3.connect(DB_PATH)) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT * FROM generation_tasks WHERE id=? AND user_id=?", (task_id, user.user_id)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="生成任务不存在")
    return {"task": dict(row), "mode": "sqlite-dev"}
