"""Application settings loaded from environment variables and .env files."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed SafePay backend settings."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = Field(default="SafePay")
    app_version: str = Field(default="0.1.0")
    app_env: str = Field(default="development")
    backend_host: str = Field(default="0.0.0.0")
    backend_port: int = Field(default=8000)
    database_url: str = Field(default="postgresql+asyncpg://postgres:postgres@localhost:5432/safepay")
    redis_url: str = Field(default="redis://localhost:6379/0")
    cors_origins: str = Field(default="http://localhost:3000")
    jwt_secret: str = Field(default="")
    jwt_refresh_secret: str = Field(default="")
    jwt_algorithm: str = Field(default="HS256")
    access_token_expires_minutes: int = Field(default=15)
    refresh_token_expires_days: int = Field(default=7)
    device_fingerprint_salt: str = Field(default="")
    log_level: str = Field(default="info")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached application settings."""

    return Settings()
