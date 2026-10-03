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


def test_character_plaza_requires_owner_publish_and_hides_unpublished():
    original_user = settings.dev_user_id
    try:
        owner = "plaza-owner-" + uuid4().hex
        visitor = "plaza-visitor-" + uuid4().hex
        with TestClient(app) as client:
            settings.dev_user_id = owner
            created = client.post('/api/characters', json={
                'name': '广场测试角色', 'persona': '用于公开测试的角色'
            })
            assert created.status_code == 201
            character_id = created.json()['id']
            assert client.get('/api/characters/plaza').json()['items'] == []
            published = client.post('/api/characters/' + character_id + '/publish', json={'summary': '公开测试'})
            assert published.status_code == 200

            settings.dev_user_id = visitor
            plaza = client.get('/api/characters/plaza').json()['items']
            assert [item['id'] for item in plaza] == [character_id]
            assert client.delete('/api/characters/' + character_id + '/publish').status_code == 404

            settings.dev_user_id = owner
            assert client.delete('/api/characters/' + character_id + '/publish').status_code == 200
            assert client.get('/api/characters/plaza').json()['items'] == []
    finally:
        settings.dev_user_id = original_user
