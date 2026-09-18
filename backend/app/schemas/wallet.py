"""Wallet schemas."""

from decimal import Decimal

from pydantic import BaseModel, Field, field_validator


def _validate_pin(v: str) -> str:
    if not v.isdigit() or len(v) != 6:
        raise ValueError("transaction_pin must be exactly 6 numeric digits.")
    return v


class WalletBalanceRead(BaseModel):
    """Read model for wallet balance."""

    balance: Decimal = Field(default=Decimal("0.00"))
    currency: str = "INR"


class WalletTopUpRequest(BaseModel):
    """Wallet top-up payload."""

    amount: Decimal = Field(gt=Decimal("0"))
    currency: str = "INR"
    idempotency_key: str = Field(min_length=1)
    transaction_pin: str = Field(default="", description="Optional — add-money bypasses PIN")


class WalletWithdrawRequest(BaseModel):
    """Wallet withdrawal payload."""

    amount: Decimal = Field(gt=Decimal("0"))
    currency: str = "INR"
    idempotency_key: str = Field(min_length=1)
    transaction_pin: str = Field(min_length=6, max_length=6)

    _validate_pin = field_validator("transaction_pin")(_validate_pin)


class PaymentRequestCreate(BaseModel):
    """Wallet payment request payload."""

    payer_wallet_id: str = Field(min_length=1)
    amount: Decimal = Field(gt=Decimal("0"))
    currency: str = "INR"


class ScheduledPaymentCreate(BaseModel):
    """Scheduled payment payload."""

    receiver_upi_id: str = Field(min_length=1)
    amount: Decimal = Field(gt=Decimal("0"))
    currency: str = "INR"
    frequency: str = Field(default="once", min_length=1)
    next_run_at: str | None = None
