# ImplementationPlan.md — Phased Build Plan

> Designed for solo "vibe coding" in VS Code + Copilot. Each phase is scoped to be completable and demoable on its own before moving to the next. Update `Tracker.md` as each phase/task completes.

## Phase 0 — Project Setup
- Initialize monorepo structure (`/frontend`, `/backend`, `/ml-service`, `/blockchain`, `/docs`)
- Set up Next.js + TypeScript + Tailwind + ShadCN in `/frontend`
- Set up FastAPI project skeleton in `/backend`
- Set up Docker Compose: postgres, redis, backend, frontend
- Configure `.env.example`, linting (ESLint/Prettier, ruff/black), pre-commit hooks
- Initialize Git repo, base README

**Exit criteria**: `docker compose up` runs an empty frontend + backend that talk to each other (health check endpoint returns 200).

## Phase 1 — Database & Core Auth
- Implement full schema from `Schema.md` via migrations (Alembic)
- Build `/auth` endpoints: register, login, OTP send/verify, refresh, logout
- JWT issuance + Redis session store
- RBAC middleware
- Frontend: Landing, Sign Up, Login, OTP Verification screens wired to real API

**Exit criteria**: A user can register, verify OTP, log in, and reach a protected "home" route with a valid session.

## Phase 2 — Wallet & Basic Payments
- Wallet model + add money / withdraw / balance endpoints
- P2P transfer and merchant payment endpoints (no fraud checks yet — pass-through approve)
- Transaction history endpoint + pagination
- Frontend: Home Dashboard, Send Money, Amount Entry, Review & Confirm, Success screens, Transaction History

**Exit criteria**: Two seeded users can send money to each other end-to-end and see it reflected in balances and history.

## Phase 3 — Device & Behavioral Data Collection
- Device fingerprinting on login/session (store in `devices`)
- Behavioral telemetry capture on frontend (keystroke/mouse/touch listeners) → `/behavior/telemetry`
- Behavioral baseline enrollment flow (frontend screen + backend storage)
- Trusted Devices page (list/revoke)

**Exit criteria**: Behavioral and device data is visibly populating in the database for real user sessions; baseline enrollment completes and is stored.

## Phase 4 — Fraud Detection Engine (Core AI)
- Build feature extraction service (transaction_deviation, behavioral_deviation, device_risk, location_risk, merchant_risk, synthetic_identity scores)
- Train/integrate XGBoost classifier + Isolation Forest anomaly detector (can start with synthetic/seeded training data)
- Implement weighted risk scoring formula (35/30/20/15) → `fraud_scores` table
- Implement Decision Agent thresholds (Approve <0.3, Challenge 0.3–0.7, Block >0.7)
- Wire risk scoring into the payment flow (synchronous call before transaction finalizes)
- Frontend: Challenge screen (OTP/face-verify), Blocked screen with reason

**Exit criteria**: A crafted "suspicious" test transaction (large amount, new device, odd hour) gets Challenged or Blocked; a normal transaction is Approved with <500ms added latency.

## Phase 5 — Explainable AI + Alerts + Case Management
- SHAP integration for per-prediction feature attribution
- Explainability Agent: generate human-readable explanation text + recommended action
- Alerts table + notification delivery (in-app, simple email stub)
- Fraud case creation on Block/Challenge-failed, fraud analyst case detail view
- Frontend: Transaction Detail explanation panel, Alerts page (admin), Case Detail page (admin)

**Exit criteria**: Every blocked/challenged transaction has a readable explanation visible to both the user and the fraud analyst; analyst can open/close a case.

## Phase 6 — Blockchain Fraud Intelligence Layer
- Write & deploy `FraudRegistry.sol` + `Reputation.sol` to local Hardhat node
- Backend Web3.py integration: publish signal, lookup signal, reputation query
- Hash device/merchant/account identifiers before any on-chain write (no PII)
- Wire: confirmed fraud case → auto-publish anonymized signal to chain
- Frontend: Device/Merchant risk view shows on-chain reputation in admin console

**Exit criteria**: Confirming a fraud case writes a signal to the local chain; looking up that hashed entity elsewhere in the app reflects the updated reputation score.

## Phase 7 — Federated Learning Layer
- Set up Flower server (coordinator) + 2–3 simulated client processes representing "institutions"
- Each client trains locally on its own partition of data; only model weights are exchanged
- Aggregate global model, version it, and hot-swap it into the fraud-ml-service
- Log `fl_training_rounds` metrics (accuracy/loss only, no raw data)

**Exit criteria**: A full federated round runs across simulated clients and produces a new global model version with logged metrics, without any client's raw data leaving its process.

## Phase 8 — Admin SOC Dashboard
- Real-time transaction feed (WebSocket or Redis pub/sub → frontend)
- Fraud heatmap, risk score visualization (charts)
- Device intelligence, merchant management, user management views
- Behavioral analytics aggregate views

**Exit criteria**: Admin can watch transactions flow in real time and see risk distributions update live.

## Phase 9 — AI Copilot
- LangGraph/LangChain-based assistant with tools: explain-transaction, explain-risk-score, recommend-security-action, account-recovery-helper
- Frontend chat UI wired into Copilot endpoint
- Ground every Copilot answer in actual `fraud_explanations`/`fraud_scores` data (no hallucinated reasons)

**Exit criteria**: Asking the Copilot "why was my payment blocked?" returns an answer consistent with the stored explanation for that transaction.

## Phase 10 — Hardening & Polish
- Rate limiting, audit logging completeness pass, encryption-at-rest review
- Accessibility pass (contrast, reduced-motion, touch targets) per `Design.md`
- Load/perf test on fraud scoring path (<500ms target)
- Final visual polish matching `Design.md` tokens across user app + admin console
- Deployment to staging (Kubernetes manifests, CI/CD pipeline)

**Exit criteria**: All success criteria in `PRD.md` are measurably met; staging deployment is live and demoable end-to-end.

## Suggested Order Rationale
Auth → Payments → Data collection → Fraud AI → Explainability → Blockchain → Federated Learning → Admin UI → Copilot → Hardening. This order ensures every fraud-related layer (Phases 4–7) has real transaction/behavioral data to work against before being built, and that the user-facing payment flow is functional and demoable as early as Phase 2.