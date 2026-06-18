# PRD.md — PaySafe Product Requirements Document

## 1. Problem Statement

Digital payments in India and globally have grown explosively (UPI, wallets, QR, P2P), but fraud has grown with them. Existing consumer payment apps (Google Pay, Paytm, PhonePe) verify *credentials* (OTP, PIN, biometric login) but largely fail to verify *behavior* — they cannot tell if the person making a transaction is acting like the real account owner. Fraud rings exploit this gap using stolen credentials, SIM-swaps, social-engineering, and device farms, while banks and fintechs operate fraud detection in silos with no cross-institution intelligence sharing.

PaySafe exists to solve three compounding problems:

1. **Reactive fraud detection** — most systems flag fraud after money has moved, not before.
2. **Siloed fraud intelligence** — a device or account flagged as fraudulent at Bank A is unknown to Bank B.
3. **Black-box AI decisions** — when a transaction is blocked, users and compliance teams get no explanation, eroding trust and creating regulatory risk.

PaySafe addresses this by combining real-time behavioral biometrics, multi-signal risk scoring, blockchain-based fraud intelligence sharing, and explainable AI into a single autonomous fraud-defense layer sitting underneath a standard UPI/wallet payment experience.

## 2. Target Users

| Segment | Description | Key Need |
|---|---|---|
| Retail consumers | Everyday users sending P2P transfers, paying merchants, scanning QR codes | Fast, frictionless payments that feel safe without extra steps |
| Merchants | Small-to-large businesses accepting digital payments | Low fraud chargebacks, fast settlement, simple integration |
| Fraud & risk analysts | Internal SOC/fraud team monitoring the platform | Real-time visibility, explainable alerts, case management |
| Compliance officers | Regulatory and audit stakeholders | Audit trails, explainability, data-privacy guarantees |
| Partner banks / fintechs | Institutions joining the cross-platform fraud network | Shared fraud signals without exposing customer PII |

## 3. Core Features

### Payments
- UPI-style payments, QR payments, P2P transfers, merchant payments, recurring/scheduled payments
- Wallet: add/withdraw money, balance, transaction history, payment requests

### Authentication & Trust
- Registration, login, OTP, passwordless auth, MFA, biometric login
- Trusted device management, behavioral baseline enrollment

### Fraud Detection Engine
- Real-time data collection (transaction, device, behavioral, historical context)
- Feature extraction (deviation scores, device/location/merchant risk)
- Weighted risk scoring (0.0–1.0) combining behavioral, transaction, device, and cross-bank signals
- Autonomous decisioning: Approve / Challenge (OTP, face verification) / Block + freeze + alert
- Explainable AI output for every flagged decision

### Behavioral Biometrics
- Continuous authentication via typing cadence, mouse dynamics, touch pressure, swipe velocity
- Behavioral Trust Score (0–100)

### Blockchain Fraud Intelligence
- Anonymized fraud signal ledger (device/merchant/account hashes — no PII)
- Cross-institution publish/lookup, reputation scoring

### Federated Learning
- Privacy-preserving collaborative model training across institutions (weights only, no raw data)

### Dashboards
- User dashboard: balance, transactions, risk insights, trusted devices, security score
- Admin/SOC dashboard: real-time transaction feed, fraud heatmaps, risk visualization, case management, device/behavioral analytics

### AI Copilot
- In-app assistant explaining blocked transactions, risk scores, and recommending security actions

## 4. Success Criteria

| Metric | Target (MVP) | Target (V1) |
|---|---|---|
| Fraud detection latency (decision per transaction) | < 500ms | < 200ms |
| False positive rate on legitimate transactions | < 5% | < 2% |
| Fraud catch rate (recall on labeled fraud test set) | > 80% | > 92% |
| Explainability coverage (every Challenge/Block has a human-readable reason) | 100% | 100% |
| System uptime | 99.5% | 99.95% |
| End-to-end transaction success (approved path) | < 2s perceived latency | < 1s |
| Cross-institution fraud signal sharing without PII leakage | 0 PII incidents in audit | 0 PII incidents in audit |

## 5. Out of Scope (MVP)

- Real bank/UPI network integration (use sandbox/mock rails)
- Real federated learning across actual external institutions (simulate with multiple local model "clients")
- Production blockchain mainnet deployment (use local/testnet chain, e.g. Hardhat network)
- Full regulatory certification (PCI-DSS, RBI compliance) — design for it, do not certify it