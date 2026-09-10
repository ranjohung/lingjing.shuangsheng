"""SQLAlchemy persistence. Schema is managed exclusively through Alembic."""
from dataclasses import asdict
from datetime import datetime, timezone
from sqlalchemy import MetaData, Table, Column, String, Integer, JSON, DateTime, ForeignKey, UniqueConstraint, create_engine, select, insert, update, delete
from .engine import Repository, Session, StoryError
from .content import STORY

metadata = MetaData()
sessions = Table("story_sessions", metadata,
    Column("id", String(36), primary_key=True), Column("user_id", String(128), nullable=False, index=True),
    Column("story_id", String(100), nullable=False), Column("story_version", String(100), nullable=False),
    Column("revision", Integer, nullable=False), Column("snapshot", JSON, nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False))
events = Table("story_choice_events", metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("session_id", String(36), ForeignKey("story_sessions.id", ondelete="CASCADE"), nullable=False),
    Column("revision", Integer, nullable=False), Column("kind", String(20), nullable=False),
    Column("payload", JSON, nullable=False),
    UniqueConstraint("session_id", "revision", name="uq_story_event_revision"))

class SQLRepository:
    def __init__(self, url):
        self.engine = create_engine(url, pool_pre_ping=True)
        self.storage_mode = "development_sqlite" if self.engine.dialect.name == "sqlite" else "postgresql"

    def _load(self, connection, owner, sid):
        row = connection.execute(select(sessions).where(sessions.c.id == sid, sessions.c.user_id == owner)).mappings().first()
        if not row:
            raise StoryError(404, "找不到这个游玩记录")
        if row["story_id"] != STORY["id"] or row["story_version"] != STORY["version"]:
            raise StoryError(409, "此存档的故事版本暂不可用，请保留存档并联系维护者")
        repo = Repository()
        repo.sessions[sid] = Session(**row["snapshot"])
        return repo

    def _mode(self, result):
        result["storage_mode"] = self.storage_mode
        return result

    def create(self, owner, identity):
        repo = Repository(); result = repo.create(owner, identity)
        with self.engine.begin() as conn:
            conn.execute(insert(sessions).values(id=result["id"], user_id=owner, story_id=STORY["id"],
                story_version=STORY["version"], revision=0, snapshot=asdict(repo.sessions[result["id"]]), updated_at=datetime.now(timezone.utc)))
        return self._mode(result)

    def get(self, owner, sid):
        with self.engine.connect() as conn:
            return self._mode(self._load(conn, owner, sid).get(owner, sid))

    def list(self, owner):
        with self.engine.connect() as conn:
            ids = conn.execute(select(sessions.c.id).where(sessions.c.user_id == owner).order_by(sessions.c.updated_at.desc())).scalars().all()
            return [self._mode(self._load(conn, owner, sid).get(owner, sid)) for sid in ids]

    def _change(self, owner, sid, revision, method, args):
        with self.engine.begin() as conn:
            repo = self._load(conn, owner, sid)
            result = getattr(repo, method)(owner, sid, *args, revision)
            changed = conn.execute(update(sessions).where(sessions.c.id == sid, sessions.c.user_id == owner, sessions.c.revision == revision)
                .values(revision=result["revision"], snapshot=asdict(repo.sessions[sid]), updated_at=datetime.now(timezone.utc)))
            if changed.rowcount != 1:
                raise StoryError(409, "进度已变化，请刷新后重试")
            payload = repo.sessions[sid].history[-1] if method == "choose" else {"target_count": args[0]}
            conn.execute(insert(events).values(session_id=sid, revision=result["revision"], kind=method, payload=payload))
            return self._mode(result)

    def choose(self, owner, sid, choice_id, option_id, revision):
        return self._change(owner, sid, revision, "choose", (choice_id, option_id))

    def rewind(self, owner, sid, target_count, revision):
        return self._change(owner, sid, revision, "rewind", (target_count,))

    def destiny(self, owner, sid):
        with self.engine.connect() as conn:
            return self._load(conn, owner, sid).destiny(owner, sid)

    def delete(self, owner, sid):
        with self.engine.begin() as conn:
            self._load(conn, owner, sid)
            conn.execute(delete(events).where(events.c.session_id == sid))
            conn.execute(delete(sessions).where(sessions.c.id == sid, sessions.c.user_id == owner))
        return {"deleted": True}
