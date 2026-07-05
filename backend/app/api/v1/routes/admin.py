"""Admin and SOC router stubs."""
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import get_current_user_id, require_role
from app.models.enums import FraudDecision
from app.models.federated import FLTrainingRound
from app.models.fraud import FraudCase, FraudScore
from app.models.identity import Device
from app.models.payments import Merchant, Transaction
from app.models.payments import Transaction

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


def _parse_window(window: str) -> timedelta:
    """Parse '24h' / '7d' style window strings. Falls back to 24h on anything malformed."""
    try:
        value, unit = int(window[:-1]), window[-1]
        if unit == "h":
            return timedelta(hours=value)
        if unit == "d":
            return timedelta(days=value)
    except (ValueError, IndexError):
        pass
    return timedelta(hours=24)


@router.get("/dashboard/overview")
async def dashboard_overview(
    window: str = "24h",
    db: AsyncSession = Depends(get_session),
    role: str = Depends(require_role("admin", "fraud_analyst", "compliance_officer")),
) -> dict[str, Any]:
    """KPI summary for the SOC dashboard: totals, decision breakdown, fraud rate, avg risk score."""
    since = datetime.now(timezone.utc) - _parse_window(window)

    total_result = await db.execute(
        select(func.count(Transaction.id)).where(Transaction.created_at >= since)
    )
    total_transactions = total_result.scalar_one()

    decision_result = await db.execute(
        select(FraudScore.decision, func.count(FraudScore.id))
        .join(Transaction, Transaction.id == FraudScore.transaction_id)
        .where(Transaction.created_at >= since)
        .group_by(FraudScore.decision)
    )
    decision_counts = {row[0].value: row[1] for row in decision_result.all()}

    approved_count = decision_counts.get(FraudDecision.APPROVE.value, 0)
    challenged_count = decision_counts.get(FraudDecision.CHALLENGE.value, 0)
    blocked_count = decision_counts.get(FraudDecision.BLOCK.value, 0)
    scored_total = approved_count + challenged_count + blocked_count

    avg_result = await db.execute(
        select(func.avg(FraudScore.final_risk_score))
        .join(Transaction, Transaction.id == FraudScore.transaction_id)
        .where(Transaction.created_at >= since)
    )
    avg_risk_score = avg_result.scalar_one()

    fraud_rate = round((challenged_count + blocked_count) / scored_total, 4) if scored_total else 0.0

    return {
        "window": window,
        "since": since.isoformat(),
        "total_transactions": total_transactions,
        "scored_transactions": scored_total,
        "approved_count": approved_count,
        "challenged_count": challenged_count,
        "blocked_count": blocked_count,
        "fraud_rate": fraud_rate,
        "avg_risk_score": float(avg_risk_score) if avg_risk_score is not None else 0.0,
    }

@router.get("/dashboard/heatmap")
async def dashboard_heatmap(
    window: str = "24h",
    db: AsyncSession = Depends(get_session),
    role: str = Depends(require_role("admin", "fraud_analyst", "compliance_officer")),
) -> dict:
    """Fraud distribution by payment_type and decision for heatmap visualization."""
    since = datetime.now(timezone.utc) - _parse_window(window)
    result = await db.execute(
        select(
            Transaction.payment_type,
            FraudScore.decision,
            func.count(FraudScore.id).label("count"),
            func.avg(FraudScore.final_risk_score).label("avg_risk"),
        )
        .join(FraudScore, FraudScore.transaction_id == Transaction.id)
        .where(Transaction.created_at >= since)
        .group_by(Transaction.payment_type, FraudScore.decision)
    )
    rows = result.all()
    heatmap = {}
    for row in rows:
        ptype = row.payment_type.value if hasattr(row.payment_type, "value") else str(row.payment_type)
        decision = row.decision.value if hasattr(row.decision, "value") else str(row.decision)
        if ptype not in heatmap:
            heatmap[ptype] = {}
        heatmap[ptype][decision] = {
            "count": row.count,
            "avg_risk": round(float(row.avg_risk), 4) if row.avg_risk else 0.0,
        }
    return {"window": window, "since": since.isoformat(), "heatmap": heatmap}


@router.get("/devices")
async def admin_devices(
    limit: int = 50,
    untrusted_only: bool = False,
    db: AsyncSession = Depends(get_session),
    role: str = Depends(require_role("admin", "fraud_analyst")),
) -> list[dict]:
    """Device intelligence — list devices ordered by risk (lowest trust first)."""
    query = select(Device).order_by(Device.trust_score.asc()).limit(limit)
    if untrusted_only:
        query = select(Device).where(Device.is_trusted == False).order_by(Device.trust_score.asc()).limit(limit)
    result = await db.execute(query)
    devices = result.scalars().all()
    return [
        {
            "id": str(d.id),
            "user_id": str(d.user_id),
            "device_name": d.device_name,
            "os_signature": d.os_signature,
            "ip_address": str(d.ip_address) if d.ip_address else None,
            "is_trusted": d.is_trusted,
            "trust_score": float(d.trust_score),
            "last_active_at": d.last_active_at.isoformat() if d.last_active_at else None,
        }
        for d in devices
    ]


@router.get("/merchants")
async def admin_merchants(
    limit: int = 50,
    db: AsyncSession = Depends(get_session),
    role: str = Depends(require_role("admin", "fraud_analyst")),
) -> list[dict]:
    """Merchant list ordered by risk rating descending."""
    result = await db.execute(
        select(Merchant).order_by(Merchant.risk_rating.desc()).limit(limit)
    )
    merchants = result.scalars().all()
    return [
        {
            "id": str(m.id),
            "business_name": m.business_name,
            "upi_id": m.upi_id,
            "category": m.category,
            "risk_rating": float(m.risk_rating),
        }
        for m in merchants
    ]


@router.get("/investigations")
async def admin_investigations(
    status_filter: str | None = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_session),
    role: str = Depends(require_role("admin", "fraud_analyst", "compliance_officer")),
) -> list[dict]:
    """Fraud investigation cases, newest first. Optional status filter."""
    query = select(FraudCase).order_by(FraudCase.created_at.desc()).limit(limit)
    if status_filter:
        from app.models.enums import FraudCaseStatus
        try:
            query = select(FraudCase).where(
                FraudCase.status == FraudCaseStatus(status_filter)
            ).order_by(FraudCase.created_at.desc()).limit(limit)
        except ValueError:
            pass
    result = await db.execute(query)
    cases = result.scalars().all()
    return [
        {
            "case_id": str(c.id),
            "transaction_id": str(c.transaction_id),
            "status": c.status.value,
            "notes": c.notes,
            "assigned_analyst_id": str(c.assigned_analyst_id) if c.assigned_analyst_id else None,
            "created_at": c.created_at.isoformat(),
        }
        for c in cases
    ]
