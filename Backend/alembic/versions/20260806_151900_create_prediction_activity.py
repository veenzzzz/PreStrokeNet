"""create prediction activity table

Revision ID: 20260806_151900
Revises: 20260806_151800
Create Date: 2026-08-06 15:19:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260806_151900"
down_revision: Union[str, None] = "20260806_151800"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "prediction_activity",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("prediction_id", sa.Integer(), nullable=True),
        sa.Column("activity_type", sa.String(length=40), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("actor_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["prediction_id"], ["predictions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_prediction_activity_prediction_id", "prediction_activity", ["prediction_id"], unique=False)
    op.create_index("ix_prediction_activity_activity_type", "prediction_activity", ["activity_type"], unique=False)
    op.create_index("ix_prediction_activity_actor_id", "prediction_activity", ["actor_id"], unique=False)
    op.create_index("ix_prediction_activity_created_at", "prediction_activity", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_prediction_activity_created_at", table_name="prediction_activity")
    op.drop_index("ix_prediction_activity_actor_id", table_name="prediction_activity")
    op.drop_index("ix_prediction_activity_activity_type", table_name="prediction_activity")
    op.drop_index("ix_prediction_activity_prediction_id", table_name="prediction_activity")
    op.drop_table("prediction_activity")
