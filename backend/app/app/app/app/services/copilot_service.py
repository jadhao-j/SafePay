"""Copilot service — 3 DB-grounded tools + LLM answer generation.

Architecture
------------
Three tool functions query the DB scoped to the authenticated user_id.
answer_question() routes by intent, calls the right tool, then either
invokes Gemini 1.5 Flash (if GEMINI_API_KEY is set) or falls back to
a deterministic rule-based response.  No hallucinations — all facts
come from fraud_scores and fraud_explanations rows.

Tool inventory
--------------
  _tool_explain_transaction       → FraudScore + FraudExplanation lookup
  _tool_explain_risk_score        → component breakdown narration
  _tool_recommend_security_action → recommended_action from DB
"""

from __future__ import annotations

import json
import logging
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.fraud import FraudExplanation, FraudScore
from app.models.payments import Transaction, Wallet

logger = logging.getLogger(__name__)


# ── DB helpers (internal) ────────────────────────────────────────────────────

async def _fetch_fraud_data(
    transaction_id: str,
    user_id: UUID,
    db: AsyncSession,
) -> dict[str, Any] | None:
    """Core lookup: FraudScore + FraudExplanation for a transaction.

    Returns None if not found OR if the transaction doesn't belong to user_id.
    This enforces user-scoping — no cross-user data leakage.
    """
    try:
        # 1. Resolve transaction
        tx_result = await db.execute(
            select(Transaction).where(Transaction.id == transaction_id)
        )
        tx = tx_result.scalar_one_or_none()
        if tx is None:
            return None

        # 2. Scope check — sender wallet must belong to authenticated user
        if tx.sender_wallet_id is not None:
            wallet_result = await db.execute(
                select(Wallet).where(Wallet.id == tx.sender_wallet_id)
            )
            wallet = wallet_result.scalar_one_or_none()
            if wallet is None or wallet.user_id != user_id:
                return None  # silently deny; caller returns "not found" answer

        # 3. Fraud score
        score_result = await db.execute(
            select(FraudScore).where(FraudScore.transaction_id == tx.id)
        )
        score = score_result.scalar_one_or_none()
        if score is None:
            return None

        # 4. Explanation (may be absent for very old rows)
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
            # Source IDs for the chat UI provenance panel
            "fraud_score_id": str(score.id),
            "explanation_id": str(explanation.id) if explanation else None,
        }
    except Exception as exc:
        logger.warning("copilot DB lookup failed: %s", exc)
        return None


# ── Tool functions ───────────────────────────────────────────────────────────

async def _tool_explain_transaction(
    transaction_id: str, user_id: UUID, db: AsyncSession
) -> dict[str, Any]:
    """Tool: explain what happened with a specific transaction."""
    data = await _fetch_fraud_data(transaction_id, user_id, db)
    if data is None:
        return {
            "error": "Transaction not found or you don't have access to it.",
            "grounded": False,
        }
    return {**data, "grounded": True}


async def _tool_explain_risk_score(
    transaction_id: str, user_id: UUID, db: AsyncSession
) -> dict[str, Any]:
    """Tool: narrate the weighted risk score breakdown."""
    data = await _fetch_fraud_data(transaction_id, user_id, db)
    if data is None:
        return {"error": "No risk score data found for that transaction.", "grounded": False}

    def _level(v: float) -> str:
        return "HIGH" if v > 0.6 else "MEDIUM" if v > 0.3 else "LOW"

    return {
        "final_risk_score": data["final_risk_score"],
        "decision": data["decision"],
        "behavioral_risk_contribution": f"{data['behavioral_risk']:.2f} (35% weight) — {_level(data['behavioral_risk'])}",
        "transaction_risk_contribution": f"{data['transaction_risk']:.2f} (30% weight) — {_level(data['transaction_risk'])}",
        "device_risk_contribution": f"{data['device_risk']:.2f} (20% weight) — {_level(data['device_risk'])}",
        "ml_model_contribution": f"{data['ml_risk']:.2f} (15% weight) — {_level(data['ml_risk'])}",
        "top_factors": data["top_factors"],
        "model_version": data["model_version"],
        "fraud_score_id": data["fraud_score_id"],
        "explanation_id": data.get("explanation_id"),
        "grounded": True,
    }


