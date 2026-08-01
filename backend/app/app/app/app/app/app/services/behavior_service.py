"""Device fingerprinting and behavioral telemetry service."""

from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import BehavioralEventType
from app.models.identity import BehavioralBaseline, BehavioralEvent, Device


async def upsert_device(
    db: AsyncSession,
    user_id: UUID,
    device_fingerprint: str,
    device_name: str | None,
    os_signature: str | None,
    ip_address: str | None,
) -> Device:
    result = await db.execute(
        select(Device).where(
            Device.user_id == user_id,
            Device.device_fingerprint == device_fingerprint,
        )
    )
    device = result.scalar_one_or_none()

    if device is None:
        device = Device(
            user_id=user_id,
            device_fingerprint=device_fingerprint,
            device_name=device_name,
            os_signature=os_signature,
            ip_address=ip_address,
            is_trusted=False,
            trust_score=Decimal('0.00'),
            last_active_at=datetime.now(timezone.utc),
        )
        db.add(device)
    else:
        device.last_active_at = datetime.now(timezone.utc)
        if ip_address:
            device.ip_address = ip_address
        if device_name:
            device.device_name = device_name

    await db.flush()
    return device


async def get_devices_for_user(db: AsyncSession, user_id: UUID) -> list[Device]:
    result = await db.execute(
        select(Device).where(Device.user_id == user_id).order_by(Device.last_active_at.desc())
    )
    return list(result.scalars().all())


async def revoke_device(db: AsyncSession, user_id: UUID, device_id: UUID) -> bool:
    result = await db.execute(
        select(Device).where(Device.id == device_id, Device.user_id == user_id)
    )
    device = result.scalar_one_or_none()
    if device is None:
        return False
    await db.delete(device)
    await db.commit()
    return True


_EVENT_TYPE_MAP = {
    'keystroke': BehavioralEventType.KEYSTROKE,
    'mouse': BehavioralEventType.MOUSE,
    'touch': BehavioralEventType.TOUCH,
}


async def ingest_telemetry_event(
    db: AsyncSession,
    user_id: UUID,
    session_id: str,
    event_type: str,
    payload: dict,
    captured_at: datetime,
) -> BehavioralEvent:
    mapped_type = _EVENT_TYPE_MAP.get(event_type.lower())
    if mapped_type is None:
        raise ValueError(f'Unknown event_type {event_type!r}. Must be one of: keystroke, mouse, touch.')

    trust_score = _derive_simple_trust_score(payload)

    event = BehavioralEvent(
        user_id=user_id,
        session_id=UUID(session_id) if session_id else None,
        event_type=mapped_type,
        payload=payload,
        trust_score_at_event=Decimal(str(trust_score)),
        captured_at=captured_at,
    )
    db.add(event)
    await db.flush()
    await db.commit()
    return event


def _derive_simple_trust_score(payload: dict) -> float:
    score = 50.0
    if 'dwell_time' in payload and isinstance(payload['dwell_time'], (int, float)):
        dwell = float(payload['dwell_time'])
        if 30 <= dwell <= 500:
            score += 10.0
        else:
            score -= 10.0
    if 'flight_time' in payload and isinstance(payload['flight_time'], (int, float)):
        flight = float(payload['flight_time'])
        if 50 <= flight <= 800:
            score += 5.0
    if 'velocity' in payload and isinstance(payload['velocity'], (int, float)):
        v = float(payload['velocity'])
        if v == 0.0 or v > 5000:
            score -= 15.0
        else:
            score += 5.0
    if 'pressure' in payload and isinstance(payload['pressure'], (int, float)):
        p = float(payload['pressure'])
        if 0.1 <= p <= 1.0:
            score += 10.0
    return max(0.0, min(100.0, score))


async def get_trust_score(db: AsyncSession, user_id: UUID) -> dict:
    result = await db.execute(
        select(
            func.avg(BehavioralEvent.trust_score_at_event).label('avg_score'),
            func.count(BehavioralEvent.id).label('total_events'),
        ).where(BehavioralEvent.user_id == user_id)
    )
    row = result.one()
    avg_score = float(row.avg_score or 0.0)
    total_events = int(row.total_events or 0)
    return {
        'trust_score': round(avg_score, 2),
        'event_count': total_events,
        'baseline_established': total_events >= 20,
    }


async def check_baseline_established(db: AsyncSession, user_id: UUID) -> bool:
    result = await db.execute(
        select(func.count(BehavioralEvent.id)).where(BehavioralEvent.user_id == user_id)
    )
    count = result.scalar() or 0
    return int(count) >= 20
async def get_device_id_for_request(
    db,
    user_id,
    device_fingerprint: str | None,
) -> 'UUID | None':
    from sqlalchemy import select
    from app.models.identity import Device
    from uuid import UUID
    if not device_fingerprint:
        return None
    result = await db.execute(
        select(Device.id).where(
            Device.user_id == user_id,
            Device.device_fingerprint == device_fingerprint,
        )
    )
    row = result.scalar_one_or_none()
    return row
