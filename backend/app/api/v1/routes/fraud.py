"""Fraud router stubs for scoring, explanations, alerts, and cases."""

from fastapi import APIRouter, HTTPException, status

from app.schemas.fraud import FraudCaseCreateRequest, FraudScoreCreateRequest

router = APIRouter(prefix="/fraud", tags=["fraud"])


@router.post("/score", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def score_transaction(payload: FraudScoreCreateRequest) -> dict[str, str]:
    """Trigger fraud scoring for a transaction."""

    raise HTTPException(status_code=501, detail="Fraud scoring will calculate the transaction risk score and decision.")


@router.get("/transactions/{transaction_id}/explanation", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def get_explanation(transaction_id: str) -> dict[str, str]:
    """Return the explanation for a scored transaction."""

    raise HTTPException(status_code=501, detail=f"Fraud explanation will return the reasons for transaction {transaction_id}.")


@router.get("/alerts", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def list_alerts(cursor: str | None = None, limit: int = 50) -> dict[str, str]:
    """List fraud alerts."""

    raise HTTPException(status_code=501, detail="Alert listing will return fraud and security alerts for review.")


@router.post("/case", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def create_case(payload: FraudCaseCreateRequest) -> dict[str, str]:
    """Open a fraud investigation case."""

    raise HTTPException(status_code=501, detail="Case creation will open a fraud investigation record.")


@router.get("/case/{case_id}", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def get_case(case_id: str) -> dict[str, str]:
    """Retrieve a fraud case."""

    raise HTTPException(status_code=501, detail=f"Case lookup will return the investigation state for case {case_id}.")
