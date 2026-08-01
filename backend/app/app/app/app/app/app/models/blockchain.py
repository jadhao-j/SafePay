"""Blockchain fraud intelligence ORM models."""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, Integer, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin
from app.models.enums import BlockchainEntityType


class BlockchainFraudSignal(UUIDMixin, TimestampMixin, Base):
    """ORM model for the blockchain_fraud_signals table."""

    __tablename__ = "blockchain_fraud_signals"

    entity_type: Mapped[BlockchainEntityType] = mapped_column(
        Enum(BlockchainEntityType, name="blockchain_entity_type", create_type=False),
        nullable=False,
    )
    entity_hash: Mapped[str] = mapped_column(Text, nullable=False)
    risk_indicator: Mapped[str] = mapped_column(Text, nullable=False)
    on_chain_tx_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    reported_by_institution: Mapped[str | None] = mapped_column(Text, nullable=True)


class ReputationScore(UUIDMixin, TimestampMixin, Base):
    """ORM model for the reputation_scores table."""

    __tablename__ = "reputation_scores"

    entity_hash: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    reputation_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), server_default="0.00", nullable=False)
    signal_count: Mapped[int] = mapped_column(Integer, server_default="0", nullable=False)
    last_updated_on_chain_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
