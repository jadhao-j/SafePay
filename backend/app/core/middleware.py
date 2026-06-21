"""Middleware: JWT auth/RBAC, device fingerprinting, rate limiting."""

import time
from collections.abc import Awaitable, Callable

from fastapi import HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.core.config import get_settings
from app.core.redis import redis_client
from app.core.security import decode_token

settings = get_settings()

# Routes that don't require an access token
PUBLIC_PATHS = {
    "/health",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/api/v1/auth/register",
    "/api/v1/auth/login",
    "/api/v1/auth/otp/send",
    "/api/v1/auth/otp/verify",
    "/api/v1/payments/qr/generate",
}


class RBACMiddleware(BaseHTTPMiddleware):
    """Extracts and verifies JWT from Authorization header for protected routes."""

    # These paths accept an expired access token — they only need to know WHO
    # is asking, not whether their session is still fresh.
    EXPIRY_EXEMPT_PATHS = {"/api/v1/auth/refresh", "/api/v1/auth/logout"}

    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        if request.url.path in PUBLIC_PATHS or request.method == "OPTIONS":
            return await call_next(request)

        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={"detail": "Missing access token."})

        token = auth_header.removeprefix("Bearer ").strip()

        try:
            if request.url.path in self.EXPIRY_EXEMPT_PATHS:
                from app.core.security import decode_token_ignore_expiry
                payload = decode_token_ignore_expiry(token)
            else:
                payload = decode_token(token)
        except Exception:
            return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={"detail": "Invalid or expired token."})

        request.state.user_id = payload.get("sub")
        request.state.role = payload.get("role", "user")

        return await call_next(request)


class DeviceFingerprintMiddleware(BaseHTTPMiddleware):
    """Reads device fingerprint headers and attaches them to request.state."""

    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        request.state.device_id = request.headers.get("X-Device-ID")
        request.state.device_name = request.headers.get("X-Device-Name")
        request.state.os_signature = request.headers.get("X-OS-Signature")
        return await call_next(request)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Sliding-window rate limit using Redis, keyed by client IP + path."""

    WINDOW_SECONDS = 60
    MAX_REQUESTS = 60  # generous default; auth endpoints get a stricter check below

    AUTH_PATHS = {"/api/v1/auth/login", "/api/v1/auth/otp/send", "/api/v1/auth/register"}
    AUTH_MAX_REQUESTS = 10

    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path
        is_auth_path = path in self.AUTH_PATHS
        limit = self.AUTH_MAX_REQUESTS if is_auth_path else self.MAX_REQUESTS

        key = f"ratelimit:{client_ip}:{path}"
        current = await redis_client.incr(key)
        if current == 1:
            await redis_client.expire(key, self.WINDOW_SECONDS)

        if current > limit:
            ttl = await redis_client.ttl(key)
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Too many requests. Please slow down."},
                headers={"Retry-After": str(max(ttl, 1))},
            )

        return await call_next(request)