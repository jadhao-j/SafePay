"""Notification model for Phase 11A."""

import enum
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class NotificationType(str, enum.Enum):
    PAYMENT_SUCCESS = "payment_success"
    PAYMENT_CHALLENGED = "payment_challenged"
    PAYMENT_BLOCKED = "payment_blocked"
    FRAUD_ALERT = "fraud_alert"
    PIN_CHANGED = "pin_changed"
    DEVICE_REVOKED = "device_revoked"
    SECURITY_ALERT = "security_alert"
    SYSTEM = "system"


class Notification(Base, UUIDMixin, TimestampMixin):
    """In-app notification for a user."""

    __tablename__ = "notifications"

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # Optional reference to a transaction/alert
    ref_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
