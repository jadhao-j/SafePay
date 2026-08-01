"""Admin schemas."""

from pydantic import BaseModel


class OverviewMetrics(BaseModel):
    """Admin dashboard overview metrics."""

    total_transactions: int = 0
    blocked_transactions: int = 0
