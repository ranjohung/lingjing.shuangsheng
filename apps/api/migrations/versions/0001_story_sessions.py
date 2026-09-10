"""Story snapshots and immutable decision audit; no other product tables yet."""
from alembic import op
import sqlalchemy as sa
revision = "0001_story_sessions"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table("story_sessions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(128), nullable=False),
        sa.Column("story_id", sa.String(100), nullable=False),
        sa.Column("story_version", sa.String(100), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("snapshot", sa.JSON(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_story_sessions_user_id", "story_sessions", ["user_id"])
    op.create_table("story_choice_events",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("session_id", sa.String(36), sa.ForeignKey("story_sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("kind", sa.String(20), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.UniqueConstraint("session_id", "revision", name="uq_story_event_revision"))

def downgrade():
    op.drop_table("story_choice_events")
    op.drop_index("ix_story_sessions_user_id", table_name="story_sessions")
    op.drop_table("story_sessions")
