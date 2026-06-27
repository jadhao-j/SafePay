# Tracker.md — Project Progress Tracker

> Update this file as you work. Mark status, dates, and notes. Keep it in sync with `ImplementationPlan.md` phase numbers/names.

## Legend
`⬜ Not Started` · `🟦 In Progress` · `✅ Done` · `🟥 Blocked`

## Phase Tracker

| Phase | Name | Status | Started | Completed | Notes |
|---|---|---|---|---|---|
| 0 | Project Setup | ✅ | 2026-06-17 | 2026-06-18 | All 6 containers healthy |
| 1 | Database & Core Auth | ✅ | 2026-06-19 | 2026-06-20 | Full auth flow tested end-to-end |
| 2 | Wallet & Basic Payments | ✅ | 2026-06-20 | 2026-06-21 | All 8 endpoints, idempotency verified |
| 3 | Device & Behavioral Data Collection | ✅ | 2026-06-22 | 2026-06-23 | Device fingerprinting, telemetry, trust score, device_id on transactions |
| 4 | Fraud Detection Engine (Core AI) | ✅ | 2026-06-26 | 2026-06-27 | XGBoost model live, fraud_scores written, explanation + alerts endpoints working |
| 5 | Explainable AI + Alerts + Case Management | ⬜ | | | |
| 6 | Blockchain Fraud Intelligence Layer | ⬜ | | | |
| 7 | Federated Learning Layer | ⬜ | | | |
| 8 | Admin SOC Dashboard | ⬜ | | | |
| 9 | AI Copilot | ⬜ | | | |
| 10 | Hardening & Polish | ⬜ | | | |

## Current Phase
**Active phase:** Phase 5 — Explainable AI + Alerts + Case Management
**Current focus task:** SHAP integration, fraud_explanations table population, alert delivery, case management endpoints
**Blockers:** None. Ganesh's ML service fixed and integrated (xgboost-v1). Mayur's blockchain contracts ready for Phase 6.

## Task-Level Checklist

### Phase 0 — Project Setup ✅ COMPLETE
- [x] Monorepo folder structure created
- [x] Frontend (Next.js+TS+Tailwind+ShadCN) initialized
- [x] Backend (FastAPI) initialized
- [x] Docker Compose running (postgres, redis, backend, frontend, ml-service, hardhat-node)
- [x] Linting/formatting configured
- [x] Health check endpoint live, checks postgres + redis

### Phase 1 — Database & Core Auth ✅ COMPLETE
- [x] Alembic migrations match Schema.md (18 tables + enum-fix migrations)
- [x] Register endpoint — creates user (pending) + wallet
- [x] Login endpoint — JWT access + refresh token pair
- [x] OTP send/verify — Redis-backed, hashed, activates user
- [x] JWT + refresh token flow — rotation on every refresh, revocation on logout
- [x] RBAC middleware — Bearer token required on all non-public routes
- [x] Device fingerprint + rate limit middleware
- [x] Tested end-to-end: register → OTP verify → login → refresh → reuse-rejected → logout → reuse-rejected

### Phase 2 — Wallet & Basic Payments ✅ COMPLETE
- [x] `GET /wallet/balance`
- [x] `POST /wallet/add-money` — idempotency confirmed, `PaymentType.TOPUP`
- [x] `POST /wallet/withdraw` — insufficient-balance rejection confirmed, `PaymentType.WITHDRAWAL`
- [x] `POST /payments/p2p/transfer` — 2 real users, dual wallet locking, idempotency confirmed
- [x] `GET /wallet/transactions` — correct ordering and payment_type labels
- [x] `POST /payments/merchant/pay` — funds routed to merchant owner's wallet
- [x] `POST /payments/qr/generate` — public endpoint, returns merchant payload
- [x] `POST /payments/qr/pay` — reuses `pay_merchant` via QR payload parsing
- [x] `POST /payments/upi/send` — reuses `transfer_p2p` via `<phone>@safepay` convention

### Phase 3 — Device & Behavioral Data Collection ✅ COMPLETE
- [x] Device upsert on login — `devices` table populated with fingerprint, name, OS, IP, trust_score=0
- [x] `DeviceFingerprintMiddleware` reads `X-Device-ID`, `X-Device-Name`, `X-OS-Signature` headers
- [x] `POST /behavior/telemetry` — keystroke/mouse/touch events stored in `behavioral_events`
- [x] `BehavioralEventType` enum `values_callable` fix — `"keystroke"` not `"KEYSTROKE"` sent to Postgres
- [x] Simple heuristic trust score (0–100) computed per event from dwell/flight/velocity/pressure signals
- [x] `GET /behavior/trust-score` — returns avg trust_score, event_count, baseline_established (>=20 events)
- [x] `GET /users/me` — returns full user profile
- [x] `GET /users/me/devices` — lists all devices for user, most recently active first
- [x] `DELETE /users/me/devices/{device_id}` — revokes a device
- [x] `GET /users/me/security-score` — combines security_score + behavioral trust data
- [x] `device_id` wired into transactions for P2P and merchant payments — real UUID verified in Postgres

