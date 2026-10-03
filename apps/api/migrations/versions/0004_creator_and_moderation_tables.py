"""Persist creator generation jobs, public characters and moderation reports."""

from alembic import op
import sqlalchemy as sa


revision = "0004_creator_and_moderation_tables"
down_revision = "0003_runtime_sqlite_tables"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "generation_tasks",
        sa.Column("id", sa.String(80), primary_key=True),
        sa.Column("user_id", sa.String(128), nullable=False),
        sa.Column("kind", sa.String(30), nullable=False),
        sa.Column("mode", sa.String(80), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("ratio", sa.String(20)),
        sa.Column("status", sa.String(40), nullable=False),
        sa.Column("provider", sa.String(80), nullable=False),
        sa.Column("created_at", sa.Float(), nullable=False),
        sa.Column("updated_at", sa.Float(), nullable=False),
        sa.Column("error", sa.Text()),
    )
    op.create_index("ix_generation_user", "generation_tasks", ["user_id", "created_at"])
    op.create_table(
        "character_plaza",
        sa.Column("character_id", sa.String(64), primary_key=True),
        sa.Column("owner_id", sa.String(128), nullable=False),
        sa.Column("summary", sa.String(300), nullable=False),
        sa.Column("published_at", sa.Float(), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="published"),
    )
    op.create_table(
        "content_reports",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("reporter_id", sa.String(128), nullable=False),
        sa.Column("target_type", sa.String(30), nullable=False),
        sa.Column("target_id", sa.String(120), nullable=False),
        sa.Column("reason", sa.String(500), nullable=False),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("created_at", sa.Float(), nullable=False),
        sa.Column("resolved_at", sa.Float()),
    )
    op.create_index("ix_reports_reporter", "content_reports", ["reporter_id", "created_at"])


def downgrade():
    op.drop_index("ix_reports_reporter", table_name="content_reports")
    op.drop_table("content_reports")
    op.drop_table("character_plaza")
    op.drop_index("ix_generation_user", table_name="generation_tasks")
    op.drop_table("generation_tasks")
