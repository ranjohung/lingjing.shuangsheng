"""Deterministic narrative rules; development repository is explicitly ephemeral."""
from copy import deepcopy
from dataclasses import dataclass, field
from threading import RLock
from uuid import uuid4

from .content import STORY

class StoryError(Exception):
    def __init__(self, status, message):
        self.status, self.message = status, message

def initial_state():
    return {"attributes": dict.fromkeys(("wisdom", "courage", "charm", "strength"), 50),
            "relationships": {}, "flags": [], "hidden_affinity": 0, "route": None}

def advance(state, option):
    state = deepcopy(state)
    for key, delta in option["effects"].items():
        state["attributes"][key] = max(0, min(100, state["attributes"][key] + delta))
    npc = option["npc"]
    state["relationships"][npc] = max(0, min(100, state["relationships"].get(npc, 50) + option["relationship_delta"]))
    state["flags"] = sorted(set(state["flags"]) | set(option["flags"]))
    state["hidden_affinity"] = len(state["flags"])
    state["route"] = option.get("route", state["route"])
    return state

def ending_for(state):
    a = state["attributes"]
    if len(state["flags"]) == 3 and a["wisdom"] >= 70:
        key = "true"
    elif a["wisdom"] >= 70 and state["relationships"].get("陈宫" if state["route"] == "power" else "貂蝉", 50) >= 55:
        key = state["route"] + "_he"
    elif a["courage"] >= 85 and a["wisdom"] < 60 and a["strength"] >= 65:
        key = state["route"] + "_be"
    else:
        key = "normal"
    return deepcopy(next(e for e in STORY["endings"] if e["id"] == key))

@dataclass
class Session:
    owner: str
    identity: dict
    id: str = field(default_factory=lambda: str(uuid4()))
    revision: int = 0
    current: str | None = STORY["start"]
    state: dict = field(default_factory=initial_state)
    history: list = field(default_factory=list)
    ending: dict | None = None

class Repository:
    def __init__(self):
        self.sessions = {}
        self.lock = RLock()

    def _owned(self, owner, sid):
        session = self.sessions.get(sid)
        if session is None or session.owner != owner:
            raise StoryError(404, "找不到这个游玩记录")
        return session

    def create(self, owner, identity):
        with self.lock:
            s = Session(owner, deepcopy(identity))
            self.sessions[s.id] = s
            return self._view(s)

    def _view(self, s):
        node = deepcopy(STORY["nodes"].get(s.current))
        if node:
            node["options"] = [{"id": o["id"], "text": o["text"]} for o in node["options"]]
        state = deepcopy(s.state)
        # Hidden counters and flags must not reveal the true-ending recipe.
        state.pop("hidden_affinity"); state.pop("flags")
        return {"id": s.id, "story_id": STORY["id"], "story_title": STORY["title"], "version": STORY["version"],
                "identity": deepcopy(s.identity), "revision": s.revision, "state": state, "node": node,
                "history": [{k: deepcopy(v) for k, v in e.items() if k not in ("before", "after")} for e in s.history],
                "ending": deepcopy(s.ending), "completed_choices": len(s.history), "total_choices": 30,
                "status": "completed" if s.ending else "in_progress", "storage_mode": "development_memory"}

    def get(self, owner, sid):
        with self.lock:
            return self._view(self._owned(owner, sid))

    def list(self, owner):
        with self.lock:
            return [self._view(s) for s in reversed(list(self.sessions.values())) if s.owner == owner]

    def choose(self, owner, sid, choice_id, option_id, revision):
        with self.lock:
            s = self._owned(owner, sid)
            if s.revision != revision:
                raise StoryError(409, "进度已变化，请刷新后重试")
            if s.current is None or choice_id != s.current:
                raise StoryError(409, "只能提交当前剧情的选择")
            node = STORY["nodes"][s.current]
            option = next((o for o in node["options"] if o["id"] == option_id), None)
            if option is None:
                raise StoryError(422, "无效选项")
            before = deepcopy(s.state)
            s.state = advance(s.state, option)
            s.history.append({"choice_id": choice_id, "option_id": option_id, "title": node["title"],
                              "text": option["text"], "before": before, "after": deepcopy(s.state)})
            s.current = option["next"]
            s.revision += 1
            if s.current is None:
                s.ending = ending_for(s.state)
            return self._view(s)

    def rewind(self, owner, sid, target_count, revision):
        with self.lock:
            s = self._owned(owner, sid)
            if revision != s.revision:
                raise StoryError(409, "进度已变化，请刷新后重试")
            if not 0 <= target_count < len(s.history):
                raise StoryError(422, "回溯位置必须早于当前进度")
            history = s.history[:target_count]
            state, current = initial_state(), STORY["start"]
            for event in history:
                option = next(o for o in STORY["nodes"][current]["options"] if o["id"] == event["option_id"])
                state = advance(state, option); current = option["next"]
            s.state, s.current, s.history, s.ending = state, current, history, None
            s.revision += 1
            return self._view(s)

    def destiny(self, owner, sid):
        with self.lock:
            s = self._owned(owner, sid)
            if not s.ending:
                raise StoryError(409, "抵达结局后才能生成命运卡")
            return {"story_title": STORY["title"], "character_name": s.identity["name"],
                    "route": STORY["routes"][s.state["route"]], "ending": deepcopy(s.ending),
                    "key_choices": [e["text"] for e in s.history if e["choice_id"] in ("common-0", "common-13", "power-15", "bond-15")],
                    "watermark": "MIRAI 灵境 · 平行人生", "visibility": "private"}

repository = Repository()
