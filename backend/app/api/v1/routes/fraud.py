"""Fraud detection endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import get_current_user_id
from app.models.fraud import FraudScore
from app.models.identity import AuditLog
from app.models.payments import Transaction
from app.schemas.fraud import FraudCaseCreateRequest, FraudScoreRead

router = APIRouter(prefix='/fraud', tags=['fraud'])


@router.get('/transactions/{transaction_id}/explanation')
async def get_explanation(
    transaction_id: str,
    db: AsyncSession = Depends(get_session),
    user_id=Depends(get_current_user_id),
) -> dict:
    """Return the fraud score and explanation for a transaction."""
    result = await db.execute(
        select(FraudScore).where(
            FraudScore.transaction_id == transaction_id
        )
    )
    score = result.scalar_one_or_none()
    if score is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='No fraud score found for this transaction.'
        )
    return {
        'transaction_id': transaction_id,
        'final_risk_score': str(score.final_risk_score),
        'decision': score.decision,
        'behavioral_risk': str(score.behavioral_deviation_score),
        'device_risk': str(score.device_risk_score),
        'transaction_risk': str(score.transaction_deviation_score),
        'model_version': score.model_version,
        'explanation_text': _generate_explanation(score),
    }


def _generate_explanation(score: FraudScore) -> str:
    """Generate a human-readable explanation. Phase 5 replaces this with SHAP."""
    factors = []
    if float(score.behavioral_deviation_score) > 0.6:
        factors.append('unusual typing and interaction patterns')
    if float(score.device_risk_score) > 0.6:
        factors.append('unrecognized or untrusted device')
    if float(score.transaction_deviation_score) > 0.5:
        factors.append('unusually large transaction amount')
    if float(score.synthetic_identity_score) > 0.5:
        factors.append('ML model flagged transaction as suspicious')

    if not factors:
        return 'Transaction was flagged for precautionary review.'

    return "Transaction flagged due to: " + ", ".join(factors) + "."


@router.get('/alerts')
async def list_alerts(
    db: AsyncSession = Depends(get_session),
    user_id=Depends(get_current_user_id),
) -> list[dict]:
    """List recent high-risk fraud scores as alerts."""
    result = await db.execute(
        select(FraudScore)
        .where(FraudScore.decision.in_(['challenge', 'block']))
        .order_by(FraudScore.id.desc())
        .limit(50)
    )
    scores = result.scalars().all()
    return [
        {
            'transaction_id': str(s.transaction_id),
            'decision': s.decision,
            'final_risk_score': str(s.final_risk_score),
            'model_version': s.model_version,
        }
        for s in scores
    ]


@router.post('/case', status_code=status.HTTP_201_CREATED)
async def create_case(
    payload: FraudCaseCreateRequest,
    db: AsyncSession = Depends(get_session),
    user_id=Depends(get_current_user_id),
) -> dict[str, str]:
    """Open a fraud investigation case."""
    from app.models.fraud import FraudCase
    from app.models.enums import FraudCaseStatus
    case = FraudCase(
        transaction_id=payload.transaction_id,
        assigned_analyst_id=payload.assigned_analyst_id,
        status=FraudCaseStatus.OPEN,
        notes=payload.notes,
    )
    db.add(case)
    await db.commit()
    return {'case_id': str(case.id), 'status': 'open'}


@router.get('/case/{case_id}')
async def get_case(
    case_id: str,
    db: AsyncSession = Depends(get_session),
    user_id=Depends(get_current_user_id),
) -> dict:
    """Retrieve a fraud investigation case."""
    from app.models.fraud import FraudCase
    result = await db.execute(
        select(FraudCase).where(FraudCase.id == case_id)
    )
    case = result.scalar_one_or_none()
    if case is None:
        raise HTTPException(status_code=404, detail='Case not found.')
    return {
        'case_id': str(case.id),
        'transaction_id': str(case.transaction_id),
        'status': case.status.value,
        'notes': case.notes,
    }
