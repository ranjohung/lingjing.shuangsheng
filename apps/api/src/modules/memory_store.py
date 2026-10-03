"""Phase 0 进程内数据：记忆 / 关系 / 角色（后续 Phase 5 替换为 PostgreSQL+pgvector）。

记忆检索采用中文双字组（bigram）重叠打分；偏好类记忆冲突时"新事实覆盖旧事实"
（对齐硬性测试：记忆冲突-香菜）。
"""
from __future__ import annotations

import re
import time
import uuid
from contextlib import contextmanager
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional

RELATION_DIMENSIONS = {
    "trust": 0.3,
    "intimacy": 0.1,
    "familiarity": 0.2,
    "respect": 0.4,
    "affection": 0.2,
    "conflict": 0.0,
    "dependency_risk": 0.0,
}

# 7 天未互动 intimacy 下降 5%~10%（关系衰减硬测试）
DECAY_DAYS = 7
INTIMACY_DECAY_RATE = 0.07
SEVEN_DAYS_SECONDS = 7 * 24 * 3600


def _shingles(text: str) -> set[str]:
    text = text.lower()
    tokens: set[str] = set(re.findall(r"[a-z0-9]+", text))
    chinese = re.findall(r"[一-鿿]", text)
    tokens.update("".join(pair) for pair in zip(chinese, chinese[1:]))
    tokens.update(chinese)
    return tokens


@dataclass
class Character:
    id: str
    user_id: str
    name: str
    persona: str
    relationship_type: str  # friend | partner | family | custom
    avatar: str  # emoji 占位（Phase 8 换 glb）
    glow: str  # 主题色 hex
    is_preset: bool = False


@dataclass
class MemoryItem:
    id: str
    user_id: str
    character_id: str
    content: str
    memory_type: str  # preference | fact | event
    importance: float = 0.5
    created_at: float = field(default_factory=time.time)
    active: bool = True

    @property
    def tokens(self) -> set[str]:
        return _shingles(self.content)


