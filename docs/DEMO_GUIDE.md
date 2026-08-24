# SafePay — Feature Guide & Demo Playbook

> **App URL (laptop):** `http://localhost:3000`  
> **App URL (phone):** `http://10.181.22.23:3000`  
> **Backend API docs:** `http://localhost:8000/docs`

---

## Table of Contents

1. [Test Accounts](#1-test-accounts)
2. [How the Fraud Engine Works](#2-how-the-fraud-engine-works)
3. [How to Trigger APPROVE / CHALLENGE / BLOCK](#3-how-to-trigger-approve--challenge--block)
4. [User App Features](#4-user-app-features)
5. [Admin SOC Dashboard](#5-admin-soc-dashboard)
6. [AI Copilot](#6-ai-copilot)
7. [Blockchain Fraud Intelligence](#7-blockchain-fraud-intelligence)
8. [Federated Learning](#8-federated-learning)
9. [Merchant Portal](#9-merchant-portal)
10. [Notification Center](#10-notification-center)
11. [User Analytics](#11-user-analytics)
12. [Quick Demo Script (5 min)](#12-quick-demo-script-5-min)

---

## 1. Test Accounts

### Regular Users

| Name | Email | Password | PIN | Starting Balance |
|---|---|---|---|---|
| User 1 | `user@safepay.dev` | `user123` | `123456` | ₹1,000 |
| User 2 | `user2@safepay.dev` | `user123` | `123456` | ₹1,000 |

> **Add money first** — go to Wallet → Add Money before testing payments.  
> Add-money bypasses fraud scoring.

### Admin / Analyst

| Role | Email | Password |
|---|---|---|
| Admin | `test@safepay.dev` | `admin123` |

> Admin login → auto-redirected to `/admin/cases`.

---

## 2. How the Fraud Engine Works

Every payment runs through a **4-factor weighted risk score** before money moves:

```
Payment Request
      │
      ▼
┌──────────────────────────────────────────────────────┐
│               FRAUD SCORING PIPELINE                 │
│                                                      │
│  Factor 1 — Behavioral Risk    (weight: 35%)         │
│    Inverted behavioral trust score (0–100)           │
│    New user with no baseline → high behavioral risk  │
│                                                      │
│  Factor 2 — Transaction Risk   (weight: 30%)         │
│    < ₹1,000   → 0.10  (low)                         │
│    ₹1k–5k     → 0.20                                │
│    ₹5k–20k    → 0.40                                │
│    ₹20k–1L    → 0.60                                │
│    > ₹1L      → 0.80  (high)                        │
│                                                      │
│  Factor 3 — Device Risk        (weight: 20%)         │
│    Unknown device     → 0.80                         │
│    Untrusted device   → based on trust score         │
│    Trusted device     → low risk                     │
│                                                      │
│  Factor 4 — ML Model Score     (weight: 15%)         │
│    XGBoost model (AUC 0.846) + SHAP explanations    │
│                                                      │
│  SCORE = 0.35×Behavioral + 0.30×Transaction         │
│        + 0.20×Device + 0.15×ML                      │
└──────────────────────────────────────────────────────┘
                        │
              ┌─────────▼──────────┐
              │   DECISION AGENT   │
              └─────────┬──────────┘
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
    Score < 0.30   Score 0.30–0.70  Score > 0.70
    ✅ APPROVE     🔐 CHALLENGE      🚫 BLOCK
```

---

## 3. How to Trigger APPROVE / CHALLENGE / BLOCK

### ✅ APPROVE (Score < 0.30)

**Conditions:**
- Small amount (< ₹1,000)
- Known device (logged in before)
- Behavioral baseline established (5+ minutes of app usage)

**How to test:**
1. Login as User 1 → Add ₹500
2. Send ₹100 to User 2 → Enter PIN
3. → **Green Success Screen** immediately ✅

> Build behavioral baseline first: spend 3–5 min using the app (tap around, type in fields) before testing approve.

---

### 🔐 CHALLENGE (Score 0.30–0.70)

Payment is allowed but requires OTP verification first.

**Easiest triggers:**

| Trigger | How |
|---|---|
| Medium-large amount | Send ₹8,000 – ₹15,000 |
| Brand new account | Register and send any amount immediately (no baseline yet) |
| New browser / Incognito | Opens with a new device fingerprint (unknown device = 0.80 device risk) |

**What happens:**
1. After confirming → **Challenge Screen** appears 🔐
2. 6-digit OTP shown on screen (demo — real app would SMS)
3. Enter OTP within 60 seconds → **Success Screen** ✅

---

### 🚫 BLOCK (Score > 0.70)

Payment is fully rejected. Money never moves.

**Easiest triggers:**

| Trigger | How |
|---|---|
| Very large amount | Send ₹50,000 or more |
| Maximum risk combo | Incognito browser + new account + ₹25,000+ |

**What happens:**
1. After confirming → **Blocked Screen** 🚫
2. Shows: plain-language reason
3. Shows: top 2 SHAP factors (which signals caused the block)
4. Shows: risk score bar (e.g. 0.82 / 1.0)
5. CTA: "Talk to Copilot" — pre-fills transaction ID

> Money is **never deducted** on a block — the transaction rolls back before DB commit.

---

### Cheat Sheet — Amount vs Expected Outcome

| Amount | New Account (< 5 min) | Established Account |
|---|---|---|
| ₹100 | 🔐 Challenge | ✅ Approve |
| ₹500 | 🔐 Challenge | ✅ Approve |
| ₹2,000 | 🔐 Challenge | 🔐 Challenge |
| ₹8,000 | 🚫 Block | 🔐 Challenge |
| ₹25,000 | 🚫 Block | 🚫 Block |
| ₹1,00,000 | 🚫 Block | 🚫 Block |

---

## 4. User App Features

### 🏠 Home Dashboard (`/home`)
- Wallet balance (real-time)
- Quick Actions: Send / Scan / Add Money / Copilot
- Recent 5 transactions with status badges
- Security Score animated ring (0–100)

### 💸 Send Money (`/send`)
Three input methods:
- **Phone number** → P2P transfer
- **UPI ID** → `9XXXXXXXXXX@safepay`
- **QR Scan** → camera or manual paste

Flow: `Recipient → Amount → Review & Confirm → PIN → Fraud decision`

### 📷 Scan QR (`/scan`)
- Live camera with animated scan line + corner brackets
- Auto-detects UPI QR codes
- Manual UPI ID fallback input

### 💳 Wallet (`/wallet`)
- Gradient balance card
- Add Money — bottom-sheet with quick-amount chips (₹500 / ₹1k / ₹2k / ₹5k)
- Withdraw — bottom-sheet modal
- Full transaction history with filter

### 🕒 Transaction History (`/history`)
- Filter: All / Approved / Challenged / Blocked / Topup / Withdrawal
- Search bar
- Tap any row → Transaction Detail with SHAP explanation panel

### 🛡️ Security Score (Profile → Security Score)
- Animated conic-gradient ring
- 3-factor breakdown bars: Device Trust / Behavioral Trust / Activity
- Contextual improvement tips

### 📱 Trusted Devices (Profile → Trusted Devices)
- All devices that have logged in
- Trust score bars
- 2-step device revoke confirmation

### 🤖 Copilot (`/copilot`)
- Ask anything about your transactions, risk score, security
- Grounded in real DB data (no hallucinations)

### 📊 Analytics (`/analytics`)
- Spending donut chart by payment type
- Risk score timeline bar chart (green/amber/red)
- AI insight cards (3 tips)
- 7d / 30d / 90d time-range toggle

### ⬡ My QR (`/my-qr`)
- Personal UPI QR code (your phone as a payment recipient)
- Copy UPI ID / Share / Download buttons
- Animated conic border

### 👥 Contacts (`/contacts`)
- Save frequent recipients
- Quick-fill chips on the Send page
- Add / search / delete contacts

### 🏪 Merchant (`/merchant`)
- Register your business → get merchant UPI ID
- Dashboard: revenue chart, QR code, payment table

---

## 5. Admin SOC Dashboard

> Login: `test@safepay.dev` / `admin123`

### 📊 Overview (`/admin/dashboard`)
- 6 KPI cards: Total Txns / Blocked / Challenged / Fraud Rate / Avg Risk / Active Alerts
- **Live WebSocket feed** — every payment appears in real time ⚡
- Risk distribution histogram — updates live
- Recent alerts panel

**Demo live feed:** Open admin on laptop → trigger a payment on phone → watch it appear instantly.

### 🗺️ Heatmap (`/admin/heatmap`)
- Payment Type × Decision grid (color-coded by avg risk score)
- Time window: 1h / 6h / 24h / 7d

### ⚠️ Alerts (`/admin/alerts`)
- All challenged + blocked transactions
- Inline SHAP explanation drawer (click any alert)
- Mark all read button

### 🗂️ Cases (`/admin/cases`)
- Fraud case queue
- Status control: Open → Under Investigation → Confirmed Fraud / Dismissed
- On "Confirmed Fraud" → **blockchain signal auto-published** ⛓️

### 📱 Devices (`/admin/devices`)
- All devices ordered by trust score
- Filter: All / Untrusted

### 🏪 Merchants (`/admin/merchants`)
- Merchant list with risk rating bars
- Search by name/category

### 👥 Users (`/admin/users`)
- All users with security score bars
- Analyst actions: **Suspend / Freeze / Activate**

**Test:**
1. Users → find User 1 → Suspend
2. User 1 tries to pay → rejected
3. Admin → Activate → User 1 can pay again

### 📈 Behavioral Analytics (`/admin/behavioral`)
- Trust score distribution bars
- Event type breakdown (keystroke / mouse / touch)
- High-risk users table
- 4 KPI cards

---

## 6. AI Copilot

> User: `/copilot` | Admin: `/admin/copilot`  
> Powered by: Google Gemini 1.5 Flash + LangGraph + 3 DB-grounded tools

| Ask | Response |
|---|---|
| "Why was my payment blocked?" | SHAP factors + plain-English reason |
| "What is my risk score?" | Latest fraud score with component breakdown |
| "How can I improve my security?" | Personalized tips from your actual data |
| "Explain transaction [ID]" | Full risk breakdown for any transaction |

**Quick test:**
1. Block a payment (₹50,000)
2. Blocked Screen → tap "Talk to Copilot"
3. Ask: *"Why was this blocked?"*
4. Copilot responds with real SHAP factors from the DB

---

## 7. Blockchain Fraud Intelligence

> Local Hardhat Ethereum node — 2 smart contracts

**Flow:**
1. Fraud analyst confirms a case as fraud
2. → `publish_fraud_signal()` called automatically
3. → Device/merchant/account **hashed** (keccak256, zero PII on chain)
4. → Signal written to `FraudRegistry.sol`
5. → `Reputation.sol` updates entity's reputation score

**API endpoints:**
- `POST /api/v1/blockchain/fraud-signal/publish`
- `GET /api/v1/blockchain/fraud-signal/lookup/{hash}`
- `GET /api/v1/blockchain/reputation/{hash}`

---

## 8. Federated Learning

> Flower framework — 3 simulated bank clients

**How it works:**
- `bank_a`, `bank_b`, `bank_c` each train on their local data shard
- Only **model weights** are shared (no raw data ever leaves)
- FedXgbBagging aggregation → Global model AUC: **0.846**

**API:**
- `GET /api/v1/admin/fl-rounds` — lists all training rounds with metrics

---

## 9. Merchant Portal

> Accessible via: More → Merchant

**Register:**
1. Login → More → Merchant → "Become a Merchant"
2. Fill Business Name + Category → Register
3. → Redirected to dashboard with unique UPI ID

**Dashboard:**
- Revenue KPI (7d / 30d / 90d toggle)
- Daily revenue bar chart
- Animated conic QR code
- Copy UPI ID button
- Incoming payments table

**Full test flow:**
1. User 1 → register as merchant "Test Shop"
2. Copy UPI: `9XXXXXXXXXX@safepay-merchant`
3. Login as User 2 → Send → paste UPI → ₹500
4. User 1 Merchant Dashboard → payment appears ✅

---

## 10. Notification Center

> Bell icon 🔔 top-right of every page

**Triggers:**
| Icon | Type | When |
|---|---|---|
| ✅ | Payment Success | Any completed payment |
| 🔐 | Payment Challenged | Fraud engine challenges |
| 🚫 | Payment Blocked | Fraud engine blocks |
| ⚠️ | Fraud Alert | Case confirmed |
| 🔑 | PIN Changed | PIN set/changed |
| 📱 | Device Revoked | Device removed |

**Test:** Send a payment → bell shows red pulsing badge → click → slide-in drawer.

> Polls every **30 seconds** automatically.

---

## 11. User Analytics

> More → Analytics (`/analytics`)

- **Spending donut** — P2P / Merchant / Topup / Withdrawal
- **Risk timeline** — last 20 scored transactions, color-coded bars
- **3 AI insight cards** — top spend category, risk trend, security tip
- **Time range** — 7d / 30d / 90d

---

## 12. Quick Demo Script (5 min)

### Step 1 — Register & Onboard (30s)
1. Open app on phone → Sign Up → fill details → Register
2. Enter OTP → Set PIN (e.g. `123456`)

### Step 2 — Safe Payment (45s)
1. Wallet → Add Money → ₹2,000
2. Send → User 2's phone → ₹200 → Confirm → enter PIN
3. → ✅ Green Success Screen (low risk, small amount)

### Step 3 — Challenge (45s)
1. Send again → same recipient → ₹8,000 → enter PIN
2. → 🔐 OTP Challenge Screen
3. Enter the OTP shown → ✅ Success

### Step 4 — Block (30s)
1. Send → ₹50,000 → enter PIN
2. → 🚫 Blocked Screen
3. See: risk score, SHAP factors, plain reason
4. Tap "Talk to Copilot"

### Step 5 — Admin Console (60s)
1. Laptop → `localhost:3000` → admin login
2. Dashboard → see all 3 payments in live feed
3. Cases → open blocked case → "Confirmed Fraud" → blockchain signal sent ⛓️

### Step 6 — Copilot & Analytics (30s)
1. Phone → Copilot → "Why was my last payment blocked?" → grounded answer
2. Analytics → risk timeline shows 🟢🟡🔴 bars for the 3 payments

---

## Common Issues & Fixes

| Problem | Cause | Fix |
|---|---|---|
| Can't login | Wrong credentials | `user@safepay.dev` / `user123` |
| "PIN not set" error | No PIN configured | Profile → Set PIN first |
| Everything getting challenged | No behavioral baseline | Use app for 5+ min first |
| Phone can't reach app | Firewall or different WiFi | Run firewall commands (admin PowerShell), check same WiFi |
| Copilot says "no data" | No transactions yet | Make some payments first |
| Admin shows empty dashboard | No transactions yet | Make payments as regular user |
