"""Authentication service — register, login, OTP, token lifecycle."""

from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.redis import redis_client
from app.core.security import (
    create_access_token,
    create_refresh_token,
    generate_otp,
    hash_otp,
    hash_password,
    hash_token,
    verify_otp_hash,
    verify_password,
)
from app.models.enums import UserStatus, WalletStatus
from app.models.identity import AuditLog, User
from app.models.payments import Wallet
from app.schemas.auth import RegisterRequest, TokenResponse

settings = get_settings()

OTP_TTL_SECONDS = 600  # 10 minutes
REFRESH_TTL_SECONDS = settings.refresh_token_expires_days * 24 * 60 * 60


async def _write_audit_log(db: AsyncSession, actor_user_id: UUID | None, action: str, metadata: dict) -> None:
    """Append an audit log entry. Never log raw PII in metadata."""

    log = AuditLog(actor_user_id=actor_user_id, action=action, event_metadata=metadata, ip_address=None)
    db.add(log)
    await db.flush()


async def register_user(db: AsyncSession, data: RegisterRequest) -> User:
    """Create a new user account with a wallet, status pending until OTP verified."""

    existing = await db.execute(
        select(User).where((User.email == data.email) | (User.phone == data.phone))
    )
    existing_user = existing.scalar_one_or_none()
    if existing_user is not None:
        raise ValueError("An account with this email or phone already exists.")

    user = User(
        name=data.name,
        email=data.email,
        phone=data.phone,
        password_hash=hash_password(data.password),
        status=UserStatus.PENDING,
    )
    db.add(user)
    await db.flush()

    wallet = Wallet(user_id=user.id, balance=0, status=WalletStatus.ACTIVE)
    db.add(wallet)

    await _write_audit_log(db, user.id, "user.register", {"has_email": bool(data.email), "has_phone": bool(data.phone)})
    await db.commit()
    return user


async def send_otp(identifier: str) -> None:
    """Generate and store a hashed OTP in Redis. Stub: real SMS/email send happens here later."""

    otp = generate_otp()
    otp_hash = hash_otp(otp, identifier)
    await redis_client.set(f"otp:{identifier}", otp_hash, ex=OTP_TTL_SECONDS)
    # TODO Phase 2+: integrate real SMS/email provider. For now, log to console in dev only.
    if settings.app_env == "development":
        print(f"[DEV ONLY] OTP for {identifier}: {otp}")


async def verify_otp(db: AsyncSession, identifier: str, code: str) -> bool:
    """Verify a submitted OTP and activate the user if currently pending."""

    stored_hash = await redis_client.get(f"otp:{identifier}")
    if stored_hash is None:
        return False

    if not verify_otp_hash(code, identifier, stored_hash):
        return False

    await redis_client.delete(f"otp:{identifier}")

    result = await db.execute(select(User).where((User.email == identifier) | (User.phone == identifier)))
    user = result.scalar_one_or_none()
    if user is None:
        return False

    if user.status == UserStatus.PENDING:
        user.status = UserStatus.ACTIVE
        await _write_audit_log(db, user.id, "otp.verified", {})
        await db.commit()

    return True


async def login_user(db: AsyncSession, identifier: str, password: str) -> tuple[User, TokenResponse] | None:
    """Authenticate a user and issue an access + refresh token pair."""

    result = await db.execute(select(User).where((User.email == identifier) | (User.phone == identifier)))
    user = result.scalar_one_or_none()

    if user is None or user.password_hash is None:
        return None

    if not verify_password(password, user.password_hash):
        return None

    if user.status != UserStatus.ACTIVE:
        return None

    tokens = await _issue_token_pair(db, user)
    await _write_audit_log(db, user.id, "user.login", {})
    await db.commit()
    return user, tokens


async def _issue_token_pair(db: AsyncSession, user: User) -> TokenResponse:
    """Create a new access + refresh token pair and store the refresh token hash in Redis."""

    access_token = create_access_token(subject=str(user.id), claims={"role": user.role.value})
    refresh_token = create_refresh_token()
    refresh_hash = hash_token(refresh_token)

    await redis_client.set(f"refresh:{user.id}:{refresh_hash}", "1", ex=REFRESH_TTL_SECONDS)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.access_token_expires_minutes * 60,
    )


async def refresh_tokens(db: AsyncSession, user_id: str, refresh_token: str) -> TokenResponse | None:
    """Rotate a refresh token: validate old one, delete it, issue a brand new pair."""

    refresh_hash = hash_token(refresh_token)
    key = f"refresh:{user_id}:{refresh_hash}"

    exists = await redis_client.get(key)
    if exists is None:
        return None

    await redis_client.delete(key)

    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        return None

    tokens = await _issue_token_pair(db, user)
    await _write_audit_log(db, user.id, "token.refresh", {})
    await db.commit()
    return tokens


async def logout_user(db: AsyncSession, user_id: str, refresh_token: str | None) -> None:
    """Revoke a refresh token on logout."""

    if refresh_token:
        refresh_hash = hash_token(refresh_token)
        await redis_client.delete(f"refresh:{user_id}:{refresh_hash}")

    await _write_audit_log(db, UUID(user_id), "user.logout", {})
    await db.commit()