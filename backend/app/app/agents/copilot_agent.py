"""LangGraph AI Copilot agent for SafePay.

Architecture
------------
* Three tools backed by real DB queries — no hallucinations.
* LLM: gemini-1.5-flash via langchain-google-genai (optional).
* Fallback: deterministic rule-based answers when GEMINI_API_KEY is absent.

Tool inventory
--------------
explain_transaction      → FraudScore + FraudExplanation lookup
explain_risk_score       → Narrates component breakdown (behavioral/device/tx/ML)
recommend_security_action → Returns recommended_action stored in FraudExplanation
"""

from __future__ import annotations

import json
import logging
from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.fraud import FraudExplanation, FraudScore
from app.models.payments import Transaction

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Pure DB helpers (tools) — user_id scoped for security
# ---------------------------------------------------------------------------

async def _get_score_and_explanation(
    transaction_id: str,
    user_id: UUID,
    db: AsyncSession,
) -> dict[str, Any] | None:
    """Fetch fraud score + explanation for a transaction, scoped to user_id."""
    try:
        tx_result = await db.execute(
            select(Transaction).where(Transaction.id == transaction_id)
        )
        tx = tx_result.scalar_one_or_none()
        if tx is None:
            return None

        # Verify the transaction belongs to the requesting user via sender wallet
        from app.models.payments import Wallet  # avoid circular at module level
        wallet_result = await db.execute(
            select(Wallet).where(Wallet.id == tx.sender_wallet_id)
        )
        wallet = wallet_result.scalar_one_or_none()
        if wallet is None or wallet.user_id != user_id:
            return None  # silently deny access to other users' data

        score_result = await db.execute(
            select(FraudScore).where(FraudScore.transaction_id == tx.id)
        )
        score = score_result.scalar_one_or_none()
        if score is None:
            return None

        exp_result = await db.execute(
            select(FraudExplanation).where(FraudExplanation.fraud_score_id == score.id)
        )
        explanation = exp_result.scalar_one_or_none()

        return {
            "transaction_id": str(tx.id),
            "amount": str(tx.amount),
            "currency": tx.currency,
            "payment_type": tx.payment_type.value if hasattr(tx.payment_type, "value") else str(tx.payment_type),
            "status": tx.status.value if hasattr(tx.status, "value") else str(tx.status),
            "final_risk_score": float(score.final_risk_score),
            "behavioral_risk": float(score.behavioral_deviation_score),
            "device_risk": float(score.device_risk_score),
            "transaction_risk": float(score.transaction_deviation_score),
            "ml_risk": float(score.synthetic_identity_score),
            "decision": score.decision.value if hasattr(score.decision, "value") else str(score.decision),
            "model_version": score.model_version,
            "explanation_text": explanation.explanation_text if explanation else "No explanation recorded.",
            "top_factors": explanation.top_factors if explanation else [],
            "confidence": float(explanation.confidence) if explanation else 0.0,
            "recommended_action": explanation.recommended_action if explanation else "Contact support.",
            "fraud_score_id": str(score.id),
            "explanation_id": str(explanation.id) if explanation else None,
        }
    except Exception as exc:
        logger.warning("copilot tool lookup failed: %s", exc)
        return None


async def tool_explain_transaction(transaction_id: str, user_id: UUID, db: AsyncSession) -> dict[str, Any]:
    """Tool: explain what happened with a specific transaction."""
    data = await _get_score_and_explanation(transaction_id, user_id, db)
    if data is None:
        return {"error": "Transaction not found or not accessible.", "grounded": False}
    return {**data, "grounded": True}


