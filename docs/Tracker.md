# Tracker.md — Project Progress Tracker

> Update this file as you work. Mark status, dates, and notes. Keep it in sync with `ImplementationPlan.md` phase numbers/names.

## Legend
`⬜ Not Started` · `🟦 In Progress` · `✅ Done` · `🟥 Blocked`

## Phase Tracker

| Phase | Name | Status | Started | Completed | Notes |
|---|---|---|---|---|---|
| 0 | Project Setup | ✅ | 2026-06-17 | 2026-06-18 | All containers running, health check confirmed, pushed to GitHub |
| 1 | Database & Core Auth | ⬜ | | | |
| 2 | Wallet & Basic Payments | ⬜ | | | |
| 3 | Device & Behavioral Data Collection | ⬜ | | | |
| 4 | Fraud Detection Engine (Core AI) | ⬜ | | | |
| 5 | Explainable AI + Alerts + Case Management | ⬜ | | | |
| 6 | Blockchain Fraud Intelligence Layer | ⬜ | | | |
| 7 | Federated Learning Layer | ⬜ | | | |
| 8 | Admin SOC Dashboard | ⬜ | | | |
| 9 | AI Copilot | ⬜ | | | |
| 10 | Hardening & Polish | ⬜ | | | |

---

## Current Phase
**Active phase:** Phase 1 — Database & Core Auth
**Current focus task:** Not started — begin with Alembic migrations
**Blockers:** none

---

## Task-Level Checklist

### Phase 0 — Project Setup ✅ COMPLETE
- [x] Monorepo folder structure created
- [x] Frontend (Next.js 14 + TS + Tailwind + ShadCN) initialized
- [x] Backend (FastAPI + Python 3.11) initialized
- [x] Docker Compose running — postgres, redis, backend, frontend, ml-service, hardhat-node
- [x] All 6 containers healthy and passing health checks
- [x] `.env` file created from `.env.example`
- [x] `ml-service/main.py` stub created — /health + /score endpoints live
- [x] `ml-service/requirements.txt` created
- [x] `blockchain/package.json` + `hardhat.config.js` created
- [x] All Dockerfiles fixed and building correctly
- [x] `docker-compose.yml` fixed (removed `<<` merge key conflicts)
- [x] Health check endpoint live — `GET /health` returns `{status: ok}`
- [x] Linting config present (ESLint + Prettier stubs)
- [x] Pushed to GitHub — main branch
- [x] `Tracker.md` updated

**Exit criteria met:** `docker compose up` runs all services healthy. `curl http://localhost:8000/health` returns `{"status":"ok"}` ✅

---

### Phase 1 — Database & Core Auth ⬜ NOT STARTED

- [ ] Alembic migrations run successfully — all 18 tables created in PostgreSQL
- [ ] SQLAlchemy ORM models verified against Schema.md
- [ ] `POST /api/v1/auth/register` — creates user + wallet, triggers OTP
- [ ] `POST /api/v1/auth/otp/send` — generates 6-digit OTP, stores in Redis TTL 600s
- [ ] `POST /api/v1/auth/otp/verify` — validates OTP, activates user
- [ ] `POST /api/v1/auth/login` — password verify, device check, issues JWT pair
- [ ] `POST /api/v1/auth/refresh` — rotates access + refresh token
- [ ] `POST /api/v1/auth/logout` — revokes refresh token in Redis
- [ ] JWT access token (15 min) + refresh token (7 days) working
- [ ] Redis session store for refresh tokens
- [ ] RBAC middleware — roles: user, merchant, fraud_analyst, compliance_officer, admin
- [ ] Device fingerprint middleware — reads X-Device-ID header
- [ ] Rate limit middleware — 10 req/min on auth endpoints
- [ ] Audit log written on every auth event
- [ ] Frontend login page — wired to real API
- [ ] Frontend register page — wired to real API
- [ ] Frontend OTP verify page — wired to real API
- [ ] Frontend set-pin page — wired to real API
- [ ] `useAuth` hook — login, logout, refresh, isAuthenticated
- [ ] Auth tests — happy path + failure path + security checks

---

### Phase 2 — Wallet & Basic Payments ⬜ NOT STARTED

- [ ] `GET /api/v1/wallet/balance` — return wallet balance
- [ ] `POST /api/v1/wallet/add-money` — add funds to wallet
- [ ] `POST /api/v1/wallet/withdraw` — withdraw funds
- [ ] `POST /api/v1/payments/p2p/transfer` — P2P transfer (no fraud check yet)
- [ ] `POST /api/v1/payments/merchant/pay` — merchant payment (pass-through)
- [ ] `GET /api/v1/wallet/transactions` — paginated transaction history
- [ ] Idempotency key enforced on all payment endpoints
- [ ] All amounts stored as NUMERIC — never float
- [ ] Frontend Home Dashboard — balance + quick actions
- [ ] Frontend Send Money page — wired to API
- [ ] Frontend Amount Entry page
- [ ] Frontend Review & Confirm page
- [ ] Frontend Success screen
- [ ] Frontend Transaction History page
- [ ] Frontend Wallet page

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

---

## Decision Log

| Date | Decision | Reason |
|---|---|---|
| 2026-06-17 | App name: SafePay (not PaySafe) | Matches abstract and FYP submission |
| 2026-06-17 | Use asyncpg driver for PostgreSQL | Better async performance with FastAPI |
| 2026-06-18 | Removed `<<` merge keys from docker-compose.yml | Incompatible with newer Docker Compose versions on Windows |
| 2026-06-18 | Added ml-service stub before Phase 4 | Needed to keep all containers healthy from Phase 0 |
| 2026-06-18 | Added blockchain package.json + hardhat.config.js | Hardhat container needs Node project to start |

---

## Change Log

| Date | What changed | Why |
|---|---|---|
| 2026-06-17 | Created SafePay monorepo skeleton | Phase 0 kickoff |
| 2026-06-17 | All 18 ORM models created | Match Schema.md exactly |
| 2026-06-17 | All route stubs returning 501 | Skeleton ready for implementation |
| 2026-06-18 | Fixed docker-compose.yml merge key conflict | Windows Docker Compose compatibility |
| 2026-06-18 | Created ml-service/main.py + requirements.txt | ml-service container was crashing |
| 2026-06-18 | Created blockchain/package.json + hardhat.config.js | hardhat-node container was crashing |
| 2026-06-18 | All 6 containers confirmed healthy | Phase 0 exit criteria met |
| 2026-06-18 | Pushed to GitHub main branch | Version control established |

---

## Daily / Session Log

| Date | Time spent | What was done | Next step |
|---|---|---|---|
| 2026-06-17 | ~2 hrs | Scaffolded monorepo, all folders, Dockerfiles, ORM models, route stubs, schemas, Tailwind config | Fix Docker Compose and start containers |
| 2026-06-18 | ~3 hrs | Fixed docker-compose.yml, created ml-service stub, created blockchain config, got all 6 containers running and healthy | Push to GitHub → start Phase 1 |