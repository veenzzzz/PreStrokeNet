"""extend clinical reports and authentication

Revision ID: 20260807_020000
Revises: 20260806_151900
Create Date: 2026-08-07 02:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260807_020000"
down_revision: Union[str, None] = "20260806_151900"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _drop_default_constraint(table_name: str, column_name: str) -> None:
    """Drop SQL Server's auto-named default before dropping its column."""
    bind = op.get_bind()
    if bind.dialect.name != "mssql":
        return
    op.execute(sa.text(f"""
        DECLARE @constraint_name nvarchar(128);
        SELECT @constraint_name = dc.name
        FROM sys.default_constraints AS dc
        INNER JOIN sys.columns AS c
            ON dc.parent_object_id = c.object_id
            AND dc.parent_column_id = c.column_id
        WHERE dc.parent_object_id = OBJECT_ID(N'[{table_name}]')
          AND c.name = N'{column_name}';
        IF @constraint_name IS NOT NULL
        BEGIN
            DECLARE @drop_sql nvarchar(max) = N'ALTER TABLE [{table_name}] DROP CONSTRAINT [' + @constraint_name + N']';
            EXEC sp_executesql @drop_sql;
        END;
    """))


def upgrade() -> None:
    op.add_column("predictions", sa.Column("diagnosis", sa.Text(), nullable=True))
    op.add_column("predictions", sa.Column("recommendation", sa.Text(), nullable=True))
    op.add_column("predictions", sa.Column("follow_up_date", sa.Date(), nullable=True))
    op.add_column("predictions", sa.Column("status", sa.String(length=20), server_default="draft", nullable=False))
    op.create_index("ix_predictions_status", "predictions", ["status"], unique=False)
    op.create_index("ix_predictions_follow_up_date", "predictions", ["follow_up_date"], unique=False)

    op.add_column("users", sa.Column("role", sa.String(length=20), server_default="Doctor", nullable=False))
    op.add_column("users", sa.Column("is_active", sa.Boolean(), server_default=sa.text("1"), nullable=False))

    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sa.String(length=128), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("replaced_by_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        # SQL Server rejects a self-referencing FK with a cascading delete action
        # as a cycle/multiple cascade path. Replacement links are application-
        # managed, so deletion remains restrictive at the database layer.
        sa.ForeignKeyConstraint(["replaced_by_id"], ["refresh_tokens.id"], ondelete="NO ACTION"),
        # User-owned refresh rows are deleted explicitly by auth_service.delete_user.
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="NO ACTION"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index("ix_refresh_tokens_id", "refresh_tokens", ["id"], unique=False)
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"], unique=False)
    op.create_index("ix_refresh_tokens_token_hash", "refresh_tokens", ["token_hash"], unique=False)
    op.create_index("ix_refresh_tokens_expires_at", "refresh_tokens", ["expires_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_refresh_tokens_expires_at", table_name="refresh_tokens")
    op.drop_index("ix_refresh_tokens_token_hash", table_name="refresh_tokens")
    op.drop_index("ix_refresh_tokens_user_id", table_name="refresh_tokens")
    op.drop_index("ix_refresh_tokens_id", table_name="refresh_tokens")
    op.drop_table("refresh_tokens")

    _drop_default_constraint("users", "is_active")
    _drop_default_constraint("users", "role")
    op.drop_column("users", "is_active")
    op.drop_column("users", "role")

    _drop_default_constraint("predictions", "status")
    op.drop_index("ix_predictions_follow_up_date", table_name="predictions")
    op.drop_index("ix_predictions_status", table_name="predictions")
    op.drop_column("predictions", "status")
    op.drop_column("predictions", "follow_up_date")
    op.drop_column("predictions", "recommendation")
    op.drop_column("predictions", "diagnosis")
