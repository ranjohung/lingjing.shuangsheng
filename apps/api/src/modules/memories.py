"""记忆模块：列表 / 单条删除 / 定向遗忘 / 导出 / 关系查询（FR-MEM-06/07）。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from ..core.security import CurrentUser, get_current_user
from .memory_store import store

router = APIRouter(prefix="/api", tags=["memories"])


class MemoryOut(BaseModel):
    id: str
    character_id: str
    content: str
    memory_type: str
    importance: float
    created_at: float


class ForgetRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=100)
    character_id: str | None = None


class ForgetResponse(BaseModel):
    forgotten_count: int


class MemoryCreateRequest(BaseModel):
    character_id: str = Field(min_length=1, max_length=80)
    content: str = Field(min_length=1, max_length=2000)
    memory_type: str = Field(pattern="^(preference|fact|event)$")
    importance: float = Field(default=0.5, ge=0.0, le=1.0)


@router.get("/memories", response_model=list[MemoryOut])
async def list_memories(character_id: str | None = Query(default=None),
                        user: CurrentUser = Depends(get_current_user)):
    return [
        MemoryOut(id=m.id, character_id=m.character_id, content=m.content,
                  memory_type=m.memory_type, importance=m.importance, created_at=m.created_at)
        for m in store.list_memories(user.user_id, character_id)
    ]


@router.post("/memories", response_model=MemoryOut, status_code=201)
async def create_memory(payload: MemoryCreateRequest,
                        user: CurrentUser = Depends(get_current_user)):
    # 记忆写入必须绑定当前用户，不能接受任意 user_id。
    item = store.add_memory(user.user_id, payload.character_id, payload.content,
                            payload.memory_type, payload.importance)
    return MemoryOut(id=item.id, character_id=item.character_id, content=item.content,
                     memory_type=item.memory_type, importance=item.importance,
                     created_at=item.created_at)


@router.delete("/memories/{memory_id}")
async def delete_memory(memory_id: str, user: CurrentUser = Depends(get_current_user)):
    if not store.delete_memory(user.user_id, memory_id):
        raise HTTPException(status_code=404, detail="记忆不存在")
    return {"deleted": True}


@router.post("/memories/forget", response_model=ForgetResponse)
async def forget_topic(payload: ForgetRequest, user: CurrentUser = Depends(get_current_user)):
    count = store.forget_topic(user.user_id, payload.topic, payload.character_id)
    return ForgetResponse(forgotten_count=count)


@router.get("/memories/export")
async def export_memories(user: CurrentUser = Depends(get_current_user)):
    return store.export_data(user.user_id)


@router.get("/relationship")
async def get_relationship(character_id: str = Query(...), user: CurrentUser = Depends(get_current_user)):
    rel = store.get_relationship(user.user_id, character_id)
    rel.apply_decay()
    labels = {
        "trust": "信任", "intimacy": "亲密", "familiarity": "熟悉",
        "respect": "尊重", "affection": "好感", "conflict": "冲突", "dependency_risk": "依赖风险",
    }
    return {
        "character_id": character_id,
        "dimensions": rel.dimensions,
        "labels": labels,
        "last_interaction": rel.last_interaction,
    }
