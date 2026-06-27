"""SafePay ML Predictor — loads model once, scores real transactions."""

import joblib
import pandas as pd

# Load once at module import time (happens when service starts)
model = joblib.load("fraud_model.pkl")
feature_columns = joblib.load("feature_columns.pkl")
encoders = joblib.load("encoders.pkl")

print(f"[ML Service] Model loaded. Features: {len(feature_columns)}")


def predict(transaction: dict) -> dict:
    """Score a transaction. Returns risk_score, decision, confidence."""

    # Start with all 338 features = 0
    row = {col: 0 for col in feature_columns}

    # Map SafePay transaction fields to IEEE-CIS feature names
    mapping = {
        "TransactionAmt": transaction.get("transaction_amt", 0.0),
        "ProductCD":      transaction.get("product_cd", "W"),
        "card1":          transaction.get("card1", 0.0),
        "card2":          transaction.get("card2", 0.0),
        "card3":          transaction.get("card3", 0.0),
        "card5":          transaction.get("card5", 0.0),
        "addr1":          transaction.get("addr1", 0.0),
        "addr2":          transaction.get("addr2", 0.0),
        "dist1":          transaction.get("dist1", 0.0),
        "P_emaildomain":  transaction.get("p_emaildomain", "gmail.com"),
        "R_emaildomain":  transaction.get("r_emaildomain", "gmail.com"),
    }

    for col, val in mapping.items():
        if col not in row:
            continue
        if col in encoders:
            try:
                row[col] = int(encoders[col].transform([str(val)])[0])
            except ValueError:
                row[col] = 0
        else:
            row[col] = float(val) if val else 0.0

    df = pd.DataFrame([row])
    proba = model.predict_proba(df)[0]
    fraud_prob = float(proba[1])

    if fraud_prob < 0.3:
        decision = "approve"
    elif fraud_prob < 0.7:
        decision = "challenge"
    else:
        decision = "block"

    return {
        "risk_score":       round(fraud_prob, 4),
        "decision":         decision,
        "confidence":       round(max(float(proba[0]), fraud_prob), 4),
        "fraud_probability": round(fraud_prob, 4),
        "model_version":    "xgboost-v1",
    }