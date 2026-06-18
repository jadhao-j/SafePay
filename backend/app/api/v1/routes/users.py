"""User profile and device management router stubs."""

from fastapi import APIRouter, HTTPException, status

from app.schemas.users import UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def get_me() -> dict[str, str]:
    """Return the current user's profile."""

    raise HTTPException(status_code=501, detail="User profile retrieval will return the authenticated user's account data.")


@router.patch("/me", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def update_me(payload: UserUpdate) -> dict[str, str]:
    """Update the current user's profile."""

    raise HTTPException(status_code=501, detail="Profile updates will validate and persist user changes.")


@router.get("/me/devices", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def list_devices() -> dict[str, str]:
    """List trusted and recent devices for the current user."""

    raise HTTPException(status_code=501, detail="Device listing will return the user's registered devices and trust status.")


@router.delete("/me/devices/{device_id}", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def revoke_device(device_id: str) -> dict[str, str]:
    """Revoke a trusted device."""

    raise HTTPException(status_code=501, detail=f"Device revocation will disable device {device_id} for the current user.")


@router.get("/me/security-score", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def get_security_score() -> dict[str, str]:
    """Return the user's current security score."""

    raise HTTPException(status_code=501, detail="Security score retrieval will return the derived trust and safety score.")
