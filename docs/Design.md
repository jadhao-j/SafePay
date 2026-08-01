# Design.md — Visual & Interaction Design System (v2)

> **Supersedes v1.** The user app moved from a light "trustworthy bank" theme to a dark, editorial, agency-grade theme (Cuberto / Active Theory / Urbi.pro direction) after design review on 2026-07-12. The SOC/Admin console keeps its existing dark theme, now sharing the same base tokens as the user app for the first time.
>
> **Trade-off, on record:** pure dark UI is a deliberate visual choice, not a default for accessibility — most banking apps ship light-mode-first for daylight/outdoor legibility. If this ships to production rather than staying a portfolio/thesis piece, plan a light-mode fallback (see §8) rather than treating dark as the only mode.

## 1. Brand Personality

SafePay now reads as a **single product, one visual language, two densities** — the same near-black canvas, glow accents, and mono-numeral treatment run through both the everyday payment app and the SOC command console. The user app is calmer and more spacious; the SOC console is denser and faster-moving. Neither looks like a "banking app" or a "dashboard template" — both should look closer to a funded fintech's flagship product than to a generic UI kit.

## 2. Color Palette (unified, dark-first)

### Core tokens (shared — user app + admin)
| Token | Hex | Usage |
|---|---|---|
| `--ink` | `#050608` | App/console background |
| `--panel` | `#0D0F14` | Cards, tiles, inputs |
| `--panel-2` | `#12151C` | Nested surfaces (icon chips, inner cards) |
| `--line` | `rgba(255,255,255,.08)` | Hairline borders (default) |
| `--line-2` | `rgba(255,255,255,.14)` | Hairline borders (emphasis, inputs) |
| `--white` | `#F5F6F8` | Primary text |
| `--dim` | `#6B7180` | Tertiary text, eyebrows, timestamps |
| `--dim-2` | `#9198A8` | Secondary text |
| `--acc` (violet) | `#7C5CFF` | Primary accent, AI/Copilot, primary buttons |
| `--acc-2` (cyan) | `#39D2FF` | Secondary accent, live/active states, gradients paired with `--acc` |
| `--success` | `#3DDC97` | Approved / positive amounts |
| `--warning` | `#FFB84D` | Challenge / medium risk |
| `--danger` | `#FF5C5C` | Blocked / high risk / negative amounts (icon only — amount text stays `--white`, see §4) |

Retire from v1: `--bg #F7F9FC`, `--surface #FFFFFF`, `--primary #3B82F6` (light usage), `--border #E2E8F0`, `--text-primary`, `--text-secondary` as *page backgrounds*. These hex values aren't wasted — `--acc` keeps the same blue family blended with violet, so brand recognition carries over; only the canvas goes dark.

### SOC console
Unchanged in principle from v1 — now literally the same token table above (previously the admin console had its own near-duplicate dark palette; v2 merges them so one CSS token set drives both surfaces). `--cyan #00D4FF` and `--violet #8B5CF6` from the old admin table map to `--acc-2` and `--acc`.

## 3. Typography

| Role | Font | Weight | Usage |
|---|---|---|---|
| Display headline | **Space Grotesk** | 700 | Balance figures, hero amounts, screen titles, admin KPI numerals — replaces Bebas Neue as the one display face used everywhere (Bebas is retired; Space Grotesk pairs better with the mono numerals at large sizes and renders more consistently across mobile/desktop) |
| UI / Body | **DM Sans** | 400/500 | Body copy, labels, buttons where not using mono |
| Technical / Mono | **IBM Plex Mono** | 400/500/600 | **Every numeral that represents money, a score, a timestamp, or an ID** — balance, transaction amounts, risk scores, hashes. This is the through-line signature: if it's a number tied to trust or money, it's mono; if it's prose, it's DM Sans or Space Grotesk. |

Type scale (base 16px, 1.25 ratio) — unchanged: `12 / 14 / 16 / 20 / 25 / 31 / 39 / 49px`, extended with `56 / 64px` for hero balance/amount display at desktop widths (§8).

Headline casing: short eyebrows/labels (`BALANCE`, `TO 9876543210`, `SECURITY SCORE`) are set uppercase with 1.5–2.5px letter-spacing in mono — this is what gives the editorial/agency feel; don't apply this treatment to full sentences or body copy.

## 4. Component & Visual Language

