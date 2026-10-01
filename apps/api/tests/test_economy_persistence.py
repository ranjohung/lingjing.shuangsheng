import asyncio
import importlib
import unittest

from src.core.security import CurrentUser
from src.modules import economy


class EconomyPersistenceTest(unittest.TestCase):
    def test_balance_survives_module_reload(self):
        user = CurrentUser(user_id="persist-economy-test", is_dev=True)
        economy.LEDGERS.pop(user.user_id, None)
        asyncio.run(economy.exchange(economy.ExchangeRequest(novel_id="xiyouji", target_currency="银两", amount=2, lingjing_cost=20), user))
        self.assertEqual(asyncio.run(economy.get_lingjing(user))["lingjing"], 1260)
        reloaded = importlib.reload(economy)
        self.assertEqual(asyncio.run(reloaded.get_lingjing(user))["lingjing"], 1260)
        self.assertEqual(asyncio.run(reloaded.get_world_currency("xiyouji", user))["balances"]["银两"], 2)
        reloaded.LEDGERS.pop(user.user_id, None)

    def test_users_are_isolated(self):
        a = CurrentUser(user_id="economy-owner-a", is_dev=True)
        b = CurrentUser(user_id="economy-owner-b", is_dev=True)
        economy.LEDGERS.pop(a.user_id, None)
        economy.LEDGERS.pop(b.user_id, None)
        asyncio.run(economy.exchange(economy.ExchangeRequest(novel_id="xiyouji", target_currency="银两", amount=1, lingjing_cost=10), a))
        self.assertEqual(asyncio.run(economy.get_lingjing(b))["lingjing"], 1280)
        self.assertEqual(asyncio.run(economy.get_world_currency("xiyouji", b))["balances"]["银两"], 0)
        economy.LEDGERS.pop(a.user_id, None)
        economy.LEDGERS.pop(b.user_id, None)


if __name__ == "__main__":
    unittest.main()
