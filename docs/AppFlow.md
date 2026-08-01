# Appflow.md — User Journey & Application Flow

> **2026-07-12 update:** visual direction moved to the v2 dark/editorial system (see Design.md). Journeys, screens, and flow logic below are unchanged — this update only affects how screens look and how navigation renders across mobile vs. desktop (§3).

## 1. User Journeys

### Journey A — New User Onboarding
`Landing Page` → `Sign Up` → `OTP Verification` → `Set PIN / Password` → `Behavioral Baseline Enrollment` (brief guided typing/tap sample) → `Link Bank Account / Add Money` → `Home Dashboard`

### Journey B — Returning User Login
`Login Page` → (password or passwordless) → `Device Check` (known device → straight in; new device → MFA) → `Home Dashboard`

### Journey C — Sending Money (P2P / UPI)
`Home Dashboard` → `Send Money` → `Select Contact / Enter UPI ID / Scan QR` → `Enter Amount` → `Review & Confirm` → **[Fraud Agent scores in background]** → 
- Low risk → `Success Screen`
- Medium risk → `Challenge Screen` (OTP / Face Verify) → `Success Screen`
- High risk → `Blocked Screen` (with explanation) → `Wallet Frozen Notice` + `Alert`

### Journey D — Merchant / QR Payment
`Home Dashboard` → `Scan QR` → `Merchant Detail Confirm` → `Enter Amount` → `Review & Confirm` → Fraud check → `Success` / `Challenge` / `Blocked`

### Journey E — Viewing a Blocked Transaction
`Transaction History` → `Tap Blocked Transaction` → `Explanation Screen` (AI Copilot explains why) → `Recommended Action` (e.g. "Verify device") → `Resolve / Dispute`

### Journey F — Fraud Analyst (Admin)
`Admin Login` → `SOC Dashboard` → `Live Transaction Feed` / `Fraud Heatmap` → `Drill into Alert` → `Case Detail` (full explainability + signals) → `Take Action` (confirm fraud / dismiss / escalate) → `Case Closed` → published anonymized signal to `Blockchain Fraud Ledger`

## 2. Screens

### Public / Auth
1. **Landing Page** — hero, value prop, trust badges, CTA (Sign Up / Login)
2. **Login Page** — email/phone + password, "use passwordless" toggle, biometric login button
3. **Sign Up Page** — name, email/phone, password
4. **OTP Verification Page** — 6-digit input, resend timer
5. **Behavioral Enrollment Page** — short interactive task capturing baseline typing/touch
6. **Set PIN Page** — 4–6 digit transaction PIN

### Core App (User)
7. **Home Dashboard** — wallet balance, quick actions (Send, Scan, Request), recent transactions, security score widget
8. **Send Money Page** — contact search / UPI ID input
9. **Scan QR Page** — camera view + manual UPI ID fallback
10. **Amount Entry Page** — numeric keypad, note field
11. **Review & Confirm Page** — recipient, amount, fee, "Pay" button
12. **Challenge Screen** — OTP or face-verification prompt mid-transaction
13. **Success Screen** — confirmation, animated checkmark, receipt
14. **Blocked Screen** — red state, plain-language reason, "Talk to Copilot" / "Contact Support" buttons
15. **Transaction History Page** — filterable list, status badges (approved/challenged/blocked)
16. **Transaction Detail Page** — full breakdown + (if flagged) explanation panel
17. **Wallet Page** — balance, add money, withdraw, scheduled payments
18. **Trusted Devices Page** — list of devices, last active, revoke option
19. **Security Score Page** — visual score (0–100), contributing factors, tips to improve
20. **Profile / Settings Page** — personal info, MFA settings, notification preferences
21. **AI Copilot Chat Page** — conversational assistant, suggested prompts

### Admin / SOC Dashboard
22. **Admin Login Page**
23. **SOC Overview Dashboard** — KPIs, live ticker, risk distribution chart
24. **Fraud Heatmap Page** — geographic + categorical heatmap
25. **Alerts Page** — sortable/filterable list of flagged transactions
26. **Case Detail Page** — full agent trace, SHAP explanation, evidence, action buttons
27. **Device Intelligence Page** — device trust scores, flagged devices
28. **Merchant Management Page** — merchant list, risk ratings
29. **User Management Page** — search users, view risk/trust history
30. **Behavioral Analytics Page** — aggregate behavioral trust trends

## 3. Navigation Structure

Navigation is one structure with two renderings, switched at the `desktop` breakpoint (≥1024px, see Design.md §8) — not two separate nav systems to maintain.

```
User App — mobile/tablet (< 1024px): bottom tab bar
├── Home (tab)
├── Send/Pay (tab → modal flow)
├── History (tab)
├── Wallet (tab)
└── Profile (tab)
    ├── Security Score
    ├── Trusted Devices
    └── Settings

User App — desktop (≥ 1024px): fixed left sidebar, same 5 destinations
├── Home
├── Send/Pay (opens as centered modal/panel, not full-screen route)
├── History
├── Wallet
└── Profile
    ├── Security Score
    ├── Trusted Devices
    └── Settings

Admin Console (unchanged — desktop-first by design, no mobile rendering)
├── Overview
├── Alerts → Case Detail
├── Heatmap
├── Devices
├── Merchants
├── Users
└── Behavioral Analytics
```

**Note (2026-07-12):** Send/Pay, Scan QR, Amount Entry, and Review & Confirm are full-screen routes on mobile but should render as a centered modal (max-width 480px) over the dashboard on desktop, per Design.md §8 — a payment confirmation shouldn't sprawl edge-to-edge on a wide screen.

## 4. Key UX Principles

- **Invisible by default**: fraud checks must not add visible friction for low-risk transactions (target: no extra screen, <500ms scoring).
- **Friction proportional to risk**: only medium/high-risk flows see a Challenge or Block screen.
- **Always explain**: any non-approval state must show a human-readable reason, never a raw error code.
- **Recoverable, not punitive**: blocked/frozen states always pair with a clear next action (verify identity, contact support, copilot help).