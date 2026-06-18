"""Blockchain router stubs for fraud signal publishing and lookup."""

from fastapi import APIRouter, HTTPException, status

from app.schemas.blockchain import BlockchainSignalPublish

router = APIRouter(prefix="/blockchain", tags=["blockchain"])


@router.post("/fraud-signal/publish", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def publish_fraud_signal(payload: BlockchainSignalPublish) -> dict[str, str]:
    """Publish an anonymized fraud signal."""

    raise HTTPException(status_code=501, detail="Fraud signal publishing will write hashed identifiers to the blockchain layer.")


@router.get("/fraud-signal/lookup/{signal_hash}", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def lookup_fraud_signal(signal_hash: str) -> dict[str, str]:
    """Look up a fraud signal by hash."""

    raise HTTPException(status_code=501, detail=f"Fraud signal lookup will query on-chain data for hash {signal_hash}.")


@router.get("/reputation/{entity_hash}", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def get_reputation(entity_hash: str) -> dict[str, str]:
    """Return the reputation for a hashed entity."""

    raise HTTPException(status_code=501, detail=f"Reputation lookup will return the reputation score for hash {entity_hash}.")