### Phase 4 — Fraud Detection Engine ✅ COMPLETE
- [x] `httpx` added to backend requirements — async HTTP client for ML service calls
- [x] `fraud_service.py` — full scoring pipeline: feature extraction → ML call → weighted scoring → decision
- [x] `call_ml_service()` — calls `http://ml-service:8001/score` with fallback (0.4 challenge if unreachable)
- [x] `compute_transaction_risk()` — amount-based risk (₹1k=0.1, ₹5k=0.2, ₹20k=0.4, ₹100k=0.6, higher=0.8)
- [x] `compute_device_risk()` — unknown device=0.8, untrusted device uses trust_score, trusted device low risk
- [x] `compute_behavioral_risk()` — inverted behavioral trust score (low trust = high risk)
- [x] `compute_weighted_score()` — 35% behavioral + 30% transaction + 20% device + 15% ML score
- [x] `make_decision()` — approve (<0.3), challenge (0.3–0.7), block (>0.7)
- [x] `FraudScore` row written to DB on every scored payment (enum values_callable fixed for FraudDecision, FraudCaseStatus, AlertType)
- [x] Fraud scoring wired into `transfer_p2p` and `pay_merchant` — runs before `db.commit()`
- [x] Block path — rolls back transaction + returns 400 with explanation
- [x] Challenge path — transaction completes but flagged in fraud_scores as challenge
- [x] `GET /fraud/transactions/{id}/explanation` — returns component scores + human-readable reason
- [x] `GET /fraud/alerts` — returns recent challenged/blocked transactions for SOC
- [x] `POST /fraud/case` — opens investigation case
- [x] `GET /fraud/case/{id}` — retrieves case details
- [x] ML service (Ganesh) fixed and integrated:
  - [x] `xgboost` added to ml-service requirements (replaced `lightgbm`)
  - [x] `main.py` rewritten to call `predictor.predict()` instead of stub scorer
  - [x] `predictor.py` loads model once at startup (not per request)
  - [x] Response shape fixed: `risk_score`, `decision`, `confidence`, `model_version`
- [x] Verified end-to-end: P2P transfer → fraud scored → `fraud_scores` row in DB with `decision: challenge` and `model_version: xgboost-v1` → explanation endpoint returns human-readable reason → alerts endpoint lists it

### Phase 5 — Explainable AI + Alerts + Case Management ⬜ NOT STARTED
- [ ] SHAP integration in ml-service — per-prediction feature attribution
- [ ] `fraud_explanations` row written with top_factors JSONB
- [ ] Replace heuristic explanation text with SHAP-driven reasons
- [ ] Alert creation on every block/challenge — writes to `alerts` table
- [ ] `GET /fraud/alerts` upgraded to query `alerts` table (not just fraud_scores)
- [ ] Alert read/unread status
- [ ] Frontend Transaction Detail — explanation panel with component scores
- [ ] Frontend Alerts page (admin)
- [ ] Frontend Case Detail page (admin)

### Phase 6 — Blockchain Fraud Intelligence Layer ⬜ NOT STARTED
- [ ] Mayur's contracts merged — FraudRegistry.sol + Reputation.sol deployed to Hardhat
- [ ] Web3.py backend integration
- [ ] Hash function — keccak256(entity_id + salt), zero PII on chain
- [ ] `POST /blockchain/fraud-signal/publish` — called on confirmed fraud case
- [ ] `GET /blockchain/fraud-signal/lookup/{hash}`
- [ ] `GET /blockchain/reputation/{hash}`
- [ ] Confirmed fraud case → auto-publish anonymized signal to chain

### Phase 7 — Federated Learning Layer ⬜ NOT STARTED
- [ ] Flower server (coordinator) running
- [ ] 3 simulated bank client processes
- [ ] Each client trains on local data shard only
- [ ] FedAvg aggregation across clients
- [ ] Global model versioned + hot-swapped into ml-service
- [ ] `fl_training_rounds` metrics logged — accuracy/loss only, no raw data
- [ ] FL round completes without any raw data leaving client process

