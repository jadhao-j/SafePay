"""Auth router — registration, login, OTP, refresh, logout."""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.services import auth_service
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


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=UserResponse)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_session)) -> UserResponse:
    """Register a new user account and send an OTP for verification."""

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


@router.post("/otp/send")
async def send_otp(payload: OtpSendRequest) -> dict[str, str]:
    """Send (or resend) an OTP to the given identifier."""

    await auth_service.send_otp(payload.identifier)
    return {"message": "OTP sent if the account exists."}


@router.post("/otp/verify")
async def verify_otp(payload: OtpVerifyRequest, db: AsyncSession = Depends(get_session)) -> dict[str, str]:
    """Verify a submitted OTP and activate the account."""

    ok = await auth_service.verify_otp(db, payload.identifier, payload.code)
    if not ok:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired code.")
    return {"message": "Verified successfully."}


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_session)) -> TokenResponse:
    """Authenticate with identifier + password, return access and refresh tokens."""

    if not payload.password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password is required.")

    result = await auth_service.login_user(db, payload.identifier, payload.password)
    if result is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")

    _, tokens = result
    return tokens


@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshRequest, request: Request, db: AsyncSession = Depends(get_session)) -> TokenResponse:
    """Rotate the access/refresh token pair using a valid refresh token."""

    user_id = request.state.user_id
    tokens = await auth_service.refresh_tokens(db, user_id, payload.refresh_token)
    if tokens is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token.")
    return tokens


@router.post("/logout")
async def logout(payload: LogoutRequest, request: Request, db: AsyncSession = Depends(get_session)) -> dict[str, str]:
    """Revoke the current session's refresh token."""

    user_id = request.state.user_id
    await auth_service.logout_user(db, user_id, payload.refresh_token)
    return {"message": "Logged out successfully."}