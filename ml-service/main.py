"""SafePay ML Service — Phase 0 stub."""

from fastapi import FastAPI

app = FastAPI(title="SafePay ML Service", version="0.1.0")


@app.get("/health")
async def health() -> dict:
    """Health check for ML service."""
    return {"status": "ok", "version": "0.1.0", "model": "stub"}


@app.post("/score")
async def score_transaction(payload: dict) -> dict:
    """Stub fraud scoring endpoint — returns mock score for Phase 0."""
    # TODO Phase 4: implement real XGBoost + Isolation Forest scoring
    return {
        "risk_score": 0.1,
        "decision": "approve",
        "confidence": 0.9,
        "note": "stub response — real model not loaded yet"
    }