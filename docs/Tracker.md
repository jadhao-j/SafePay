# Tracker.md — Project Progress Tracker

> Update this file as you work. Mark status, dates, and notes. Keep it in sync with `ImplementationPlan.md` phase numbers/names.

## Legend
`⬜ Not Started` · `🟦 In Progress` · `✅ Done` · `🟥 Blocked`

## Phase Tracker

| Phase | Name | Status | Started | Completed | Notes |
|---|---|---|---|---|---|
| 0 | Project Setup | ✅ | 2026-06-17 | 2026-06-18 | All 6 containers healthy, docs in place |
| 1 | Database & Core Auth | ✅ | 2026-06-19 | 2026-06-20 | Full flow tested end-to-end: register → OTP → login → refresh → logout |
| 2 | Wallet & Basic Payments | ✅ | 2026-06-20 | 2026-06-21 | All 8 endpoints built and tested, idempotency + rejection paths verified |
| 3 | Device & Behavioral Data Collection | ✅ | 2026-06-22 | 2026-06-23 | Device upsert on login, telemetry ingestion, trust score, device management, device_id on transactions |
| 4 | Fraud Detection Engine (Core AI) | ⬜ | | | |
| 5 | Explainable AI + Alerts + Case Management | ⬜ | | | |
| 6 | Blockchain Fraud Intelligence Layer | ⬜ | | | |
| 7 | Federated Learning Layer | ⬜ | | | |
| 8 | Admin SOC Dashboard | ⬜ | | | |
| 9 | AI Copilot | ⬜ | | | |
| 10 | Hardening & Polish | ⬜ | | | |

## Current Phase
**Active phase:** Phase 4 — Fraud Detection Engine (Core AI)
**Current focus task:** Not yet started — feature extraction service, XGBoost classifier, weighted risk scoring, decision agent, wire into payment flow
**Blockers:** None. Phase 3 completed cleanly.

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

### Phase 4 — Fraud Detection Engine ⬜ NOT STARTED
- [ ] Feature extraction service — 6 deviation scores
- [ ] XGBoost classifier — trained on IEEE-CIS dataset
- [ ] Isolation Forest anomaly detector
- [ ] Weighted risk score formula (35/30/20/15)
- [ ] `POST /api/v1/fraud/score` — internal scoring endpoint
- [ ] Decision agent — Approve / Challenge / Block thresholds
- [ ] `fraud_scores` row written for every transaction
- [ ] Wire fraud scoring into payment flow (before transaction finalizes)
- [ ] Frontend Challenge screen — OTP / face verify
- [ ] Frontend Blocked screen — with plain-language reason
- [ ] Latency target < 500ms verified

### Phase 5 — Explainable AI + Alerts + Case Management ⬜ NOT STARTED
- [ ] SHAP integration — per-prediction feature attribution
- [ ] `fraud_explanations` row written for every block/challenge
- [ ] Human-readable explanation text generated
- [ ] `GET /api/v1/fraud/transactions/{id}/explanation` endpoint live
- [ ] Alerts table — fraud_block, fraud_challenge, device_new, security_score_drop
- [ ] In-app alert delivery
- [ ] `POST /api/v1/fraud/case` — open fraud investigation
- [ ] Frontend Transaction Detail — explanation panel
- [ ] Frontend Alerts page (admin)
- [ ] Frontend Case Detail page (admin)

### Phase 6 — Blockchain Fraud Intelligence Layer ⬜ NOT STARTED
- [ ] `FraudRegistry.sol` contract written
- [ ] `Reputation.sol` contract written
- [ ] Contracts deployed to local Hardhat node
- [ ] Web3.py backend integration
- [ ] Hash function — keccak256(entity_id + salt), zero PII on chain
- [ ] `POST /api/v1/blockchain/fraud-signal/publish` endpoint
- [ ] `GET /api/v1/blockchain/fraud-signal/lookup/{hash}` endpoint
- [ ] Confirmed fraud case → auto-publish to chain
- [ ] Admin console shows on-chain reputation scores

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

## Bug Log

