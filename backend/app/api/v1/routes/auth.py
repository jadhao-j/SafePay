"""Auth router stubs for registration, login, OTP, MFA, refresh, and logout."""

from fastapi import APIRouter, HTTPException, status

from app.schemas.auth import LogoutRequest, LoginRequest, MfaVerifyRequest, OtpSendRequest, OtpVerifyRequest, RefreshRequest, RegisterRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def register(payload: RegisterRequest) -> dict[str, str]:
    """Register a new user account."""

    raise HTTPException(status_code=501, detail="Registration will create a SafePay account and start OTP verification.")


@router.post("/login", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def login(payload: LoginRequest) -> dict[str, str]:
    """Authenticate a user with password or passwordless flow."""

    raise HTTPException(status_code=501, detail="Login will authenticate users and issue access and refresh tokens.")


@router.post("/otp/send", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def send_otp(payload: OtpSendRequest) -> dict[str, str]:
    """Send an OTP for verification or MFA."""

    raise HTTPException(status_code=501, detail="OTP send will dispatch a one-time code through the configured provider.")


@router.post("/otp/verify", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def verify_otp(payload: OtpVerifyRequest) -> dict[str, str]:
    """Verify an OTP supplied by the user."""

    raise HTTPException(status_code=501, detail="OTP verification will validate the one-time code and continue the auth flow.")


@router.post("/mfa/verify", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def verify_mfa(payload: MfaVerifyRequest) -> dict[str, str]:
    """Verify a second-factor challenge."""

    raise HTTPException(status_code=501, detail="MFA verification will confirm an additional authentication factor.")


@router.post("/refresh", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def refresh(payload: RefreshRequest) -> dict[str, str]:
    """Rotate the session using the refresh token."""

    raise HTTPException(status_code=501, detail="Token refresh will rotate the access token and refresh token pair.")


@router.post("/logout", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def logout(payload: LogoutRequest) -> dict[str, str]:
    """Revoke the current session."""

    raise HTTPException(status_code=501, detail="Logout will revoke the current SafePay session and tokens.")
