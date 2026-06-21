
# Tracker.md — Project Progress Tracker

> Update this file as you work. Mark status, dates, and notes. Keep it in sync with `ImplementationPlan.md` phase numbers/names.

## Legend
`⬜ Not Started` · `🟦 In Progress` · `✅ Done` · `🟥 Blocked`

## Phase Tracker

| Phase | Name | Status | Started | Completed | Notes |
|---|---|---|---|---|---|
| 0 | Project Setup | ✅ | 2026-06-17 | 2026-06-18 | All 6 containers healthy, docs in place |
| 1 | Database & Core Auth | ✅ | 2026-06-19 | 2026-06-20 | Full flow tested end-to-end: register → OTP → login → refresh → logout |
| 2 | Wallet & Basic Payments | ✅ | 2026-06-20 | 2026-06-21 | All 8 endpoints built and tested, including idempotency + rejection paths on every money-movement endpoint |
| 3 | Device & Behavioral Data Collection | ⬜ | | | |
| 4 | Fraud Detection Engine (Core AI) | ⬜ | | | |
| 5 | Explainable AI + Alerts + Case Management | ⬜ | | | |
| 6 | Blockchain Fraud Intelligence Layer | ⬜ | | | |
| 7 | Federated Learning Layer | ⬜ | | | |
| 8 | Admin SOC Dashboard | ⬜ | | | |
| 9 | AI Copilot | ⬜ | | | |
| 10 | Hardening & Polish | ⬜ | | | |

## Current Phase
**Active phase:** Phase 3 — Device & Behavioral Data Collection
**Current focus task:** Not yet started — see ImplementationPlan.md Phase 3 scope (device fingerprinting on login, behavioral telemetry capture, baseline enrollment, trusted devices page)
**Blockers:** None. Docker Desktop on Windows had several transient networking/memory blips this session (connection resets, WatchFiles memory error) — all resolved via container restart or full Docker Desktop restart. Not a code issue; logged in Bug Log below for awareness going into Phase 3's longer-running dev sessions.

## Task-Level Checklist

### Phase 0 — Project Setup
- [x] Monorepo folder structure created
- [x] Frontend (Next.js+TS+Tailwind+ShadCN) initialized
- [x] Backend (FastAPI) initialized
- [x] Docker Compose running (postgres, redis, backend, frontend, ml-service, hardhat-node)
- [x] Linting/formatting configured
- [x] Health check endpoint live, checks postgres + redis

### Phase 1 — Database & Core Auth
- [x] Alembic migrations match Schema.md (18 tables + enum-fix migrations)
- [x] Register endpoint — creates user (pending) + wallet
- [x] Login endpoint — JWT access + refresh token pair
- [x] OTP send/verify — Redis-backed, hashed, activates user
- [x] JWT + refresh token flow — rotation on every refresh, revocation on logout
- [x] RBAC middleware — Bearer token required on all non-public routes
- [x] Device fingerprint + rate limit middleware (basic version; full device tracking deferred to Phase 3)
- [x] Tested end-to-end: register → OTP verify → login → refresh → reuse-rejected → logout → reuse-rejected

### Phase 2 — Wallet & Basic Payments ✅ COMPLETE
- [x] `GET /wallet/balance` — tested
- [x] `POST /wallet/add-money` — tested, idempotency confirmed, uses `PaymentType.TOPUP`
- [x] `POST /wallet/withdraw` — tested, insufficient-balance rejection confirmed, uses `PaymentType.WITHDRAWAL`
- [x] `POST /payments/p2p/transfer` — tested with 2 real users, dual wallet locking verified, idempotency confirmed, receiver identified by phone
- [x] `GET /wallet/transactions` — tested, correct ordering and payment_type labels
- [x] `POST /payments/merchant/pay` — tested, money correctly routed to merchant owner's wallet
- [x] `POST /payments/qr/generate` — tested, public endpoint (no auth needed), returns merchant payload
- [x] `POST /payments/qr/pay` — tested, reuses `pay_merchant` by parsing QR payload JSON
- [x] `POST /payments/upi/send` — tested, idempotency confirmed, reuses `transfer_p2p` via `<phone>@safepay` UPI ID convention
- [ ] (Deferred to Phase 3) `wallet/payment-requests` — needs alerts infrastructure
- [ ] (Deferred to Phase 3) `wallet/scheduled-payments` / `payments/recurring` — needs job scheduler

**Phase 2 exit criteria met:** every money-movement endpoint tested for (a) happy path with correct balance changes verified directly in Postgres, (b) idempotency — replaying the same request with the same `idempotency_key` returns the original transaction without double-moving money, and (c) at least one failure path (insufficient balance) correctly rejected without side effects.


