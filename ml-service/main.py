"""SafePay ML Service - XGBoost fraud scoring."""
from fastapi import FastAPI
from pydantic import BaseModel
from app.models.predictor import predict

app = FastAPI(title="SafePay ML Service", version="1.0.0")


class ScoreRequest(BaseModel):
    transaction_id: str = ""
    transaction_amt: float = 0.0
    product_cd: str = "W"
    card1: float = 0.0
    card2: float = 0.0
    card3: float = 0.0
    card5: float = 0.0
    addr1: float = 0.0
    addr2: float = 0.0
    dist1: float = 0.0
    p_emaildomain: str = "gmail.com"
    r_emaildomain: str = "gmail.com"
    device_trust_score: float = 50.0
    behavioral_trust_score: float = 50.0
    is_new_device: bool = False
    hour_of_day: int = 12


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0", "model": "xgboost_loaded"}


@app.post("/score")
async def score_transaction(payload: ScoreRequest):
    result = predict(payload.dict())
    result["transaction_id"] = payload.transaction_id
    return result
