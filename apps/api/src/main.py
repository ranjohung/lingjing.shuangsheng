"""MIRAI 灵境 — FastAPI 入口（Phase 0 骨架）。

启动：.venv/Scripts/python -m uvicorn src.main:app --reload --port 8000
验收：GET /health → 200 {"status":"ok"}；熔断器可通过 /admin 接口观测。
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .core.config import settings
from .core.kill_switch import KillSwitch
from .infrastructure.cache import create_cache
from .modules.chat import router as chat_router
from .modules.characters import router as characters_router
from .modules.economy import router as economy_router
from .modules.discovery import router as discovery_router
from .modules.memories import router as memories_router
from .modules.profile import router as profile_router
from .modules.scenes import router as scenes_router
from .modules.world_saves import router as world_saves_router
from .modules.story.router import router as story_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mirai.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    cache = await create_cache(settings.redis_url)
    app.state.kill_switch = KillSwitch(cache, settings.daily_budget_limit_usd)
    logger.info("缓存后端: %s | 日预算: $%.2f | Supabase: %s | LLM: %s",
                cache.kind, settings.daily_budget_limit_usd,
                "configured" if settings.supabase_configured else "dev 降级",
                "configured" if settings.llm_configured else "规则模拟")
    yield


app = FastAPI(title="MIRAI 灵境 API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(characters_router)
app.include_router(economy_router)
app.include_router(discovery_router)
app.include_router(memories_router)
app.include_router(profile_router)
app.include_router(scenes_router)
app.include_router(world_saves_router)
app.include_router(story_router)


@app.get("/health")
async def health(request: Request):
    ks: KillSwitch = request.app.state.kill_switch
    cost = await ks.daily_cost()
    return {
        "status": "ok",
        "service": "mirai-companion-api",
        "phase": 0,
        "components": {
            "cache": ks.cache_kind,
            "database": "sqlite" if settings.story_database_url and settings.story_database_url.startswith("sqlite") else ("configured" if settings.story_database_url else "not_configured"),
            "kill_switch": "enabled",
            "auth": "jwt" if settings.auth_jwt_secret else ("dev_fallback" if settings.dev_auth_enabled else "not_configured"),
            "llm": "rule_engine" if not settings.llm_configured else "gateway",
        },
        "budget": {"spent_usd": round(cost, 4), "limit_usd": ks.daily_limit},
    }


@app.get("/admin/cost/today")
async def cost_today(request: Request):
    ks: KillSwitch = request.app.state.kill_switch
    return {"spent_usd": round(await ks.daily_cost(), 4), "limit_usd": ks.daily_limit}


@app.post("/admin/kill-switch/reset")
async def kill_switch_reset(request: Request):
    ks: KillSwitch = request.app.state.kill_switch
    await ks.reset()
    return {"reset": True, "spent_usd": 0.0}


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("未处理异常: %s", exc)
    return JSONResponse(status_code=500, content={"detail": "服务器内部错误（已记录）"})