async def tool_explain_risk_score(transaction_id: str, user_id: UUID, db: AsyncSession) -> dict[str, Any]:
    """Tool: narrate the risk score breakdown for a transaction."""
    data = await _get_score_and_explanation(transaction_id, user_id, db)
    if data is None:
        return {"error": "No risk score data found for that transaction.", "grounded": False}

    breakdown = {
        "final_risk_score": data["final_risk_score"],
        "behavioral_risk_contribution": f"{data['behavioral_risk']:.2f} (35% weight) — {'HIGH' if data['behavioral_risk'] > 0.6 else 'MEDIUM' if data['behavioral_risk'] > 0.3 else 'LOW'}",
        "transaction_risk_contribution": f"{data['transaction_risk']:.2f} (30% weight) — {'HIGH' if data['transaction_risk'] > 0.6 else 'MEDIUM' if data['transaction_risk'] > 0.3 else 'LOW'}",
        "device_risk_contribution": f"{data['device_risk']:.2f} (20% weight) — {'HIGH' if data['device_risk'] > 0.6 else 'MEDIUM' if data['device_risk'] > 0.3 else 'LOW'}",
        "ml_model_contribution": f"{data['ml_risk']:.2f} (15% weight) — {'HIGH' if data['ml_risk'] > 0.6 else 'MEDIUM' if data['ml_risk'] > 0.3 else 'LOW'}",
        "top_factors": data["top_factors"],
        "model_version": data["model_version"],
        "decision": data["decision"],
        "grounded": True,
    }
    return breakdown


async def tool_recommend_security_action(transaction_id: str, user_id: UUID, db: AsyncSession) -> dict[str, Any]:
    """Tool: return the recommended security action for a transaction."""
    data = await _get_score_and_explanation(transaction_id, user_id, db)
    if data is None:
        return {
            "error": "No data found for that transaction.",
            "recommended_action": "Please contact SafePay support.",
            "grounded": False,
        }
    return {
        "decision": data["decision"],
        "recommended_action": data["recommended_action"],
        "explanation_text": data["explanation_text"],
        "confidence": data["confidence"],
        "grounded": True,
    }


# ---------------------------------------------------------------------------
# Deterministic fallback (no LLM required)
# ---------------------------------------------------------------------------

def _deterministic_answer(question: str, tool_result: dict[str, Any], tool_name: str) -> str:
    """Rule-based answer composer — used when Gemini API key is absent."""
    if tool_result.get("error"):
        return (
            f"I couldn't find information for that transaction. "
            f"Details: {tool_result['error']}"
        )

    q_lower = question.lower()

    if "blocked" in q_lower or "block" in q_lower or "decline" in q_lower or "denied" in q_lower:
        explanation = tool_result.get("explanation_text", "")
        action = tool_result.get("recommended_action", "Contact support.")
        score = tool_result.get("final_risk_score") or tool_result.get("confidence", 0)
        return (
            f"Your payment was blocked because: {explanation}\n\n"
            f"Risk score: {score:.2f} (scale 0–1, where >0.7 triggers a block).\n\n"
            f"What to do next: {action}"
        )

    if "challeng" in q_lower or "otp" in q_lower or "verify" in q_lower:
        explanation = tool_result.get("explanation_text", "")
        return (
            f"Your payment was flagged for extra verification because: {explanation}\n\n"
            f"An OTP challenge was issued as a precautionary step. "
            f"If you completed the OTP, the payment should have processed normally."
        )

    if "risk" in q_lower or "score" in q_lower:
        b = tool_result.get("behavioral_risk_contribution") or str(tool_result.get("behavioral_risk", "N/A"))
        d = tool_result.get("device_risk_contribution") or str(tool_result.get("device_risk", "N/A"))
        t = tool_result.get("transaction_risk_contribution") or str(tool_result.get("transaction_risk", "N/A"))
        ml = tool_result.get("ml_model_contribution") or str(tool_result.get("ml_risk", "N/A"))
        final = tool_result.get("final_risk_score", "N/A")
        return (
            f"Here is the risk score breakdown for your transaction:\n\n"
            f"• Overall risk: {final}\n"
            f"• Behavioral signals: {b}\n"
            f"• Device trust: {d}\n"
            f"• Transaction amount: {t}\n"
            f"• ML model score: {ml}\n\n"
            f"The formula is: 35% behavioral + 30% transaction + 20% device + 15% ML."
        )

    if "security" in q_lower or "improve" in q_lower or "action" in q_lower or "recommend" in q_lower:
        action = tool_result.get("recommended_action", "Contact SafePay support for guidance.")
        confidence = tool_result.get("confidence", 0)
        return (
            f"Recommended action: {action}\n\n"
            f"(Confidence in this assessment: {confidence:.0%})"
        )

    # Generic fallback
    explanation = (
        tool_result.get("explanation_text")
        or tool_result.get("recommended_action")
        or "I have retrieved the transaction data but couldn't match a specific question pattern."
    )
    return explanation


