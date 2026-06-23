"""Wallet service — balance, add money, withdraw, P2P transfer, transaction history."""

from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import PaymentType, TransactionStatus
from app.models.identity import AuditLog, User
from app.models.payments import Merchant, Transaction, Wallet

async def _write_audit_log(db: AsyncSession, actor_user_id: UUID, action: str, metadata: dict) -> None:
    """Append an audit log entry."""

    log = AuditLog(actor_user_id=actor_user_id, action=action, event_metadata=metadata, ip_address=None)
    db.add(log)
    await db.flush()


async def get_wallet_by_user_id(db: AsyncSession, user_id: UUID) -> Wallet:
    """Fetch a user's wallet, raising if not found."""

    result = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
    wallet = result.scalar_one_or_none()
    if wallet is None:
        raise ValueError("Wallet not found for this user.")
    return wallet


async def get_balance(db: AsyncSession, user_id: UUID) -> Wallet:
    """Return the caller's wallet (includes balance, currency, status)."""

    return await get_wallet_by_user_id(db, user_id)


async def _find_existing_transaction(db: AsyncSession, idempotency_key: str) -> Transaction | None:
    """Check if a transaction with this idempotency key already exists."""

    result = await db.execute(select(Transaction).where(Transaction.idempotency_key == idempotency_key))
    return result.scalar_one_or_none()


async def add_money(db: AsyncSession, user_id: UUID, amount: Decimal, idempotency_key: str) -> Transaction:
    """Top up the caller's wallet."""

    existing = await _find_existing_transaction(db, idempotency_key)
    if existing is not None:
        return existing

    result = await db.execute(select(Wallet).where(Wallet.user_id == user_id).with_for_update())
    wallet = result.scalar_one_or_none()
    if wallet is None:
        raise ValueError("Wallet not found.")
    if wallet.status != "active":
        raise ValueError("Wallet is not active.")

    wallet.balance = wallet.balance + amount

    txn = Transaction(
        sender_wallet_id=wallet.id,
        receiver_wallet_id=wallet.id,
        amount=amount,
        currency=wallet.currency,
        payment_type=PaymentType.TOPUP,
        status=TransactionStatus.COMPLETED,
        device_id=None,
        idempotency_key=idempotency_key,
    )
    db.add(txn)
    await db.flush()

    await _write_audit_log(db, user_id, "wallet.add_money", {"amount": str(amount)})
    await db.commit()
    return txn


async def withdraw(db: AsyncSession, user_id: UUID, amount: Decimal, idempotency_key: str) -> Transaction:
    """Withdraw funds from the caller's wallet."""

    existing = await _find_existing_transaction(db, idempotency_key)
    if existing is not None:
        return existing

    result = await db.execute(select(Wallet).where(Wallet.user_id == user_id).with_for_update())
    wallet = result.scalar_one_or_none()
    if wallet is None:
        raise ValueError("Wallet not found.")
    if wallet.status != "active":
        raise ValueError("Wallet is not active.")
    if wallet.balance < amount:
        raise ValueError("Insufficient balance.")

    wallet.balance = wallet.balance - amount

    txn = Transaction(
        sender_wallet_id=wallet.id,
        receiver_wallet_id=wallet.id,
        amount=amount,
        currency=wallet.currency,
        payment_type=PaymentType.WITHDRAWAL,
        status=TransactionStatus.COMPLETED,
        device_id=None,
        idempotency_key=idempotency_key,
    )
    db.add(txn)
    await db.flush()

    await _write_audit_log(db, user_id, "wallet.withdraw", {"amount": str(amount)})
    await db.commit()
    return txn


async def transfer_p2p(
    db: AsyncSession,
    sender_user_id: UUID,
    receiver_phone: str,
    amount: Decimal,
    idempotency_key: str,
    note: str | None,
    device_id=None,
) -> Transaction:
    """Transfer funds from the caller's wallet to another user's wallet, identified by phone."""

    existing = await _find_existing_transaction(db, idempotency_key)
    if existing is not None:
        return existing

    # Lock sender wallet first
    sender_result = await db.execute(select(Wallet).where(Wallet.user_id == sender_user_id).with_for_update())
    sender_wallet = sender_result.scalar_one_or_none()
    if sender_wallet is None:
        raise ValueError("Sender wallet not found.")
    if sender_wallet.status != "active":
        raise ValueError("Sender wallet is not active.")

    # Find receiver by phone
    receiver_user_result = await db.execute(select(User).where(User.phone == receiver_phone))
    receiver_user = receiver_user_result.scalar_one_or_none()
    if receiver_user is None:
        raise ValueError("No SafePay user found with this phone number.")
    if receiver_user.id == sender_user_id:
        raise ValueError("Cannot transfer money to yourself.")

    if sender_wallet.balance < amount:
        raise ValueError("Insufficient balance.")

    # Lock receiver wallet (consistent lock order: sender first, then receiver, to avoid deadlocks)
    receiver_result = await db.execute(select(Wallet).where(Wallet.user_id == receiver_user.id).with_for_update())
    receiver_wallet = receiver_result.scalar_one_or_none()
    if receiver_wallet is None:
        raise ValueError("Receiver wallet not found.")
    if receiver_wallet.status != "active":
        raise ValueError("Receiver wallet is not active.")

    sender_wallet.balance = sender_wallet.balance - amount
    receiver_wallet.balance = receiver_wallet.balance + amount

    txn = Transaction(
        sender_wallet_id=sender_wallet.id,
        receiver_wallet_id=receiver_wallet.id,
        amount=amount,
        currency=sender_wallet.currency,
        payment_type=PaymentType.P2P,
        status=TransactionStatus.COMPLETED,
        device_id=device_id,
        idempotency_key=idempotency_key,
    )
    db.add(txn)
    await db.flush()

    await _write_audit_log(
        db,
        sender_user_id,
        "payment.p2p_transfer",
        {"amount": str(amount), "receiver_user_id": str(receiver_user.id)},
    )
    await db.commit()
    return txn


