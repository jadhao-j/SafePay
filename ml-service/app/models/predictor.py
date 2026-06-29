"""SafePay ML Predictor — XGBoost + SHAP explanations."""

import joblib
import numpy as np
import pandas as pd
import shap

# Load once at startup
model = joblib.load("fraud_model.pkl")
feature_columns = joblib.load("feature_columns.pkl")
encoders = joblib.load("encoders.pkl")

# Build SHAP explainer once at startup (TreeExplainer is fast for XGBoost)
explainer = shap.TreeExplainer(model)

print(f"[ML Service] Model + SHAP explainer loaded. Features: {len(feature_columns)}")


def _build_feature_row(transaction: dict) -> dict:
    """Map SafePay transaction fields to IEEE-CIS feature vector."""
    row = {col: 0 for col in feature_columns}
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
    return row


def predict(transaction: dict) -> dict:
    """Score a transaction and return SHAP feature contributions."""
    row = _build_feature_row(transaction)
    df = pd.DataFrame([row])

    # Model prediction
    proba = model.predict_proba(df)[0]
    fraud_prob = float(proba[1])

    if fraud_prob < 0.3:
        decision = "approve"
    elif fraud_prob < 0.7:
        decision = "challenge"
    else:
        decision = "block"

    # SHAP values for fraud class (index 1)
    shap_values = explainer.shap_values(df)
    # TreeExplainer returns list [class0_shap, class1_shap] for binary classification
    if isinstance(shap_values, list):
        fraud_shap = shap_values[1][0]
    else:
        fraud_shap = shap_values[0]

    # Top 5 contributing features by absolute SHAP value
    shap_series = pd.Series(fraud_shap, index=feature_columns)
    top_factors = (
        shap_series.abs()
        .nlargest(5)
        .index.tolist()
    )
    top_contributions = [
        {
            "feature": feat,
            "shap_value": round(float(shap_series[feat]), 4),
            "contribution": "increases_risk" if shap_series[feat] > 0 else "decreases_risk"
        }
        for feat in top_factors
    ]

    return {
        "risk_score":            round(fraud_prob, 4),
        "decision":              decision,
        "confidence":            round(max(float(proba[0]), fraud_prob), 4),
        "fraud_probability":     round(fraud_prob, 4),
        "model_version":         "xgboost-v1-shap",
        "feature_contributions": top_contributions,
    }
