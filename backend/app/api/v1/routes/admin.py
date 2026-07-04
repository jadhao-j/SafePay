"""Admin and SOC router stubs."""
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import get_current_user_id
from app.models.federated import FLTrainingRound

router = APIRouter(prefix="/admin", tags=["admin"])


class FLRoundPayload(BaseModel):
    """Payload for logging a completed federated learning round."""
    round_number: int
    global_model_version: str
    participating_clients: list[str]
    aggregate_metrics: dict[str, Any]


@router.post("/fl-round", status_code=status.HTTP_201_CREATED)
async def log_fl_round(
    payload: FLRoundPayload,
    db: AsyncSession = Depends(get_session),
) -> dict:
    """Log a completed federated learning round. Called by the Flower coordinator."""
    round_row = FLTrainingRound(
        round_number=payload.round_number,
        global_model_version=payload.global_model_version,
        participating_clients=payload.participating_clients,
        aggregate_metrics=payload.aggregate_metrics,
        completed_at=datetime.now(timezone.utc),
    )
    db.add(round_row)
    await db.commit()
    await db.refresh(round_row)
    return {
        "id": str(round_row.id),
        "round_number": round_row.round_number,
        "global_model_version": round_row.global_model_version,
        "completed_at": round_row.completed_at.isoformat(),
        "status": "logged",
    }


@router.get("/fl-rounds")
async def list_fl_rounds(
    db: AsyncSession = Depends(get_session),
    user_id=Depends(get_current_user_id),
) -> list[dict]:
    """List all federated learning rounds, newest first."""
    result = await db.execute(
        select(FLTrainingRound).order_by(FLTrainingRound.round_number.desc()).limit(20)
    )
    rounds = result.scalars().all()
    return [
        {
            "id": str(r.id),
            "round_number": r.round_number,
            "global_model_version": r.global_model_version,
            "participating_clients": r.participating_clients,
            "aggregate_metrics": r.aggregate_metrics,
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
        }
        for r in rounds
    ]


@router.get("/dashboard/overview", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def dashboard_overview(window: str = "24h") -> dict[str, str]:
    """Return the admin overview dashboard data."""
    raise HTTPException(status_code=501, detail="Admin overview will return KPIs and fraud monitoring summaries.")


@router.get("/dashboard/heatmap", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def dashboard_heatmap(granularity: str = "day") -> dict[str, str]:
    """Return fraud heatmap data."""
    raise HTTPException(status_code=501, detail="Heatmap data will return geographic and categorical fraud distribution.")


@router.get("/devices", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def admin_devices(cursor: str | None = None, limit: int = 50) -> dict[str, str]:
    """Return device intelligence data."""
    raise HTTPException(status_code=501, detail="Admin device view will return flagged device intelligence records.")


@router.get("/merchants", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def admin_merchants(cursor: str | None = None, limit: int = 50) -> dict[str, str]:
    """Return merchant intelligence data."""
    raise HTTPException(status_code=501, detail="Merchant management will return merchant risk and reputation data.")


@router.get("/investigations", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def admin_investigations(status_filter: str | None = None, cursor: str | None = None, limit: int = 50) -> dict[str, str]:
    """Return fraud investigations for analysts."""
    raise HTTPException(status_code=501, detail="Investigation listing will return open and resolved fraud cases.")
