"""Behavior telemetry and trust score endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import get_current_user_id
from app.schemas.behavior import TelemetryEvent, TrustScoreRead
from app.services import behavior_service

router = APIRouter(prefix='/behavior', tags=['behavior'])


@router.post('/telemetry', status_code=status.HTTP_201_CREATED)
async def ingest_telemetry(
    payload: TelemetryEvent,
    db: AsyncSession = Depends(get_session),
    user_id=Depends(get_current_user_id),
) -> dict[str, str]:
    try:
        event = await behavior_service.ingest_telemetry_event(
            db,
            user_id=user_id,
            session_id=payload.session_id,
            event_type=payload.event_type,
            payload=payload.payload,
            captured_at=payload.captured_at,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return {'event_id': str(event.id), 'status': 'recorded'}


@router.get('/trust-score', response_model=TrustScoreRead)
async def get_trust_score(
    db: AsyncSession = Depends(get_session),
    user_id=Depends(get_current_user_id),
) -> TrustScoreRead:
    result = await behavior_service.get_trust_score(db, user_id)
    return TrustScoreRead(**result)
