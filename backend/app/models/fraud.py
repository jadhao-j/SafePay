"""Fraud detection ORM models."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Numeric, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin
from app.models.enums import AlertType, FraudCaseStatus, FraudDecision


class FraudScore(UUIDMixin, TimestampMixin, Base):
    """ORM model for the fraud_scores table."""

    __tablename__ = "fraud_scores"

    transaction_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("transactions.id"), unique=True, nullable=False
    )
    transaction_deviation_score: Mapped[Decimal] = mapped_column(
        Numeric(5, 4), server_default="0.0000", nullable=False
    )
    behavioral_deviation_score: Mapped[Decimal] = mapped_column(
        Numeric(5, 4), server_default="0.0000", nullable=False
    )
    device_risk_score: Mapped[Decimal] = mapped_column(Numeric(5, 4), server_default="0.0000", nullable=False)
    location_risk_score: Mapped[Decimal] = mapped_column(Numeric(5, 4), server_default="0.0000", nullable=False)
    merchant_risk_score: Mapped[Decimal] = mapped_column(Numeric(5, 4), server_default="0.0000", nullable=False)
    synthetic_identity_score: Mapped[Decimal] = mapped_column(
        Numeric(5, 4), server_default="0.0000", nullable=False
    )
    final_risk_score: Mapped[Decimal] = mapped_column(Numeric(5, 4), server_default="0.0000", nullable=False)
    decision: Mapped[FraudDecision] = mapped_column(
        Enum(FraudDecision, name="fraud_decision", create_type=False, values_callable=lambda e: [x.value for x in e]),
        nullable=False,
    )
    model_version: Mapped[str | None] = mapped_column(Text, nullable=True)


class FraudExplanation(UUIDMixin, TimestampMixin, Base):
    """ORM model for the fraud_explanations table."""

    __tablename__ = "fraud_explanations"

    fraud_score_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("fraud_scores.id"), nullable=False
    )
    top_factors: Mapped[dict] = mapped_column(JSONB, nullable=False)
    explanation_text: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[Decimal] = mapped_column(Numeric(5, 4), server_default="0.0000", nullable=False)
    recommended_action: Mapped[str | None] = mapped_column(Text, nullable=True)


class FraudCase(UUIDMixin, TimestampMixin, Base):
    """ORM model for the fraud_cases table."""

    __tablename__ = "fraud_cases"

    transaction_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("transactions.id"), nullable=False
    )
    assigned_analyst_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    status: Mapped[FraudCaseStatus] = mapped_column(
        Enum(FraudCaseStatus, name="fraud_case_status", create_type=False, values_callable=lambda e: [x.value for x in e]),
        nullable=False,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    blockchain_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)



class Alert(UUIDMixin, TimestampMixin, Base):
    """ORM model for the alerts table."""

    __tablename__ = "alerts"

    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    transaction_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("transactions.id"), nullable=True
    )
    type: Mapped[AlertType] = mapped_column(
        Enum(AlertType, name="alert_type", create_type=False, values_callable=lambda e: [x.value for x in e]),
        nullable=False,
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, server_default="false", nullable=False)
