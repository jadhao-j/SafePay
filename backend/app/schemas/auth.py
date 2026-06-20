"""Auth request and response schemas."""

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    """Registration payload."""

    name: str = Field(min_length=1)
    email: EmailStr | None = None
    phone: str | None = None
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    """Login payload."""

    identifier: str = Field(min_length=1)
    password: str | None = None


class OtpSendRequest(BaseModel):
    """OTP send payload."""

    identifier: str = Field(min_length=1)
    delivery_channel: str = Field(default="sms", min_length=1)


class OtpVerifyRequest(BaseModel):
    """OTP verification payload."""

    identifier: str = Field(min_length=1)
    code: str = Field(min_length=4, max_length=8)


class MfaVerifyRequest(BaseModel):
    """MFA verification payload."""

    challenge_id: str = Field(min_length=1)
    code: str = Field(min_length=4, max_length=8)


class RefreshRequest(BaseModel):
    """Refresh token payload."""

    refresh_token: str = Field(min_length=1)


class LogoutRequest(BaseModel):
    """Logout payload."""

    refresh_token: str | None = None

class TokenResponse(BaseModel):
    """Access and refresh token pair returned after login or refresh."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    """Safe user representation — never includes password or pin hash."""

    id: str
    name: str | None
    email: str | None
    phone: str | None
    role: str
    status: str
    mfa_enabled: bool
    security_score: int