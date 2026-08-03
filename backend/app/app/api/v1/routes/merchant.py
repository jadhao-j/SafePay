"""Merchant portal router — Phase 11E."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import get_current_user_id
from app.models.payments import Merchant, Transaction, Wallet
from app.models.identity import User
from app.services import merchant_service

router = APIRouter(prefix="/merchant", tags=["merchant"])


class MerchantRegisterRequest(BaseModel):
    business_name: str
    category: str | None = None


@router.get("/me", status_code=200)
async def get_my_merchant(
    db: AsyncSession = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    """Return the merchant profile for the current user."""
    merchant = await merchant_service.get_merchant_by_user(db, user_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="No merchant profile found. Register first.")
    return {
        "id": str(merchant.id),
        "business_name": merchant.business_name,
        "upi_id": merchant.upi_id,
        "category": merchant.category,
        "risk_rating": float(merchant.risk_rating),
        "created_at": merchant.created_at.isoformat(),
    }


@router.post("/register", status_code=201)
async def register_merchant(
    payload: MerchantRegisterRequest,
    db: AsyncSession = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    """Register the current user as a merchant."""
    # Check if already registered
    existing = await merchant_service.get_merchant_by_user(db, user_id)
    if existing:
        raise HTTPException(status_code=409, detail="You already have a merchant profile.")

    # Get user's phone for UPI ID
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    phone = user.phone or str(user_id)[:8]
    upi_id = f"{phone}@safepay-merchant"

    merchant = Merchant(
        user_id=user_id,
        business_name=payload.business_name,
        upi_id=upi_id,
        category=payload.category,
    )
    db.add(merchant)
    await db.commit()
    await db.refresh(merchant)
    return {
        "id": str(merchant.id),
        "business_name": merchant.business_name,
        "upi_id": merchant.upi_id,
        "category": merchant.category,
        "message": "Merchant profile created! Share your UPI ID to start accepting payments.",
    }


@router.get("/payments", status_code=200)
async def get_merchant_payments(
    limit: int = 50,
    db: AsyncSession = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    """Return incoming payments received by this merchant."""
    merchant = await merchant_service.get_merchant_by_user(db, user_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="No merchant profile found.")

    # Get transactions where merchant_id matches
    result = await db.execute(
        select(Transaction)
        .where(Transaction.merchant_id == merchant.id)
        .order_by(Transaction.created_at.desc())
        .limit(limit)
    )
    txns = result.scalars().all()

    return {
        "payments": [
            {
                "id": str(t.id),
                "amount": float(t.amount),
                "currency": t.currency,
                "status": t.status.value if hasattr(t.status, "value") else str(t.status),
                "payment_type": t.payment_type.value if hasattr(t.payment_type, "value") else str(t.payment_type),
                "created_at": t.created_at.isoformat(),
            }
            for t in txns
        ],
        "count": len(txns),
    }


@router.get("/analytics", status_code=200)
async def get_merchant_analytics(
    days: int = 7,
    db: AsyncSession = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    """Return revenue analytics for the merchant."""
    merchant = await merchant_service.get_merchant_by_user(db, user_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="No merchant profile found.")
    return await merchant_service.get_merchant_analytics(db, merchant, days=days)
