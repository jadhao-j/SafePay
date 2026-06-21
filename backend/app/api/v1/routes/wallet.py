"""Wallet router — balance, deposits, withdrawals, transaction history."""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import get_current_user_id
from app.schemas.wallet import (
    PaymentRequestCreate,
    ScheduledPaymentCreate,
    WalletBalanceRead,
    WalletTopUpRequest,
    WalletWithdrawRequest,
)
from app.services import wallet_service

router = APIRouter(prefix="/wallet", tags=["wallet"])


@router.get("/balance", response_model=WalletBalanceRead)
async def get_balance(
    db: AsyncSession = Depends(get_session),
    user_id=Depends(get_current_user_id),
) -> WalletBalanceRead:
    """Return the caller's wallet balance."""

    try:
        wallet = await wallet_service.get_balance(db, user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return WalletBalanceRead(balance=wallet.balance, currency=wallet.currency)


@router.post("/add-money", status_code=status.HTTP_201_CREATED)
async def add_money(
    payload: WalletTopUpRequest,
    db: AsyncSession = Depends(get_session),
    user_id=Depends(get_current_user_id),
) -> dict[str, str]:
    """Add funds to the caller's wallet."""

    try:
        txn = await wallet_service.add_money(db, user_id, payload.amount, payload.idempotency_key)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return {"transaction_id": str(txn.id), "status": txn.status.value, "amount": str(txn.amount)}


@router.post("/withdraw", status_code=status.HTTP_201_CREATED)
async def withdraw(
    payload: WalletWithdrawRequest,
    db: AsyncSession = Depends(get_session),
    user_id=Depends(get_current_user_id),
) -> dict[str, str]:
    """Withdraw funds from the caller's wallet."""

    try:
        txn = await wallet_service.withdraw(db, user_id, payload.amount, payload.idempotency_key)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return {"transaction_id": str(txn.id), "status": txn.status.value, "amount": str(txn.amount)}


@router.get("/transactions")
async def list_transactions(
    limit: int = 50,
    db: AsyncSession = Depends(get_session),
    user_id=Depends(get_current_user_id),
) -> list[dict[str, str | None]]:
    """List the caller's transaction history, most recent first."""

    txns = await wallet_service.list_transactions(db, user_id, limit)

    return [
        {
            "id": str(t.id),
            "amount": str(t.amount),
            "currency": t.currency,
            "payment_type": t.payment_type.value,
            "status": t.status.value,
            "created_at": t.created_at.isoformat(),
        }
        for t in txns
    ]


@router.post("/payment-requests", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def create_payment_request(payload: PaymentRequestCreate) -> dict[str, str]:
    """Create a payment request. Deferred to Phase 3 (needs alerts infrastructure)."""

    raise HTTPException(status_code=501, detail="Payment requests are planned for Phase 3.")


@router.post("/scheduled-payments", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def create_scheduled_payment(payload: ScheduledPaymentCreate) -> dict[str, str]:
    """Create a scheduled payment. Deferred to Phase 3 (needs job scheduler)."""

    raise HTTPException(status_code=501, detail="Scheduled payments are planned for Phase 3.")