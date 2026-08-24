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
| 5 | Explainable AI + Alerts + Case Management | ✅ | 2026-06-28 | 2026-06-29 | SHAP live, fraud_explanations + alerts written per transaction, all 6 fraud endpoints, 4 frontend pages built |
| 6 | Blockchain Fraud Intelligence Layer | ✅ | 2026-06-30 | 2026-07-01 | FraudRegistry + Reputation contracts deployed to Hardhat, Web3.py integration, auto-publish on confirmed_fraud, BlockchainPanel.tsx verified in browser |
| 7 | Federated Learning Layer | ✅ | 2026-07-01 | 2026-07-04 | Flower FedXgbBagging, 3 simulated bank clients, AUC 0.846, fl_training_rounds logged, /model/reload endpoint live |
| 8 | Admin SOC Dashboard | ✅ | 2026-07-05 | 2026-07-06 | All 4 remaining items complete: risk chart, live updates, user mgmt + actions, behavioral analytics |
| 9 | AI Copilot | ✅ | 2026-07-08 | 2026-07-08 | LangGraph agent + 3 tools live, Gemini 1.5 Flash active, grounded answers verified, user copilot page built |
| 10a | User App Frontend | ✅ | 2026-07-08 | 2026-07-08 | Tier 1-3 complete, 15 screens — built against v1 design tokens (now superseded, see 10a-v2) |
| 10a-v2 | Frontend Design Pivot (v2 dark/editorial) | ✅ | 2026-07-12 | 2026-07-16 | Option B full rebuild complete. All 15 user-app screens + all 9 admin pages rebuilt with v2 dark tokens. Shared AdminPageShell + v2 globals.css keyframes added. AdminKpiPanel and AdminSocShell upgraded to pure inline styles. |
| 10 | Hardening & Polish | ✅ | 2026-07-17 | 2026-08-01 | PIN system, payment routing, challenge-OTP flow, copilot fix, QR camera, wallet modal, admin login, ₹1000 starter balance |
| 11 | Smart Notifications · User Analytics · Merchant Portal | ✅ | 2026-08-01 | 2026-08-14 | All 4 sub-phases complete: notification center, user analytics, personal QR, contact book, merchant portal (register + dashboard) |

## Current Phase
**Active phase:** None — all phases complete through Phase 11.
**Current focus task:** N/A
**Blockers:** None.

> **Note (2026-07-12):** Design.md was revised to v2 mid-project, after Phase 10a and Phase 8's frontend were already fully built and verified. Every one of the 15 Phase 10a screens and all 8 admin pages currently use now-retired v1 tokens. Option B (full rebuild against v2, not the faster Option A token-only swap) was chosen deliberately — see Decision Log — so this phase re-touches nearly every existing frontend file already marked complete above, not just new screens.

> **Note — Phase 10a (User App Frontend)** was identified as a planning gap: AppFlow.md defines 14 user-facing screens that were never assigned to any phase checklist. Phase 10a closed this gap before final hardening.

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

### Phase 5 — Explainable AI + Alerts + Case Management ✅ COMPLETE
- [x] SHAP integration in ml-service — TreeExplainer on 338-feature XGBoost, top 5 contributors returned per prediction
- [x] `fraud_explanations` row written with top_factors JSONB on every scored transaction
- [x] Replace heuristic explanation text with SHAP-driven reasons via `generate_explanation_text()`
- [x] Alert creation on every block/challenge — `create_alert()` writes to `alerts` table
- [x] `GET /fraud/alerts` queries `alerts` table, filtered by user_id
- [x] `PATCH /fraud/alerts/{id}/read` — mark alert read/unread
- [x] `GET /fraud/transactions/{id}/explanation` — full SHAP + component scores response
- [x] `POST /fraud/case` + `GET /fraud/case/{id}` + `PATCH /fraud/case/{id}` — full case CRUD
- [x] Frontend Transaction History page — filterable list, status badges, fraud row highlighting
- [x] Frontend Transaction Detail page — amount card + meta + SHAP ExplanationPanel + Open Case CTA
- [x] Frontend Admin Alerts page — SOC dark theme, filter pills, mark-read, inline explanation drawer
- [x] Frontend Admin Cases page — alert-to-case queue, open case actions
- [x] Frontend Admin Case Detail page — status controls, notes, SHAP evidence panel
- [x] Verified end-to-end: transfer → SHAP scored → explanation in DB → alert written → all 4 pages render

