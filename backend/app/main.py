"""FastAPI application factory for SafePay backend."""

import logging
from collections.abc import Callable

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes import admin, auth, behavior, blockchain, copilot, fraud, payments, users, wallet
from app.core.config import get_settings
from app.core.middleware import DeviceFingerprintMiddleware, RBACMiddleware, RateLimitMiddleware


def configure_logging() -> None:
    """Configure structured JSON logging for the application."""

    logging.basicConfig(level=logging.INFO, format="%(message)s")
    structlog.configure(
        processors=[
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        cache_logger_on_first_use=True,
    )


def create_app() -> FastAPI:
    """Build and configure the FastAPI application."""

    settings = get_settings()
    configure_logging()

    app = FastAPI(title=settings.app_name, version=settings.app_version, docs_url="/docs", redoc_url="/redoc")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RBACMiddleware)
    app.add_middleware(DeviceFingerprintMiddleware)
    app.add_middleware(RateLimitMiddleware)

    app.include_router(auth.router, prefix="/api/v1")
    app.include_router(users.router, prefix="/api/v1")
    app.include_router(wallet.router, prefix="/api/v1")
    app.include_router(payments.router, prefix="/api/v1")
    app.include_router(fraud.router, prefix="/api/v1")
    app.include_router(behavior.router, prefix="/api/v1")
    app.include_router(blockchain.router, prefix="/api/v1")
    app.include_router(admin.router, prefix="/api/v1")
    app.include_router(copilot.router, prefix="/api/v1")

    @app.get("/health")
    async def health() -> dict:
        """Return service health — checks postgres and redis."""
        import asyncpg
        import redis.asyncio as aioredis

        settings = get_settings()
        pg_ok = False
        redis_ok = False

        try:
            conn = await asyncpg.connect(
                settings.database_url.replace("+asyncpg", "")
            )
            await conn.execute("SELECT 1")
            await conn.close()
            pg_ok = True
        except Exception:
            pg_ok = False

        try:
            r = aioredis.from_url(settings.redis_url)
            await r.ping()
            await r.aclose()
            redis_ok = True
        except Exception:
            redis_ok = False

        return {
            "status": "ok" if pg_ok and redis_ok else "degraded",
            "version": settings.app_version,
            "services": {
                "postgres": "ok" if pg_ok else "fail",
                "redis": "ok" if redis_ok else "fail"
            }
        }

    return app


app = create_app()
