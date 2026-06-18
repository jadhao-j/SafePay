"""Fraud schemas."""

from decimal import Decimal

from pydantic import BaseModel, Field


class FraudScoreRead(BaseModel):
    """Fraud score response model."""

    transaction_id: str
    final_risk_score: Decimal = Field(ge=Decimal("0"), le=Decimal("1"))
    decision: str


class FraudScoreCreateRequest(BaseModel):
    """Fraud scoring trigger payload."""

    transaction_id: str = Field(min_length=1)
    device_id: str | None = None
    behavioral_context: dict[str, object] | None = None


class FraudCaseCreateRequest(BaseModel):
    """Fraud case creation payload."""

    transaction_id: str = Field(min_length=1)
    assigned_analyst_id: str | None = None
    notes: str | None = None
