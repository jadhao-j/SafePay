"""Notification service — create and retrieve in-app notifications."""

import logging
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification, NotificationType

logger = logging.getLogger(__name__)


async def create_notification(
    db: AsyncSession,
    user_id: UUID,
    type: NotificationType,
    title: str,
    body: str,
    ref_id: str | None = None,
) -> Notification:
    """Create and persist a notification. Never raises — failures are logged."""
    try:
        notif = Notification(
            user_id=user_id,
            type=type.value,
            title=title,
            body=body,
            ref_id=ref_id,
        )
        db.add(notif)
        await db.flush()
        return notif
    except Exception as exc:
        logger.warning("Failed to create notification: %s", exc)
        raise


async def notify(
    db: AsyncSession,
    user_id: UUID,
    type: NotificationType,
    title: str,
    body: str,
    ref_id: str | None = None,
) -> None:
    """Fire-and-forget notification helper. Never raises."""
    try:
        await create_notification(db, user_id, type, title, body, ref_id)
    except Exception as exc:
        logger.warning("notify() silently failed: %s", exc)


async def get_notifications(
    db: AsyncSession,
    user_id: UUID,
    limit: int = 30,
    offset: int = 0,
) -> tuple[list[Notification], int]:
    """Return paginated notifications and total unread count."""
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    notifications = list(result.scalars().all())

    unread_result = await db.execute(
        select(func.count()).where(
            Notification.user_id == user_id,
            Notification.read == False,  # noqa: E712
        )
    )
    unread_count = unread_result.scalar() or 0

    return notifications, unread_count


async def mark_read(db: AsyncSession, user_id: UUID, notification_id: UUID) -> bool:
    """Mark a single notification as read. Returns False if not found."""
    result = await db.execute(
        update(Notification)
        .where(Notification.id == notification_id, Notification.user_id == user_id)
        .values(read=True)
        .returning(Notification.id)
    )
    await db.flush()
    return result.scalar_one_or_none() is not None


async def mark_all_read(db: AsyncSession, user_id: UUID) -> int:
    """Mark all notifications for a user as read. Returns count updated."""
    result = await db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.read == False)  # noqa: E712
        .values(read=True)
        .returning(Notification.id)
    )
    await db.flush()
    return len(result.fetchall())