### Phase 6 — Blockchain Fraud Intelligence Layer ✅ COMPLETE
- [x] Mayur's contracts merged — FraudRegistry.sol + Reputation.sol deployed to Hardhat
- [x] Web3.py backend integration
- [x] Hash function — keccak256(entity_id + salt), zero PII on chain
- [x] POST /blockchain/fraud-signal/publish — called on confirmed fraud case
- [x] GET /blockchain/fraud-signal/lookup/{hash}
- [x] GET /blockchain/reputation/{hash}
- [x] Confirmed fraud case → auto-publish anonymized signal to chain

### Phase 7 — Federated Learning Layer ✅ COMPLETE
- [x] Flower server (coordinator) running — FedXgbBagging strategy
- [x] 3 simulated bank client processes — bank_a, bank_b, bank_c
- [x] Each client trains on local data shard only
- [x] FedXgbBagging aggregation across clients — AUC 0.846
- [x] Global model saved as fraud_model_fl.json
- [x] fl_training_rounds metrics logged — accuracy/loss only, no raw data
- [x] POST /admin/fl-round endpoint — Flower coordinator calls this after each round
- [x] GET /admin/fl-rounds endpoint — lists completed rounds
- [x] POST /model/reload endpoint — validates FL model availability
- [x] cross_bank_fraud_signal wired into ML payload from blockchain lookup
- [x] FL round completes without any raw data leaving client process

### Phase 8 — Admin SOC Dashboard ✅ COMPLETE
- [x] GET /admin/dashboard/overview — KPIs verified
- [x] GET /admin/dashboard/heatmap — fraud distribution by payment_type and decision
- [x] GET /admin/devices — device intelligence, ordered by trust score
- [x] GET /admin/merchants — merchant list ordered by risk rating
- [x] GET /admin/investigations — fraud cases with optional status filter
- [x] WebSocket /ws/admin/feed — real-time transaction events via Redis pub/sub
- [x] publish_transaction_event() wired into score_transaction() pipeline
- [x] /health exempted from RateLimitMiddleware
- [x] Real-time transaction feed via WebSocket — /ws/admin/feed, token via query param,
      role-gated (admin/fraud_analyst/compliance_officer), Redis pub/sub channel admin:tx-feed.
      Verified live in browser: two events (pending, then final decision) appeared in the
      SOC dashboard feed panel with zero page refresh.
- [x] Frontend: SOC Dashboard page — KPI panel (6 cards) + live feed panel + risk distribution bar chart, dark theme per Design.md
- [x] Frontend: Heatmap page — payment_type × decision grid, avg risk color-coded, time window selector
- [x] Frontend: Devices page — trust score bars, trusted/untrusted filter
- [x] Frontend: Merchants page — risk rating bars, search filter
- [x] Risk score distribution charts — GET /admin/dashboard/risk-distribution (0.1-wide buckets), bar chart on dashboard updates live via WS feed
- [x] Live risk score updates via Redis pub/sub — same WS feed (admin:tx-feed) increments histogram client-side on each event, no separate stream needed
- [x] User management view — GET /admin/users, role/status badges, security score bars
- [x] User analyst actions — PATCH /admin/users/{id}/status (suspend/freeze/activate), admin-only, optimistic UI with loading/error states
- [x] Behavioral analytics aggregate view — GET /admin/dashboard/behavioral-analytics: trust score buckets, event type breakdown, high-risk user table
- [x] Frontend: Users page — full user table with suspend/freeze/activate actions
- [x] Frontend: Behavioral analytics page — trust score distribution bars, event type breakdown, high-risk user table, 4 KPI cards

