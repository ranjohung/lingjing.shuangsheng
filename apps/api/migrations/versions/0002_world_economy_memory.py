"""Core world runtime, wallet and companion persistence tables.

This migration deliberately creates tables before any later ALTER migration.
It does not enable real payment or identity verification; those remain service
integration gates in the V7 plan.
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_world_economy_memory"
down_revision = "0001_story_sessions"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "game_saves",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(128), nullable=False),
        sa.Column("novel_id", sa.String(100), nullable=False),
        sa.Column("save_slot", sa.Integer(), nullable=False),
        sa.Column("chapter_number", sa.Integer(), nullable=False),
        sa.Column("scene_id", sa.String(100), nullable=False),
        sa.Column("script_node_id", sa.String(100), nullable=False),
        sa.Column("player_state", sa.JSON(), nullable=False),
        sa.Column("world_currency", sa.JSON(), nullable=False),
        sa.Column("relationships", sa.JSON(), nullable=False),
        sa.Column("inventory", sa.JSON(), nullable=False),
        sa.Column("quests", sa.JSON(), nullable=False),
        sa.Column("flags", sa.JSON(), nullable=False),
        sa.Column("saved_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "novel_id", "save_slot", name="uq_game_save_slot"),
    )
    op.create_index("ix_game_saves_user_novel", "game_saves", ["user_id", "novel_id"])

    op.create_table(
        "user_currency",
        sa.Column("user_id", sa.String(128), primary_key=True),
        sa.Column("lingjing", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("lingyu", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_recharged", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "player_world_currency",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(128), nullable=False),
        sa.Column("novel_id", sa.String(100), nullable=False),
        sa.Column("currency_balances", sa.JSON(), nullable=False),
        sa.Column("total_earned", sa.JSON(), nullable=False),
        sa.Column("total_spent", sa.JSON(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "novel_id", name="uq_world_currency_owner"),
    )
    op.create_table(
        "lingjing_transactions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(128), nullable=False),
        sa.Column("transaction_type", sa.String(30), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("balance_after", sa.Integer(), nullable=False),
        sa.Column("related_novel_id", sa.String(100)),
        sa.Column("description", sa.String(500), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "world_currency_transactions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(128), nullable=False),
        sa.Column("novel_id", sa.String(100), nullable=False),
        sa.Column("currency_type", sa.String(50), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("balance_after", sa.Integer(), nullable=False),
        sa.Column("transaction_type", sa.String(30), nullable=False),
        sa.Column("description", sa.String(500), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "memories",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(128), nullable=False),
        sa.Column("character_id", sa.String(100), nullable=False),
        sa.Column("memory_layer", sa.String(20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("importance", sa.Float(), nullable=False),
        sa.Column("source_relation", sa.String(30), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_recalled_at", sa.DateTime(timezone=True)),
    )
    op.create_table(
        "relationship_states",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(128), nullable=False),
        sa.Column("character_id", sa.String(100), nullable=False),
        sa.Column("dimensions", sa.JSON(), nullable=False),
        sa.Column("dependency_risk", sa.Float(), nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "character_id", name="uq_relationship_owner"),
    )


def downgrade():
    op.drop_table("relationship_states")
    op.drop_table("memories")
    op.drop_table("world_currency_transactions")
    op.drop_table("lingjing_transactions")
    op.drop_table("player_world_currency")
    op.drop_table("user_currency")
    op.drop_index("ix_game_saves_user_novel", table_name="game_saves")
    op.drop_table("game_saves")
