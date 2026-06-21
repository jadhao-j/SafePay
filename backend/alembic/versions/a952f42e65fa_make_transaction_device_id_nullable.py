"""make transaction device_id nullable

Revision ID: a952f42e65fa
Revises: d4232f70a5d7
Create Date: 2026-06-20

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PG_UUID


# revision identifiers, used by Alembic.
revision: str = "a952f42e65fa"
down_revision: Union[str, None] = "d4232f70a5d7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Allow transactions.device_id to be NULL — device tracking arrives in Phase 3."""

    op.alter_column(
        "transactions",
        "device_id",
        existing_type=PG_UUID(as_uuid=True),
        nullable=True,
    )


def downgrade() -> None:
    """Revert device_id to NOT NULL.

    Note: this will fail if any rows have NULL device_id at the time of downgrade.
    """
    op.alter_column(
        "transactions",
        "device_id",
        existing_type=PG_UUID(as_uuid=True),
        nullable=False,
    )