| # | Bug | Root Cause | Fix |
|---|---|---|---|
| 1 | Alembic silently did nothing | `DATABASE_URL` hardcoded wrong in `docker-compose.yml` | Fixed env var via terminal |
| 2 | Alembic still silent | `psycopg2-binary` not installed | Added to `requirements.txt`, rebuilt |
| 3 | Alembic still silent | `alembic/env.py` was empty placeholder | Wrote real `env.py` |
| 4 | `ModuleNotFoundError: app.db.base` | `db/base.py` didn't exist | Created as import aggregator |
| 5 | `password authentication failed for user "paysafe"` | Credential mismatch between `.env` and `docker-compose.yml` | Standardized on `postgres:postgres` |
| 6 | bcrypt "password too long" on 11-char password | `bcrypt`/`passlib` version incompatibility | Pinned `bcrypt==4.0.1`, `passlib[bcrypt]==1.7.4` |
| 7 | `alembic revision` failed | `alembic/script.py.mako` missing | Created standard template |
| 8 | `AttributeError: pending` | `UserStatus` enum missing `PENDING` | Added value + migration |
| 9 | `invalid input value for enum user_status: "PENDING"` | SQLAlchemy sends member name not `.value` | Added `values_callable` to all `Enum()` columns |
| 10 | Same enum bug on `wallet_status` | Same root cause, different table | Same fix in `payments.py` |
| 11 | `device_id` NOT NULL constraint | Phase 3 not built yet | Migration: made nullable |
| 12 | Async/sync driver conflict | One URL for both app + Alembic | Split into `DATABASE_URL` + `ALEMBIC_DATABASE_URL` |
| 13 | Transaction history showed `"p2p"` for all types | `PaymentType.P2P` hardcoded | Added `TOPUP`/`WITHDRAWAL` enum values + migration |
| 14 | Intermittent connection reset | Docker Desktop networking degrading | Full `docker compose down && up` or Docker Desktop restart |
| 15 | `merchant/pay` 500: `NoneType` has no `.id` | `return txn` written as bare `return` | Added missing `txn` |
| 16 | `NameError: name 'router' is not defined` | Route decorator pasted into service file | Removed misplaced code |
| 17 | `qr/generate` returned 401 | Route not in `PUBLIC_PATHS` | Added to middleware public paths |
| 18 | `WatchfilesRustInternalError: Cannot allocate memory` | File-watcher resource exhaustion | `docker compose restart backend` |
| 19 | `invalid input value for enum behavioral_event_type: "KEYSTROKE"` | `BehavioralEventType` missing `values_callable` | Added via `sed` on `identity.py` |
| 20 | `device_id = None` param in wrong position | `sed` inserted optional param before required params | Rewrote signatures via Python `str.replace()` inside container |

## Decision Log

| Date | Decision | Reason |
|---|---|---|
| 2026-06-17 | App name: SafePay (not PaySafe) | Matches FYP abstract |
| 2026-06-18 | Rewrote `docker-compose.yml` without YAML merge keys | Incompatible with installed Docker Compose on Windows |
| 2026-06-20 | P2P receiver identified by phone, not wallet UUID | Realistic UX — users know phone numbers, not wallet IDs |
| 2026-06-20 | Refresh/logout require `Authorization` header not `user_id` in body | Token proves identity; client-supplied user_id could be tampered |
| 2026-06-20 | Team split by folder ownership | Avoids merge conflicts, each service independently buildable |
| 2026-06-21 | Merchant payments to owner's wallet | `merchants` has no wallet; matches schema |
| 2026-06-21 | QR pay delegates to `pay_merchant` | No duplicate locking logic |
| 2026-06-21 | UPI IDs as `<phone>@safepay` | No `upi_id` on `users`; reuses `transfer_p2p` with zero schema changes |
| 2026-06-22 | Phase 3 trust score kept heuristic | Phase 4 ML replaces it; avoid premature complexity |
| 2026-06-23 | `device_id` optional on transactions | Backward compatible — payments without device header still work |

## Daily/Session Log

| Date | Time spent | What was done | Next step |
|---|---|---|---|
| 2026-06-17/18 | ~2 sessions | Phase 0 complete | Start Phase 1 |
| 2026-06-19/20 | Long session | Phase 1 complete — full auth flow, 12 bugs fixed | Start Phase 2 |
| 2026-06-20 | Setup | Team split planned, Ganesh/Mayur onboarded | Continue Phase 2 |
| 2026-06-20/21 | Long session | Phase 2 core complete | Merchant/QR/UPI |
| 2026-06-21 | Long session | Phase 2 fully complete — all 8 endpoints, 5 more bugs fixed | Start Phase 3 |
| 2026-06-22/23 | Session | Phase 3 complete — device upsert, telemetry, trust score, device management, device_id on transactions. Fixed bugs #19-20. All verified in Postgres. | Start Phase 4 — Fraud Detection Engine |