"""Contacts router — Phase 11D."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import get_current_user_id
from app.models.contact import Contact

router = APIRouter(prefix="/contacts", tags=["contacts"])


class ContactCreate(BaseModel):
    name: str
    phone: str | None = None
    upi_id: str | None = None


@router.get("/", status_code=status.HTTP_200_OK)
async def list_contacts(
    search: str = Query(default="", description="Search by name or phone"),
    db: AsyncSession = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    """List saved contacts for the current user."""
    query = select(Contact).where(Contact.owner_user_id == user_id).order_by(Contact.name)
    if search:
        pattern = f"%{search}%"
        query = query.where(
            (Contact.name.ilike(pattern)) | (Contact.phone.ilike(pattern))
        )
    result = await db.execute(query)
    contacts = result.scalars().all()
    return {
        "contacts": [
            {
                "id": str(c.id),
                "name": c.name,
                "phone": c.phone,
                "upi_id": c.upi_id,
                "created_at": c.created_at.isoformat(),
            }
            for c in contacts
        ]
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_contact(
    payload: ContactCreate,
    db: AsyncSession = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    """Save a new contact."""
    if not payload.phone and not payload.upi_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one of phone or upi_id is required.",
        )
    contact = Contact(
        owner_user_id=user_id,
        name=payload.name,
        phone=payload.phone,
        upi_id=payload.upi_id,
    )
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    return {
        "id": str(contact.id),
        "name": contact.name,
        "phone": contact.phone,
        "upi_id": contact.upi_id,
    }


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(
    contact_id: UUID,
    db: AsyncSession = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    """Delete a saved contact."""
    result = await db.execute(
        select(Contact).where(Contact.id == contact_id, Contact.owner_user_id == user_id)
    )
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found.")
    await db.delete(contact)
    await db.commit()
