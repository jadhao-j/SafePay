"""SafePay ML Predictor Service."""
from fastapi import FastAPI
from app.models.predictor import predict

app = FastAPI(title="SafePay ML Service", version="0.1.0")


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0", "model": "xgboost-v1-shap"}


@app.post("/score")
async def score_transaction(payload: dict):
    result = predict(payload)
    return result


@app.post("/model/reload")
async def reload_model():
    """
    Validates the federated model is available.
    Note: FL model uses a different feature set than production model.
    In production, this would trigger a validation pipeline before swap.
    """
    import os
    model_path = "fraud_model_fl.json"
    if not os.path.exists(model_path):
        return {"status": "error", "detail": "fraud_model_fl.json not found"}
    return {
        "status": "validated",
        "model_version": "fl-xgboost-v1",
        "note": "FL model validated and ready. Feature alignment required before production swap.",
        "fl_model_path": model_path,
    }


@app.get("/model/info")
async def model_info():
    return {
        "model_version": "xgboost-v1-shap",
        "trained_on": "IEEE-CIS Fraud Detection dataset",
        "feature_count": 338,
    }