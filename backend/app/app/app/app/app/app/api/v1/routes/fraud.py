"""Fraud detection endpoints — Phase 5 with SHAP explanations."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import get_current_user_id
from app.models.fraud import Alert, FraudCase, FraudExplanation, FraudScore
from app.models.enums import FraudCaseStatus
from app.schemas.fraud import FraudCaseCreateRequest
from app.services.fraud_service import publish_case_to_blockchain

router = APIRouter(prefix='/fraud', tags=['fraud'])


@router.get('/transactions/{transaction_id}/explanation')
async def get_explanation(
    transaction_id: str,
    db: AsyncSession = Depends(get_session),
    user_id=Depends(get_current_user_id),
) -> dict:
    """Return SHAP-based explanation for a scored transaction."""
    score_result = await db.execute(
        select(FraudScore).where(FraudScore.transaction_id == transaction_id)
    )
    score = score_result.scalar_one_or_none()
    if score is None:
        raise HTTPException(status_code=404, detail='No fraud score found for this transaction.')

    explanation = None
    exp_result = await db.execute(
        select(FraudExplanation).where(FraudExplanation.fraud_score_id == score.id)
    )
    explanation = exp_result.scalar_one_or_none()

    return {
        'transaction_id': transaction_id,
        'final_risk_score': str(score.final_risk_score),
        'decision': score.decision.value if hasattr(score.decision, 'value') else score.decision,
        'behavioral_risk': str(score.behavioral_deviation_score),
        'device_risk': str(score.device_risk_score),
        'transaction_risk': str(score.transaction_deviation_score),
        'ml_score': str(score.synthetic_identity_score),
        'model_version': score.model_version,
        'explanation_text': explanation.explanation_text if explanation else 'Explanation not yet generated.',
        'top_factors': explanation.top_factors if explanation else [],
        'confidence': str(explanation.confidence) if explanation else '0',
        'recommended_action': explanation.recommended_action if explanation else 'Contact support.',
    }


@router.get('/alerts')
async def list_alerts(
    db: AsyncSession = Depends(get_session),
    user_id=Depends(get_current_user_id),
) -> list[dict]:
    """List recent fraud alerts for the current user."""
    result = await db.execute(
        select(Alert)
        .where(Alert.user_id == user_id)
        .order_by(Alert.created_at.desc())
        .limit(50)
    )
    alerts = result.scalars().all()
    return [
        {
            'id': str(alert.id),
            'transaction_id': str(alert.transaction_id) if alert.transaction_id else None,
            'type': alert.type.value if hasattr(alert.type, 'value') else alert.type,
            'message': alert.message,
            'is_read': alert.is_read,
            'created_at': alert.created_at.isoformat(),
        }
        for alert in alerts
    ]


@router.patch('/alerts/{alert_id}/read')
async def mark_alert_read(
    alert_id: str,
    db: AsyncSession = Depends(get_session),
    user_id=Depends(get_current_user_id),
) -> dict:
    """Mark one alert as read for the current user."""
    try:
        parsed_alert_id = UUID(alert_id)
    except ValueError:
        raise HTTPException(status_code=400, detail='Invalid alert id.')

    result = await db.execute(
        select(Alert).where(Alert.id == parsed_alert_id, Alert.user_id == user_id)
    )
    alert = result.scalar_one_or_none()
    if alert is None:
        raise HTTPException(status_code=404, detail='Alert not found.')

    alert.is_read = True
    await db.commit()
    await db.refresh(alert)
    return {
        'id': str(alert.id),
        'is_read': alert.is_read,
    }


@router.post('/case', status_code=status.HTTP_201_CREATED)
async def create_case(
    payload: FraudCaseCreateRequest,
    db: AsyncSession = Depends(get_session),
    user_id=Depends(get_current_user_id),
) -> dict[str, str]:
    """Open a fraud investigation case."""
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
    result = await db.execute(select(FraudCase).where(FraudCase.id == case_id))
    case = result.scalar_one_or_none()
    if case is None:
        raise HTTPException(status_code=404, detail='Case not found.')
    return {
        'case_id': str(case.id),
        'transaction_id': str(case.transaction_id),
        'status': case.status.value,
        'notes': case.notes,
        'blockchain': case.blockchain_data,
    }


@router.patch('/case/{case_id}')
async def update_case(
    case_id: str,
    status_update: dict,
    db: AsyncSession = Depends(get_session),
    user_id=Depends(get_current_user_id),
) -> dict:
    """Update fraud case status — for fraud analysts."""
    result = await db.execute(select(FraudCase).where(FraudCase.id == case_id))
    case = result.scalar_one_or_none()
    if case is None:
        raise HTTPException(status_code=404, detail='Case not found.')

    new_status = status_update.get('status')
    if new_status:
        try:
            case.status = FraudCaseStatus(new_status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f'Invalid status: {new_status}')

    if 'notes' in status_update:
        case.notes = status_update['notes']

    await db.commit()

    if case.status == FraudCaseStatus.CONFIRMED_FRAUD and not case.blockchain_data:
        blockchain_result = await publish_case_to_blockchain(db, case.id, case.transaction_id)
        case.blockchain_data = blockchain_result
        await db.commit()

    return {
        'case_id': str(case.id),
        'transaction_id': str(case.transaction_id),
        'status': case.status.value,
        'notes': case.notes,
        'blockchain': case.blockchain_data,
    }