### Phase 9 — AI Copilot ✅ COMPLETE
- [x] LangGraph agent with 3 tools: `explain_transaction`, `explain_risk_score`, `recommend_security_action`
- [x] Copilot grounded in real `fraud_explanations` + `fraud_scores` data — user_id scoped, no hallucinations
- [x] `POST /api/v1/copilot/ask` endpoint — wired in `main.py`, schemas defined
- [x] Gemini 1.5 Flash via `langchain-google-genai` — `GEMINI_API_KEY` in `.env` + docker-compose env block
- [x] Deterministic fallback when API key absent — copilot never breaks app
- [x] Cross-user isolation — wallet.user_id check in every tool call, 404-style on mismatch (verified)
- [x] Frontend Copilot chat page at `src/app/(user)/copilot/page.tsx` — user light theme, chat bubbles, source tags, tool badge, ungrounded warning banner
- [x] End-to-end verified: grounded answer with markdown formatting from Gemini confirms LLM is active

### Phase 10a — User App Frontend ✅ COMPLETE

> Closes the planning gap: these screens were in AppFlow.md but never assigned to a phase.
> Backend for all of these is fully working — only the frontend shells needed building.

#### Tier 1 — Critical for demo (Journey C: the main fraud detection flow)
- [x] **Home Dashboard** (Screen 7) — wallet balance display, quick actions (Send / Scan / Copilot / Add Money), recent 5 transactions, security score ring wired to `GET /users/me/security-score`
- [x] **Send Money Page** (Screen 8) — 3-step flow: phone/UPI input → amount (quick-amount chips) → review & confirm, calls `POST /payments/p2p/transfer`, routes by `decision`
- [x] **Challenge Screen** (Screen 12) — 6-digit OTP input, 60s countdown timer, fraud reason from explanation API, calls `POST /payments/{id}/verify-challenge`
- [x] **Success Screen** (Screen 13) — animated spring checkmark, receipt (amount, recipient, txn ID, timestamp), Send Another + Go Home CTAs
- [x] **Blocked Screen** (Screen 14) — red shield, plain-language fraud reason, risk score bar, top 2 SHAP factors, "Talk to Copilot" CTA pre-fills txn ID

#### Tier 2 — Good to have for complete demo
- [x] **Wallet Page** (Screen 17) — balance card with bottom-sheet modal for add/withdraw, full transaction history list
- [x] **Landing Page** (Screen 1) — dark hero, animated headline, stats row, 4 trust badge cards, Sign Up / Login CTAs, demo CTA block
- [x] **Register Page** (Screen 3) — name, email/phone, password + confirm fields, password strength meter, calls `POST /auth/register`, redirects to /otp-verify
- [x] **OTP Verification Page** (Screen 4) — 6-digit segmented input, paste support, 60s countdown + resend, success animation, redirects to /login
- [x] **Login redirect by role** — admin/analyst/compliance_officer → /admin/cases, regular users → /home (JWT payload decoded client-side)

#### Components built
- [x] `BottomNav.tsx` — sticky 5-tab nav: Home, Send, Scan, History, Copilot. Active tab indicator.

#### Tier 3 — Optional / Phase 10 polish
- [x] **Set PIN Page** (Screen 6) — custom keypad, 6-dot indicator, enter + confirm 2-step, mismatch detection, success screen
- [x] **Scan QR Page** (Screen 9) — live BarcodeDetector camera with animated scan line + corner brackets, manual UPI ID fallback, routes by fraud decision
- [x] **Trusted Devices Page** (Screen 18) — trust score bars, OS device icons, 2-step revoke confirmation, `DELETE /users/me/devices/{id}`
- [x] **Security Score Page** (Screen 19) — animated SVG ring, score label badge, 3-factor breakdown bars, contextual improvement tips
- [x] **Profile / Settings Page** (Screen 20) — avatar card with role/status badges, info row, settings groups (Security/Payments/Account), logout

#### BottomNav updated
- [x] Tabs: Home, Send, Scan, Wallet, Profile (History + Copilot accessible from Profile and Home quick actions)

#### Components — built inline (no separate files needed)
- [x] `WalletBalanceCard` — built inline in Home + Wallet pages
- [x] `QuickActions` — 4-button grid built inline in Home Dashboard
- [x] `RecentTransactionsList` — built inline in Home Dashboard (5 txns, status badges)
- [x] `ChallengeModal` — implemented as `/send/challenge/page.tsx` (routed page, not modal)
- [x] `SuccessReceipt` — implemented as `/send/success/page.tsx` (routed page)
- [x] `BlockedExplanation` — implemented as `/send/blocked/page.tsx` (routed page)

