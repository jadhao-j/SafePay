"""Payment schemas."""

from decimal import Decimal

from pydantic import BaseModel, Field


class PaymentCreate(BaseModel):
    """Generic payment creation payload."""

    amount: Decimal = Field(gt=Decimal("0"))
    currency: str = "INR"
    idempotency_key: str


class UpiSendRequest(BaseModel):
    """UPI send payload."""

    recipient_upi_id: str = Field(min_length=1)
    amount: Decimal = Field(gt=Decimal("0"))
    currency: str = "INR"
    note: str | None = None
    idempotency_key: str = Field(min_length=1)


class QRGenerateRequest(BaseModel):
    """QR generation payload."""

    merchant_upi_id: str = Field(min_length=1)
    amount: Decimal | None = None
    currency: str = "INR"


class QRPayRequest(BaseModel):
    """QR payment payload."""

    qr_payload: str = Field(min_length=1)
    amount: Decimal = Field(gt=Decimal("0"))
    currency: str = "INR"
    idempotency_key: str = Field(min_length=1)


class MerchantPayRequest(BaseModel):
    """Merchant payment payload."""

    merchant_id: str = Field(min_length=1)
    amount: Decimal = Field(gt=Decimal("0"))
    currency: str = "INR"
    idempotency_key: str = Field(min_length=1)


class P2PTransferRequest(BaseModel):
    """P2P transfer payload."""

    receiver_wallet_id: str = Field(min_length=1)
    amount: Decimal = Field(gt=Decimal("0"))
    currency: str = "INR"
    note: str | None = None
    idempotency_key: str = Field(min_length=1)


class RecurringPaymentRequest(BaseModel):
    """Recurring payment payload."""

    receiver_upi_id: str = Field(min_length=1)
    amount: Decimal = Field(gt=Decimal("0"))
    currency: str = "INR"
    cadence: str = Field(min_length=1)
    idempotency_key: str = Field(min_length=1)