@dataclass
class Relationship:
    user_id: str
    character_id: str
    dimensions: dict[str, float] = field(default_factory=lambda: dict(RELATION_DIMENSIONS))
    last_interaction: float = field(default_factory=time.time)

    def apply_decay(self) -> float:
        """按距上次互动的天数懒衰减，返回 intimacy 下降量。"""
        elapsed = time.time() - self.last_interaction
        if elapsed >= SEVEN_DAYS_SECONDS:
            periods = int(elapsed // SEVEN_DAYS_SECONDS)
            drop = self.dimensions["intimacy"] * INTIMACY_DECAY_RATE * periods
            self.dimensions["intimacy"] = max(0.0, self.dimensions["intimacy"] - drop)
            return drop
        return 0.0


class InMemoryStore:
    # 免费档：2 个角色槽位（FR-BILL-05，服务端强制）
    FREE_CHARACTER_LIMIT = 2

    PRESET_CHARACTERS = [
        Character(
            id="preset_ling", user_id="*", name="灵",
            persona="温柔、敏锐的陪伴者，像夜色里一盏安静的灯。说话柔和，擅长倾听，"
                    "会在你难过时先接住情绪，再温柔地陪你看清事实，从不盲目附和。",
            relationship_type="friend", avatar="🧚", glow="#8b7cf6", is_preset=True,
        ),
        Character(
            id="preset_xiaoman", user_id="*", name="小满",
            persona="元气、直率的青梅竹马型伙伴，爱开玩笑、会吐槽，像晴天的风。"
                    "在你低落时会想办法逗你笑，但大事上从不含糊。",
            relationship_type="friend", avatar="🌻", glow="#f6a6d8", is_preset=True,
        ),
    ]

    def __init__(self) -> None:
        self.memories: list[MemoryItem] = []
        self.relationships: dict[tuple[str, str], Relationship] = {}
        self.characters: dict[tuple[str, str], Character] = {}

    # ---- 角色 ----
    def list_characters(self, user_id: str) -> list[Character]:
        """预设角色对所有用户可见 + 用户自建角色。"""
        customs = [c for c in self.characters.values() if c.user_id == user_id]
        return list(self.PRESET_CHARACTERS) + customs

    def get_character(self, user_id: str, character_id: str) -> Optional[Character]:
        if character_id.startswith("preset_"):
            for p in self.PRESET_CHARACTERS:
                if p.id == character_id:
                    return p
        return self.characters.get((user_id, character_id))

    def count_custom_characters(self, user_id: str) -> int:
        return sum(1 for c in self.characters.values() if c.user_id == user_id)

    def create_character(self, user_id: str, name: str, persona: str,
                         relationship_type: str, avatar: str, glow: str) -> Character:
        item = Character(
            id=uuid.uuid4().hex[:10], user_id=user_id, name=name, persona=persona,
            relationship_type=relationship_type, avatar=avatar, glow=glow, is_preset=False,
        )
        self.characters[(user_id, item.id)] = item
        return item

    # ---- 记忆 ----
    def _scope(self, user_id: str, character_id: str) -> list[MemoryItem]:
        return [m for m in self.memories if m.user_id == user_id and m.character_id == character_id and m.active]

    def search(self, user_id: str, character_id: str, query: str, limit: int = 3) -> list[MemoryItem]:
        query_tokens = _shingles(query)
        scored: list[tuple[float, MemoryItem]] = []
        for mem in self._scope(user_id, character_id):
            overlap = len(query_tokens & mem.tokens)
            if overlap:
                score = overlap * (0.5 + mem.importance)
                scored.append((score, mem))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [m for _, m in scored[:limit]]

    def add_memory(self, user_id: str, character_id: str, content: str, memory_type: str,
                   importance: float = 0.5) -> MemoryItem:
        item = MemoryItem(
            id=uuid.uuid4().hex[:12], user_id=user_id, character_id=character_id,
            content=content, memory_type=memory_type, importance=importance,
        )
        # 偏好冲突：同主题旧偏好失效（新事实覆盖旧事实）
        if memory_type == "preference":
            new_tokens = item.tokens
            for old in self._scope(user_id, character_id):
                if old.memory_type == "preference" and len(new_tokens & old.tokens) >= 2:
                    old.active = False
        self.memories.append(item)
        return item

    # ---- 关系 ----
    def get_relationship(self, user_id: str, character_id: str) -> Relationship:
        key = (user_id, character_id)
        rel = self.relationships.get(key)
        if rel is None:
            rel = Relationship(user_id=user_id, character_id=character_id)
            self.relationships[key] = rel
        return rel

    def touch_relationship(self, user_id: str, character_id: str, deltas: dict[str, float]) -> tuple[Relationship, float]:
        rel = self.get_relationship(user_id, character_id)
        decay_drop = rel.apply_decay()
        for dim, value in deltas.items():
            if dim in rel.dimensions:
                rel.dimensions[dim] = max(0.0, min(1.0, rel.dimensions[dim] + value))
        rel.last_interaction = time.time()
        return rel, decay_drop

    def list_memories(self, user_id: str, character_id: Optional[str] = None) -> list[MemoryItem]:
        items = [m for m in self.memories if m.user_id == user_id and m.active]
        if character_id:
            items = [m for m in items if m.character_id == character_id]
        items.sort(key=lambda m: m.created_at, reverse=True)
        return items

    def delete_memory(self, user_id: str, memory_id: str) -> bool:
        for m in self.memories:
            if m.id == memory_id and m.user_id == user_id:
                m.active = False
                return True
        return False

    def forget_topic(self, user_id: str, topic: str, character_id: Optional[str] = None) -> int:
        """定向遗忘：语义命中主题的记忆物理失活，返回删除条数。"""
        topic_tokens = _shingles(topic)
        count = 0
        for m in self.list_memories(user_id, character_id):
            if len(topic_tokens & m.tokens) >= 2:
                m.active = False
                count += 1
        return count

    def export_data(self, user_id: str) -> dict:
        """用户数据导出（记忆 + 关系 + 角色），标准 JSON。"""
        return {
            "exported_at": time.time(),
            "user_id": user_id,
            "characters": [
                {"id": c.id, "name": c.name, "persona": c.persona,
                 "relationship_type": c.relationship_type, "avatar": c.avatar}
                for c in self.list_characters(user_id)
            ],
            "relationships": [
                {"character_id": key[1], "dimensions": rel.dimensions,
                 "last_interaction": rel.last_interaction}
                for key, rel in self.relationships.items() if key[0] == user_id
            ],
            "memories": [
                {"id": m.id, "character_id": m.character_id, "content": m.content,
                 "memory_type": m.memory_type, "importance": m.importance,
                 "created_at": m.created_at}
                for m in self.memories if m.user_id == user_id and m.active
            ],
        }




class SQLiteStore(InMemoryStore):
    """SQLite-backed companion data store; all rows remain owner-scoped."""

    def __init__(self, database_url: str):
        super().__init__()
        import sqlite3
        from urllib.parse import urlparse
        self._sqlite3 = sqlite3
        parsed = urlparse(database_url)
        raw = parsed.path or './story-development.db'
        if raw.startswith('/./'):
            raw = raw[1:]
        if raw.startswith("/") and len(raw) > 2 and raw[2] == ":":
            raw = raw[1:]
        self._db_path = str((Path(__file__).resolve().parents[2] / raw).resolve()) if not Path(raw).is_absolute() else str(Path(raw).resolve())
        Path(self._db_path).parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _connect(self):
        conn = self._sqlite3.connect(self._db_path)
        conn.row_factory = self._sqlite3.Row
        return conn

    @contextmanager
    def _connection(self):
        conn = self._connect()
        try:
            yield conn
        finally:
            conn.close()

    def _init_db(self):
        with self._connection() as conn:
            conn.executescript("""
            CREATE TABLE IF NOT EXISTS companion_characters (
              id TEXT NOT NULL, user_id TEXT NOT NULL, name TEXT NOT NULL,
              persona TEXT NOT NULL, relationship_type TEXT NOT NULL,
              avatar TEXT NOT NULL, glow TEXT NOT NULL, is_preset INTEGER NOT NULL DEFAULT 0,
              PRIMARY KEY (user_id, id)
            );
            CREATE TABLE IF NOT EXISTS companion_memories (
              id TEXT PRIMARY KEY, user_id TEXT NOT NULL, character_id TEXT NOT NULL,
              content TEXT NOT NULL, memory_type TEXT NOT NULL, importance REAL NOT NULL,
              created_at REAL NOT NULL, active INTEGER NOT NULL DEFAULT 1
            );
            CREATE INDEX IF NOT EXISTS ix_companion_memories_owner
              ON companion_memories(user_id, character_id, active);
            CREATE TABLE IF NOT EXISTS companion_relationships (
              user_id TEXT NOT NULL, character_id TEXT NOT NULL, dimensions TEXT NOT NULL,
              last_interaction REAL NOT NULL, PRIMARY KEY (user_id, character_id)
            );
            """)

    def _load_custom(self, user_id):
        with self._connection() as conn:
            return [Character(id=r["id"], user_id=r["user_id"], name=r["name"], persona=r["persona"],
                relationship_type=r["relationship_type"], avatar=r["avatar"], glow=r["glow"], is_preset=bool(r["is_preset"]))
                for r in conn.execute("SELECT * FROM companion_characters WHERE user_id=? ORDER BY rowid", (user_id,))]

    def list_characters(self, user_id):
        return list(self.PRESET_CHARACTERS) + self._load_custom(user_id)

    def get_character(self, user_id, character_id):
        preset = super().get_character(user_id, character_id)
        if preset:
            return preset
        with self._connection() as conn:
            r = conn.execute("SELECT * FROM companion_characters WHERE user_id=? AND id=?", (user_id, character_id)).fetchone()
        return None if not r else Character(id=r["id"], user_id=r["user_id"], name=r["name"], persona=r["persona"], relationship_type=r["relationship_type"], avatar=r["avatar"], glow=r["glow"], is_preset=False)

    def count_custom_characters(self, user_id):
        with self._connection() as conn:
            return int(conn.execute("SELECT COUNT(*) FROM companion_characters WHERE user_id=?", (user_id,)).fetchone()[0])

    def create_character(self, user_id, name, persona, relationship_type, avatar, glow):
        item = Character(id=uuid.uuid4().hex[:10], user_id=user_id, name=name, persona=persona, relationship_type=relationship_type, avatar=avatar, glow=glow, is_preset=False)
        with self._connection() as conn:
            conn.execute("INSERT INTO companion_characters VALUES (?,?,?,?,?,?,?,0)", (item.id, user_id, name, persona, relationship_type, avatar, glow))
            conn.commit()
        return item

    def _rows_memories(self, user_id, character_id=None, query=None, limit=3):
        sql = "SELECT * FROM companion_memories WHERE user_id=? AND active=1"
        args = [user_id]
        if character_id:
            sql += " AND character_id=?"; args.append(character_id)
        sql += " ORDER BY created_at DESC"
        with self._connection() as conn:
            rows = conn.execute(sql, args).fetchall()
        items = [MemoryItem(id=r["id"], user_id=r["user_id"], character_id=r["character_id"], content=r["content"], memory_type=r["memory_type"], importance=r["importance"], created_at=r["created_at"], active=bool(r["active"])) for r in rows]
        if query is not None:
            tokens = _shingles(query)
            scored = [(len(tokens & item.tokens) * (0.5 + item.importance), item) for item in items if tokens & item.tokens]
            return [item for _, item in sorted(scored, key=lambda pair: pair[0], reverse=True)[:limit]]
        return items

    def list_memories(self, user_id, character_id=None):
        return self._rows_memories(user_id, character_id)

    def search(self, user_id, character_id, query, limit=3):
        return self._rows_memories(user_id, character_id, query, limit)

    def add_memory(self, user_id, character_id, content, memory_type, importance=0.5):
        item = MemoryItem(id=uuid.uuid4().hex[:12], user_id=user_id, character_id=character_id, content=content, memory_type=memory_type, importance=importance)
        with self._connection() as conn:
            if memory_type == "preference":
                tokens = _shingles(content)
                for old in self._rows_memories(user_id, character_id):
                    if old.memory_type == "preference" and len(tokens & old.tokens) >= 2:
                        conn.execute("UPDATE companion_memories SET active=0 WHERE id=? AND user_id=?", (old.id, user_id))
            conn.execute("INSERT INTO companion_memories VALUES (?,?,?,?,?,?,?,1)", (item.id, user_id, character_id, content, memory_type, importance, item.created_at))
        return item

    def delete_memory(self, user_id, memory_id):
        with self._connection() as conn:
            cur = conn.execute("UPDATE companion_memories SET active=0 WHERE id=? AND user_id=? AND active=1", (memory_id, user_id))
            return cur.rowcount == 1

    def forget_topic(self, user_id, topic, character_id=None):
        ids = [m.id for m in self._rows_memories(user_id, character_id) if len(_shingles(topic) & m.tokens) >= 2]
        with self._connection() as conn:
            for memory_id in ids:
                conn.execute("UPDATE companion_memories SET active=0 WHERE id=? AND user_id=?", (memory_id, user_id))
        return len(ids)

    def get_relationship(self, user_id, character_id):
        import json
        with self._connection() as conn:
            r = conn.execute("SELECT * FROM companion_relationships WHERE user_id=? AND character_id=?", (user_id, character_id)).fetchone()
            if r:
                return Relationship(user_id=user_id, character_id=character_id, dimensions=json.loads(r["dimensions"]), last_interaction=r["last_interaction"])
            rel = Relationship(user_id=user_id, character_id=character_id)
            conn.execute("INSERT INTO companion_relationships VALUES (?,?,?,?)", (user_id, character_id, json.dumps(rel.dimensions), rel.last_interaction))
            return rel

    def touch_relationship(self, user_id, character_id, deltas):
        import json
        rel = self.get_relationship(user_id, character_id)
        decay_drop = rel.apply_decay()
        for dim, value in deltas.items():
            if dim in rel.dimensions:
                rel.dimensions[dim] = max(0.0, min(1.0, rel.dimensions[dim] + value))
        rel.last_interaction = time.time()
        with self._connection() as conn:
            conn.execute("UPDATE companion_relationships SET dimensions=?, last_interaction=? WHERE user_id=? AND character_id=?", (json.dumps(rel.dimensions), rel.last_interaction, user_id, character_id))
        return rel, decay_drop

    def export_data(self, user_id):
        return {
            "exported_at": time.time(), "user_id": user_id,
            "characters": [{"id": c.id, "name": c.name, "persona": c.persona, "relationship_type": c.relationship_type, "avatar": c.avatar} for c in self.list_characters(user_id)],
            "relationships": [{"character_id": character_id, "dimensions": self.get_relationship(user_id, character_id).dimensions, "last_interaction": self.get_relationship(user_id, character_id).last_interaction} for (owner, character_id) in self._relationship_keys(user_id)],
            "memories": [{"id": m.id, "character_id": m.character_id, "content": m.content, "memory_type": m.memory_type, "importance": m.importance, "created_at": m.created_at} for m in self.list_memories(user_id)],
        }

    def _relationship_keys(self, user_id):
        with self._connection() as conn:
            return [(r["user_id"], r["character_id"]) for r in conn.execute("SELECT user_id, character_id FROM companion_relationships WHERE user_id=?", (user_id,))]

try:
    from ..core.config import settings
    store = SQLiteStore(settings.story_database_url) if settings.story_database_url and settings.story_database_url.startswith("sqlite") else InMemoryStore()
except Exception:
    store = InMemoryStore()