- **Canvas, not cards-on-white**: content sits directly on `--ink` wherever possible (hero balance, review amount). Cards (`--panel`, 1px `--line`) are reserved for grouped/scannable data — transaction rows, form inputs, KPI panels — not for single hero values.
- **Glow blobs**: each screen gets 1–2 large (260–420px), heavily blurred (60–80px) radial gradients in `--acc`/`--acc-2` at low opacity (~30–45%), positioned off-canvas-corner. This is the primary "premium" signal — cheap (pure CSS `radial-gradient` + `filter: blur()`), no WebGL, no measurable perf cost.
- **Grain overlay**: a subtle (~5% opacity) SVG turbulence noise texture over every screen, `pointer-events: none`. Keeps flat dark surfaces from looking like a Figma flat-fill instead of a designed product.
- **Signature ring**: the security-score shield uses a slow (6–8s) `conic-gradient` spin behind a static glyph — communicates "actively protected," CSS-only, respects `prefers-reduced-motion`.
- **Risk/status color**: on dark, negative transaction amounts stay `--white` with a colored *icon* (not colored amount text) — pure red/green numerals on near-black fail contrast and readability at small mono sizes faster than they do on light backgrounds. Status badges (pill, uppercase, mono, colored) still carry the semantic color.
- **Buttons**: primary = solid pill (`border-radius: 100px`), gradient `--acc-2` → `--acc` for payment/confirm actions, solid `--white` on `#000` text for auth/sign-in actions (highest contrast, most trust-critical tap target). Secondary = `--panel` tile with `--line` border, no fill.
- **Cards**: 16–20px radius, 1px `--line` border, no drop shadow on dark (shadows don't read on near-black — depth comes from the glow blobs and panel-tone steps instead, `--ink` → `--panel` → `--panel-2`).
- **Charts (admin)**: unchanged from v1 — line/area with `--acc`/`--acc-2` gradient fills, heatmap on green→amber→red risk scale.

## 5. Motion / Animation

- **Balance count-up**: cubic ease-out, ~900–1000ms, on screen entry only (not on every re-render).
- **Screening/scanning state**: a small pulsing dot (`box-shadow` ring pulse, 1.6s loop) next to a "Screening" label, replacing the v1 scan-bar — reads calmer and cheaper at a glance during the <500ms fraud check.
- **Signature ring**: continuous slow spin, see §4.
- **Glow blobs**: static in v1/v2 mockups; optional slow drift (20–30s, translate ±15px) is acceptable *only* on non-transaction screens (Home, Login) — never introduce continuous motion on Review/Confirm/Challenge screens, where the UI must feel settled while money is at stake.
- All animation still respects `prefers-reduced-motion` per §6 — no exceptions for the new glow/grain/ring treatments.
- **Explicitly out of scope**: Three.js/WebGL scenes, particle systems, scroll-jacking, custom cursors — these are agency-showcase techniques (Cuberto, Active Theory) that cost real load time/battery and don't survive contact with a payment-critical mobile flow. The dark canvas + glow + grain + mono-numerals combination is what's being borrowed from those references, not their rendering approach.

## 6. Accessibility

- Minimum contrast ratio 4.5:1 for body text — re-verify against the new dark tokens: `--dim` (`#6B7180`) on `--ink` (`#050608`) sits close to the line for body-length text; reserve `--dim` for short labels/timestamps and use `--dim-2` (`#9198A8`) or `--white` for anything sentence-length.
- Risk states still communicated by color **and** icon/label, never color alone (unchanged).
- All animations respect `prefers-reduced-motion` (unchanged, now covers ring-spin, glow-drift, count-up, pulse-dot).
- Touch targets ≥ 44px (unchanged).
- Grain overlay must stay ≤ 6% opacity and `pointer-events: none` — it's decorative texture, not to interfere with contrast or hit-testing.

## 7. Reference Assets

- `secureid-workflow.html` — SOC visual language; now the token source both surfaces pull from (see §2).
- `secureid-journey.html` — superseded by `safepay-v2.html` (this session's mockup) as the current user-journey visual reference. Keep the old file for historical/thesis comparison ("v1 → v2 design evolution") rather than deleting it.
- `safepay-v2.html` — canonical dark/editorial reference for Home, Review & Confirm, and SOC Sign-in. Extend the same system to the remaining screens listed in AppFlow.md §2 (Amount Entry, Success, Blocked, Challenge, Wallet, Trusted Devices, Security Score, Profile, Copilot Chat) as they're built.
- `safepay-responsive.html` — mobile + desktop breakpoint reference (see §8).

## 8. Responsive: Mobile + Desktop

The v1/v2 mockups so far are phone-frame only. SafePay's frontend (Next.js 14) needs both a mobile web/PWA layout and a desktop web layout from the same component set — not a separate desktop redesign.

**Breakpoints** (extend Tailwind defaults already implied by the stack):
| Name | Width | Layout behavior |
|---|---|---|
| `mobile` | < 640px | Single column, bottom tab bar, full-bleed hero, phone-frame layouts as mocked |
| `tablet` | 640–1023px | Single column content, max-width 640px, centered; bottom tab bar retained |
| `desktop` | ≥ 1024px | Two-region layout: fixed left sidebar nav (72px collapsed / 240px expanded) replaces bottom tab bar; main content area max-width 1120px, centered with side gutters |

**Desktop-specific rules:**
- **Navigation**: bottom tab bar → left sidebar with the same 5 items (Home, Send, Scan, Wallet, Profile), icon + label, active item gets the `--acc-2` icon tint + a left-edge `--acc` bar (same active-state logic as mobile, different position).
- **Home dashboard**: balance hero and quick actions stay top-of-column but no longer need to be full-bleed; introduce a secondary right-hand column at ≥1280px for "Security score" + "Recent activity" side-by-side instead of stacked, since desktop has the horizontal room mobile doesn't.
- **Review & Confirm**: stays single-column and centered (max-width 480px) even on desktop — a payment confirmation should never sprawl edge-to-edge on a wide screen; constrain it visually so it still reads as a focused, modal-like moment.
- **Glow blobs / grain**: keep both, but scale glow blob size and blur radius up proportionally (~1.4×) on desktop so they don't read as small dots on a large canvas.
- **Hero/balance type scale**: step up from 56px (mobile) to 64px (desktop) using the extended type scale in §3.
- **SOC console**: already primarily a desktop surface in v1; no structural change needed, just adopt the unified token set from §2.

See `safepay-responsive.html` for the Home screen built at both breakpoints from one shared markup/CSS source (not two separate files) — that's the pattern to carry into the actual Next.js components.
