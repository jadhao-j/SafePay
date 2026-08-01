"""Database base imports — exposes Base and all models for Alembic autogenerate."""
from app.models.base import Base  # noqa: F401

# Import all models here so Alembic can detect them
from app.models.identity import *  # noqa: F401, F403
from app.models.payments import *  # noqa: F401, F403
from app.models.fraud import *  # noqa: F401, F403
from app.models.blockchain import *  # noqa: F401, F403
from app.models.federated import *  # noqa: F401, F403

__all__ = ["Base"]