async def _tool_recommend_security_action(
    transaction_id: str, user_id: UUID, db: AsyncSession
) -> dict[str, Any]:
    """Tool: return the recommended security action stored in fraud_explanations."""
    data = await _fetch_fraud_data(transaction_id, user_id, db)
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
        "fraud_score_id": data["fraud_score_id"],
        "explanation_id": data.get("explanation_id"),
        "grounded": True,
    }


# ── Deterministic fallback (no LLM) ─────────────────────────────────────────

def _deterministic_answer(question: str, tool_result: dict[str, Any]) -> str:
    """Rule-based answer — used when GEMINI_API_KEY is absent or Gemini call fails."""
    if tool_result.get("error"):
        return (
            f"I couldn't find information for that transaction. "
            f"Details: {tool_result['error']}"
        )

    q = question.lower()

    if any(w in q for w in ("blocked", "block", "declined", "denied", "reject")):
        exp = tool_result.get("explanation_text", "")
        action = tool_result.get("recommended_action", "Contact support.")
        score = tool_result.get("final_risk_score", 0)
        return (
            f"Your payment was **blocked** because: {exp}\n\n"
            f"Overall risk score: {score:.2f} / 1.00  (threshold > 0.70 triggers a block).\n\n"
            f"What to do next: {action}"
        )

    if any(w in q for w in ("challeng", "otp", "verify", "verification")):
        exp = tool_result.get("explanation_text", "")
        return (
            f"Your payment was **challenged** (asked for OTP) because: {exp}\n\n"
            "Completing the OTP confirms your identity and allows the payment through."
        )

    if any(w in q for w in ("risk", "score", "breakdown", "component")):
        b = tool_result.get("behavioral_risk_contribution", str(tool_result.get("behavioral_risk", "N/A")))
        t = tool_result.get("transaction_risk_contribution", str(tool_result.get("transaction_risk", "N/A")))
        d = tool_result.get("device_risk_contribution", str(tool_result.get("device_risk", "N/A")))
        ml = tool_result.get("ml_model_contribution", str(tool_result.get("ml_risk", "N/A")))
        final = tool_result.get("final_risk_score", "N/A")
        return (
            f"Risk score breakdown for your transaction:\n\n"
            f"• **Overall risk**: {final}\n"
            f"• **Behavioral signals**: {b}\n"
            f"• **Transaction amount**: {t}\n"
            f"• **Device trust**: {d}\n"
            f"• **ML model**: {ml}\n\n"
            "Formula: 35% behavioral + 30% transaction + 20% device + 15% ML."
        )

    if any(w in q for w in ("security", "improve", "action", "recommend", "next", "help")):
        action = tool_result.get("recommended_action", "Contact SafePay support.")
        conf = tool_result.get("confidence", 0)
        return f"Recommended action: {action}\n\n(System confidence: {conf:.0%})"

    # Generic fallback
    return (
        tool_result.get("explanation_text")
        or tool_result.get("recommended_action")
        or "I retrieved your transaction data but couldn't match a specific question. "
           "Try asking: 'Why was my payment blocked?' or 'What is my risk score?'"
    )


# ── Gemini LLM answer ────────────────────────────────────────────────────────

def _build_prompt(question: str, tool_result: dict[str, Any]) -> str:
    data_block = json.dumps(tool_result, indent=2, default=str)
    return f"""You are SafePay Copilot, an AI assistant helping users understand payment security.

RULES (follow strictly):
- Answer ONLY using facts present in the DATA BLOCK below. Never invent scores, amounts, or reasons.
- Be concise, empathetic, and use plain language — no jargon.
- For blocked payments: explain using explanation_text, state the risk score, then give recommended_action.
- For risk scores: narrate each component (behavioral/transaction/device/ML) in plain English.
- For security actions: quote recommended_action from the data.
- If data has an "error" key: tell the user the transaction wasn't found and ask them to check the ID.

DATA BLOCK (grounded facts only):
{data_block}

USER QUESTION:
{question}

Answer (plain English, 3–6 sentences max):"""


