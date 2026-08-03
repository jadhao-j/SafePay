"""Create Phase 11 tables: notifications and contacts.

Run inside the backend container:
  python /app/migrate_phase11.py
"""
import asyncio
from sqlalchemy import text
from app.core.database import async_session_factory


CREATE_NOTIFICATIONS = """
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    ref_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS ix_notifications_read ON notifications(user_id, read);
"""

CREATE_CONTACTS = """
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    upi_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_contact_owner_phone UNIQUE (owner_user_id, phone)
);
CREATE INDEX IF NOT EXISTS ix_contacts_owner_user_id ON contacts(owner_user_id);
"""


async def migrate():
    statements = [
        # notifications table
        """CREATE TABLE IF NOT EXISTS notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type VARCHAR(50) NOT NULL,
            title VARCHAR(200) NOT NULL,
            body TEXT NOT NULL,
            read BOOLEAN NOT NULL DEFAULT FALSE,
            ref_id VARCHAR(100),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )""",
        "CREATE INDEX IF NOT EXISTS ix_notifications_user_id ON notifications(user_id)",
        "CREATE INDEX IF NOT EXISTS ix_notifications_read ON notifications(user_id, read)",
        # contacts table
        """CREATE TABLE IF NOT EXISTS contacts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(100) NOT NULL,
            phone VARCHAR(20),
            upi_id VARCHAR(100),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT uq_contact_owner_phone UNIQUE (owner_user_id, phone)
        )""",
        "CREATE INDEX IF NOT EXISTS ix_contacts_owner_user_id ON contacts(owner_user_id)",
    ]
    async with async_session_factory() as db:
        for stmt in statements:
            await db.execute(text(stmt))
        await db.commit()
        print("✅ Phase 11 tables created: notifications, contacts")


asyncio.run(migrate())
