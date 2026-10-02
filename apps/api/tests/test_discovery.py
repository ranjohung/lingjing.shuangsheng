from fastapi.testclient import TestClient
from uuid import uuid4

from src.main import app
from src.core.config import settings


def _client_for_isolated_user():
    settings.dev_user_id = "discovery-test-" + uuid4().hex
    return TestClient(app)


def test_notifications_are_user_scoped_and_readable():
    with _client_for_isolated_user() as client:
        first = client.get('/api/v1/notifications')
        assert first.status_code == 200
        data = first.json()
        assert data['mode'] == 'sqlite-dev'
        assert data['unread'] == 2
        item_id = data['items'][0]['id']
        marked = client.post(f'/api/v1/notifications/{item_id}/read', json={'read': True})
        assert marked.status_code == 200
        assert marked.json()['item']['read'] is True


def test_recommendations_are_explicitly_non_personalized():
    with _client_for_isolated_user() as client:
        response = client.get('/api/v1/recommendations?limit=3')
        assert response.status_code == 200
        data = response.json()
        assert data['personalized'] is False
        assert data['mode'] == 'bundled-catalog'
        assert len(data['items']) == 3