async def _gemini_answer(question: str, tool_result: dict[str, Any], api_key: str) -> str:
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.messages import HumanMessage

        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=api_key,
            temperature=0.15,
            max_tokens=400,
        )
        response = await llm.ainvoke([HumanMessage(content=_build_prompt(question, tool_result))])
        content = str(response.content).strip() if response.content else ""

        # Gemini sometimes returns empty content (safety filter / empty output error)
        if not content or "model output must contain" in content.lower():
            logger.warning("Gemini returned empty/invalid content — using deterministic fallback")
            return _deterministic_answer(question, tool_result)

        return content
    except Exception as exc:
        logger.warning("Gemini call failed — using deterministic fallback: %s", exc)
        return _deterministic_answer(question, tool_result)


# ── General question handler (no transaction_id) ────────────────────────────

async def _handle_general_question(
    question: str,
    user_id: UUID,
    db: AsyncSession,
    settings: Any,
) -> dict[str, Any]:
    """Answer general questions (balance, risk, security) using live user data."""
    from app.models.identity import User
    from decimal import Decimal

    q = question.lower()

    try:
        # Fetch wallet balance
        wallet_result = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
        wallet = wallet_result.scalar_one_or_none()
        balance = float(wallet.balance) if wallet else 0.0
        currency = wallet.currency if wallet else "INR"

        # Fetch last 5 transactions
        tx_result = await db.execute(
            select(Transaction)
            .where(Transaction.sender_wallet_id == wallet.id if wallet else Transaction.id == None)
            .order_by(Transaction.created_at.desc())  # type: ignore[attr-defined]
            .limit(5)
        )
        recent_txns = tx_result.scalars().all()

        # Fetch latest fraud score for user
        latest_score: FraudScore | None = None
        if recent_txns:
            for txn in recent_txns:
                score_result = await db.execute(
                    select(FraudScore).where(FraudScore.transaction_id == txn.id).limit(1)
                )
                score = score_result.scalar_one_or_none()
                if score:
                    latest_score = score
                    break

        # Build grounded context
        context: dict[str, Any] = {
            "wallet_balance": f"{balance:.2f} {currency}",
            "recent_transaction_count": len(recent_txns),
            "recent_transactions": [
                {
                    "id": str(t.id),
                    "amount": str(t.amount),
                    "status": t.status.value if hasattr(t.status, "value") else str(t.status),
                    "type": t.payment_type.value if hasattr(t.payment_type, "value") else str(t.payment_type),
                }
                for t in recent_txns
            ],
        }
        if latest_score:
            context["latest_risk_score"] = float(latest_score.final_risk_score)
            context["latest_decision"] = (
                latest_score.decision.value
                if hasattr(latest_score.decision, "value")
                else str(latest_score.decision)
            )
            context["behavioral_risk"] = float(latest_score.behavioral_deviation_score)
            context["device_risk"] = float(latest_score.device_risk_score)
            context["transaction_risk"] = float(latest_score.transaction_deviation_score)
            context["ml_risk"] = float(latest_score.synthetic_identity_score)

        # Build answer
        if any(w in q for w in ("balance", "money", "wallet", "how much")):
            answer = (
                f"Your SafePay wallet balance is **₹{balance:,.2f}**. "
                + (f"You have {len(recent_txns)} recent transaction(s)." if recent_txns else "No recent transactions found.")
            )
        elif any(w in q for w in ("risk", "score", "fraud", "safe", "security")):
            if latest_score:
                risk = float(latest_score.final_risk_score)
                level = "LOW 🟢" if risk < 0.35 else "MEDIUM 🟡" if risk < 0.65 else "HIGH 🔴"
                answer = (
                    f"Your latest transaction risk score is **{risk:.2f}/1.00** ({level}). "
                    f"Breakdown — Behavioral: {context.get('behavioral_risk', 0):.2f}, "
                    f"Device: {context.get('device_risk', 0):.2f}, "
                    f"Transaction: {context.get('transaction_risk', 0):.2f}, "
                    f"ML model: {context.get('ml_risk', 0):.2f}. "
                    f"Decision on last payment: **{context.get('latest_decision', 'N/A').upper()}**."
                )
            else:
                answer = (
                    "No risk score data found yet. Make a transaction first and I'll be able to explain your security profile. "
                    f"Current balance: ₹{balance:,.2f}."
                )
        elif any(w in q for w in ("transaction", "history", "recent", "payment", "sent", "transfer")):
            if recent_txns:
                lines = "\n".join(
                    f"• {t['type'].upper()} ₹{t['amount']} — {t['status'].upper()} (ID: ...{t['id'][-8:]})"
                    for t in context["recent_transactions"]
                )
                answer = f"Your recent transactions:\n{lines}"
            else:
                answer = "No recent transactions found in your account."
        elif settings.gemini_api_key:
            # Use Gemini for open-ended questions with context
            answer = await _gemini_answer(question, context, settings.gemini_api_key)
        else:
            answer = (
                f"Hi! Your wallet balance is **₹{balance:,.2f}**. "
                "I can help you understand your risk scores, transaction history, and security. "
                "To get details about a specific transaction, mention its ID in your question."
            )

        return {
            "answer": answer,
            "sources": [f"wallet:{wallet.id}" if wallet else ""],
            "tool_used": "general_profile",
            "grounded": True,
        }

    except Exception as exc:
        logger.warning("General question handler failed: %s", exc)
        return {
            "answer": (
                "I encountered an issue fetching your account data. "
                "Try asking about a specific transaction: 'Explain transaction <ID>'."
            ),
            "sources": [],
            "tool_used": None,
            "grounded": False,
        }


