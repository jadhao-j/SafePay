"""Wallet and payments ORM models."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin
from app.models.enums import (
    PaymentRequestStatus,
    PaymentType,
    ScheduledPaymentFrequency,
    TransactionStatus,
    WalletStatus,
)


class Wallet(UUIDMixin, TimestampMixin, Base):
    """ORM model for the wallets table."""

    __tablename__ = "wallets"

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False
    )
    balance: Mapped[Decimal] = mapped_column(Numeric(14, 2), server_default="0.00", nullable=False)
    currency: Mapped[str] = mapped_column(Text, server_default="INR", nullable=False)
    status: Mapped[WalletStatus] = mapped_column(
        Enum(WalletStatus, name="wallet_status", create_type=False),
        server_default="active",
        nullable=False,
    )


class Merchant(UUIDMixin, TimestampMixin, Base):
    """ORM model for the merchants table."""

    __tablename__ = "merchants"

    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    business_name: Mapped[str] = mapped_column(Text, nullable=False)
    upi_id: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    category: Mapped[str | None] = mapped_column(Text, nullable=True)
    risk_rating: Mapped[Decimal] = mapped_column(Numeric(5, 2), server_default="0.00", nullable=False)


class Transaction(UUIDMixin, TimestampMixin, Base):
    """ORM model for the transactions table."""

    __tablename__ = "transactions"

    sender_wallet_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("wallets.id"), nullable=False
    )
    receiver_wallet_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("wallets.id"), nullable=True
    )
    merchant_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("merchants.id"), nullable=True
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(Text, nullable=False)
    payment_type: Mapped[PaymentType] = mapped_column(
        Enum(PaymentType, name="payment_type", create_type=False),
        nullable=False,
    )
    status: Mapped[TransactionStatus] = mapped_column(
        Enum(TransactionStatus, name="transaction_status", create_type=False),
        nullable=False,
    )
    device_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("devices.id"), nullable=False)
    idempotency_key: Mapped[str] = mapped_column(Text, unique=True, nullable=False)


class PaymentRequest(UUIDMixin, TimestampMixin, Base):
    """ORM model for the payment_requests table."""

    __tablename__ = "payment_requests"

    requester_wallet_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("wallets.id"), nullable=False
    )
    payer_wallet_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("wallets.id"), nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    status: Mapped[PaymentRequestStatus] = mapped_column(
        Enum(PaymentRequestStatus, name="payment_request_status", create_type=False),
        nullable=False,
    )


class ScheduledPayment(UUIDMixin, TimestampMixin, Base):
    """ORM model for the scheduled_payments table."""

    __tablename__ = "scheduled_payments"

    wallet_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("wallets.id"), nullable=False)
    receiver_upi_id: Mapped[str] = mapped_column(Text, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    frequency: Mapped[ScheduledPaymentFrequency] = mapped_column(
        Enum(ScheduledPaymentFrequency, name="scheduled_payment_frequency", create_type=False),
        nullable=False,
    )
    next_run_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, server_default="true", nullable=False)
