"""应用配置：全部来自环境变量（.env.local），代码中不落真实密钥。

未配置第三方 Key 时不报错，由对应模块降级为本地/模拟模式。
"""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env.local", env_file_encoding="utf-8", extra="ignore")

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    # PostgreSQL（Phase 5 起使用）
    database_url: str = "postgresql://mirai:local_dev_pass@localhost:5432/mirai"

    # Explicit opt-in persistence. None keeps the existing development memory mode.
    story_database_url: str | None = None

    # Redis；未配置或连不上时自动降级为进程内缓存
    redis_url: str | None = "redis://localhost:6379/0"

    # Supabase Auth（Phase 4 起使用；未配置时使用本地 dev 用户）
    supabase_url: str | None = None
    supabase_anon_key: str | None = None

    # LLM Gateway（Phase 9 起使用；未配置时使用规则模拟回复）
    openai_api_key: str | None = None
    openai_base_url: str | None = None
    llm_model: str = "gpt-4o-mini"

    # Resend / Stripe / Sentry（后续阶段）
    resend_api_key: str | None = None
    stripe_secret_key: str | None = None
    sentry_dsn: str | None = None

    # 成本熔断器（Phase 0 必须）
    daily_budget_limit_usd: float = 50.0
    demo_cost_per_request_usd: float = 0.01

    @property
    def supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_anon_key)

    @property
    def llm_configured(self) -> bool:
        return bool(self.openai_api_key)


settings = Settings()
