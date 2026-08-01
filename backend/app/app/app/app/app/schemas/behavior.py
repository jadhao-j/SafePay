"""Behavior and device schemas."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class TelemetryEvent(BaseModel):
    session_id: str = Field(min_length=1)
    event_type: str
    payload: dict[str, object]
    captured_at: datetime


class TrustScoreRead(BaseModel):
    trust_score: float
    event_count: int
    baseline_established: bool


class DeviceResponse(BaseModel):
    id: str
    device_name: str | None
    os_signature: str | None
    ip_address: str | None
    is_trusted: bool
    trust_score: float
    last_active_at: datetime | None
