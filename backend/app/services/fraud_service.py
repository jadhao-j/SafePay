"""Fraud detection service - Phase 4 core engine."""

import httpx
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.fraud import FraudScore
from app.models.identity import Device
from app.models.payments import Transaction

settings = get_settings()


# ── ML Service call ───────────────────────────────────────────────────────────

async def call_ml_service(payload: dict) -> dict:
    """Call the ML scoring microservice. Returns risk_score, decision, confidence."""
    ml_url = getattr(settings, 'ml_service_url', 'http://ml-service:8001')
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(f'{ml_url}/score', json=payload)
            response.raise_for_status()
            return response.json()
    except Exception:
        # If ML service is unreachable, default to a medium-risk score
        # so payments are challenged rather than blindly approved
        return {
            'risk_score': 0.4,
            'decision': 'challenge',
            'confidence': 0.5,
            'model_version': 'fallback',
        }


# ── Risk component computation ────────────────────────────────────────────────

def compute_transaction_risk(amount: Decimal) -> float:
    """Higher transaction amounts = higher risk contribution."""
    amt = float(amount)
    if amt < 1000:
        return 0.1
    elif amt < 5000:
        return 0.2
    elif amt < 20000:
        return 0.4
    elif amt < 100000:
        return 0.6
    else:
        return 0.8


def compute_device_risk(device: Device | None) -> float:
    """Unknown or low-trust devices = higher risk."""
    if device is None:
        return 0.8  # unknown device is high risk
    trust = float(device.trust_score)
    if not device.is_trusted:
        return max(0.3, 1.0 - (trust / 100.0))
    return max(0.0, 1.0 - (trust / 100.0))


def compute_behavioral_risk(behavioral_trust_score: float) -> float:
    """Low behavioral trust = higher risk."""
    return max(0.0, 1.0 - (behavioral_trust_score / 100.0))


def compute_weighted_score(
    ml_score: float,
    behavioral_risk: float,
    transaction_risk: float,
    device_risk: float,
) -> float:
    """
    Weighted risk formula from PRD.md:
      35% Behavioral risk
      30% Transaction risk
      20% Device risk
      15% ML model score (cross-bank intelligence proxy for now)
    """
    weighted = (
        0.35 * behavioral_risk
        + 0.30 * transaction_risk
        + 0.20 * device_risk
        + 0.15 * ml_score
    )
    return round(min(1.0, max(0.0, weighted)), 4)


def make_decision(weighted_score: float) -> str:
    """Apply decision thresholds from PRD.md."""
    if weighted_score < 0.3:
        return 'approve'
    elif weighted_score <= 0.7:
        return 'challenge'
    else:
        return 'block'


# ── Main scoring orchestrator ─────────────────────────────────────────────────

async def score_transaction(
    db: AsyncSession,
    transaction: Transaction,
    device_id: UUID | None,
    behavioral_trust_score: float = 50.0,
) -> dict:
    """
    Full fraud scoring pipeline for a transaction.
    Returns a dict with decision, scores, and the fraud_score row id.
    Writes a fraud_scores row to the database.
    """
    # 1. Look up device if provided
    device = None
    if device_id is not None:
        result = await db.execute(select(Device).where(Device.id == device_id))
        device = result.scalar_one_or_none()

    # 2. Compute component risk scores
    transaction_risk = compute_transaction_risk(transaction.amount)
    device_risk = compute_device_risk(device)
    behavioral_risk = compute_behavioral_risk(behavioral_trust_score)

    # 3. Call ML service with transaction context
    ml_payload = {
        'transaction_id': str(transaction.id),
        'transaction_amt': float(transaction.amount),
        'product_cd': 'W',
        'device_trust_score': float(device.trust_score) if device else 0.0,
        'behavioral_trust_score': behavioral_trust_score,
        'is_new_device': device is None or not device.is_trusted,
    }
    ml_result = await call_ml_service(ml_payload)
    ml_score = float(ml_result.get('risk_score', 0.4))

    # 4. Compute final weighted score
    final_score = compute_weighted_score(
        ml_score=ml_score,
        behavioral_risk=behavioral_risk,
        transaction_risk=transaction_risk,
        device_risk=device_risk,
    )

    # 5. Make decision
    decision = make_decision(final_score)

    # 6. Write fraud_scores row
    fraud_score_row = FraudScore(
        transaction_id=transaction.id,
        transaction_deviation_score=Decimal(str(transaction_risk)),
        behavioral_deviation_score=Decimal(str(behavioral_risk)),
        device_risk_score=Decimal(str(device_risk)),
        location_risk_score=Decimal('0.0'),
        merchant_risk_score=Decimal('0.0'),
        synthetic_identity_score=Decimal(str(ml_score)),
        final_risk_score=Decimal(str(final_score)),
        decision=decision,
        model_version=ml_result.get('model_version', 'xgboost-v1'),
    )
    db.add(fraud_score_row)
    await db.flush()

    return {
        'fraud_score_id': str(fraud_score_row.id),
        'decision': decision,
        'final_risk_score': final_score,
        'ml_risk_score': ml_score,
        'behavioral_risk': behavioral_risk,
        'device_risk': device_risk,
        'transaction_risk': transaction_risk,
        'confidence': float(ml_result.get('confidence', 0.5)),
        'model_version': ml_result.get('model_version', 'xgboost-v1'),
    }
