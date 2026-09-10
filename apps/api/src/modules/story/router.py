from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from typing import Literal
from ...core.security import CurrentUser, get_current_user
from ..memory_store import store
from .content import CATALOG, STORY
from .engine import StoryError, repository
from ...core.config import settings
if settings.story_database_url:
    from .database import SQLRepository
    repository = SQLRepository(settings.story_database_url)

router = APIRouter(tags=["story"])
class StartRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    story_id: str
    role_id: str = "lubu"
    identity_mode: Literal["canonical", "custom", "character"] = "canonical"
    name: str = Field(default="", max_length=20)
    background: str = Field(default="", max_length=500)
    character_id: str | None = None

class ChoiceRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    choice_id: str
    option_id: str
    expected_revision: int = Field(ge=0)

class RewindRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    target_count: int = Field(ge=0)
    expected_revision: int = Field(ge=0)

def call(fn, *args):
    try:
        return fn(*args)
    except StoryError as exc:
        raise HTTPException(exc.status, exc.message) from exc

def summary(s):
    return {k: v for k, v in s.items() if k not in ("nodes", "endings", "start")}

@router.get("/api/stories")
def catalog(user: CurrentUser = Depends(get_current_user)):
    return [summary(s) for s in CATALOG]

@router.get("/api/stories/{story_id}")
def detail(story_id: str, user: CurrentUser = Depends(get_current_user)):
    s = next((s for s in CATALOG if s["id"] == story_id), None)
    if s is None:
        raise HTTPException(404, "找不到这部故事")
    return summary(s)

@router.post("/api/story-sessions", status_code=201)
def start(payload: StartRequest, user: CurrentUser = Depends(get_current_user)):
    if payload.story_id != STORY["id"]:
        raise HTTPException(422, "该故事尚未开放游玩")
    if payload.role_id != "lubu":
        raise HTTPException(422, "该人物视角尚未开放")
    identity = {"mode": payload.identity_mode, "role_id": payload.role_id, "name": "吕布", "background": "三国平行世界的吕布", "character_id": None}
    if payload.identity_mode == "custom":
        if not payload.name.strip() or not payload.background.strip():
            raise HTTPException(422, "请填写人物姓名和入世背景")
        identity.update(name=payload.name.strip(), background=payload.background.strip())
    elif payload.identity_mode == "character":
        c = store.get_character(user.user_id, payload.character_id or "")
        if c is None or c.is_preset:
            raise HTTPException(404, "找不到属于你的自建人物")
        identity.update(name=c.name, background=c.persona, character_id=c.id)
    return repository.create(user.user_id, identity)

@router.get("/api/story-sessions")
def sessions(user: CurrentUser = Depends(get_current_user)):
    return repository.list(user.user_id)

@router.get("/api/story-sessions/{sid}")
def session(sid: str, user: CurrentUser = Depends(get_current_user)):
    return call(repository.get, user.user_id, sid)

@router.post("/api/story-sessions/{sid}/choices")
def choose(sid: str, payload: ChoiceRequest, user: CurrentUser = Depends(get_current_user)):
    return call(repository.choose, user.user_id, sid, payload.choice_id, payload.option_id, payload.expected_revision)

@router.post("/api/story-sessions/{sid}/rewind")
def rewind(sid: str, payload: RewindRequest, user: CurrentUser = Depends(get_current_user)):
    return call(repository.rewind, user.user_id, sid, payload.target_count, payload.expected_revision)

@router.get("/api/story-sessions/{sid}/destiny")
def destiny(sid: str, user: CurrentUser = Depends(get_current_user)):
    return call(repository.destiny, user.user_id, sid)
