"""Payment router — P2P transfer, UPI send, QR generate/pay, merchant pay."""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import get_current_user_id
from app.models.identity import Device
from app.schemas.payments import (
    MerchantPayRequest,
    P2PTransferRequest,
    QRGenerateRequest,
    QRPayRequest,
    RecurringPaymentRequest,
    UpiSendRequest,
)
from app.services import wallet_service

router = APIRouter(prefix='/payments', tags=['payments'])


async def _get_device_id(request: Request, db: AsyncSession, user_id):
    """Look up the device UUID from the fingerprint header, if present."""
    fingerprint = getattr(request.state, 'device_id', None)
    if not fingerprint:
        return None
    result = await db.execute(
        select(Device.id).where(
            Device.user_id == user_id,
            Device.device_fingerprint == fingerprint,
        )
    )
    return result.scalar_one_or_none()


@router.post('/p2p/transfer', status_code=status.HTTP_201_CREATED)
async def transfer_p2p(
    payload: P2PTransferRequest,
    request: Request,
    db: AsyncSession = Depends(get_session),
    user_id=Depends(get_current_user_id),
) -> dict[str, str | None]:
    device_id = await _get_device_id(request, db, user_id)
    try:
        txn = await wallet_service.transfer_p2p(
            db,
            sender_user_id=user_id,
            receiver_phone=payload.receiver_phone,
            amount=payload.amount,
            idempotency_key=payload.idempotency_key,
            note=payload.note,
            device_id=device_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return {'transaction_id': str(txn.id), 'status': txn.status.value, 'amount': str(txn.amount)}


@router.post('/upi/send', status_code=status.HTTP_201_CREATED)
async def send_upi(
    payload: UpiSendRequest,
    request: Request,
    db: AsyncSession = Depends(get_session),
    user_id=Depends(get_current_user_id),
) -> dict[str, str | None]:
    device_id = await _get_device_id(request, db, user_id)
    try:
        txn = await wallet_service.send_upi(
            db,
            sender_user_id=user_id,
            recipient_upi_id=payload.recipient_upi_id,
            amount=payload.amount,
            idempotency_key=payload.idempotency_key,
            note=payload.note,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return {'transaction_id': str(txn.id), 'status': txn.status.value, 'amount': str(txn.amount)}


@router.post('/qr/generate', status_code=status.HTTP_201_CREATED)
async def generate_qr(
    payload: QRGenerateRequest,
    db: AsyncSession = Depends(get_session),
) -> dict:
    try:
        qr_payload = await wallet_service.generate_qr_payload(
            db,
            merchant_upi_id=payload.merchant_upi_id,
            amount=payload.amount,
            currency=payload.currency,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return {'qr_payload': qr_payload}


@router.post('/qr/pay', status_code=status.HTTP_201_CREATED)
async def pay_qr(
    payload: QRPayRequest,
    request: Request,
    db: AsyncSession = Depends(get_session),
    user_id=Depends(get_current_user_id),
) -> dict[str, str | None]:
    device_id = await _get_device_id(request, db, user_id)
    try:
        txn = await wallet_service.pay_qr(
            db,
            sender_user_id=user_id,
            qr_payload_str=payload.qr_payload,
            amount=payload.amount,
            idempotency_key=payload.idempotency_key,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return {'transaction_id': str(txn.id), 'status': txn.status.value, 'amount': str(txn.amount)}


@router.post('/merchant/pay', status_code=status.HTTP_201_CREATED)
async def pay_merchant(
    payload: MerchantPayRequest,
    request: Request,
    db: AsyncSession = Depends(get_session),
    user_id=Depends(get_current_user_id),
) -> dict[str, str | None]:
    device_id = await _get_device_id(request, db, user_id)
    try:
        txn = await wallet_service.pay_merchant(
            db,
            sender_user_id=user_id,
            merchant_id=payload.merchant_id,
            amount=payload.amount,
            idempotency_key=payload.idempotency_key,
            device_id=device_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return {'transaction_id': str(txn.id), 'status': txn.status.value, 'amount': str(txn.amount)}


@router.post('/recurring', status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def create_recurring_payment(payload: RecurringPaymentRequest) -> dict[str, str]:
    raise HTTPException(status_code=501, detail='Recurring payments are planned for Phase 3.')
