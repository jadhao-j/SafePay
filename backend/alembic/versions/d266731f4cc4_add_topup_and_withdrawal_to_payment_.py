"""add topup and withdrawal to payment_type enum

Revision ID: d266731f4cc4
Revises: a952f42e65fa
Create Date: 2026-06-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d266731f4cc4"
down_revision: Union[str, None] = "a952f42e65fa"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add 'topup' and 'withdrawal' as valid values to the payment_type Postgres enum."""

    op.execute("ALTER TYPE payment_type ADD VALUE IF NOT EXISTS 'topup'")
    op.execute("ALTER TYPE payment_type ADD VALUE IF NOT EXISTS 'withdrawal'")


def downgrade() -> None:
    """Postgres does not support removing enum values directly.

    A downgrade would require recreating the type and migrating data,
    which is intentionally left as a manual operation if ever needed.
    """
    pass