# ── Public entry point ───────────────────────────────────────────────────────

async def answer_question(
    question: str,
    transaction_id: str | None,
    user_id: UUID,
    db: AsyncSession,
) -> dict[str, Any]:
    """Orchestrate copilot: choose tool → fetch grounded data → produce answer.

    Returns dict with keys: answer, sources, tool_used, grounded.
    """
    settings = get_settings()
    q = question.lower()

    # No transaction_id → try to answer general questions using user profile data
    if not transaction_id or not transaction_id.strip():
        return await _handle_general_question(question, user_id, db, settings)

    # Route by question intent
    if any(w in q for w in ("risk", "score", "breakdown", "component", "weight")):
        tool_name = "explain_risk_score"
        tool_result = await _tool_explain_risk_score(transaction_id, user_id, db)
    elif any(w in q for w in ("action", "security", "improve", "recommend", "next", "help")):
        tool_name = "recommend_security_action"
        tool_result = await _tool_recommend_security_action(transaction_id, user_id, db)
    else:
        # Default: explain the transaction (covers blocked / challenged / general)
        tool_name = "explain_transaction"
        tool_result = await _tool_explain_transaction(transaction_id, user_id, db)

    grounded = tool_result.get("grounded", False)

    # Build source list for the UI provenance panel
    sources: list[str] = []
    if tool_result.get("transaction_id"):
        sources.append(f"transaction:{tool_result['transaction_id']}")
    if tool_result.get("fraud_score_id"):
        sources.append(f"fraud_score:{tool_result['fraud_score_id']}")
    if tool_result.get("explanation_id"):
        sources.append(f"explanation:{tool_result['explanation_id']}")

    # Generate answer
    if settings.gemini_api_key and grounded:
        answer = await _gemini_answer(question, tool_result, settings.gemini_api_key)
    else:
        answer = _deterministic_answer(question, tool_result)

    return {
        "answer": answer,
        "sources": sources,
        "tool_used": tool_name,
        "grounded": grounded,
    }
