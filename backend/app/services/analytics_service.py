"""Analytics service — spending breakdown, risk history, AI insights."""

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import PaymentType
from app.models.fraud import FraudScore
from app.models.payments import Transaction, Wallet


async def get_spending(
    db: AsyncSession,
    user_id: UUID,
    days: int = 30,
) -> dict:
    """Return total spending + breakdown by payment_type for the last N days."""
    since = datetime.now(timezone.utc) - timedelta(days=days)

    wallet_result = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
    wallet = wallet_result.scalar_one_or_none()
    if not wallet:
        return {"total": 0, "currency": "INR", "breakdown": {}, "days": days}

    # Outgoing transactions only (sender = user's wallet), excluding topup/withdrawal
    result = await db.execute(
        select(Transaction.payment_type, func.sum(Transaction.amount))
        .where(
            Transaction.sender_wallet_id == wallet.id,
            Transaction.created_at >= since,
            Transaction.status.in_(["completed", "approved"]),
        )
        .group_by(Transaction.payment_type)
    )
    rows = result.all()

    breakdown: dict[str, float] = {}
    total = Decimal("0")
    for payment_type, amount in rows:
        if amount:
            breakdown[payment_type] = float(amount)
            # Only count outgoing (not topups)
            if payment_type not in ("topup",):
                total += amount

    return {
        "total": float(total),
        "currency": "INR",
        "breakdown": breakdown,
        "days": days,
    }


async def get_risk_history(
    db: AsyncSession,
    user_id: UUID,
    limit: int = 20,
) -> list[dict]:
    """Return the last N fraud scores for the user's transactions."""
    wallet_result = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
    wallet = wallet_result.scalar_one_or_none()
    if not wallet:
        return []

    result = await db.execute(
        select(FraudScore, Transaction.created_at, Transaction.amount, Transaction.payment_type)
        .join(Transaction, FraudScore.transaction_id == Transaction.id)
        .where(Transaction.sender_wallet_id == wallet.id)
        .order_by(Transaction.created_at.desc())
        .limit(limit)
    )
    rows = result.all()

    history = []
    for score, created_at, amount, ptype in rows:
        history.append(
            {
                "transaction_id": str(score.transaction_id),
                "risk_score": float(score.final_risk_score),
                "decision": score.decision.value if hasattr(score.decision, "value") else str(score.decision),
                "amount": float(amount),
                "payment_type": ptype.value if hasattr(ptype, "value") else str(ptype),
                "date": created_at.isoformat(),
            }
        )
    return history


async def get_insights(
    db: AsyncSession,
    user_id: UUID,
) -> list[dict]:
    """Generate deterministic insight cards for the user."""
    spending_30d = await get_spending(db, user_id, days=30)
    spending_7d = await get_spending(db, user_id, days=7)
    risk_history = await get_risk_history(db, user_id, limit=10)

    insights: list[dict] = []

    # Insight 1: Top spending category
    breakdown = spending_30d.get("breakdown", {})
    if breakdown:
        top_cat = max(breakdown, key=lambda k: breakdown[k])
        top_amt = breakdown[top_cat]
        insights.append(
            {
                "type": "info",
                "icon": "💳",
                "title": f"Top spend: {top_cat.upper()}",
                "body": f"You spent ₹{top_amt:,.0f} on {top_cat} payments in the last 30 days.",
                "color": "blue",
            }
        )

    # Insight 2: Risk trend
    if len(risk_history) >= 3:
        recent_avg = sum(r["risk_score"] for r in risk_history[:3]) / 3
        older_avg = sum(r["risk_score"] for r in risk_history[3:]) / max(len(risk_history) - 3, 1)
        if recent_avg < older_avg - 0.05:
            insights.append(
                {
                    "type": "success",
                    "icon": "🛡️",
                    "title": "Risk score improving",
                    "body": f"Your average risk score dropped from {older_avg:.2f} to {recent_avg:.2f}. Keep building trust.",
                    "color": "green",
                }
            )
        elif recent_avg > older_avg + 0.05:
            insights.append(
                {
                    "type": "warning",
                    "icon": "⚠️",
                    "title": "Risk score rising",
                    "body": f"Your risk score increased to {recent_avg:.2f}. Consider reviewing your recent transactions.",
                    "color": "amber",
                }
            )
        else:
            insights.append(
                {
                    "type": "info",
                    "icon": "📊",
                    "title": "Risk score stable",
                    "body": f"Your fraud risk score is stable at {recent_avg:.2f}. Great job maintaining safe payment habits.",
                    "color": "blue",
                }
            )

    # Insight 3: Weekly vs monthly spend comparison
    weekly_total = spending_7d.get("total", 0)
    monthly_total = spending_30d.get("total", 0)
    if monthly_total > 0:
        weekly_share = weekly_total / monthly_total * 100
        if weekly_share > 60:
            insights.append(
                {
                    "type": "warning",
                    "icon": "🔥",
                    "title": "High weekly spend",
                    "body": f"You spent {weekly_share:.0f}% of your monthly total (₹{weekly_total:,.0f}) just this week.",
                    "color": "amber",
                }
            )
        else:
            insights.append(
                {
                    "type": "success",
                    "icon": "✅",
                    "title": "Spending on track",
                    "body": f"This week's spend (₹{weekly_total:,.0f}) is {weekly_share:.0f}% of your monthly total. Looking good.",
                    "color": "green",
                }
            )

    # Fallback insight
    if not insights:
        insights.append(
            {
                "type": "info",
                "icon": "💡",
                "title": "Start transacting",
                "body": "Make your first payment to see personalised spending insights and your fraud risk profile.",
                "color": "blue",
            }
        )

    return insights[:3]
