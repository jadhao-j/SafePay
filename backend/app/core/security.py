"""Password hashing and JWT helpers for SafePay backend skeleton."""

from datetime import datetime, timedelta, timezone
from typing import Any


from jose import jwt
from passlib.context import CryptContext

from app.core.config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a plaintext password."""

    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a hash."""

    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str, claims: dict[str, Any] | None = None) -> str:
    """Create a JWT access token."""

    settings = get_settings()
    payload: dict[str, Any] = {
        "sub": subject,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expires_minutes),
    }
    if claims is not None:
        payload.update(claims)
    return jwt.encode(payload, settings.jwt_secret or "change-me", algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict[str, Any]:
    """Decode a JWT token."""

    settings = get_settings()
    return jwt.decode(token, settings.jwt_secret or "change-me", algorithms=[settings.jwt_algorithm])


import secrets
import hashlib


def create_refresh_token() -> str:
    """Generate a cryptographically secure opaque refresh token."""

    return secrets.token_urlsafe(48)


def hash_token(token: str) -> str:
    """Hash a token before storing it (Redis key), so raw tokens never sit in storage."""

    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_otp() -> str:
    """Generate a 6-digit numeric OTP."""

    return f"{secrets.randbelow(1_000_000):06d}"


def hash_otp(otp: str, identifier: str) -> str:
    """Hash an OTP combined with the identifier so OTPs aren't reusable across users."""

    return hashlib.sha256(f"{otp}:{identifier}".encode("utf-8")).hexdigest()


def verify_otp_hash(otp: str, identifier: str, stored_hash: str) -> bool:
    """Constant-time comparison of a submitted OTP against its stored hash."""

    return secrets.compare_digest(hash_otp(otp, identifier), stored_hash)

def decode_token_ignore_expiry(token: str) -> dict[str, str]:
    """Decode a JWT's claims without verifying expiry — used only for refresh flow,
    where an expired access token still proves which user is requesting a refresh."""

    settings = get_settings()
    return jwt.decode(
        token,
        settings.jwt_secret or "change-me",
        algorithms=[settings.jwt_algorithm],
        options={"verify_exp": False},
    )