"""Common response schemas and envelope models."""

from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field


T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """Standard API response envelope."""

    model_config = ConfigDict(extra="forbid")

    data: T | None = None
    error: str | None = None
    meta: dict[str, str] = Field(default_factory=dict)
