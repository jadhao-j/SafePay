"""Payment schemas."""

from decimal import Decimal

from pydantic import BaseModel, Field, field_validator


def _validate_pin(v: str) -> str:
    if not v.isdigit() or len(v) != 4:
        raise ValueError("transaction_pin must be exactly 4 numeric digits.")
    return v


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
    transaction_pin: str = Field(min_length=4, max_length=4)

    _validate_pin = field_validator("transaction_pin")(_validate_pin)


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
    transaction_pin: str = Field(min_length=4, max_length=4)

    _validate_pin = field_validator("transaction_pin")(_validate_pin)


class MerchantPayRequest(BaseModel):
    """Merchant payment payload."""

    merchant_id: str = Field(min_length=1)
    amount: Decimal = Field(gt=Decimal("0"))
    currency: str = "INR"
    idempotency_key: str = Field(min_length=1)
    transaction_pin: str = Field(min_length=4, max_length=4)

    _validate_pin = field_validator("transaction_pin")(_validate_pin)


class P2PTransferRequest(BaseModel):
    """P2P transfer payload — receiver identified by phone number."""

    receiver_phone: str = Field(min_length=10, max_length=15)
    amount: Decimal = Field(gt=Decimal("0"))
    currency: str = "INR"
    note: str | None = None
    idempotency_key: str = Field(min_length=1)
    transaction_pin: str = Field(min_length=4, max_length=4)

    _validate_pin = field_validator("transaction_pin")(_validate_pin)


class RecurringPaymentRequest(BaseModel):
    """Recurring payment payload."""

    receiver_upi_id: str = Field(min_length=1)
    amount: Decimal = Field(gt=Decimal("0"))
    currency: str = "INR"
    cadence: str = Field(min_length=1)
    idempotency_key: str = Field(min_length=1)

class VerifyChallengeRequest(BaseModel):
    """Payload to verify a payment challenge OTP."""

    code: str = Field(min_length=4, max_length=8)