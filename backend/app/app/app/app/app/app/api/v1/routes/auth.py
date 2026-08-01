"""Auth router — registration, login, OTP, refresh, logout."""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.schemas.auth import (
    LoginRequest,
    LogoutRequest,
    OtpSendRequest,
    OtpVerifyRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services import auth_service, behavior_service

router = APIRouter(prefix='/auth', tags=['auth'])


@router.post('/register', status_code=status.HTTP_201_CREATED, response_model=UserResponse)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_session)) -> UserResponse:
    try:
        user = await auth_service.register_user(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    identifier = user.email or user.phone
    if identifier:
        await auth_service.send_otp(identifier)

    return UserResponse(
        id=str(user.id),
        name=user.name,
        email=user.email,
        phone=user.phone,
        role=user.role.value,
        status=user.status.value,
        mfa_enabled=user.mfa_enabled,
        security_score=user.security_score,
    )


@router.post('/otp/send')
async def send_otp(payload: OtpSendRequest) -> dict[str, str]:
    await auth_service.send_otp(payload.identifier)
    return {'message': 'OTP sent if the account exists.'}


@router.post('/otp/verify')
async def verify_otp(payload: OtpVerifyRequest, db: AsyncSession = Depends(get_session)) -> dict[str, str]:
    ok = await auth_service.verify_otp(db, payload.identifier, payload.code)
    if not ok:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid or expired code.')
    return {'message': 'Verified successfully.'}


@router.post('/login', response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_session),
) -> TokenResponse:
    if not payload.password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Password is required.')

    result = await auth_service.login_user(db, payload.identifier, payload.password)
    if result is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials.')

    user, tokens = result

    # Record which device is logging in.
    # Fingerprint falls back to IP if no X-Device-ID header is sent.
    device_fingerprint = (
        request.headers.get('X-Device-ID')
        or request.client.host
        or 'unknown'
    )
    device_name = request.headers.get('X-Device-Name')
    os_signature = request.headers.get('X-OS-Signature')
    ip_address = request.client.host if request.client else None

    await behavior_service.upsert_device(
        db,
        user_id=user.id,
        device_fingerprint=device_fingerprint,
        device_name=device_name,
        os_signature=os_signature,
        ip_address=ip_address,
    )
    await db.commit()

    return tokens


@router.post('/refresh', response_model=TokenResponse)
async def refresh(payload: RefreshRequest, request: Request, db: AsyncSession = Depends(get_session)) -> TokenResponse:
    user_id = request.state.user_id
    tokens = await auth_service.refresh_tokens(db, user_id, payload.refresh_token)
    if tokens is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid or expired refresh token.')
    return tokens


@router.post('/logout')
async def logout(payload: LogoutRequest, request: Request, db: AsyncSession = Depends(get_session)) -> dict[str, str]:
    user_id = request.state.user_id
    await auth_service.logout_user(db, user_id, payload.refresh_token)
    return {'message': 'Logged out successfully.'}
