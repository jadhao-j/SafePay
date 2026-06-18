"""Behavior schemas."""

from pydantic import BaseModel


class TelemetryEvent(BaseModel):
    """Behavioral telemetry payload."""

    event_type: str
    payload: dict[str, object]


class TrustScoreRead(BaseModel):
    """Behavioral trust score response model."""

    trust_score: float
