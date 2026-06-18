"""Blockchain schemas."""

from pydantic import BaseModel


class BlockchainSignalPublish(BaseModel):
    """Publish request for a blockchain fraud signal."""

    entity_type: str
    entity_hash: str
    risk_indicator: str