### Phase 8 — Admin SOC Dashboard ⬜ NOT STARTED
- [ ] Real-time transaction feed via WebSocket
- [ ] Fraud heatmap visualization
- [ ] Risk score distribution charts
- [ ] Device intelligence view
- [ ] Merchant management view
- [ ] User management view
- [ ] Behavioral analytics aggregate view
- [ ] Live risk score updates via Redis pub/sub

### Phase 9 — AI Copilot ⬜ NOT STARTED
- [ ] LangGraph agent with tools: explain-transaction, explain-risk-score, recommend-security-action
- [ ] Copilot grounded in real `fraud_explanations` data — no hallucinated reasons
- [ ] `POST /api/v1/copilot/ask` endpoint
- [ ] Frontend Copilot chat UI
- [ ] "Why was my payment blocked?" returns answer matching stored explanation

### Phase 10 — Hardening & Polish ⬜ NOT STARTED
- [ ] Rate limiting complete pass — all endpoints covered
- [ ] Audit logging completeness verified
- [ ] Encryption at rest — PII columns encrypted
- [ ] Accessibility pass — contrast ratios, touch targets, reduced-motion
- [ ] Load test fraud scoring path — confirm < 500ms at load
- [ ] Final visual polish — Design.md tokens applied everywhere
- [ ] All PRD.md success criteria measurably met
- [ ] Kubernetes manifests written
- [ ] CI/CD pipeline (GitHub Actions) — lint, test, build, deploy
- [ ] Staging deployment live and demoable
- [ ] Replace dev-mode OTP console print with real SMS/email provider
- [ ] Pin all dependency versions in requirements.txt

## Bug Log (Phase 4 additions)

| # | Bug | Root Cause | Fix |
|---|---|---|---|
| 21 | f-string syntax error in fraud route | Single quotes inside single-quote f-string | Replaced with string concatenation |
| 22 | `ModuleNotFoundError: No module named 'httpx'` | httpx added to requirements.txt but container not rebuilt | `docker compose up -d --build --pull=never backend` |
| 23 | `ModuleNotFoundError: No module named 'xgboost'` in ml-service | requirements.txt had `lightgbm` instead of `xgboost` | Replaced with `xgboost` in requirements.txt |
| 24 | ml-service `/score` always returned same prediction | `main.py` used stub scorer, never called `predictor.predict()` | Rewrote `main.py` to import and call `predict()` |
| 25 | f-string `"` inside `"` in wallet_service block path | Python f-string quote conflict | Extracted to variable `risk_score_val` before f-string |
| 26 | `FraudDecision`, `FraudCaseStatus`, `AlertType` missing `values_callable` | Same enum casing bug as all previous phases | Fixed via Python str.replace() script inside container |
| 27 | Fraud scoring string replacement matched 0 functions | Script used single quotes but actual file used double quotes | Fixed by first printing exact repr() of target block, then matching exactly |

## Decision Log (Phase 4 additions)

| Date | Decision | Reason |
|---|---|---|
| 2026-06-26 | ML service fallback returns 0.4 (challenge) if unreachable | Payments shouldn't be blindly approved if fraud scoring is down; challenge is safer than approve as default |
| 2026-06-26 | Challenge path allows transaction to complete (not pause) | Async OTP challenge flow requires pending transaction state — deferred to Phase 5; challenge flag in fraud_scores is sufficient for Phase 4 |
| 2026-06-26 | Weighted formula: 35% behavioral + 30% transaction + 20% device + 15% ML | Matches PRD.md spec; behavioral signals most important since they're hardest to fake |
| 2026-06-27 | Fraud scoring runs before `db.commit()` in payment functions | Block path can roll back cleanly; if scoring ran after commit, blocking would require a reversal transaction |

## Daily/Session Log

| Date | Time spent | What was done | Next step |
|---|---|---|---|
| 2026-06-17/18 | ~2 sessions | Phase 0 complete | Phase 1 |
| 2026-06-19/20 | Long session | Phase 1 complete — 12 bugs | Phase 2 |
| 2026-06-20 | Setup | Team split, Ganesh/Mayur onboarded | Phase 2 |
| 2026-06-20/21 | Long session | Phase 2 core complete | Merchant/QR/UPI |
| 2026-06-21 | Long session | Phase 2 fully complete | Phase 3 |
| 2026-06-22/23 | Session | Phase 3 complete | Phase 4 |
| 2026-06-26/27 | Long session | Phase 4 complete — fixed Ganesh's ML service (3 critical gaps), wired XGBoost fraud scoring into payment flow, fraud_scores written to DB, explanation + alerts endpoints live. Fixed 7 more bugs (#21-27). | Phase 5 — SHAP, alert delivery, case management |