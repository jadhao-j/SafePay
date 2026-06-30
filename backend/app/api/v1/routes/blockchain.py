"""Blockchain router - fraud signal publishing and lookup via Web3.py."""
from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import get_current_user_id
from app.schemas.blockchain import BlockchainSignalPublish
from app.services import blockchain_service

router = APIRouter(prefix="/blockchain", tags=["blockchain"])

_ENTITY_TYPE_MAP = {"device": 0, "merchant": 1, "account": 2}


@router.post("/fraud-signal/publish")
async def publish_fraud_signal(
    payload: BlockchainSignalPublish,
    user_id=Depends(get_current_user_id),
) -> dict:
    """Publish an anonymized fraud signal to the FraudRegistry contract."""
    entity_type_int = _ENTITY_TYPE_MAP.get(payload.entity_type.lower())
    if entity_type_int is None:
        raise HTTPException(status_code=400, detail=f"Invalid entity_type: {payload.entity_type}")

    result = await blockchain_service.publish_fraud_signal_by_hash(payload.entity_hash, entity_type_int)
    result["risk_indicator"] = payload.risk_indicator
    return result


@router.get("/fraud-signal/lookup/{signal_hash}")
async def lookup_fraud_signal(
    signal_hash: str,
    user_id=Depends(get_current_user_id),
) -> dict:
    """Look up a fraud signal by hash on the FraudRegistry contract."""
    return await blockchain_service.lookup_fraud_signal(signal_hash)


@router.get("/reputation/{entity_hash}")
async def get_reputation(
    entity_hash: str,
    user_id=Depends(get_current_user_id),
) -> dict:
    """Return the reputation score for a hashed entity."""
    return await blockchain_service.get_reputation(entity_hash)