async def list_transactions(db: AsyncSession, user_id: UUID, limit: int = 50) -> list[Transaction]:
    """List the caller's transaction history, most recent first."""

    wallet = await get_wallet_by_user_id(db, user_id)

    result = await db.execute(
        select(Transaction)
        .where((Transaction.sender_wallet_id == wallet.id) | (Transaction.receiver_wallet_id == wallet.id))
        .order_by(Transaction.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def pay_merchant(
    db: AsyncSession,
    sender_user_id: UUID,
    merchant_id: str,
    amount: Decimal,
    idempotency_key: str,
    device_id=None,
) -> Transaction:
    """Pay a merchant directly. Funds go to the merchant owner's wallet."""

    existing = await _find_existing_transaction(db, idempotency_key)
    if existing is not None:
        return existing

    sender_result = await db.execute(select(Wallet).where(Wallet.user_id == sender_user_id).with_for_update())
    sender_wallet = sender_result.scalar_one_or_none()
    if sender_wallet is None:
        raise ValueError("Sender wallet not found.")
    if sender_wallet.status != "active":
        raise ValueError("Sender wallet is not active.")

    merchant_result = await db.execute(select(Merchant).where(Merchant.id == UUID(merchant_id)))
    merchant = merchant_result.scalar_one_or_none()
    if merchant is None:
        raise ValueError("Merchant not found.")

    if sender_wallet.balance < amount:
        raise ValueError("Insufficient balance.")

    receiver_result = await db.execute(select(Wallet).where(Wallet.user_id == merchant.user_id).with_for_update())
    receiver_wallet = receiver_result.scalar_one_or_none()
    if receiver_wallet is None:
        raise ValueError("Merchant wallet not found.")
    if receiver_wallet.status != "active":
        raise ValueError("Merchant wallet is not active.")

    sender_wallet.balance = sender_wallet.balance - amount
    receiver_wallet.balance = receiver_wallet.balance + amount

    txn = Transaction(
        sender_wallet_id=sender_wallet.id,
        receiver_wallet_id=receiver_wallet.id,
        merchant_id=merchant.id,
        amount=amount,
        currency=sender_wallet.currency,
        payment_type=PaymentType.MERCHANT,
        status=TransactionStatus.COMPLETED,
        device_id=device_id,
        idempotency_key=idempotency_key,
    )
    db.add(txn)
    await db.flush()

    await _write_audit_log(
        db,
        sender_user_id,
        "payment.merchant_pay",
        {"amount": str(amount), "merchant_id": str(merchant.id)},
    )
    await db.commit()
    return txn  


async def generate_qr_payload(
    db: AsyncSession,
    merchant_upi_id: str,
    amount: Decimal | None,
    currency: str,
) -> dict:
    """Generate a QR payload for a merchant. Does not move money."""

    merchant_result = await db.execute(select(Merchant).where(Merchant.upi_id == merchant_upi_id))
    merchant = merchant_result.scalar_one_or_none()
    if merchant is None:
        raise ValueError("No merchant found with this UPI ID.")

    payload = {
        "merchant_id": str(merchant.id),
        "merchant_upi_id": merchant.upi_id,
        "business_name": merchant.business_name,
        "amount": str(amount) if amount is not None else None,
        "currency": currency,
    }
    return payload

async def pay_qr(
    db: AsyncSession,
    sender_user_id: UUID,
    qr_payload_str: str,
    amount: Decimal,
    idempotency_key: str,
) -> Transaction:
    """Pay a scanned QR code — parses the payload and reuses pay_merchant logic."""

    import json

    try:
        payload_data = json.loads(qr_payload_str)
    except (json.JSONDecodeError, TypeError) as exc:
        raise ValueError("Invalid QR payload format.") from exc

    merchant_id = payload_data.get("merchant_id")
    if not merchant_id:
        raise ValueError("QR payload missing merchant information.")

    return await pay_merchant(db, sender_user_id, merchant_id, amount, idempotency_key)

async def send_upi(
    db: AsyncSession,
    sender_user_id: UUID,
    recipient_upi_id: str,
    amount: Decimal,
    idempotency_key: str,
    note: str | None,
) -> Transaction:
    """Send a UPI payment. UPI IDs are in the form <phone>@safepay; reuses transfer_p2p."""

    if "@" not in recipient_upi_id:
        raise ValueError("Invalid UPI ID format.")

    phone_part = recipient_upi_id.split("@")[0]
    if not phone_part:
        raise ValueError("Invalid UPI ID format.")

    return await transfer_p2p(
        db,
        sender_user_id=sender_user_id,
        receiver_phone=phone_part,
        amount=amount,
        idempotency_key=idempotency_key,
        note=note,
    )