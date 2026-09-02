"""create predictions baseline table when absent

Revision ID: 20260806_151700
Revises: 20260804_090800
Create Date: 2026-08-06 15:17:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = "20260806_151700"
down_revision: Union[str, None] = "20260804_090800"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if inspect(bind).has_table("predictions"):
        return

    op.create_table(
        "predictions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("patient_name", sa.String(length=100), nullable=True),
        sa.Column("patient_id", sa.String(length=100), nullable=True),
        sa.Column("gender", sa.Integer(), nullable=True),
        sa.Column("age", sa.Float(), nullable=True),
        sa.Column("hypertension", sa.Integer(), nullable=True),
        sa.Column("heart_disease", sa.Integer(), nullable=True),
        sa.Column("ever_married", sa.Integer(), nullable=True),
        sa.Column("work_type", sa.Integer(), nullable=True),
        sa.Column("Residence_type", sa.Integer(), nullable=True),
        sa.Column("avg_glucose_level", sa.Float(), nullable=True),
        sa.Column("bmi", sa.Float(), nullable=True),
        sa.Column("smoking_status", sa.Integer(), nullable=True),
        sa.Column("key", sa.Integer(), nullable=True),
        sa.Column("H", sa.Float(), nullable=True),
        sa.Column("UD", sa.Float(), nullable=True),
        sa.Column("DD", sa.Float(), nullable=True),
        sa.Column("clinical_probability", sa.Float(), nullable=True),
        sa.Column("keystroke_probability", sa.Float(), nullable=True),
        sa.Column("final_probability", sa.Float(), nullable=True),
        sa.Column("risk", sa.String(length=20), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_predictions_id", "predictions", ["id"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    if inspect(bind).has_table("predictions"):
        op.drop_index("ix_predictions_id", table_name="predictions")
        op.drop_table("predictions")