### Phase 10a-v2 — Frontend Design Pivot 🟦 IN PROGRESS

> Design.md v2 supersedes v1 after Phase 10a (15 screens) and Phase 8 (8 admin pages) were already complete and verified. This phase re-tokens/rebuilds that existing, working frontend — it does not add new screens or change any backend/AppFlow.md journey logic.

#### Foundation
- [x] `globals.css` — v2 CSS variables (--ink, --panel, --panel-2, --line, --line-2, --white, --dim, --dim-2, --acc, --acc-2, --success, --warning, --danger), replacing both v1 user light-theme vars and v1 admin dark-theme vars
- [x] `tailwind.config.ts` — map v2 tokens, retire v1 `admin.*` and `user.*` color objects
- [x] Space Grotesk added via `next/font/google` in `layout.tsx` — replaces Bebas Neue everywhere (admin display headings) and becomes the display face for user-app hero/balance figures
- [x] Grain overlay + glow blob shared component/utility classes (per Design.md §4)
- [x] `UserShell.tsx` — new responsive nav shell (bottom tab bar <1024px, left sidebar ≥1024px per Design.md §8), replaces standalone `BottomNav.tsx` usage across all 15 user-app screens
- [x] Desktop breakpoint layout rules (max-width 1120px main content, 480px centered modal for Send/Review/Confirm on desktop, two-column Home at ≥1280px)

#### User app screens — retoken/rebuild against v2 (all 15 screens from Phase 10a, structurally unchanged, visual system only)
- [x] Home Dashboard
- [x] Send Money flow (+ Challenge / Success / Blocked)
- [x] Wallet — hero banner, frosted glass balance card, add/withdraw bottom-sheet modal with quick-amount chips
- [x] Landing — (pre-existing v2 build)
- [x] Register — spinning conic logo, glassmorphism card, animated password strength bar
- [x] OTP Verify — dark OTP cells with violet fill border, paste support, countdown timer
- [x] Set PIN — glowing dot indicators, dark numpad keys, success animation
- [x] Scan QR — dark viewfinder, corner brackets, animated cyan scan line, manual fallback
- [x] Trusted Devices — dark cards, animated trust score bars, 2-step revoke confirm
- [x] Security Score — animated conic-gradient score ring, factor breakdown bars, recommendations
- [x] Profile / Settings — frosted glass avatar card, conic score ring, settings groups
- [x] Copilot Chat — spinning conic logo header, dark chat bubbles, source tags, typing indicator
- [x] Transaction History — filter pills, search input, dark transaction rows

#### Auth screens — v2 login/register system
- [x] Login — conic spinning logo, radial gradient + dot grid bg, glassmorphism card, gradient sign-in button

#### Admin console — full v2 rebuild (AdminPageShell shared sidebar + all 9 pages)
- [x] **AdminPageShell.tsx** — new shared sidebar component: spinning conic logo, active cyan nav indicator, sign-out link
- [x] **AdminKpiPanel.tsx** — upgraded to pure inline styles, shimmer skeleton loading
- [x] Dashboard — KPI bar + AdminSocShell live feed + risk bar chart + recent alerts panel
- [x] Heatmap — time-window pills, color-coded heatmap table with risk cell backgrounds
- [x] Devices — filter pills (all/untrusted), trust score bars, status badges
- [x] Merchants — search input, risk rating bars, category badges
- [x] Users — search + role filter, security score bars, suspend/freeze/activate actions
- [x] Behavioral Analytics — KPI cards, horizontal bar charts, high-risk users table
- [x] Alerts — filter pills, SHAP explanation drawer, mark-all-read
- [x] Cases — alert-to-case queue, case table with status badges
- [x] Copilot (SOC) — quick-prompt 2×2 grid, dark chat bubbles, source tags, grounded/ungrounded indicators