---

### Phase 3 — Device & Behavioral Data Collection ⬜ NOT STARTED

- [ ] Device fingerprinting on every login — stored in `devices` table
- [ ] Behavioral telemetry JS SDK — keystroke dwell/flight time capture
- [ ] Touch telemetry — pressure + swipe velocity capture
- [ ] `POST /api/v1/behavior/telemetry` — ingest behavioral events
- [ ] Behavioral baseline enrollment flow — 20 session minimum
- [ ] `GET /api/v1/behavior/trust-score` — returns current behavioral trust score
- [ ] Trusted Devices page — list + revoke
- [ ] Behavioral events stored in `behavioral_events` table

---

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

---

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

---

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

---

### Phase 7 — Federated Learning Layer ⬜ NOT STARTED

- [ ] Flower server (coordinator) running
- [ ] 3 simulated bank client processes
- [ ] Each client trains on local data shard only
- [ ] FedAvg aggregation across clients
- [ ] Global model versioned + hot-swapped into ml-service
- [ ] `fl_training_rounds` metrics logged — accuracy/loss only, no raw data
- [ ] FL round completes without any raw data leaving client process

---

### Phase 8 — Admin SOC Dashboard ⬜ NOT STARTED

- [ ] Real-time transaction feed via WebSocket
- [ ] Fraud heatmap visualization
- [ ] Risk score distribution charts
- [ ] Device intelligence view
- [ ] Merchant management view
- [ ] User management view
- [ ] Behavioral analytics aggregate view
- [ ] Live risk score updates via Redis pub/sub

---

### Phase 9 — AI Copilot ⬜ NOT STARTED

- [ ] LangGraph agent with tools: explain-transaction, explain-risk-score, recommend-security-action
- [ ] Copilot grounded in real `fraud_explanations` data — no hallucinated reasons
- [ ] `POST /api/v1/copilot/ask` endpoint
- [ ] Frontend Copilot chat UI
- [ ] "Why was my payment blocked?" returns answer matching stored explanation

---

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
- [ ] Replace dev-mode OTP console print with real SMS/email provider integration
- [ ] Pin all dependency versions in requirements.txt (bcrypt/passlib lesson learned in Phase 1)

---
## Bug Log (Phase 1 + Phase 2)

| # | Bug | Root Cause | Fix |
|---|---|---|---|
| 1 | Alembic silently did nothing | `DATABASE_URL` hardcoded with wrong driver/credentials in `docker-compose.yml`, overriding `.env` | Fixed env var, then made it permanent via direct terminal edit |
| 2 | Alembic still silent after URL fix | `psycopg2-binary` not installed in backend container | Added to `requirements.txt`, rebuilt image |
| 3 | Alembic still silent after psycopg2 fix | `alembic/env.py` was an empty placeholder file | Wrote real `env.py` reading `DATABASE_URL` from environment |
| 4 | `ModuleNotFoundError: app.db.base` | `db/base.py` didn't exist; `Base` actually lived in `models/base.py` | Created `db/base.py` as import aggregator, `db/session.py` for sync Alembic session |
| 5 | `password authentication failed for user "paysafe"` | `.env` and `docker-compose.yml` env var values mismatched | Standardized on `postgres:postgres`, fixed both files |
| 6 | bcrypt "password too long" on 11-char password | `bcrypt`/`passlib` version incompatibility | Pinned `bcrypt==4.0.1`, `passlib[bcrypt]==1.7.4` |
| 7 | `alembic revision` failed: missing template | `alembic/script.py.mako` didn't exist | Created standard Mako template file |
| 8 | `AttributeError: pending` on UserStatus | `UserStatus` enum missing `PENDING` value | Added enum value + migration |
| 9 | `invalid input value for enum user_status: "PENDING"` | SQLAlchemy `Enum()` sends member *name* not `.value` by default | Added `values_callable=lambda e: [x.value for x in e]` to all `Enum()` columns |
| 10 | Same enum bug on `wallet_status` | Same root cause as #9, different table | Same `values_callable` fix in `payments.py` |
| 11 | `device_id` NOT NULL constraint failure | Device tracking not built until Phase 3 | Migration: `transactions.device_id` made nullable |
| 12 | Async/sync SQLAlchemy driver conflict | One `DATABASE_URL` couldn't serve both async app + sync Alembic | Split into `DATABASE_URL` (asyncpg) + `ALEMBIC_DATABASE_URL` (sync) |
| 13 | Transaction history showed `"p2p"` for add-money/withdraw | `wallet_service.py` hardcoded `PaymentType.P2P` everywhere | Added `TOPUP`/`WITHDRAWAL` enum values + migration, updated functions |
| 14 | Intermittent `Recv failure: Connection was reset`, even on `/health` | Docker Desktop on Windows networking degrading over long uptimes | `docker compose down && up`; escalate to full Docker Desktop restart if needed |
| 15 | `merchant/pay` returned 500: `'NoneType' object has no attribute 'id'` | `pay_merchant()`'s final line was `return` with the variable name accidentally dropped (`return` instead of `return txn`) | Added missing `txn` to the return statement |
| 16 | Backend crashed on reload: `NameError: name 'router' is not defined` | Route decorator code (`@router.post(...)`) accidentally pasted into `wallet_service.py` instead of `payments.py` | Removed misplaced route code from the service file, kept only the plain service function |
| 17 | `qr/generate` returned 401 `Missing access token` | New route wasn't added to `RBACMiddleware`'s `PUBLIC_PATHS`, but QR generation is merchant-facing and shouldn't require a customer token | Added `/api/v1/payments/qr/generate` to `PUBLIC_PATHS` |
| 18 | `WatchfilesRustInternalError: Cannot allocate memory (os error 12)` | File-watcher resource exhaustion after long session of repeated rebuilds/restarts | `docker compose restart backend` cleared it |

