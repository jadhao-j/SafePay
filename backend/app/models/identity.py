"""Identity and auth ORM models."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Numeric, Text
from sqlalchemy.dialects.postgresql import INET, JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin
from app.models.enums import BehavioralEventType, UserRole, UserStatus


class User(UUIDMixin, TimestampMixin, Base):
    """ORM model for the users table."""

    __tablename__ = "users"

    name: Mapped[str | None] = mapped_column(Text, nullable=True)
    email: Mapped[str | None] = mapped_column(Text, unique=True, nullable=True)
    phone: Mapped[str | None] = mapped_column(Text, unique=True, nullable=True)
    password_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", create_type=False, values_callable=lambda enum_cls: [e.value for e in enum_cls]),
        server_default="user",
        nullable=False,
    )
    pin_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, server_default="false", nullable=False)
    security_score: Mapped[int] = mapped_column(Integer, server_default="0", nullable=False)
    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus, name="user_status", create_type=False, values_callable=lambda enum_cls: [e.value for e in enum_cls]),
        nullable=False,
    )


class Device(UUIDMixin, TimestampMixin, Base):
    """ORM model for the devices table."""

    __tablename__ = "devices"

    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    device_fingerprint: Mapped[str] = mapped_column(Text, nullable=False)
    device_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    os_signature: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(INET, nullable=True)
    is_trusted: Mapped[bool] = mapped_column(Boolean, server_default="false", nullable=False)
    trust_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), server_default="0.00", nullable=False)
    last_active_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class BehavioralBaseline(UUIDMixin, TimestampMixin, Base):
    """ORM model for the behavioral_baselines table."""

    __tablename__ = "behavioral_baselines"

    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    keystroke_profile: Mapped[dict] = mapped_column(JSONB, nullable=False)
    mouse_profile: Mapped[dict] = mapped_column(JSONB, nullable=False)
    touch_profile: Mapped[dict] = mapped_column(JSONB, nullable=False)
    baseline_version: Mapped[int] = mapped_column(Integer, server_default="1", nullable=False)


class BehavioralEvent(UUIDMixin, TimestampMixin, Base):
    """ORM model for the behavioral_events table."""

    __tablename__ = "behavioral_events"

    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    session_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), nullable=True)
    event_type: Mapped[BehavioralEventType] = mapped_column(
        Enum(BehavioralEventType, name="behavioral_event_type", create_type=False),
        nullable=False,
    )
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    trust_score_at_event: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class AuditLog(UUIDMixin, TimestampMixin, Base):
    """ORM model for the audit_logs table (append-only)."""

    __tablename__ = "audit_logs"

    actor_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    action: Mapped[str] = mapped_column(Text, nullable=False)
    event_metadata: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False)
    ip_address: Mapped[str | None] = mapped_column(INET, nullable=True)
