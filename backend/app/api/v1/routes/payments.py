"""Payment router stubs for UPI, QR, merchant, P2P, and recurring flows."""

from fastapi import APIRouter, HTTPException, status

from app.schemas.payments import MerchantPayRequest, P2PTransferRequest, QRGenerateRequest, QRPayRequest, RecurringPaymentRequest, UpiSendRequest

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/upi/send", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def send_upi(payload: UpiSendRequest) -> dict[str, str]:
    """Send a UPI payment."""

    raise HTTPException(status_code=501, detail="UPI send will initiate a payment transfer using UPI rails.")


@router.post("/qr/generate", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def generate_qr(payload: QRGenerateRequest) -> dict[str, str]:
    """Generate a QR payload for payment."""

    raise HTTPException(status_code=501, detail="QR generation will create a scannable payment payload.")


@router.post("/qr/pay", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def pay_qr(payload: QRPayRequest) -> dict[str, str]:
    """Pay a QR code."""

    raise HTTPException(status_code=501, detail="QR payment will submit a transaction for a scanned merchant code.")


@router.post("/merchant/pay", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def pay_merchant(payload: MerchantPayRequest) -> dict[str, str]:
    """Pay a merchant directly."""

    raise HTTPException(status_code=501, detail="Merchant payment will transfer funds to a merchant account.")


@router.post("/p2p/transfer", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def transfer_p2p(payload: P2PTransferRequest) -> dict[str, str]:
    """Transfer funds between users."""

    raise HTTPException(status_code=501, detail="P2P transfer will move funds between two SafePay wallets.")


@router.post("/recurring", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def create_recurring_payment(payload: RecurringPaymentRequest) -> dict[str, str]:
    """Create a recurring payment instruction."""

    raise HTTPException(status_code=501, detail="Recurring payment will schedule a repeat transaction pattern.")
