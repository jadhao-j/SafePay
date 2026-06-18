"""Admin and SOC router stubs."""

from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard/overview", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def dashboard_overview(window: str = "24h") -> dict[str, str]:
    """Return the admin overview dashboard data."""

    raise HTTPException(status_code=501, detail="Admin overview will return KPIs and fraud monitoring summaries.")


@router.get("/dashboard/heatmap", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def dashboard_heatmap(granularity: str = "day") -> dict[str, str]:
    """Return fraud heatmap data."""

    raise HTTPException(status_code=501, detail="Heatmap data will return geographic and categorical fraud distribution.")


@router.get("/devices", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def admin_devices(cursor: str | None = None, limit: int = 50) -> dict[str, str]:
    """Return device intelligence data."""

    raise HTTPException(status_code=501, detail="Admin device view will return flagged device intelligence records.")


@router.get("/merchants", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def admin_merchants(cursor: str | None = None, limit: int = 50) -> dict[str, str]:
    """Return merchant intelligence data."""

    raise HTTPException(status_code=501, detail="Merchant management will return merchant risk and reputation data.")


@router.get("/investigations", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def admin_investigations(status_filter: str | None = None, cursor: str | None = None, limit: int = 50) -> dict[str, str]:
    """Return fraud investigations for analysts."""

    raise HTTPException(status_code=501, detail="Investigation listing will return open and resolved fraud cases.")
