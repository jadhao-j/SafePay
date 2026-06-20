# Tracker.md — Project Progress Tracker

> Update this file as you work. Mark status, dates, and notes. Keep it in sync with `ImplementationPlan.md` phase numbers/names.

## Legend
`⬜ Not Started` · `🟦 In Progress` · `✅ Done` · `🟥 Blocked`

## Phase Tracker

| Phase | Name | Status | Started | Completed | Notes |
|---|---|---|---|---|---|
| 0 | Project Setup | ✅ | 2026-06-17 | 2026-06-18 | All containers running, health check confirmed, pushed to GitHub |
| 1 | Database & Core Auth | ✅ | 2026-06-19 | 2026-06-20 | Full auth flow tested end-to-end: register, OTP, login, refresh, logout |
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
**Active phase:** Phase 2 — Wallet & Basic Payments
**Current focus task:** Not started — begin with wallet balance + add money endpoints
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
- [x] `blockchain/package.json` + `hardhat.config.js` created
- [x] All Dockerfiles fixed and building correctly
- [x] `docker-compose.yml` fixed (removed `<<` merge key conflicts)
- [x] Health check endpoint live — `GET /health` returns `{status: ok}`
- [x] Pushed to GitHub — main branch

**Exit criteria met:** `docker compose up` runs all services healthy. ✅

---

### Phase 1 — Database & Core Auth ✅ COMPLETE

- [x] Alembic migrations run successfully — all 18 tables + alembic_version created in PostgreSQL
- [x] Second migration added — `pending` value added to `user_status` Postgres enum
- [x] SQLAlchemy ORM models verified against Schema.md
- [x] `POST /api/v1/auth/register` — creates user (status=pending) + wallet (status=active), triggers OTP — **tested 201 Created**
- [x] `POST /api/v1/auth/otp/send` — generates 6-digit OTP, stores hashed in Redis TTL 600s
- [x] `POST /api/v1/auth/otp/verify` — validates OTP, activates user — **tested 200 OK, status pending→active confirmed in DB**
- [x] `POST /api/v1/auth/login` — password verify, issues JWT pair — **tested 200 OK, real access+refresh tokens returned**
- [x] `POST /api/v1/auth/refresh` — rotates access + refresh token, old token deleted from Redis — **tested 200 OK + reuse correctly returns 401**
- [x] `POST /api/v1/auth/logout` — revokes refresh token in Redis — **tested 200 OK + reuse correctly returns 401**
- [x] JWT access token (15 min) + refresh token (7 days, opaque, Redis-backed) working
- [x] Redis session store for refresh tokens (hashed, never stored raw)
- [x] OTP hashed in Redis (never stored raw) with constant-time comparison
- [x] RBACMiddleware — verifies JWT from Authorization header, attaches user_id/role to request.state
- [x] Expiry-exempt path handling for /refresh and /logout (accepts technically-expired access token to identify user)
- [x] DeviceFingerprintMiddleware — reads X-Device-ID headers
- [x] RateLimitMiddleware — Redis sliding window, stricter limit on auth endpoints
- [x] Audit log written on register, otp.verified, login, token.refresh, logout
- [x] Dual database URL setup — async (asyncpg) for app, sync (psycopg2) for Alembic, no more driver conflicts
- [x] SQLAlchemy enum columns fixed with `values_callable` across identity.py and payments.py — prevents name/value casing bugs
- [x] Debug print statements removed from auth_service.py after verification

**Exit criteria met:** Full auth flow tested end-to-end with real curl requests against running containers — register → OTP verify → login → refresh (with rotation + reuse rejection) → logout (with revocation + reuse rejection). ✅

