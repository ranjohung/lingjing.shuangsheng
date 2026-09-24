"""Development wallet API with the V7 one-way currency rules."""
from __future__ import annotations
import time, uuid
from dataclasses import dataclass, field
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from ..core.security import CurrentUser, get_current_user

router = APIRouter(prefix="/api/v1/currency", tags=["economy"])

@dataclass
class Ledger:
    lingjing: int = 1280
    lingyu: int = 0
    worlds: dict[str, dict[str, int]] = field(default_factory=dict)
    transactions: list[dict] = field(default_factory=list)

LEDGERS: dict[str, Ledger] = {}
def ledger(user_id: str) -> Ledger:
    return LEDGERS.setdefault(user_id, Ledger())

class ExchangeRequest(BaseModel):
    novel_id: str = Field(min_length=1, max_length=100)
    target_currency: str = Field(min_length=1, max_length=50)
    amount: int = Field(gt=0, le=1_000_000)
    lingjing_cost: int = Field(gt=0, le=1_000_000)

class SpendWorldRequest(BaseModel):
    novel_id: str = Field(min_length=1, max_length=100)
    currency_type: str = Field(min_length=1, max_length=50)
    amount: int = Field(gt=0, le=1_000_000)
    description: str = Field(min_length=1, max_length=200)

@router.get("/lingjing")
async def get_lingjing(user: CurrentUser = Depends(get_current_user)):
    b=ledger(user.user_id); return {"lingjing":b.lingjing,"lingyu":b.lingyu,"mode":"local-demo"}

@router.get("/world/{novel_id}")
async def get_world_currency(novel_id: str, user: CurrentUser = Depends(get_current_user)):
    b=ledger(user.user_id); return {"novel_id":novel_id,"balances":b.worlds.get(novel_id,{"铜钱":31,"银两":0}),"mode":"local-demo"}

@router.post("/exchange")
async def exchange(payload: ExchangeRequest, user: CurrentUser = Depends(get_current_user)):
    b=ledger(user.user_id)
    if payload.lingjing_cost>b.lingjing: raise HTTPException(402,"灵晶余额不足")
    b.lingjing-=payload.lingjing_cost
    balances=b.worlds.setdefault(payload.novel_id,{"铜钱":31,"银两":0})
    balances[payload.target_currency]=balances.get(payload.target_currency,0)+payload.amount
    b.transactions.append({"id":uuid.uuid4().hex,"type":"exchange","amount":-payload.lingjing_cost,"novel_id":payload.novel_id,"created_at":time.time()})
    return {"success":True,"lingjing_balance":b.lingjing,"world_currency_balance":balances}

@router.post("/spend-world")
async def spend_world(payload: SpendWorldRequest, user: CurrentUser = Depends(get_current_user)):
    b=ledger(user.user_id); balances=b.worlds.setdefault(payload.novel_id,{"铜钱":31,"银两":0})
    if balances.get(payload.currency_type,0)<payload.amount: raise HTTPException(402,"小说世界货币不足")
    balances[payload.currency_type]-=payload.amount
    b.transactions.append({"id":uuid.uuid4().hex,"type":"world-spend","amount":-payload.amount,"novel_id":payload.novel_id,"currency":payload.currency_type,"description":payload.description,"created_at":time.time()})
    return {"success":True,"novel_id":payload.novel_id,"balances":balances}

@router.get("/transactions")
async def transactions(user: CurrentUser = Depends(get_current_user)):
    return {"items":ledger(user.user_id).transactions,"mode":"local-demo"}
