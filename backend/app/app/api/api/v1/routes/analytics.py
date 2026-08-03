"""Analytics router — Phase 11B."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import get_current_user_id
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/spending", status_code=status.HTTP_200_OK)
async def get_spending(
    days: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    """Spending breakdown by payment type for the last N days."""
    return await analytics_service.get_spending(db, user_id, days=days)


@router.get("/risk-history", status_code=status.HTTP_200_OK)
async def get_risk_history(
    limit: int = Query(default=20, ge=1, le=50),
    db: AsyncSession = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    """Last N fraud risk scores for the user's transactions."""
    history = await analytics_service.get_risk_history(db, user_id, limit=limit)
    return {"history": history, "count": len(history)}


@router.get("/insights", status_code=status.HTTP_200_OK)
async def get_insights(
    db: AsyncSession = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    """AI-generated insight cards based on spending and risk patterns."""
    insights = await analytics_service.get_insights(db, user_id)
    return {"insights": insights}
