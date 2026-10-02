"""Notification and recommendation API.

This phase deliberately uses an explicit process-local store.  It is real API
state for local development, but responses identify the mode so the UI cannot
present it as production-synchronised data before persistence is wired.
"""
from __future__ import annotations

import sqlite3
import time
import uuid
from contextlib import closing
from pathlib import Path
from urllib.parse import urlparse

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from ..core.security import CurrentUser, get_current_user
from ..core.config import settings

router = APIRouter(prefix="/api/v1", tags=["discovery"])


def _db_path() -> str:
    url = settings.story_database_url or "sqlite:///./story-development.db"
    raw = urlparse(url).path or "./story-development.db"
    if raw.startswith("/./"):
        raw = raw[1:]
    path = Path(raw)
    if not path.is_absolute():
        path = Path(__file__).resolve().parents[2] / path
    path.parent.mkdir(parents=True, exist_ok=True)
    return str(path.resolve())


DB_PATH = _db_path()


def _ensure_store() -> None:
    with closing(sqlite3.connect(DB_PATH)) as conn:
        conn.execute("""CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL, type TEXT NOT NULL,
            title TEXT NOT NULL, body TEXT NOT NULL, read INTEGER NOT NULL DEFAULT 0,
            created_at REAL NOT NULL
        )""")
        conn.commit()


def inbox_items(user_id: str) -> list[dict]:
    _ensure_store()
    with closing(sqlite3.connect(DB_PATH)) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT id,type,title,body,read,created_at FROM notifications WHERE user_id=? ORDER BY created_at DESC", (user_id,)).fetchall()
        if not rows:
            seed = [
                (uuid.uuid4().hex, user_id, "system", "欢迎来到灵境", "你的小说世界存档会保存在当前开发设备。", 0, time.time()),
                (uuid.uuid4().hex, user_id, "world", "世界更新", "已有作品可以继续探索场景互动。", 0, time.time()),
            ]
            conn.executemany("INSERT INTO notifications(id,user_id,type,title,body,read,created_at) VALUES(?,?,?,?,?,?,?)", seed)
            conn.commit()
            rows = conn.execute("SELECT id,type,title,body,read,created_at FROM notifications WHERE user_id=? ORDER BY created_at DESC", (user_id,)).fetchall()
    return [{**dict(row), "read": bool(row["read"])} for row in rows]


class ReadRequest(BaseModel):
    read: bool = True


@router.get("/notifications")
async def notifications(user: CurrentUser = Depends(get_current_user)):
    items = inbox_items(user.user_id)
    return {"items": items, "unread": sum(1 for item in items if not item["read"]), "mode": "sqlite-dev"}


@router.post("/notifications/{notification_id}/read")
async def mark_notification(notification_id: str, payload: ReadRequest, user: CurrentUser = Depends(get_current_user)):
    items = inbox_items(user.user_id)
    with closing(sqlite3.connect(DB_PATH)) as conn:
        updated = conn.execute("UPDATE notifications SET read=? WHERE id=? AND user_id=?", (int(payload.read), notification_id, user.user_id)).rowcount
        conn.commit()
    if updated:
        for item in items:
            if item["id"] == notification_id:
                item["read"] = payload.read
                return {"success": True, "item": item, "mode": "sqlite-dev"}
    return {"success": False, "detail": "通知不存在", "mode": "sqlite-dev"}


@router.get("/recommendations")
async def recommendations(limit: int = 10, user: CurrentUser = Depends(get_current_user)):
    limit = max(1, min(limit, 30))
    # These are the currently bundled public-domain worlds, not a fabricated
    # personalised ranking.  Personalisation waits for a persistent event log.
    catalog = [
        {"book_id": "xiyouji", "title": "西游记", "reason": "公版世界 · 可互动剧情"},
        {"book_id": "hongloumeng", "title": "红楼梦", "reason": "公版世界 · 角色关系"},
        {"book_id": "sanguoyanyi", "title": "三国演义", "reason": "公版世界 · 多角色路线"},
        {"book_id": "shuihuzhuan", "title": "水浒传", "reason": "公版世界 · 场景探索"},
        {"book_id": "liaozhai", "title": "聊斋志异", "reason": "公版世界 · 氛围剧情"},
    ]
    return {"items": catalog[:limit], "personalized": False, "mode": "bundled-catalog", "user_id": user.user_id}
