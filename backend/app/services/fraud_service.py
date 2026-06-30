import httpx
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.enums import AlertType, FraudDecision
from app.models.fraud import Alert, FraudExplanation, FraudScore
from app.models.identity import Device
from app.models.payments import Transaction, Wallet
from app.services import blockchain_service

settings = get_settings()


async def call_ml_service(payload: dict) -> dict:
    ml_url = getattr(settings, 'ml_service_url', 'http://ml-service:8001')
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.post(f'{ml_url}/score', json=payload)
            response.raise_for_status()
            return response.json()
    except Exception:
        return {
            'risk_score': 0.4,
            'decision': 'challenge',
            'confidence': 0.5,
            'model_version': 'fallback',
            'feature_contributions': [],
        }


def compute_transaction_risk(amount: Decimal) -> float:
    amt = float(amount)
    if amt < 1000:
        return 0.1
    elif amt < 5000:
        return 0.2
    elif amt < 20000:
        return 0.4
    elif amt < 100000:
        return 0.6
    else:
        return 0.8


def compute_device_risk(device) -> float:
    if device is None:
        return 0.8
    trust = float(device.trust_score)
    if not device.is_trusted:
        return max(0.3, 1.0 - (trust / 100.0))
    return max(0.0, 1.0 - (trust / 100.0))


def compute_behavioral_risk(behavioral_trust_score: float) -> float:
    return max(0.0, 1.0 - (behavioral_trust_score / 100.0))


def compute_weighted_score(ml_score: float, behavioral_risk: float,
                           transaction_risk: float, device_risk: float) -> float:
    weighted = (
        0.35 * behavioral_risk
        + 0.30 * transaction_risk
        + 0.20 * device_risk
        + 0.15 * ml_score
    )
    return round(min(1.0, max(0.0, weighted)), 4)


def make_decision(weighted_score: float) -> str:
    if weighted_score < 0.3:
        return 'approve'
    elif weighted_score <= 0.7:
        return 'challenge'
    else:
        return 'block'


def generate_explanation_text(shap_contributions: list, component_scores: dict) -> str:
    """Generate human-readable explanation from SHAP contributions and component scores."""
    reasons = []

    # SHAP-driven reasons
    for item in shap_contributions:
        if item['shap_value'] > 0.05:
            feat = item['feature']
            if 'TransactionAmt' in feat:
                reasons.append('unusually high transaction amount for this model')
            elif 'card' in feat.lower():
                reasons.append('card characteristics flagged as unusual')
            elif 'addr' in feat.lower():
                reasons.append('billing address signals are atypical')
            elif 'emaildomain' in feat.lower():
                reasons.append('email domain associated with elevated risk')
            elif 'dist' in feat.lower():
                reasons.append('distance signals indicate anomaly')

    # Component score reasons
    if component_scores.get('device_risk', 0) > 0.6:
        reasons.append('unrecognized or untrusted device')
    if component_scores.get('behavioral_risk', 0) > 0.6:
        reasons.append('unusual interaction patterns detected')
    if component_scores.get('transaction_risk', 0) > 0.5:
        reasons.append('transaction amount outside normal range')

    reasons = list(dict.fromkeys(reasons))  # deduplicate preserving order

    if not reasons:
        return 'Transaction flagged for precautionary review by automated system.'

    return 'Transaction flagged due to: ' + ', '.join(reasons) + '.'


async def write_explanation(
    db: AsyncSession,
    fraud_score_id: UUID,
    shap_contributions: list,
    component_scores: dict,
    confidence: float,
) -> FraudExplanation:
    """Write a FraudExplanation row with SHAP data."""
    explanation_text = generate_explanation_text(shap_contributions, component_scores)

    decision = 'review'
    if component_scores.get('final_risk_score', 0) < 0.3:
        decision = 'no action required'
    elif component_scores.get('final_risk_score', 0) <= 0.7:
        decision = 'verify identity via OTP before retrying'
    else:
        decision = 'contact support to unlock account'

    explanation = FraudExplanation(
        fraud_score_id=fraud_score_id,
        top_factors=shap_contributions,
        explanation_text=explanation_text,
        confidence=Decimal(str(round(confidence, 4))),
        recommended_action=decision,
    )
    db.add(explanation)
    await db.flush()
    return explanation


