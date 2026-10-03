"""User-scoped content reports for the UGC moderation queue."""
from __future__ import annotations

import sqlite3
import time
import uuid
from contextlib import closing
from pathlib import Path
from urllib.parse import urlparse

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from ..core.config import settings
from ..core.security import CurrentUser, get_current_user, require_admin
from ..core import audit
from .memory_store import store

router = APIRouter(prefix="/api/reports", tags=["reports"])


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
        conn.execute("""CREATE TABLE IF NOT EXISTS content_reports (
            id TEXT PRIMARY KEY, reporter_id TEXT NOT NULL, target_type TEXT NOT NULL,
            target_id TEXT NOT NULL, reason TEXT NOT NULL, status TEXT NOT NULL,
            created_at REAL NOT NULL, resolved_at REAL
        )""")
        conn.execute("CREATE INDEX IF NOT EXISTS ix_reports_reporter ON content_reports(reporter_id, created_at)")
        conn.commit()


class ReportRequest(BaseModel):
    target_type: str = Field(pattern="^(novel|character|post|memory|comment)$")
    target_id: str = Field(min_length=1, max_length=120)
    reason: str = Field(min_length=2, max_length=500)


class ReviewRequest(BaseModel):
    status: str = Field(pattern="^(reviewed|resolved|rejected)$")


@router.post("", status_code=201)
async def create_report(payload: ReportRequest, user: CurrentUser = Depends(get_current_user)):
    _ensure()
    item = {"id": uuid.uuid4().hex, "reporter_id": user.user_id,
            "target_type": payload.target_type, "target_id": payload.target_id,
            "reason": payload.reason.strip(), "status": "pending", "created_at": time.time(), "resolved_at": None}
    with closing(sqlite3.connect(DB_PATH)) as conn:
        conn.execute("INSERT INTO content_reports VALUES (?,?,?,?,?,?,?,?)", tuple(item.values()))
        conn.commit()
    return {"item": item, "mode": "sqlite-dev"}


@router.get("")
async def list_my_reports(user: CurrentUser = Depends(get_current_user)):
    _ensure()
    with closing(sqlite3.connect(DB_PATH)) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT * FROM content_reports WHERE reporter_id=? ORDER BY created_at DESC", (user.user_id,)).fetchall()
    return {"items": [dict(row) for row in rows], "mode": "sqlite-dev"}


@router.get("/admin/queue")
async def report_queue(_admin: CurrentUser = Depends(require_admin)):
    _ensure()
    with closing(sqlite3.connect(DB_PATH)) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT * FROM content_reports WHERE status='pending' ORDER BY created_at ASC").fetchall()
    return {"items": [dict(row) for row in rows], "mode": "sqlite-dev"}


@router.post("/admin/{report_id}/review")
async def review_report(report_id: str, payload: ReviewRequest,
                        admin: CurrentUser = Depends(require_admin)):
    _ensure()
    now = time.time()
    with closing(sqlite3.connect(DB_PATH)) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT * FROM content_reports WHERE id=?", (report_id,)).fetchone()
        if row is None:
            return {"success": False, "detail": "举报不存在", "mode": "sqlite-dev"}
        conn.execute("UPDATE content_reports SET status=?, resolved_at=? WHERE id=?", (payload.status, now, report_id))
        conn.commit()
        updated = dict(row)
    # 处理完成的角色/评论举报执行最小可逆下架；驳回不改内容可见性。
    if payload.status == "resolved" and updated["target_type"] in {"character", "comment"}:
        target_db = getattr(store, "_db_path", DB_PATH)
        with closing(sqlite3.connect(target_db)) as target:
            if updated["target_type"] == "character":
                target.execute("UPDATE character_plaza SET status='moderated' WHERE character_id=?", (updated["target_id"],))
            else:
                target.execute("UPDATE character_comments SET status='moderated' WHERE id=?", (updated["target_id"],))
            target.commit()
    updated["status"] = payload.status
    updated["resolved_at"] = now
    audit.record(admin.user_id, "content_report.review", report_id, {"status": payload.status, "target_id": updated["target_id"]})
    return {"success": True, "item": updated, "mode": "sqlite-dev"}
