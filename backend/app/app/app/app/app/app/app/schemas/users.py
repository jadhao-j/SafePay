"""User schemas."""

from pydantic import BaseModel, EmailStr, Field, field_validator


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


class PinUpdate(BaseModel):
    """Payload for setting or changing the transaction PIN."""

    pin: str = Field(min_length=4, max_length=4, description="Exactly 4 numeric digits.")

    @field_validator("pin")
    @classmethod
    def pin_must_be_numeric(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("PIN must contain only digits.")
        return v
