"""AI copilot router stubs."""

from fastapi import APIRouter, HTTPException, status

from app.schemas.copilot import CopilotQuestion

router = APIRouter(prefix="/copilot", tags=["copilot"])


@router.post("/ask", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def ask_copilot(payload: CopilotQuestion) -> dict[str, str]:
    """Ask the SafePay copilot a question."""

    raise HTTPException(status_code=501, detail="Copilot answers will explain transactions, risk, and security actions.")
