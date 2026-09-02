"""extend predictions with audit and reporting fields

Revision ID: 20260806_151800
Revises: 20260804_090800
Create Date: 2026-08-06 15:18:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260806_151800"
down_revision: Union[str, None] = "20260806_151700"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("predictions", sa.Column("doctor_notes", sa.Text(), nullable=True))
    op.add_column("predictions", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("predictions", sa.Column("pdf_generated", sa.Boolean(), server_default=sa.text("0"), nullable=False))
    op.add_column("predictions", sa.Column("excel_generated", sa.Boolean(), server_default=sa.text("0"), nullable=False))
    op.add_column("predictions", sa.Column("email_sent", sa.Boolean(), server_default=sa.text("0"), nullable=False))
    op.add_column("predictions", sa.Column("created_by", sa.Integer(), nullable=True))
    op.add_column("predictions", sa.Column("last_modified_by", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_predictions_created_by_users", "predictions", "users", ["created_by"], ["id"], ondelete="SET NULL")
    op.create_foreign_key("fk_predictions_last_modified_by_users", "predictions", "users", ["last_modified_by"], ["id"], ondelete="NO ACTION")
    op.create_index("ix_predictions_created_at", "predictions", ["created_at"], unique=False)
    op.create_index("ix_predictions_risk", "predictions", ["risk"], unique=False)
    op.create_index("ix_predictions_final_probability", "predictions", ["final_probability"], unique=False)
    op.create_index("ix_predictions_patient_name", "predictions", ["patient_name"], unique=False)
    op.create_index("ix_predictions_patient_id", "predictions", ["patient_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_predictions_patient_id", table_name="predictions")
    op.drop_index("ix_predictions_patient_name", table_name="predictions")
    op.drop_index("ix_predictions_final_probability", table_name="predictions")
    op.drop_index("ix_predictions_risk", table_name="predictions")
    op.drop_index("ix_predictions_created_at", table_name="predictions")
    op.drop_constraint("fk_predictions_last_modified_by_users", "predictions", type_="foreignkey")
    op.drop_constraint("fk_predictions_created_by_users", "predictions", type_="foreignkey")
    op.drop_column("predictions", "last_modified_by")
    op.drop_column("predictions", "created_by")
    op.drop_column("predictions", "email_sent")
    op.drop_column("predictions", "excel_generated")
    op.drop_column("predictions", "pdf_generated")
    op.drop_column("predictions", "updated_at")
    op.drop_column("predictions", "doctor_notes")
