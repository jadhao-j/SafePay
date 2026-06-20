"""add pending status to user_status enum

Revision ID: d4232f70a5d7
Revises: 001
Create Date: 2026-06-20

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d4232f70a5d7"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add 'pending' as a valid value to the user_status Postgres enum."""

    op.execute("ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'pending'")


def downgrade() -> None:
    """Postgres does not support removing enum values directly.

    A downgrade would require recreating the type and migrating data,
    which is intentionally left as a manual operation if ever needed.
    """
    pass