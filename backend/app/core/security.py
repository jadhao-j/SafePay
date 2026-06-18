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
