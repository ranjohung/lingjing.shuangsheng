from fastapi.testclient import TestClient

from src.main import app
from src.modules.memory_store import store
from src.core.security import CurrentUser, get_current_user
import sqlite3


def test_character_plaza_requires_owner_opt_in_and_supports_report(monkeypatch):
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(user_id='plaza-test-user', is_dev=True)
    client = TestClient(app)
    with sqlite3.connect(store._db_path) as conn:
        conn.execute('DELETE FROM companion_characters WHERE user_id=?', ('plaza-test-user',))
        conn.execute('DELETE FROM character_plaza WHERE owner_id=?', ('plaza-test-user',))
        conn.commit()
    created = client.post('/api/characters', json={'name': '广场测试角色', 'persona': '只在作者主动公开后出现'})
    assert created.status_code == 201
    cid = created.json()['id']
    assert client.get('/api/characters/plaza').status_code == 200
    assert not any(item['id'] == cid for item in client.get('/api/characters/plaza').json()['items'])
    published = client.post(f'/api/characters/{cid}/publish', json={'summary': '公开测试简介'})
    assert published.status_code == 200
    items = client.get('/api/characters/plaza?query=公开测试').json()['items']
    assert any(item['id'] == cid for item in items)
    reaction = client.post(f'/api/characters/plaza/{cid}/reaction', json={'kind': 'resonate'})
    assert reaction.status_code == 200
    assert reaction.json()['active'] is True
    assert reaction.json()['count'] == 1
    toggled = client.post(f'/api/characters/plaza/{cid}/reaction', json={'kind': 'resonate'})
    assert toggled.json()['active'] is False
    assert toggled.json()['count'] == 0
    report = client.post(f'/api/characters/plaza/{cid}/report', json={'reason': '测试举报理由'})
    assert report.status_code == 201
    assert client.delete(f'/api/characters/{cid}/publish').status_code == 200
    app.dependency_overrides.clear()