async def create_alert(
    db: AsyncSession,
    transaction: Transaction,
    decision: str,
    explanation_text: str,
) -> Alert | None:
    """Write an Alert row when a transaction is challenged or blocked."""
    if decision not in ("challenge", "block"):
        return None

    wallet_result = await db.execute(
        select(Wallet).where(Wallet.id == transaction.sender_wallet_id)
    )
    wallet = wallet_result.scalar_one_or_none()
    if wallet is None:
        return None

    alert_type = (
        AlertType.FRAUD_BLOCK
        if decision == "block"
        else AlertType.FRAUD_CHALLENGE
    )

    alert = Alert(
        user_id=wallet.user_id,
        transaction_id=transaction.id,
        type=alert_type,
        message=explanation_text,
    )
    db.add(alert)
    await db.flush()
    return alert


async def publish_case_to_blockchain(db: AsyncSession, case_id, transaction_id) -> dict:
    """Publish device + account fraud signals on-chain for a confirmed fraud case."""
    tx_result = await db.execute(select(Transaction).where(Transaction.id == transaction_id))
    transaction = tx_result.scalar_one_or_none()
    if transaction is None:
        return {"published": False, "reason": "transaction not found"}

    wallet_result = await db.execute(select(Wallet).where(Wallet.id == transaction.sender_wallet_id))
    wallet = wallet_result.scalar_one_or_none()

    results = {}
    if transaction.device_id is not None:
        try:
            device_result = await blockchain_service.publish_fraud_signal(
                str(transaction.device_id), blockchain_service.ENTITY_TYPE_DEVICE
            )
            results["device"] = device_result
        except Exception as exc:
            results["device"] = {"published": False, "error": str(exc)}

    if wallet is not None:
        try:
            account_result = await blockchain_service.publish_fraud_signal(
                str(wallet.user_id), blockchain_service.ENTITY_TYPE_ACCOUNT
            )
            results["account"] = account_result
        except Exception as exc:
            results["account"] = {"published": False, "error": str(exc)}

    return results



async def score_transaction(
    db: AsyncSession,
    transaction: Transaction,
    device_id,
    behavioral_trust_score: float = 50.0,
) -> dict:
    """Full fraud scoring pipeline — scores + writes fraud_scores + fraud_explanations."""
    device = None
    if device_id is not None:
        result = await db.execute(select(Device).where(Device.id == device_id))
        device = result.scalar_one_or_none()

    transaction_risk = compute_transaction_risk(transaction.amount)
    device_risk = compute_device_risk(device)
    behavioral_risk = compute_behavioral_risk(behavioral_trust_score)

    ml_payload = {
        'transaction_id': str(transaction.id),
        'transaction_amt': float(transaction.amount),
        'product_cd': 'W',
        'device_trust_score': float(device.trust_score) if device else 0.0,
        'behavioral_trust_score': behavioral_trust_score,
        'is_new_device': device is None or not device.is_trusted,
    }
    ml_result = await call_ml_service(ml_payload)
    ml_score = float(ml_result.get('risk_score', 0.4))
    shap_contributions = ml_result.get('feature_contributions', [])
    confidence = float(ml_result.get('confidence', 0.5))

    final_score = compute_weighted_score(
        ml_score=ml_score,
        behavioral_risk=behavioral_risk,
        transaction_risk=transaction_risk,
        device_risk=device_risk,
    )
    decision = make_decision(final_score)

    fraud_score_row = FraudScore(
        transaction_id=transaction.id,
        transaction_deviation_score=Decimal(str(transaction_risk)),
        behavioral_deviation_score=Decimal(str(behavioral_risk)),
        device_risk_score=Decimal(str(device_risk)),
        location_risk_score=Decimal('0.0'),
        merchant_risk_score=Decimal('0.0'),
        synthetic_identity_score=Decimal(str(ml_score)),
        final_risk_score=Decimal(str(final_score)),
        decision=decision,
        model_version=ml_result.get('model_version', 'xgboost-v1-shap'),
    )
    db.add(fraud_score_row)
    await db.flush()

    component_scores = {
        'final_risk_score': final_score,
        'device_risk': device_risk,
        'behavioral_risk': behavioral_risk,
        'transaction_risk': transaction_risk,
    }
    explanation = await write_explanation(
        db, fraud_score_row.id, shap_contributions, component_scores, confidence
    )
    await create_alert(db, transaction, decision, explanation.explanation_text)

    return {
        'fraud_score_id': str(fraud_score_row.id),
        'decision': decision,
        'final_risk_score': final_score,
        'ml_risk_score': ml_score,
        'behavioral_risk': behavioral_risk,
        'device_risk': device_risk,
        'transaction_risk': transaction_risk,
        'confidence': confidence,
        'model_version': ml_result.get('model_version', 'xgboost-v1-shap'),
        'shap_contributions': shap_contributions,
    }