### Phase 10 — Hardening & Polish ✅ COMPLETE
- [x] PIN system — 4-digit PIN saved to backend (`PATCH /users/me/pin`), verified on every payment
- [x] Payment routing — frontend routes phone → P2P, UPI/email → UPI send correctly
- [x] Challenge-OTP flow — frontend shows OTP verification screen when fraud engine challenges a transaction; balance updates only after verified
- [x] Copilot field name fix — frontend sent `{ message }`, backend expected `{ question }` → 422 on every copilot request → fixed
- [x] Copilot general questions — `_handle_general_question` handler added; questions like "What is my risk score?" return live DB data without a transaction ID
- [x] Scan QR camera size — viewfinder capped at 300×300 px, was stretching full-screen
- [x] Wallet modal z-index — raised to 100 + `maxHeight: 90vh` so sheet never clips under sidebar
- [x] New-user starter balance — ₹1,000 demo balance on registration
- [x] Admin login — reset corrupted bcrypt hash via in-container Python script; `test@safepay.dev / admin123` confirmed working

### Phase 11 — Smart Notifications · User Analytics · Merchant Portal ✅ COMPLETE

> Adds the three biggest missing layers for a complete fintech demo:
> 1. **Notification Center** — real-time in-app alerts for payments, fraud events, security actions
> 2. **User Analytics** — spending trends, risk score history, personalised insights
> 3. **Merchant Portal** — merchant registration, own QR generation, incoming payment dashboard

#### 11A — In-App Notification Center
- [x] Backend: `notifications` table (id, user_id, type ENUM, title, body, read, created_at)
- [x] `GET /notifications/` — paginated, newest first; `X-Unread-Count` response header
- [x] `PATCH /notifications/{id}/read` — mark single read
- [x] `PATCH /notifications/read-all` — mark all read
- [x] Notification triggers: payment success, payment challenged, payment blocked wired into `wallet_service.transfer_p2p`
- [x] Frontend: `NotificationBell.tsx` component — bell icon with red pulsing unread badge
- [x] Frontend: slide-in notification drawer — icon per type, title + body, time-ago label, unread dot
- [x] Frontend: mark-all-read on drawer open, "MARK ALL READ" button
- [x] Real-time push via Redis pub/sub `user:{id}:events` channel — intentionally deferred; polling every 30s implemented in `NotificationBell.tsx` (sufficient for demo, noted in Decision Log)

#### 11B — User Analytics Dashboard
- [x] `GET /analytics/spending` — total + breakdown by payment_type for 7d / 30d / 90d windows
- [x] `GET /analytics/risk-history` — last 20 fraud scores for the user ordered by date
- [x] `GET /analytics/insights` — deterministic AI tips (top spend category, risk trend direction, security improvement suggestions)
- [x] Frontend: `/analytics` page
  - [x] Spending donut chart (CSS conic-gradient, P2P / Merchant / Topup / Withdrawal slices)
  - [x] Risk score timeline — color-coded bar chart (green/amber/red), last 20 scored transactions
  - [x] 3 insight cards (green / amber / blue) from `/analytics/insights`
  - [x] 7d / 30d / 90d time-range pill toggle
- [x] Analytics accessible via BottomNav "More" menu

#### 11C — Personal UPI QR Code
- [x] `GET /payments/qr/my-qr` — returns UPI deep-link payload for the logged-in user (`{phone}@safepay`)
- [x] Frontend: `/my-qr` dedicated page
  - [x] Renders QR using `qrcode` npm canvas library (dynamic import)
  - [x] User's name + UPI ID displayed below with copy button
  - [x] Share (Web Share API) / Download (canvas toBlob) buttons
  - [x] Animated conic-gradient border around QR card
- [x] Accessible via BottomNav "More" menu

#### 11D — Contact Book
- [x] Backend: `contacts` table (id, owner_user_id, name, phone, upi_id, created_at)
- [x] `POST /contacts/`, `GET /contacts/?search=`, `DELETE /contacts/{id}`
- [x] Frontend: avatar chip row on Send page — filters by typed recipient, tap to pre-fill
- [x] Frontend: `/contacts` management page — search, add-contact bottom-sheet, 2-step delete

