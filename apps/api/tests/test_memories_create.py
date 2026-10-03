from fastapi.testclient import TestClient

from src.main import app
from src.modules.memory_store import store


def test_create_memory_is_persisted_and_scoped_to_current_user():
    with TestClient(app) as client:
        created = client.post("/api/memories", json={
            "character_id": "preset_ling",
            "content": "我偏好清淡的茶",
            "memory_type": "preference",
            "importance": 0.8,
        })
        assert created.status_code == 201
        body = created.json()
        assert body["character_id"] == "preset_ling"
        assert body["importance"] == 0.8
        listed = client.get("/api/memories?character_id=preset_ling")
        assert listed.status_code == 200
        assert any(item["id"] == body["id"] for item in listed.json())
