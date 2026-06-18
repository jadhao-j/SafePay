# TechStack.md — Technical Requirements Document

## 1. Stack Overview

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, ShadCN UI |
| Backend | FastAPI (Python 3.11+) |
| AI / ML | XGBoost, Isolation Forest, SHAP, LangChain, LangGraph |
| Database | PostgreSQL (primary), Redis (cache, session, rate-limit) |
| Blockchain | Solidity, Hardhat (local testnet), Web3.py |
| Federated Learning | Flower (flwr) |
| Infra | Docker, Docker Compose (dev), Kubernetes (prod) |
| Auth | JWT (access + refresh), OAuth2 (social login), RBAC |

## 2. User Authentication

### Flow
1. **Registration** → email/phone + password → OTP verification (SMS/email) → behavioral baseline enrollment begins.
2. **Login** → password or passwordless (magic link / OTP) → device fingerprint captured → if new device, trigger MFA.
3. **MFA** → OTP, or biometric (WebAuthn/platform biometric) for supported devices.
4. **Session** → short-lived JWT access token (15 min) + httpOnly refresh token (7 days) stored in Redis-backed session store, rotated on use.
5. **RBAC roles**: `user`, `merchant`, `fraud_analyst`, `compliance_officer`, `admin`.

### Token Design
- Access token: JWT, HS256/RS256, claims = `user_id`, `role`, `device_id`, `trust_score`, `exp`.
- Refresh token: opaque random string, stored hashed in Postgres + Redis, revocable.
- Every authenticated request passes through a middleware that re-validates device fingerprint and attaches `behavioral_trust_score` to the request context for downstream fraud scoring.

## 3. API Structure

Base URL: `/api/v1`

```
/auth
  POST   /register
  POST   /login
  POST   /otp/send
  POST   /otp/verify
  POST   /mfa/verify
  POST   /refresh
  POST   /logout

/users
  GET    /me
  PATCH  /me
  GET    /me/devices
  DELETE /me/devices/{device_id}
  GET    /me/security-score

/wallet
  GET    /balance
  POST   /add-money
  POST   /withdraw
  GET    /transactions
  POST   /payment-requests
  POST   /scheduled-payments

/payments
  POST   /upi/send
  POST   /qr/generate
  POST   /qr/pay
  POST   /merchant/pay
  POST   /p2p/transfer
  POST   /recurring

/fraud
  POST   /score            (internal: trigger risk scoring for a transaction)
  GET    /transactions/{id}/explanation
  GET    /alerts
  POST   /case             (open fraud investigation)
  GET    /case/{id}

/behavior
  POST   /telemetry         (ingest keystroke/mouse/touch events)
  GET    /trust-score

/blockchain
  POST   /fraud-signal/publish
  GET    /fraud-signal/lookup/{hash}
  GET    /reputation/{entity_hash}

/admin
  GET    /dashboard/overview
  GET    /dashboard/heatmap
  GET    /devices
  GET    /merchants
  GET    /investigations

/copilot
  POST   /ask
```

### Conventions
- All responses: `{ "data": ..., "error": null, "meta": {...} }`
- Versioned via URL path (`/api/v1`), not headers.
- Pagination: cursor-based (`?cursor=...&limit=...`).
- All mutating endpoints idempotent via `Idempotency-Key` header for payment safety.

## 4. Database

**PostgreSQL** — primary system of record (see `Schema.md` for full DDL/ER detail). Core domains: users, devices, wallets, transactions, fraud_scores, fraud_cases, blockchain_signals, behavioral_events.

**Redis** — used for:
- Session/refresh-token store
- Rate limiting (sliding window per user/IP)
- Real-time behavioral trust score cache (TTL-based)
- Pub/sub for real-time admin dashboard updates

**TimescaleDB extension (optional, recommended)** on Postgres for high-volume behavioral telemetry and transaction time-series if scale requires it.

## 5. AI Layer

| Component | Tool | Purpose |
|---|---|---|
| Supervised fraud classifier | XGBoost | Primary transaction-level fraud probability |
| Anomaly detector | Isolation Forest | Unsupervised outlier detection on behavioral/device features |
| Explainability | SHAP | Per-prediction feature attribution → feeds Explainability Agent |
| Agent orchestration | LangGraph | Stateful multi-agent workflow (Fraud → Risk → Device → Behavioral → Decision → Explainability → Alert) |
| Agent tool-calling / reasoning | LangChain | Tool wrappers around scoring services, blockchain lookups, copilot |
| Federated training | Flower | Coordinates local model training across simulated institution clients |

Model serving: scikit-learn/XGBoost models served via a dedicated FastAPI microservice (`fraud-ml-service`), loaded in-memory, versioned with MLflow or simple file-based versioning for MVP.

## 6. Blockchain Layer

- **Network**: local Hardhat node (dev), testnet (e.g. Polygon Amoy) for staging.
- **Contracts (Solidity)**:
  - `FraudRegistry.sol` — stores `bytes32` hashes of fraudulent device/merchant/account identifiers + risk indicator metadata.
  - `Reputation.sol` — tracks reputation score per hashed entity.
- **Access**: Web3.py from backend services; only hashed identifiers (e.g. `keccak256(device_id + salt)`) ever leave the system — no PII on-chain.

## 7. Infrastructure

- **Dev**: Docker Compose (frontend, backend, fraud-ml-service, postgres, redis, hardhat-node).
- **Prod**: Kubernetes — separate deployments for `web`, `api`, `ml-service`, `fl-coordinator`, with HPA on `api` and `ml-service`.
- **CI/CD**: GitHub Actions — lint, type-check, test, build, push image, deploy.
- **Secrets**: environment-based (`.env` in dev), Kubernetes Secrets / cloud secret manager in prod.
- **Observability**: structured logging (JSON), OpenTelemetry traces, Prometheus + Grafana dashboards for latency/risk-score distribution.

## 8. Security Requirements (cross-cutting)

- JWT + OAuth2 + RBAC enforced at API gateway/middleware layer.
- TLS in transit; AES-256 at rest for PII columns (encrypted at the application or DB-extension level).
- Rate limiting per IP + per user on auth and payment endpoints.
- Device fingerprinting on every session.
- Full audit logging (immutable, append-only table) for auth events, payment events, and fraud decisions.
- Secure session management: token rotation, device revocation, forced logout on suspicious risk score.