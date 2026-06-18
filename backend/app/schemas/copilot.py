"""Copilot schemas."""

from pydantic import BaseModel, Field


class CopilotQuestion(BaseModel):
    """Copilot question payload."""

    question: str = Field(min_length=1)


class CopilotAnswer(BaseModel):
    """Copilot answer response model."""

    answer: str