#### 11E — Merchant Portal
- [x] Backend: `POST /merchant/register` — creates merchant profile (business_name, upi_id, category)
- [x] Backend: `GET /merchant/me`, `GET /merchant/payments`, `GET /merchant/analytics`
- [x] Frontend: merchant registration flow at `/merchant/register` — glassmorphism card, conic spinning logo, category dropdown, success animation
- [x] Frontend: `/merchant` — smart router: checks profile → redirects to register or dashboard
- [x] Frontend: merchant dashboard at `/merchant/dashboard`
  - [x] Total revenue card + daily bar chart (last 7 days, 30d, 90d time-range toggle)
  - [x] Today's incoming payments table with status badges + icons
  - [x] Merchant QR code display with animated conic-gradient border + Copy UPI button

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
| 28 | Blockchain bank private key missing trailing hex digit | Key in compose env was 65 chars (`...78690`) instead of 66 (`...78690d`), deriving wrong unfunded address | Pulled correct key from hardhat-node startup logs |
| 29 | `ResponseValidationError` on PATCH /fraud/case/{id} | Return type hint was `dict[str, str]` but blockchain results are nested dicts | Changed return type to plain `dict` |
| 30 | POST /admin/fl-round returning 401 | /api/v1/admin/fl-round not in PUBLIC_PATHS — RBAC middleware blocked it before route handler | Added to PUBLIC_PATHS in middleware.py |
| 31 | /model/reload crashed /score after swap | FL model has different feature set (285 features) vs production model (338 features) — XGBoost feature_names mismatch | Kept production model for scoring, FL model validated separately via /model/reload |

## Decision Log (Phase 4 additions)

