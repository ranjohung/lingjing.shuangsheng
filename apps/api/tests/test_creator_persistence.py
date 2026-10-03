from uuid import uuid4

from fastapi.testclient import TestClient

from src.core.config import settings
from src.main import app


def test_generation_and_reports_are_user_scoped():
    original_user = settings.dev_user_id
    try:
        user_a = "creator-a-" + uuid4().hex
        user_b = "creator-b-" + uuid4().hex
        with TestClient(app) as client:
            settings.dev_user_id = user_a
            task = client.post('/api/v1/generation/tasks', json={
                'kind': 'image', 'mode': 'cover', 'prompt': '隔离测试'
            }).json()['task']
            report = client.post('/api/reports', json={
                'target_type': 'post', 'target_id': 'post-a', 'reason': '测试举报'
            }).json()['item']

            settings.dev_user_id = user_b
            assert all(item['id'] != task['id'] for item in client.get('/api/v1/generation/tasks').json()['items'])
            assert client.get('/api/reports').json()['items'] == []

            settings.dev_user_id = user_a
            assert client.get('/api/v1/generation/tasks/' + task['id']).json()['task']['user_id'] == user_a
            assert client.get('/api/reports').json()['items'][0]['id'] == report['id']
    finally:
        settings.dev_user_id = original_user