# ---------------------------------------------------------------------------
# LLM-powered answer (Gemini via LangChain)
# ---------------------------------------------------------------------------

def _build_llm_prompt(question: str, tool_result: dict[str, Any]) -> str:
    """Compose the prompt for the LLM given a user question and grounded tool data."""
    data_block = json.dumps(tool_result, indent=2, default=str)
    return f"""You are SafePay Copilot, an AI assistant that helps users understand their payment security.

IMPORTANT RULES:
- Answer ONLY from the DATA BLOCK below. Do not add facts, scores, or reasons not present in the data.
- Be concise, empathetic, and clear. Use plain language — no jargon.
- If the data shows a blocked payment, explain why using the explanation_text field.
- If the data shows a risk score, narrate the components in plain English.
- If asked for next steps, use the recommended_action field.
- Never make up transaction IDs, amounts, or dates.

DATA BLOCK (grounded facts):
{data_block}

USER QUESTION:
{question}

Answer:"""


async def _gemini_answer(question: str, tool_result: dict[str, Any], api_key: str) -> str:
    """Call Gemini 1.5 Flash to produce a grounded answer."""
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.messages import HumanMessage

        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=api_key,
            temperature=0.2,
            max_tokens=512,
        )
        prompt = _build_llm_prompt(question, tool_result)
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        return str(response.content).strip()
    except Exception as exc:
        logger.warning("Gemini call failed, falling back to deterministic: %s", exc)
        return _deterministic_answer(question, tool_result, "gemini_fallback")


# ---------------------------------------------------------------------------
# Public entry point — called by copilot_service
# ---------------------------------------------------------------------------

async def run_copilot(
    question: str,
    transaction_id: str | None,
    user_id: UUID,
    db: AsyncSession,
    gemini_api_key: str = "",
) -> dict[str, Any]:
    """Orchestrate copilot: choose tool → fetch data → produce answer.

    Returns a dict with keys: answer, sources, tool_used, grounded.
    """
    q_lower = question.lower()

    # --- Tool routing ---
    if transaction_id:
        # Route by question intent
        if "risk" in q_lower or "score" in q_lower or "breakdown" in q_lower:
            tool_name = "explain_risk_score"
            tool_result = await tool_explain_risk_score(transaction_id, user_id, db)
        elif (
            "action" in q_lower
            or "security" in q_lower
            or "improve" in q_lower
            or "recommend" in q_lower
            or "next" in q_lower
        ):
            tool_name = "recommend_security_action"
            tool_result = await tool_recommend_security_action(transaction_id, user_id, db)
        else:
            # Default: explain the transaction (blocked/challenge/general)
            tool_name = "explain_transaction"
            tool_result = await tool_explain_transaction(transaction_id, user_id, db)
    else:
        # No transaction_id — answer generically
        return {
            "answer": (
                "To give you a grounded answer, I need a transaction ID. "
                "You can find this in your transaction history or in any fraud alert. "
                "Try asking: \"Why was transaction <ID> blocked?\""
            ),
            "sources": [],
            "tool_used": None,
            "grounded": False,
        }

    grounded = tool_result.get("grounded", False)

    # Collect source IDs for the UI to display
    sources: list[str] = []
    if tool_result.get("transaction_id"):
        sources.append(f"transaction:{tool_result['transaction_id']}")
    if tool_result.get("fraud_score_id"):
        sources.append(f"fraud_score:{tool_result['fraud_score_id']}")
    if tool_result.get("explanation_id"):
        sources.append(f"explanation:{tool_result['explanation_id']}")

    # --- Answer generation ---
    if gemini_api_key and grounded:
        answer = await _gemini_answer(question, tool_result, gemini_api_key)
    else:
        answer = _deterministic_answer(question, tool_result, tool_name)

    return {
        "answer": answer,
        "sources": sources,
        "tool_used": tool_name,
        "grounded": grounded,
    }
