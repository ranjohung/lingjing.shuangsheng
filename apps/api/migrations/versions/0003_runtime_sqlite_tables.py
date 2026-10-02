"""Align the Alembic schema with the SQLite runtime persistence adapters."""

from alembic import op
import sqlalchemy as sa


revision = "0003_runtime_sqlite_tables"
down_revision = "0002_world_economy_memory"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "companion_characters",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("user_id", sa.String(128), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("persona", sa.Text(), nullable=False),
        sa.Column("relationship_type", sa.String(80), nullable=False),
        sa.Column("avatar", sa.String(500), nullable=False),
        sa.Column("glow", sa.String(200), nullable=False),
        sa.Column("is_preset", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.PrimaryKeyConstraint("user_id", "id"),
    )
    op.create_table(
        "companion_memories",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("user_id", sa.String(128), nullable=False),
        sa.Column("character_id", sa.String(64), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("memory_type", sa.String(80), nullable=False),
        sa.Column("importance", sa.Float(), nullable=False),
        sa.Column("created_at", sa.Float(), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.create_index("ix_companion_memories_owner", "companion_memories", ["user_id", "character_id", "active"])
    op.create_table(
        "companion_relationships",
        sa.Column("user_id", sa.String(128), nullable=False),
        sa.Column("character_id", sa.String(64), nullable=False),
        sa.Column("dimensions", sa.JSON(), nullable=False),
        sa.Column("last_interaction", sa.Float(), nullable=False),
        sa.PrimaryKeyConstraint("user_id", "character_id"),
    )
    op.create_table(
        "economy_ledgers",
        sa.Column("user_id", sa.String(128), primary_key=True),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("updated_at", sa.Float(), nullable=False),
    )
    op.create_table(
        "api_world_saves",
        sa.Column("user_id", sa.String(128), nullable=False),
        sa.Column("novel_id", sa.String(100), nullable=False),
        sa.Column("save_slot", sa.Integer(), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("saved_at", sa.Float(), nullable=False),
        sa.PrimaryKeyConstraint("user_id", "novel_id", "save_slot"),
    )
    op.create_table(
        "notifications",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("user_id", sa.String(128), nullable=False),
        sa.Column("type", sa.String(40), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("read", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.Float(), nullable=False),
    )


def downgrade():
    op.drop_table("notifications")
    op.drop_table("api_world_saves")
    op.drop_table("economy_ledgers")
    op.drop_table("companion_relationships")
    op.drop_index("ix_companion_memories_owner", table_name="companion_memories")
    op.drop_table("companion_memories")
    op.drop_table("companion_characters")
