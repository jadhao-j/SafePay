# Tracker.md — Project Progress Tracker

> Update this file as you work. Mark status, dates, and notes. Keep it in sync with `ImplementationPlan.md` phase numbers/names.

## Legend
`⬜ Not Started` · `🟦 In Progress` · `✅ Done` · `🟥 Blocked`

## Phase Tracker

| Phase | Name | Status | Started | Completed | Notes |
|---|---|---|---|---|---|
| 0 | Project Setup | 🟦 | 2026-06-17 | | Monorepo folder structure scaffolded |
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

## Current Phase
**Active phase:** Phase 0 — Project Setup
**Current focus task:** Monorepo folder structure scaffolded
**Blockers:** none

## Task-Level Checklist (update per active phase)

### Phase 0 — Project Setup
- [x] Monorepo folder structure created
- [ ] Frontend (Next.js+TS+Tailwind+ShadCN) initialized
- [ ] Backend (FastAPI) initialized
- [ ] Docker Compose running (postgres, redis, backend, frontend)
- [ ] Linting/formatting configured
- [ ] Health check endpoint live

### Phase 1 — Database & Core Auth
- [ ] Alembic migrations match Schema.md
- [ ] Register endpoint
- [ ] Login endpoint
- [ ] OTP send/verify
- [ ] JWT + refresh token flow
- [ ] RBAC middleware
- [ ] Frontend auth screens wired

### Phase 2 — Wallet & Basic Payments
- [ ] Wallet endpoints (balance, add, withdraw)
- [ ] P2P transfer (pass-through, no fraud check)
- [ ] Merchant payment (pass-through)
- [ ] Transaction history endpoint
- [ ] Frontend payment flow screens

*(continue adding checklists per phase as you reach them — copy structure from `ImplementationPlan.md`)*

## Decision Log
| Date | Decision | Reason |
|---|---|---|
| | | |

## Change Log
| Date | What changed | Why |
|---|---|---|
| | | |
| 2026-06-17 | Created the SafePay monorepo skeleton, root metadata files, and placeholder service READMEs/.gitkeep files. | Establish Phase 0 project structure before implementing code. |

## Daily/Session Log
| Date | Time spent | What was done | Next step |
|---|---|---|---|
| | | | |
| 2026-06-17 | initial setup | Read docs and scaffolded the repository structure only. | Add framework initialization in the frontend and backend next. |