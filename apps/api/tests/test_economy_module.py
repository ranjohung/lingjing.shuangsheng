import asyncio

from src.core.security import CurrentUser
from src.modules import economy


def test_lingjing_one_way_exchange_and_world_spend():
    user = CurrentUser(user_id="economy-test", is_dev=True)
    economy.LEDGERS.pop(user.user_id, None)

    balance = asyncio.run(economy.get_lingjing(user))
    assert balance["lingjing"] == 1280

    exchanged = asyncio.run(economy.exchange(
        economy.ExchangeRequest(
            novel_id="xiyouji", target_currency="银两", amount=1, lingjing_cost=10
        ), user
    ))
    assert exchanged["lingjing_balance"] == 1270
    assert exchanged["world_currency_balance"]["银两"] == 1

    spent = asyncio.run(economy.spend_world(
        economy.SpendWorldRequest(
            novel_id="xiyouji", currency_type="银两", amount=1, description="测试消费"
        ), user
    ))
    assert spent["balances"]["银两"] == 0
    assert not hasattr(economy, "reverse_exchange")
