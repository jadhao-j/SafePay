"""Wallet router stubs for balances, deposits, withdrawals, and requests."""

from fastapi import APIRouter, HTTPException, status

from app.schemas.wallet import PaymentRequestCreate, ScheduledPaymentCreate, WalletTopUpRequest, WalletWithdrawRequest

router = APIRouter(prefix="/wallet", tags=["wallet"])


@router.get("/balance", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def get_balance() -> dict[str, str]:
    """Return the wallet balance."""

    raise HTTPException(status_code=501, detail="Balance lookup will return the current wallet balance.")


@router.post("/add-money", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def add_money(payload: WalletTopUpRequest) -> dict[str, str]:
    """Add funds to the wallet."""

    raise HTTPException(status_code=501, detail="Add money will create a wallet top-up transaction.")


@router.post("/withdraw", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def withdraw(payload: WalletWithdrawRequest) -> dict[str, str]:
    """Withdraw funds from the wallet."""

    raise HTTPException(status_code=501, detail="Withdraw will create a wallet cash-out transaction.")


@router.get("/transactions", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def list_transactions(cursor: str | None = None, limit: int = 50) -> dict[str, str]:
    """List wallet transactions."""

    raise HTTPException(status_code=501, detail="Transaction history will return wallet transaction records.")


@router.post("/payment-requests", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def create_payment_request(payload: PaymentRequestCreate) -> dict[str, str]:
    """Create a payment request."""

    raise HTTPException(status_code=501, detail="Payment requests will create a request for funds from another wallet.")


@router.post("/scheduled-payments", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def create_scheduled_payment(payload: ScheduledPaymentCreate) -> dict[str, str]:
    """Create a scheduled payment."""

    raise HTTPException(status_code=501, detail="Scheduled payments will register a future recurring wallet transfer.")