**Frontend auth screens (login/register/otp-verify/set-pin) and useAuth hook:** Deferred — backend-first approach taken for Phase 1, frontend wiring will happen alongside Phase 2 frontend work to batch frontend changes together.

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
- [ ] Fix remaining enum `values_callable` gaps in payments.py if new bugs surface (TransactionStatus, PaymentType, PaymentRequestStatus, ScheduledPaymentFrequency already fixed in Phase 1 cleanup)
- [ ] Frontend Home Dashboard — balance + quick actions
- [ ] Frontend Send Money page — wired to API
- [ ] Frontend Amount Entry page
- [ ] Frontend Review & Confirm page
- [ ] Frontend Success screen
- [ ] Frontend Transaction History page
- [ ] Frontend Wallet page
- [ ] Frontend login/register/otp-verify/set-pin pages wired to real Phase 1 auth API
- [ ] `useAuth` hook — login, logout, refresh, isAuthenticated

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

## Decision Log

| Date | Decision | Reason |
|---|---|---|
| 2026-06-17 | App name: SafePay (not PaySafe) | Matches abstract and FYP submission |
| 2026-06-17 | Use asyncpg driver for PostgreSQL (app layer) | Better async performance with FastAPI |
| 2026-06-18 | Removed `<<` merge keys from docker-compose.yml | Incompatible with newer Docker Compose versions on Windows |
| 2026-06-18 | Added ml-service stub before Phase 4 | Needed to keep all containers healthy from Phase 0 |
| 2026-06-19 | Split DATABASE_URL into two variables | App needs async (asyncpg), Alembic needs sync (psycopg2) — single shared URL caused repeated conflicts |
| 2026-06-19 | Added PENDING to UserStatus enum (Python + Postgres) | Required for register→OTP verify→active flow; original enum only had ACTIVE/SUSPENDED/FROZEN |
| 2026-06-19 | Added `values_callable` to all Enum() columns in identity.py and payments.py | SQLAlchemy was sending Python enum .name (e.g. "ACTIVE") instead of .value (e.g. "active") to Postgres, causing InvalidTextRepresentationError |
| 2026-06-19 | Pinned bcrypt==4.0.1 and passlib[bcrypt]==1.7.4 | Unpinned versions were incompatible, causing silent password validation errors |
| 2026-06-19 | Refresh/logout use Authorization header (not body user_id) | More secure — client-supplied user_id in body could be spoofed; access token (even expired) proves identity via decode_token_ignore_expiry |
| 2026-06-19 | Created backend/alembic/script.py.mako manually | File was missing from original scaffold, blocking `alembic revision` command |

---

## Bug Log (Phase 1 — for postmortem / thesis writing)

| # | Bug | Root Cause | Fix |
|---|---|---|---|
| 1 | `alembic upgrade head` printed nothing, no tables created | DATABASE_URL used `+asyncpg` driver, but Alembic requires sync driver | Created separate `ALEMBIC_DATABASE_URL` with plain `postgresql://` |
| 2 | `ModuleNotFoundError: app.db.base` | Alembic env.py imported from a path that didn't exist yet | Created `app/db/base.py` re-exporting `Base` from `app/models/base.py` |
| 3 | `password authentication failed for user "paysafe"` | docker-compose.yml had a stale hardcoded fallback URL with different credentials than Postgres was initialized with | Aligned all credentials to `postgres:postgres` everywhere |
| 4 | `ModuleNotFoundError: psycopg2` | Alembic needs psycopg2 but only asyncpg was in requirements.txt | Added `psycopg2-binary==2.9.9` |
| 5 | `ModuleNotFoundError: app.db.base` (again, different cause) | `env.py` was a placeholder with no real code | Wrote full working `env.py` with proper offline/online migration functions |
| 6 | App crashed on startup: `asyncio extension requires async driver, psycopg2 is not async` | After fixing Alembic's URL to sync, the same URL was being read by the async app code | Split into two env vars permanently (see Decision Log) |
| 7 | `FileNotFoundError: alembic/script.py.mako` | Template file missing from scaffold | Created standard Alembic mako template manually |
| 8 | `AttributeError: pending` on UserStatus | Enum only had ACTIVE/SUSPENDED/FROZEN, no PENDING value existed | Added PENDING to Python enum + new Alembic migration to alter Postgres enum type |
| 9 | `invalid input value for enum user_status: "PENDING"` | SQLAlchemy Enum() column defaults to sending `.name` (uppercase) not `.value` (lowercase) | Added `values_callable=lambda e: [x.value for x in e]` to the column definition |
| 10 | Same bug as #9 but on `wallet_status` | Same root cause, different table — `Wallet.status` had the same unfixed Enum() column | Applied same `values_callable` fix across all 5 enum columns in payments.py |
| 11 | `password cannot be longer than 72 bytes` on an 11-character password | bcrypt/passlib version mismatch causing passlib to misread bcrypt's version metadata | Pinned `bcrypt==4.0.1` and `passlib[bcrypt]==1.7.4` |
| 12 | PowerShell `curl` and `Invoke-WebRequest` quoting/escaping failures | PowerShell's curl alias ≠ real curl; nested quotes break easily | Switched to `curl.exe` with `--data-binary "@file.json"` pattern for all test requests |

