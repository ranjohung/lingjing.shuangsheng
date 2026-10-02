"""Development wallet API with the V7 one-way currency rules."""
from __future__ import annotations
import time, uuid, json, sqlite3
from contextlib import closing
from pathlib import Path
from urllib.parse import urlparse
from ..core.config import settings
from dataclasses import dataclass, field
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from ..core.security import CurrentUser, get_current_user

router = APIRouter(prefix="/api/v1/currency", tags=["economy"])

@dataclass
class Ledger:
    lingjing: int = 1280
    lingyu: int = 0
    action_value: int = 0
    items: dict[str, int] = field(default_factory=dict)
    worlds: dict[str, dict[str, int]] = field(default_factory=dict)
    transactions: list[dict] = field(default_factory=list)

class PersistentLedgerCache(dict):
    """兼容测试的缓存外观；真实账本以 user_id 为主键落 SQLite。"""
    def __init__(self):
        super().__init__()
        url = settings.story_database_url or "sqlite:///./story-development.db"
        raw = urlparse(url).path or "./story-development.db"
        if raw.startswith("/./"):
            raw = raw[1:]
        self.db_path = str((Path(__file__).resolve().parents[2] / raw).resolve()) if not Path(raw).is_absolute() else str(Path(raw).resolve())
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        with closing(sqlite3.connect(self.db_path)) as conn:
            conn.execute("CREATE TABLE IF NOT EXISTS economy_ledgers (user_id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at REAL NOT NULL)")
            conn.commit()

    def pop(self, user_id, *args):
        value = super().pop(user_id, *args)
        with closing(sqlite3.connect(self.db_path)) as conn:
            conn.execute("DELETE FROM economy_ledgers WHERE user_id=?", (user_id,))
            conn.commit()
        return value

LEDGERS = PersistentLedgerCache()
def ledger(user_id: str) -> Ledger:
    cached = LEDGERS.get(user_id)
    if cached is not None:
        return cached
    with closing(sqlite3.connect(LEDGERS.db_path)) as conn:
        row = conn.execute("SELECT payload FROM economy_ledgers WHERE user_id=?", (user_id,)).fetchone()
    if not row:
        value = Ledger()
    else:
        data = json.loads(row[0])
        value = Ledger(**data)
    LEDGERS[user_id] = value
    return value

def persist_ledger(user_id: str, value: Ledger) -> None:
    payload = json.dumps({"lingjing": value.lingjing, "lingyu": value.lingyu, "action_value": value.action_value, "items": value.items, "worlds": value.worlds, "transactions": value.transactions}, ensure_ascii=False)
    with closing(sqlite3.connect(LEDGERS.db_path)) as conn:
        conn.execute("INSERT INTO economy_ledgers(user_id,payload,updated_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at", (user_id, payload, time.time()))
        conn.commit()

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

class PurchaseRequest(BaseModel):
    item_id: str = Field(min_length=1, max_length=100)
    novel_id: str = Field(min_length=1, max_length=100)

MALL_ITEMS = [
    {"id":"silver-1","item_type":"currency","item_name":"1两银子","description":"西游记世界货币","lingjing_price":10,"grant":{"currency":"银两","amount":1}},
    {"id":"copper-1000","item_type":"currency","item_name":"1000铜钱","description":"西游记世界货币","lingjing_price":10,"grant":{"currency":"铜钱","amount":1000}},
    {"id":"action-100","item_type":"action_point","item_name":"100行动值","description":"补充本次世界行动值","lingjing_price":10,"grant":{"action_value":100}},
    {"id":"medicine","item_type":"item","item_name":"疗伤药","description":"加入小说世界背包","lingjing_price":20,"grant":{"item":"疗伤药","amount":1}},
]

@router.get("/lingjing")
async def get_lingjing(user: CurrentUser = Depends(get_current_user)):
    b=ledger(user.user_id); return {"lingjing":b.lingjing,"lingyu":b.lingyu,"mode":"sqlite"}

@router.get("/world/{novel_id}")
async def get_world_currency(novel_id: str, user: CurrentUser = Depends(get_current_user)):
    b=ledger(user.user_id); return {"novel_id":novel_id,"balances":b.worlds.get(novel_id,{"铜钱":31,"银两":0}),"mode":"sqlite"}

@router.post("/exchange")
async def exchange(payload: ExchangeRequest, user: CurrentUser = Depends(get_current_user)):
    b=ledger(user.user_id)
    if payload.lingjing_cost>b.lingjing: raise HTTPException(402,"灵晶余额不足")
    b.lingjing-=payload.lingjing_cost
    balances=b.worlds.setdefault(payload.novel_id,{"铜钱":31,"银两":0})
    balances[payload.target_currency]=balances.get(payload.target_currency,0)+payload.amount
    b.transactions.append({"id":uuid.uuid4().hex,"type":"exchange","amount":-payload.lingjing_cost,"novel_id":payload.novel_id,"created_at":time.time()})
    persist_ledger(user.user_id, b)
    return {"success":True,"lingjing_balance":b.lingjing,"world_currency_balance":balances}

@router.post("/spend-world")
async def spend_world(payload: SpendWorldRequest, user: CurrentUser = Depends(get_current_user)):
    b=ledger(user.user_id); balances=b.worlds.setdefault(payload.novel_id,{"铜钱":31,"银两":0})
    if balances.get(payload.currency_type,0)<payload.amount: raise HTTPException(402,"小说世界货币不足")
    balances[payload.currency_type]-=payload.amount
    b.transactions.append({"id":uuid.uuid4().hex,"type":"world-spend","amount":-payload.amount,"novel_id":payload.novel_id,"currency":payload.currency_type,"description":payload.description,"created_at":time.time()})
    persist_ledger(user.user_id, b)
    return {"success":True,"novel_id":payload.novel_id,"balances":balances}

@router.get("/mall/items")
async def mall_items(novel_id: str = "xiyouji", user: CurrentUser = Depends(get_current_user)):
    return {"novel_id": novel_id, "lingjing": ledger(user.user_id).lingjing, "items": MALL_ITEMS, "mode": "sqlite"}

@router.post("/mall/purchase")
async def mall_purchase(payload: PurchaseRequest, user: CurrentUser = Depends(get_current_user)):
    b = ledger(user.user_id)
    item = next((x for x in MALL_ITEMS if x["id"] == payload.item_id), None)
    if item is None:
        raise HTTPException(404, "商城商品不存在")
    price = int(item["lingjing_price"])
    if b.lingjing < price:
        raise HTTPException(402, "灵晶余额不足")
    b.lingjing -= price
    grant = item["grant"]
    balances = b.worlds.setdefault(payload.novel_id, {"铜钱":31, "银两":0})
    if "currency" in grant:
        balances[grant["currency"]] = balances.get(grant["currency"], 0) + int(grant["amount"])
    if "action_value" in grant:
        b.action_value += int(grant["action_value"])
    if "item" in grant:
        b.items[grant["item"]] = b.items.get(grant["item"], 0) + int(grant["amount"])
    b.transactions.append({"id":uuid.uuid4().hex,"type":"mall-purchase","item_id":item["id"],"amount":-price,"novel_id":payload.novel_id,"created_at":time.time()})
    persist_ledger(user.user_id, b)
    return {"success":True,"item":item,"lingjing_balance":b.lingjing,"world_currency_balance":balances,"action_value":b.action_value,"items":b.items,"mode":"sqlite"}

@router.get("/transactions")
async def transactions(user: CurrentUser = Depends(get_current_user)):
    return {"items":ledger(user.user_id).transactions,"mode":"sqlite"}
