# ML_CONTRACT.md — Interface Contract for ML Service (Ganesh)

> This is the ONLY thing you need to honor. As long as your service speaks this exact contract, you can change everything inside `ml-service/` freely — model architecture, libraries, training process, anything. The backend team (Jay) will never touch your folder, and you never need to touch `backend/`.

---

## Your Folder

```
ml-service/
  main.py              ← FastAPI app — entry point
  requirements.txt      ← your dependencies, pin versions
  app/                  ← put your real code here (models, training, inference)
  tests/                ← your tests
  README.md             ← document your approach here for the thesis
```

## How To Run Standalone (you don't need Docker for daily dev)

```bash
cd ml-service
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

Test it's running: `http://localhost:8001/health`

To test inside the full stack later: `docker compose up -d --build ml-service`

---

## Endpoint 1 — Health Check (already exists, do not break it)

```
GET /health

Response 200:
{
  "status": "ok",
  "version": "0.1.0",
  "model": "xgboost-v1"   ← update this string as you version your model
}
```

---

## Endpoint 2 — Fraud Score (THIS IS YOUR MAIN DELIVERABLE)

```
POST /score
Content-Type: application/json
```

### Request body — what the backend sends you

```json
{
  "transaction_id": "uuid-string",
  "amount": 5000.00,
  "currency": "INR",
  "payment_type": "p2p",
  "user_id": "uuid-string",
  "device_id": "uuid-string",
  "device_trust_score": 0.85,
  "is_new_device": false,
  "biometric_anomaly_score": 0.12,
  "user_avg_transaction_amount": 1200.00,
  "user_transaction_count_30d": 45,
  "location_deviation_score": 0.05,
  "merchant_risk_rating": 0.0,
  "cross_bank_fraud_signal": false,
  "timestamp": "2026-06-20T10:30:00Z"
}
```

**Field notes:**
- `biometric_anomaly_score` — comes from Phase 3 (behavioral biometrics), 0 = normal, 1 = highly anomalous. Will be `null` until Phase 3 is built — handle that gracefully (treat as 0.5 neutral if null).
- `cross_bank_fraud_signal` — comes from Mayur's blockchain layer in Phase 6. Will be `false` (default safe) until that's wired in.
- You are NOT responsible for computing any of these inputs. The backend computes/fetches them and sends them to you already assembled. Your job starts at "given these numbers, what's the risk?"

### Response body — what you must return

```json
{
  "risk_score": 0.23,
  "decision": "approve",
  "confidence": 0.91,
  "model_version": "xgboost-v1.2.0",
  "feature_contributions": {
    "amount_deviation": 0.15,
    "device_trust": 0.05,
    "biometric_anomaly": 0.03
  }
}
```

**Field rules — these are strict:**
| Field | Type | Constraint |
|---|---|---|
| `risk_score` | float | must be 0.0 to 1.0 |
| `decision` | string | must be exactly one of: `"approve"`, `"challenge"`, `"block"` |
| `confidence` | float | must be 0.0 to 1.0 |
| `model_version` | string | any string, just keep it updated |
| `feature_contributions` | object | optional but strongly wanted — this is your SHAP output, needed for Phase 5 Explainable AI |

**Decision thresholds (from PRD.md — you can tune the exact cutoffs but keep this structure):**
```
risk_score < 0.3        → "approve"
0.3 <= risk_score <= 0.7 → "challenge"
risk_score > 0.7        → "block"
```

### Latency requirement

**This endpoint must respond in under 500ms** (per ImplementationPlan.md Phase 4 exit criteria). If your model is slow, that's your problem to solve (caching, simpler model, batching) — but the contract doesn't change.

---

## Endpoint 3 — Model Info (nice to have, for admin dashboard later)

```
GET /model/info

Response 200:
{
  "model_version": "xgboost-v1.2.0",
  "trained_on": "IEEE-CIS Fraud Detection dataset",
  "training_date": "2026-06-25",
  "accuracy_auc": 0.94,
  "feature_count": 24
}
```

---

## What You're Building, Phase by Phase

| Phase | Your task |
|---|---|
| Phase 4 | Replace the stub `/score` with a real XGBoost classifier trained on IEEE-CIS dataset. Add Isolation Forest for anomaly detection. Implement the weighted scoring formula from PRD.md (35% behavioral / 30% transaction / 20% device / 15% cross-bank). |
| Phase 5 | Add SHAP explainability — populate `feature_contributions` properly. This feeds the "why was I blocked" explanation. |
| Phase 7 | Federated learning — use the Flower framework. You'll run 3 simulated bank clients training the same model architecture without sharing raw data. This replaces your single XGBoost model with a federated-trained one, but the `/score` contract stays identical. |

---

## What You DO NOT Need To Worry About

- Authentication — the backend handles all auth, you trust requests coming from `backend` container internally
- Database — you don't write to Postgres directly. If you need to log predictions, return them in the response and let backend store them
- Frontend — you never touch React/Next.js
- Docker networking — already configured, your service is reachable at `http://ml-service:8001` from inside the backend container

---

## How To Test Your Changes Don't Break the Contract

Before opening a pull request, run this from the project root:

```bash
docker compose up -d --build ml-service
curl.exe -X POST http://localhost:8001/score -H "Content-Type: application/json" --data-binary "@test_payload.json"
```

Verify the response matches the contract shape above exactly.

---

## Git Workflow

```bash
git checkout -b feature/ml-<short-description>
# example: feature/ml-xgboost-baseline

# ...do your work in ml-service/ only...

git add ml-service/
git commit -m "feat(ml): train baseline XGBoost on IEEE-CIS dataset"
git push origin feature/ml-xgboost-baseline
```

Then open a Pull Request on GitHub targeting `main`. Jay will review and merge.

**Never commit directly to `main`.** Never edit files outside `ml-service/` without asking first.
