import tempfile
import unittest
from pathlib import Path
from alembic.config import Config
from alembic import command
from sqlalchemy import inspect, select
from src.modules.story.database import SQLRepository, events
from src.modules.story.engine import StoryError

class StoryDatabaseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.url = "sqlite:///" + (Path(self.temp.name) / "story.db").as_posix()
        self.cfg = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
        self.cfg.attributes["url"] = self.url
        command.upgrade(self.cfg, "head")
        self.repo = SQLRepository(self.url)
    def tearDown(self):
        self.repo.engine.dispose(); self.temp.cleanup()
    def test_reopen_preserves_state_audit_and_rewind(self):
        s=self.repo.create("alice",{"name":"重启测试"})
        s=self.repo.choose("alice",s["id"],"common-0","2",0)
        self.repo.engine.dispose(); self.repo=SQLRepository(self.url)
        restored=self.repo.get("alice",s["id"])
        self.assertEqual(restored,s)
        self.repo.rewind("alice",s["id"],0,1)
        with self.repo.engine.connect() as conn:
            rows=conn.execute(select(events)).mappings().all()
        self.assertEqual([r["kind"] for r in rows],["choose","rewind"])
        self.assertIn("before",rows[0]["payload"])
        self.assertEqual(self.repo.get("alice",s["id"])["completed_choices"],0)
    def test_two_repositories_reject_stale_write_and_delete(self):
        s=self.repo.create("alice",{"name":"并发测试"})
        other=SQLRepository(self.url)
        try:
            self.repo.choose("alice",s["id"],"common-0","0",0)
            with self.assertRaises(StoryError): other.choose("alice",s["id"],"common-0","1",0)
            with self.assertRaises(StoryError): other.delete("bob",s["id"])
            self.repo.delete("alice",s["id"])
            self.assertEqual(other.list("alice"),[])
            with other.engine.connect() as conn: self.assertEqual(conn.execute(select(events)).all(),[])
        finally: other.engine.dispose()
    def test_migration_downgrade_upgrade(self):
        self.repo.engine.dispose()
        command.downgrade(self.cfg,"base")
        self.assertNotIn("story_sessions",inspect(self.repo.engine).get_table_names())
        command.upgrade(self.cfg,"head")
        self.assertIn("story_sessions",inspect(self.repo.engine).get_table_names())

if __name__=="__main__": unittest.main()
