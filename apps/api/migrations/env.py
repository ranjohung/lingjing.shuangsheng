from alembic import context
from sqlalchemy import create_engine
from src.core.config import settings
from src.modules.story.database import metadata

url = context.config.attributes.get("url") or settings.story_database_url
if not url:
    raise RuntimeError("Set STORY_DATABASE_URL before running migrations")
if context.is_offline_mode():
    context.configure(url=url, target_metadata=metadata, literal_binds=True)
    with context.begin_transaction(): context.run_migrations()
else:
    engine = create_engine(url)
    with engine.connect() as conn:
        context.configure(connection=conn, target_metadata=metadata)
        with context.begin_transaction(): context.run_migrations()
    engine.dispose()
