"""Federated learning ORM models."""

from datetime import datetime

from sqlalchemy import DateTime, Enum, Integer, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin
from app.models.enums import FLClientStatus


class FLClient(UUIDMixin, TimestampMixin, Base):
    """ORM model for the fl_clients table."""

    __tablename__ = "fl_clients"

    institution_name: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[FLClientStatus] = mapped_column(
        Enum(FLClientStatus, name="fl_client_status", create_type=False),
        nullable=False,
    )


class FLTrainingRound(UUIDMixin, TimestampMixin, Base):
    """ORM model for the fl_training_rounds table."""

    __tablename__ = "fl_training_rounds"

    round_number: Mapped[int] = mapped_column(Integer, nullable=False)
    global_model_version: Mapped[str] = mapped_column(Text, nullable=False)
    participating_clients: Mapped[list] = mapped_column(JSONB, nullable=False)
    aggregate_metrics: Mapped[dict] = mapped_column(JSONB, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