| Date | Decision | Reason |
|---|---|---|
| 2026-06-26 | ML service fallback returns 0.4 (challenge) if unreachable | Payments shouldn't be blindly approved if fraud scoring is down; challenge is safer than approve as default |
| 2026-06-26 | Challenge path allows transaction to complete (not pause) | Async OTP challenge flow requires pending transaction state — deferred to Phase 5; challenge flag in fraud_scores is sufficient for Phase 4 |
| 2026-06-26 | Weighted formula: 35% behavioral + 30% transaction + 20% device + 15% ML | Matches PRD.md spec; behavioral signals most important since they're hardest to fake |
| 2026-06-27 | Fraud scoring runs before `db.commit()` in payment functions | Block path can roll back cleanly; if scoring ran after commit, blocking would require a reversal transaction |
| 2026-07-12 | Chose Option B (full rebuild) over Option A (token-swap-only) for the v2 design pivot | Portfolio/thesis-quality visual polish valued over the ~2–3 day time cost; Option A was the faster/lower-risk recommendation but Option B better serves the FYP demo goal. Accepted trade-off: re-touches all 23 already-complete frontend files (15 user + 8 admin) rather than a pure CSS variable swap. |
| 2026-08-14 | Deferred Redis pub/sub real-time notification push; use 30s polling instead | Redis WebSocket per-user push adds infra complexity (new channel, socket auth, reconnect logic) for marginal demo benefit. Polling every 30s provides acceptable UX and is already implemented in `NotificationBell.tsx`. Can be upgraded post-submission. |

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
| 2026-06-28/29 | Long session | Phase 5 complete — SHAP TreeExplainer integrated (338 features), fraud_explanations table live, create_alert() wired, 6 fraud API endpoints verified, 4 frontend pages + shared components built (ExplanationPanel, AlertRow, CaseStatusBadge), route group layouts added. | Phase 6 — Blockchain |
| 2026-07-01 | Long session | Phase 6 complete — Hardhat contracts compiled + deployed, blockchain_service.py Web3.py integration, 3 blockchain routes live, auto-publish on confirmed_fraud, BlockchainPanel.tsx rendering in browser with real tx hashes | Phase 7 — Federated Learning |
| 2026-07-04 | Long session | Phase 7 complete — Flower FL integrated, 3 bank clients, FedXgbBagging AUC 0.846, fl_training_rounds in DB, cross_bank_fraud_signal wired, /model/reload live | Phase 8 — Admin SOC Dashboard |
| 2026-07-05/06 | Long session | Phase 8 complete — all 4 remaining admin items: risk chart (GET /admin/dashboard/risk-distribution), live WS updates, user mgmt + analyst actions, behavioral analytics. 4 frontend pages built. | Phase 9 — AI Copilot |
| 2026-07-08 | Session | Phase 9 complete — copilot_agent.py (328 lines, 3 tools), copilot_service.py, route, schemas all verified. GEMINI_API_KEY wired into docker-compose + .env. Gemini 1.5 Flash active (markdown answers confirmed). Cross-user isolation tested. Frontend copilot chat page built at /copilot. | Phase 10a — User App Frontend |
| 2026-07-08 | Session | Phase 10a Tier 1 complete — BottomNav.tsx (5-tab sticky nav), Home Dashboard (balance card + security score ring + quick actions + recent 5 txns), Send Money 3-step flow (routes to challenge/success/blocked by fraud decision), Challenge OTP screen (6-digit input + 60s timer + verify-challenge), Success screen (animated checkmark + receipt), Blocked screen (SHAP factors + Copilot CTA), Wallet page (gradient card + add/withdraw modal + history). | Phase 10a Tier 2 / Phase 10 |
| 2026-07-08 | Session | Phase 10a Tier 2 complete — Landing page (dark hero, stats, trust badges, demo CTA), Register page (name/email/phone/password + strength meter, POST /auth/register), OTP verify page (segmented input + paste + 60s resend + success animation), Login role-based redirect (admin → /admin/cases, user → /home). Full onboarding flow now complete. | Phase 10 — Hardening |
| 2026-07-08 | Session | Phase 10a Tier 3 complete — Scan QR (BarcodeDetector camera + manual fallback), Trusted Devices (trust bars + 2-step revoke), Security Score (animated SVG ring + factor breakdown + tips), Profile/Settings (avatar card + settings groups + logout), Set PIN (custom keypad + 2-step confirm). BottomNav updated to Home/Send/Scan/Wallet/Profile. Phase 10a fully complete. | Phase 10 — Hardening |
| 2026-07-12 | Session | Design.md revised to v2 (dark/editorial, unified user+admin tokens, Space Grotesk replaces Bebas Neue). AppFlow.md updated for responsive nav (sidebar ≥1024px, centered modal for Send/Review on desktop). Reviewed Option A vs B, chose Option B (full rebuild). Tracker updated: new Phase 10a-v2 opened, re-scoping all Phase 10a + Phase 8 frontend work against v2 tokens. | Phase 10a-v2 foundation: globals.css, tailwind.config.ts, Space Grotesk, UserShell.tsx |
| 2026-07-16 | Session | Phase 10a-v2 Batch 1 complete — Home, Send, Challenge, Success, Blocked. All v2 premium dark with frosted glass, gradients, conic shield rings. | Phase 10a-v2 Batch 2 |
| 2026-07-16 | Session | Phase 10a-v2 **FULLY COMPLETE** — All 15 user-app screens + 9 admin pages rebuilt. User: Wallet (hero+glass card+bottom-sheet), Copilot (spinning logo, dark chat, source tags), Profile (frosted glass avatar + conic score ring + settings groups), History (filter pills + search), Security Score (animated conic ring), Trusted Devices (spring bars + 2-step revoke), Scan QR (corner brackets + scan line), Set PIN (glow dots + dark numpad), OTP Verify (dark OTP cells + paste), Register (strength bar), Login (spinning logo + dot grid). Admin: new AdminPageShell shared sidebar, AdminKpiPanel upgraded, Dashboard/Heatmap/Devices/Merchants/Users/Behavioral/Alerts/Cases/Copilot all rebuilt inline. globals.css updated: body now #050608, sp-spin/sp-shimmer/sp-pulse keyframes global. | Phase 10 — Hardening & Polish |
| 2026-08-14 | Session | Phase 11 **FULLY COMPLETE** — Verified all Phase 11 sub-phases done: 11A notification center (bell + drawer + polling), 11B user analytics (spending donut + risk timeline + insights), 11C personal UPI QR page, 11D contact book. Built missing 11E merchant portal: `POST /merchant/register` + `GET /merchant/me/payments/analytics` backend (merchant_service.py, merchant.py route), `/merchant/register` dedicated page (glassmorphism + conic logo + category dropdown + success anim), `/merchant/dashboard` page (KPI cards + daily bar chart + animated conic QR + payments table + 7d/30d/90d range toggle), `/merchant` smart router. Tracker.md updated — all phases 0–11 now ✅ complete. | Demo-ready — no further phases planned |