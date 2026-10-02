import asyncio
import time
import unittest

import jwt
from fastapi import HTTPException

from src.core.config import settings
from src.core.security import get_current_user


class JwtAuthTests(unittest.TestCase):
    def setUp(self):
        self.original_secret = settings.auth_jwt_secret
        self.original_dev = settings.dev_auth_enabled
        self.original_environment = settings.environment
        settings.auth_jwt_secret = "test-secret"
        settings.dev_auth_enabled = False
        settings.environment = "production"

    def tearDown(self):
        settings.auth_jwt_secret = self.original_secret
        settings.dev_auth_enabled = self.original_dev
        settings.environment = self.original_environment

    def test_valid_jwt_scopes_user_and_role(self):
        token = jwt.encode(
            {"sub": "user-a", "role": "user", "exp": int(time.time()) + 300},
            "test-secret",
            algorithm="HS256",
        )
        user = asyncio.run(get_current_user(f"Bearer {token}"))
        self.assertEqual(user.user_id, "user-a")
        self.assertEqual(user.role, "user")
        self.assertFalse(user.is_dev)

    def test_expired_or_missing_token_is_rejected(self):
        expired = jwt.encode({"sub": "user-a", "exp": int(time.time()) - 1}, "test-secret", algorithm="HS256")
        with self.assertRaises(HTTPException) as expired_error:
            asyncio.run(get_current_user(f"Bearer {expired}"))
        self.assertEqual(expired_error.exception.status_code, 401)

        with self.assertRaises(HTTPException) as missing_error:
            asyncio.run(get_current_user(None))
        self.assertEqual(missing_error.exception.status_code, 401)


if __name__ == "__main__":
    unittest.main()
