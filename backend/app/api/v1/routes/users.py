"""User profile and device management endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import get_current_user_id
from app.models.identity import User
from app.schemas.behavior import DeviceResponse
from app.schemas.users import UserUpdate
from app.services import behavior_service

router = APIRouter(prefix='/users', tags=['users'])


@router.get('/me')
async def get_me(
    db: AsyncSession = Depends(get_session),
    user_id=Depends(get_current_user_id),
) -> dict:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found.')
    return {
        'id': str(user.id),
        'name': user.name,
        'email': user.email,
        'phone': user.phone,
        'role': user.role.value,
        'status': user.status.value,
        'mfa_enabled': user.mfa_enabled,
        'security_score': user.security_score,
    }


@router.patch('/me')
async def update_me(
    payload: UserUpdate,
    db: AsyncSession = Depends(get_session),
    user_id=Depends(get_current_user_id),
) -> dict[str, str]:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found.')
    if payload.name is not None:
        user.name = payload.name
    await db.commit()
    return {'message': 'Profile updated.'}


@router.get('/me/devices', response_model=list[DeviceResponse])
async def list_devices(
    db: AsyncSession = Depends(get_session),
    user_id=Depends(get_current_user_id),
) -> list[DeviceResponse]:
    devices = await behavior_service.get_devices_for_user(db, user_id)
    return [
        DeviceResponse(
            id=str(d.id),
            device_name=d.device_name,
            os_signature=d.os_signature,
            ip_address=str(d.ip_address) if d.ip_address else None,
            is_trusted=d.is_trusted,
            trust_score=float(d.trust_score),
            last_active_at=d.last_active_at,
        )
        for d in devices
    ]


@router.delete('/me/devices/{device_id}', status_code=status.HTTP_204_NO_CONTENT)
async def revoke_device(
    device_id: str,
    db: AsyncSession = Depends(get_session),
    user_id=Depends(get_current_user_id),
) -> None:
    found = await behavior_service.revoke_device(db, user_id, UUID(device_id))
    if not found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Device not found or does not belong to this user.',
        )


@router.get('/me/security-score')
async def get_security_score(
    db: AsyncSession = Depends(get_session),
    user_id=Depends(get_current_user_id),
) -> dict:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found.')
    trust_data = await behavior_service.get_trust_score(db, user_id)
    return {
        'security_score': user.security_score,
        'behavioral_trust_score': trust_data['trust_score'],
        'baseline_established': trust_data['baseline_established'],
        'event_count': trust_data['event_count'],
    }
