import asyncio
import importlib
import unittest

from src.core.security import CurrentUser
from src.modules import world_saves


class WorldSavePersistenceTest(unittest.TestCase):
    def test_save_survives_module_reload_and_isolated(self):
        user = CurrentUser(user_id="save-unittest-persist", is_dev=True)
        other = CurrentUser(user_id="save-unittest-other", is_dev=True)
        slot = 17
        asyncio.run(world_saves.write_save("xiyouji", slot, world_saves.SavePayload(slot=slot, chapter="persist", progress=42, state={"gold": 9}), user))
        self.assertEqual(asyncio.run(world_saves.list_saves("xiyouji", other))["items"], [])
        reloaded = importlib.reload(world_saves)
        restored = asyncio.run(reloaded.read_save("xiyouji", slot, user))
        self.assertEqual(restored["save"]["progress"], 42)
        self.assertEqual(asyncio.run(reloaded.delete_save("xiyouji", slot, user))["deleted"], True)


if __name__ == "__main__":
    unittest.main()
