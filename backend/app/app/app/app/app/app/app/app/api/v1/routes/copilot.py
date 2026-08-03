"""AI Copilot router — Phase 9."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import get_current_user_id
from app.schemas.copilot import CopilotAnswer, CopilotQuestion
from app.services.copilot_service import answer_question

router = APIRouter(prefix="/copilot", tags=["copilot"])


@router.post("/ask", response_model=CopilotAnswer, status_code=status.HTTP_200_OK)
async def ask_copilot(
    payload: CopilotQuestion,
    db: AsyncSession = Depends(get_session),
    user_id=Depends(get_current_user_id),
) -> CopilotAnswer:
    """Ask the SafePay AI Copilot a question about a transaction, risk score, or security action.

    Pass an optional ``transaction_id`` to ground the answer in real DB data.
    """
    result = await answer_question(
        question=payload.question,
        transaction_id=payload.transaction_id,
        user_id=user_id,
        db=db,
    )
    return CopilotAnswer(
        answer=result["answer"],
        sources=result.get("sources", []),
        tool_used=result.get("tool_used"),
        grounded=result.get("grounded", False),
    )