## Decision Log

| Date | Decision | Reason |
|---|---|---|
| 2026-06-17 | App name: SafePay (not PaySafe) | Matches FYP abstract and most existing docs |
| 2026-06-18 | Rewrote `docker-compose.yml` without YAML merge keys (`<<`) | Merge key syntax conflicted with installed Docker Compose version on Windows |
| 2026-06-20 | P2P transfer identifies receiver by phone number, not wallet UUID | Matches realistic UX — users know phone numbers, not internal wallet IDs |
| 2026-06-20 | Refresh/logout require `Authorization: Bearer <token>` header rather than a `user_id` field in the request body | Correct security pattern — access token (even expired) proves identity via signature, client-supplied `user_id` could be tampered with |
| 2026-06-20 | Phase 2 scope narrowed for first pass to core mechanism (balance/add-money/withdraw/p2p/transactions) before extending to merchant/QR/UPI | Avoid repeating Phase 1's pattern of debugging 10+ endpoints simultaneously |
| 2026-06-20 | Team split by folder ownership (backend=you, ml-service=Ganesh, blockchain=Mayur) | Each service is an independently buildable Docker container; avoids merge conflicts |
| 2026-06-21 | Merchant payments route funds to the merchant *owner's* personal wallet, since `merchants` table has no wallet of its own | Matches schema as designed; merchant-specific wallets would be a schema change out of scope for Phase 2 |
| 2026-06-21 | QR generate/pay built as thin wrappers: `generate_qr_payload` returns a JSON-able dict, `pay_qr` parses that same JSON string and delegates to `pay_merchant` | Avoids duplicating locking/idempotency logic — any future bug fix to `pay_merchant` automatically benefits QR pay too |
| 2026-06-21 | UPI IDs modeled as `<phone>@safepay` convention rather than adding a new `upi_id` column to `users` | Schema only defined `upi_id` on `merchants`, not `users`; this convention lets `upi/send` reuse `transfer_p2p` directly with zero schema changes, matching real UPI ID formatting |

## Daily/Session Log

| Date | Time spent | What was done | Next step |
|---|---|---|---|
| 2026-06-17/18 | ~2 sessions | Phase 0 complete: monorepo, Docker Compose, all 6 services healthy | Start Phase 1 |
| 2026-06-19/20 | Long debugging session | Phase 1 complete: full auth flow built and tested end-to-end through 12 real bugs | Start Phase 2 |
| 2026-06-20 | Setup | Team split planned: Ganesh (ML), Mayur (Blockchain) onboarding docs created | Continue Phase 2 solo |
| 2026-06-20/21 | Long session | Phase 2 core mechanism complete: balance, add-money, withdraw, P2P transfer, transaction history — all tested | Build merchant/QR/UPI endpoints |
| 2026-06-21 | Long session | Phase 2 fully completed: merchant/pay, qr/generate, qr/pay, upi/send all built, tested, and verified (including idempotency on every endpoint). Fixed 5 more real bugs (#15–18) — missing return statement, misplaced route code, missing public path, and a file-watcher memory error. All 8 Phase 2 endpoints confirmed working with real balance verification in Postgres after every test. | Start Phase 3 — Device & Behavioral Data Collection |