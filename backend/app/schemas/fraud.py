"""Fraud detection schemas."""

from decimal import Decimal
from pydantic import BaseModel, Field


class FraudScoreRead(BaseModel):
    """Full fraud score response including component scores."""
    transaction_id: str
    final_risk_score: Decimal = Field(ge=Decimal('0'), le=Decimal('1'))
    decision: str  # approve / challenge / block
    ml_risk_score: Decimal
    behavioral_risk: Decimal
    device_risk: Decimal
    transaction_risk: Decimal
    confidence: Decimal
    model_version: str


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


class FraudExplanationRead(BaseModel):
    """Explanation for a fraud decision - populated in Phase 5."""
    transaction_id: str
    explanation_text: str
    top_factors: list[dict]
    confidence: Decimal
    recommended_action: str
