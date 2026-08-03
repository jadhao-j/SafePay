"""Notifications router — Phase 11A."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import get_current_user_id
from app.services import notification_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", status_code=status.HTTP_200_OK)
async def list_notifications(
    limit: int = 30,
    offset: int = 0,
    response: Response = None,
    db: AsyncSession = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    """Return paginated notifications with unread count in header."""
    notifications, unread_count = await notification_service.get_notifications(
        db, user_id, limit=limit, offset=offset
    )
    if response:
        response.headers["X-Unread-Count"] = str(unread_count)
    return {
        "notifications": [
            {
                "id": str(n.id),
                "type": n.type,
                "title": n.title,
                "body": n.body,
                "read": n.read,
                "ref_id": n.ref_id,
                "created_at": n.created_at.isoformat(),
            }
            for n in notifications
        ],
        "unread_count": unread_count,
        "total": len(notifications),
    }


@router.patch("/{notification_id}/read", status_code=status.HTTP_200_OK)
async def mark_notification_read(
    notification_id: UUID,
    db: AsyncSession = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    """Mark a single notification as read."""
    found = await notification_service.mark_read(db, user_id, notification_id)
    if not found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")
    await db.commit()
    return {"success": True}


@router.patch("/read-all", status_code=status.HTTP_200_OK)
async def mark_all_notifications_read(
    db: AsyncSession = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    """Mark all notifications as read."""
    count = await notification_service.mark_all_read(db, user_id)
    await db.commit()
    return {"marked_read": count}
