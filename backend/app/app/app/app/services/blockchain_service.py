"""Blockchain service - Web3.py integration with FraudRegistry and Reputation contracts."""
import json
from pathlib import Path

from web3 import Web3

from app.core.config import get_settings

settings = get_settings()

_ABI_DIR = Path(__file__).resolve().parent.parent / "blockchain_abi"

with open(_ABI_DIR / "FraudRegistry.json") as f:
    _fraud_registry_abi = json.load(f)["abi"]

with open(_ABI_DIR / "Reputation.json") as f:
    _reputation_abi = json.load(f)["abi"]

w3 = Web3(Web3.HTTPProvider(settings.blockchain_rpc_url))

_bank_account = w3.eth.account.from_key(settings.blockchain_bank_private_key)

fraud_registry = w3.eth.contract(
    address=Web3.to_checksum_address(settings.fraud_registry_address),
    abi=_fraud_registry_abi,
)

reputation_contract = w3.eth.contract(
    address=Web3.to_checksum_address(settings.reputation_address),
    abi=_reputation_abi,
)

ENTITY_TYPE_DEVICE = 0
ENTITY_TYPE_MERCHANT = 1
ENTITY_TYPE_ACCOUNT = 2


def compute_entity_hash(entity_id: str) -> bytes:
    """Compute keccak256(entity_id:salt) - zero PII on chain."""
    payload = f"{entity_id}:{settings.blockchain_hash_salt}"
    return Web3.keccak(text=payload)


def _send_transaction(function_call):
    """Sign and send a transaction as the configured bank account."""
    nonce = w3.eth.get_transaction_count(_bank_account.address)
    tx = function_call.build_transaction({
        "from": _bank_account.address,
        "nonce": nonce,
    })
    signed = w3.eth.account.sign_transaction(tx, private_key=settings.blockchain_bank_private_key)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    return receipt, tx_hash.hex()


async def publish_fraud_signal(entity_id: str, entity_type: int) -> dict:
    """Report a fraud signal on-chain via FraudRegistry.reportFraud()."""
    entity_hash = compute_entity_hash(entity_id)
    call = fraud_registry.functions.reportFraud(entity_hash, entity_type)
    receipt, tx_hash = _send_transaction(call)
    return {
        "entity_hash": entity_hash.hex(),
        "tx_hash": tx_hash,
        "block_number": receipt["blockNumber"],
        "status": "published",
    }


async def publish_fraud_signal_by_hash(entity_hash_hex: str, entity_type: int) -> dict:
    """Report a fraud signal on-chain when the hash is already computed by the caller."""
    entity_hash_bytes = bytes.fromhex(entity_hash_hex.replace("0x", ""))
    call = fraud_registry.functions.reportFraud(entity_hash_bytes, entity_type)
    receipt, tx_hash = _send_transaction(call)
    return {
        "entity_hash": entity_hash_hex,
        "tx_hash": tx_hash,
        "block_number": receipt["blockNumber"],
        "status": "published",
    }


async def lookup_fraud_signal(entity_hash_hex: str) -> dict:
    """Check FraudRegistry.checkSignal() for a given hash."""
    entity_hash_bytes = bytes.fromhex(entity_hash_hex.replace("0x", ""))
    is_fraud, reported_at, reporting_bank = fraud_registry.functions.checkSignal(entity_hash_bytes).call()
    return {
        "entity_hash": entity_hash_hex,
        "is_fraud": is_fraud,
        "reported_at": reported_at,
        "reporting_bank": reporting_bank,
    }


async def update_reputation(entity_id: str, new_score: int) -> dict:
    """Update reputation score via Reputation.updateReputation()."""
    entity_hash = compute_entity_hash(entity_id)
    call = reputation_contract.functions.updateReputation(entity_hash, new_score)
    receipt, tx_hash = _send_transaction(call)
    return {
        "entity_hash": entity_hash.hex(),
        "tx_hash": tx_hash,
        "block_number": receipt["blockNumber"],
        "status": "updated",
    }


async def get_reputation(entity_hash_hex: str) -> dict:
    """Get reputation score via Reputation.getReputation()."""
    entity_hash_bytes = bytes.fromhex(entity_hash_hex.replace("0x", ""))
    score, last_updated = reputation_contract.functions.getReputation(entity_hash_bytes).call()
    return {
        "entity_hash": entity_hash_hex,
        "score": score,
        "last_updated": last_updated,
    }