**Lesson for future phases:** Whenever a new ORM model with an `Enum()` column is added, apply `values_callable` immediately rather than discovering the bug at request time. Whenever a new Python package is added to requirements.txt, pin the exact version rather than using `>=`.

---

## Change Log

| Date | What changed | Why |
|---|---|---|
| 2026-06-17 | Created SafePay monorepo skeleton | Phase 0 kickoff |
| 2026-06-17 | All 18 ORM models created | Match Schema.md exactly |
| 2026-06-18 | Fixed docker-compose.yml merge key conflict | Windows Docker Compose compatibility |
| 2026-06-18 | All 6 containers confirmed healthy | Phase 0 exit criteria met |
| 2026-06-18 | Pushed to GitHub main branch | Version control established |
| 2026-06-19 | Wrote real `auth_service.py` — register, OTP, login, refresh, logout logic | Phase 1 core implementation |
| 2026-06-19 | Wrote real `api/v1/routes/auth.py` — replaced all 501 stubs with working endpoints | Phase 1 core implementation |
| 2026-06-19 | Wrote real `core/middleware.py` — RBAC JWT verification, device fingerprint, rate limiting | Phase 1 core implementation |
| 2026-06-19 | Added refresh token + OTP hashing helpers to `core/security.py` | Required for secure token rotation and OTP storage |
| 2026-06-19 | Created `backend/alembic/script.py.mako` | Missing migration template |
| 2026-06-19 | Created migration `d4232f70a5d7` — added `pending` to `user_status` enum | Schema gap discovered during implementation |
| 2026-06-20 | Fixed `values_callable` on all Enum() columns in identity.py + payments.py | Prevent enum casing bugs across all tables |
| 2026-06-20 | Pinned bcrypt and passlib versions in requirements.txt | Fix password hashing crash |
| 2026-06-20 | Full auth flow tested end-to-end via curl against live containers | Phase 1 verification |
| 2026-06-20 | Removed debug print statements from auth_service.py | Code cleanup after verification |

---

## Daily / Session Log

| Date | Time spent | What was done | Next step |
|---|---|---|---|
| 2026-06-17 | ~2 hrs | Scaffolded monorepo, all folders, Dockerfiles, ORM models, route stubs, schemas, Tailwind config | Fix Docker Compose and start containers |
| 2026-06-18 | ~3 hrs | Fixed docker-compose.yml, created ml-service stub, created blockchain config, got all 6 containers running and healthy | Push to GitHub → start Phase 1 |
| 2026-06-19 to 2026-06-20 | ~4 hrs | Built full auth_service.py, auth routes, middleware, security helpers. Debugged 12 distinct issues across Alembic config, SQLAlchemy async/sync driver conflict, enum casing bugs (2 tables), bcrypt version mismatch, missing migration template, and PowerShell curl quoting. Verified entire auth flow end-to-end with real HTTP requests. | Start Phase 2 — Wallet & Basic Payments |