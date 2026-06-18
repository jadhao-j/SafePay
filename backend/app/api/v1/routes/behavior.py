"""Behavior telemetry router stubs."""

from fastapi import APIRouter, HTTPException, status

from app.schemas.behavior import TelemetryEvent

router = APIRouter(prefix="/behavior", tags=["behavior"])


@router.post("/telemetry", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def ingest_telemetry(payload: TelemetryEvent) -> dict[str, str]:
    """Ingest behavioral telemetry events."""

    raise HTTPException(status_code=501, detail="Behavior telemetry ingestion will store keystroke, mouse, and touch events.")


@router.get("/trust-score", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def get_trust_score(device_id: str | None = None) -> dict[str, str]:
    """Return the current behavioral trust score."""

    raise HTTPException(status_code=501, detail="Trust score lookup will return the derived behavioral safety score.")
