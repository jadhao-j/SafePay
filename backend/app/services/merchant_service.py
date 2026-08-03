"""Merchant service — profile, payments list, revenue analytics."""

from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payments import Merchant, Transaction
from app.models.enums import TransactionStatus


async def get_merchant_by_user(db: AsyncSession, user_id: UUID) -> Merchant | None:
    """Return the merchant record owned by this user, or None."""
    result = await db.execute(select(Merchant).where(Merchant.user_id == user_id))
    return result.scalar_one_or_none()


async def get_merchant_payments(
    db: AsyncSession,
    merchant: Merchant,
    limit: int = 50,
) -> list[Transaction]:
    """Return incoming payments for this merchant, newest first."""
    result = await db.execute(
        select(Transaction)
        .where(Transaction.merchant_id == merchant.id)
        .order_by(Transaction.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_merchant_analytics(
    db: AsyncSession,
    merchant: Merchant,
    days: int = 7,
) -> dict:
    """Return total revenue + daily chart for a merchant."""
    since = datetime.now(timezone.utc) - timedelta(days=days)

    completed_statuses = [
        TransactionStatus.COMPLETED.value,
        TransactionStatus.APPROVED.value,
    ]

    # Total revenue in window
    total_result = await db.execute(
        select(func.sum(Transaction.amount)).where(
            Transaction.merchant_id == merchant.id,
            Transaction.status.in_(completed_statuses),
            Transaction.created_at >= since,
        )
    )
    total = float(total_result.scalar() or 0)

    # Daily breakdown
    daily_result = await db.execute(
        select(
            func.date_trunc("day", Transaction.created_at).label("day"),
            func.sum(Transaction.amount).label("revenue"),
            func.count().label("count"),
        )
        .where(
            Transaction.merchant_id == merchant.id,
            Transaction.status.in_(completed_statuses),
            Transaction.created_at >= since,
        )
        .group_by("day")
        .order_by("day")
    )
    daily = [
        {
            "date": str(row.day.date()),
            "revenue": float(row.revenue),
            "count": row.count,
        }
        for row in daily_result.all()
    ]

    # Transactions today (all statuses)
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_result = await db.execute(
        select(func.count()).where(
            Transaction.merchant_id == merchant.id,
            Transaction.created_at >= today_start,
        )
    )
    today_count = int(today_result.scalar() or 0)

    return {
        "total_revenue": total,
        "currency": "INR",
        "days": days,
        "daily": daily,
        "today_transaction_count": today_count,
    }
