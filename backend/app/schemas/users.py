"""User schemas."""

from pydantic import BaseModel, EmailStr, Field


class UserRead(BaseModel):
    """Read model for user profile data."""

    id: str
    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    role: str
    status: str


class UserUpdate(BaseModel):
    """Update payload for user profile data."""

    name: str | None = Field(default=None, min_length=1)
    phone: str | None = None
