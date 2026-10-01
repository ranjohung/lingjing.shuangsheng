"""Development world-save API for the interactive novel runtime.

The store is intentionally process-local until the production database is wired.
Every operation is scoped by the authenticated development user and novel id.
"""
from __future__ import annotations

import time, json, sqlite3
from pathlib import Path
from urllib.parse import urlparse
from ..core.config import settings
from copy import deepcopy
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from ..core.security import CurrentUser, get_current_user

router = APIRouter(prefix="/api/v1/world-saves", tags=["world-saves"])
class PersistentSaves(dict):
    """SQLite-backed cache preserving the legacy SAVES.clear() test hook."""
    def __init__(self):
        super().__init__()
        url = settings.story_database_url or "sqlite:///./story-development.db"
        raw = urlparse(url).path or "./story-development.db"
        if raw.startswith("/./"):
            raw = raw[1:]
        self.db_path = str((Path(__file__).resolve().parents[2] / raw).resolve()) if not Path(raw).is_absolute() else str(Path(raw).resolve())
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("CREATE TABLE IF NOT EXISTS api_world_saves (user_id TEXT NOT NULL, novel_id TEXT NOT NULL, save_slot INTEGER NOT NULL, payload TEXT NOT NULL, saved_at REAL NOT NULL, PRIMARY KEY(user_id, novel_id, save_slot))")

    def clear(self):
        super().clear()
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("DELETE FROM api_world_saves")

SAVES = PersistentSaves()

class SavePayload(BaseModel):
    slot: int = Field(ge=0, le=17)
    chapter: str = Field(min_length=1, max_length=200)
    progress: int = Field(ge=0, le=100)
    state: dict = Field(default_factory=dict)

def slots_for(user_id: str, novel_id: str) -> dict[int, dict]:
    key = (user_id, novel_id)
    if key not in SAVES:
        with sqlite3.connect(SAVES.db_path) as conn:
            rows = conn.execute("SELECT save_slot, payload FROM api_world_saves WHERE user_id=? AND novel_id=? ORDER BY save_slot", (user_id, novel_id)).fetchall()
        SAVES[key] = {int(slot): json.loads(payload) for slot, payload in rows}
    return SAVES[key]

def persist_slots(user_id: str, novel_id: str, slots: dict[int, dict]) -> None:
    with sqlite3.connect(SAVES.db_path) as conn:
        for slot, record in slots.items():
            conn.execute("INSERT INTO api_world_saves(user_id,novel_id,save_slot,payload,saved_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id,novel_id,save_slot) DO UPDATE SET payload=excluded.payload,saved_at=excluded.saved_at", (user_id, novel_id, slot, json.dumps(record, ensure_ascii=False), record["saved_at"]))

def delete_persisted(user_id: str, novel_id: str, slot: int) -> None:
    with sqlite3.connect(SAVES.db_path) as conn:
        conn.execute("DELETE FROM api_world_saves WHERE user_id=? AND novel_id=? AND save_slot=?", (user_id, novel_id, slot))

@router.get("/{novel_id}")
async def list_saves(novel_id: str, user: CurrentUser = Depends(get_current_user)):
    slots = slots_for(user.user_id, novel_id)
    return {"novel_id": novel_id, "items": [deepcopy(slots[k]) for k in sorted(slots)], "mode": "sqlite"}

@router.put("/{novel_id}/{slot}")
async def write_save(novel_id: str, slot: int, payload: SavePayload, user: CurrentUser = Depends(get_current_user)):
    if slot != payload.slot:
        raise HTTPException(422, "存档槽位不一致")
    record = {"slot": slot, "chapter": payload.chapter, "progress": payload.progress, "state": deepcopy(payload.state), "saved_at": time.time()}
    slots_for(user.user_id, novel_id)[slot] = record
    persist_slots(user.user_id, novel_id, slots_for(user.user_id, novel_id))
    return {"success": True, "novel_id": novel_id, "save": deepcopy(record), "mode": "sqlite"}

@router.get("/{novel_id}/{slot}")
async def read_save(novel_id: str, slot: int, user: CurrentUser = Depends(get_current_user)):
    record = slots_for(user.user_id, novel_id).get(slot)
    if record is None:
        raise HTTPException(404, "暂无剧情")
    return {"novel_id": novel_id, "save": deepcopy(record), "mode": "sqlite"}

@router.delete("/{novel_id}/{slot}")
async def delete_save(novel_id: str, slot: int, user: CurrentUser = Depends(get_current_user)):
    removed = slots_for(user.user_id, novel_id).pop(slot, None)
    if removed is None:
        raise HTTPException(404, "暂无剧情")
    delete_persisted(user.user_id, novel_id, slot)
    return {"deleted": True, "novel_id": novel_id, "slot": slot, "mode": "sqlite"}
