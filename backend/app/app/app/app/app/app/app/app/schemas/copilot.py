"""Copilot schemas."""

from pydantic import BaseModel, Field


class CopilotQuestion(BaseModel):
    """Copilot question payload."""

    question: str = Field(min_length=1)
    transaction_id: str | None = Field(default=None, description="Optional transaction UUID for grounded answers.")


class CopilotAnswer(BaseModel):
    """Copilot answer response model."""

    answer: str
    sources: list[str] = Field(default_factory=list, description="DB record IDs consulted to produce this answer.")
    tool_used: str | None = Field(default=None, description="Agent tool that was invoked.")
    grounded: bool = Field(default=False, description="True when the answer is grounded in real DB data.")
