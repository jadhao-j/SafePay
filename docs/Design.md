# Design.md — Visual & Interaction Design System

## 1. Brand Personality

PaySafe should feel like the intersection of a **trustworthy bank** and a **real-time security operations center** — calm and premium for everyday payments, but switching into a sharp, data-dense "command center" aesthetic in the admin/fraud views.

## 2. Color Palette

### User App (light, trustworthy fintech)
| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#F7F9FC` | App background |
| `--surface` | `#FFFFFF` | Cards, sheets |
| `--primary` | `#3B82F6` | Primary actions, links |
| `--primary-dark` | `#1D4ED8` | Pressed states |
| `--accent-violet` | `#8B5CF6` | Secondary accents, AI/Copilot elements |
| `--success` | `#10B981` | Approved transactions |
| `--warning` | `#F59E0B` | Challenge / medium risk |
| `--danger` | `#EF4444` | Blocked / high risk |
| `--text-primary` | `#0F172A` | Headings |
| `--text-secondary` | `#64748B` | Body/secondary text |
| `--border` | `#E2E8F0` | Dividers, card borders |

### Admin / SOC Console (dark, command-center)
| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#04080F` | Console background |
| `--surface` | `#0A1628` | Panels |
| `--card` | `#0D1D35` | Cards |
| `--border` | `#162840` | Card/panel borders |
| `--text` | `#C5D8EF` | Body text |
| `--dim` | `#3D6080` | Muted/labels |
| `--cyan` | `#00D4FF` | Primary data/AI accent |
| `--blue` | `#3B82F6` | Secondary accent |
| `--violet` | `#8B5CF6` | Agent/AI markers |
| `--green` | `#10B981` | Low risk / approved |
| `--amber` | `#F59E0B` | Medium risk |
| `--red` | `#EF4444` | High risk / blocked |

> Note: the dark palette above matches the existing `secureid-workflow.html` reference visual already produced for this project — reuse it as the canonical admin theme rather than re-deriving a new one.

## 3. Typography

| Role | Font | Weight | Usage |
|---|---|---|---|
| Display / Hero | **Bebas Neue** | 400 | Big numeric/logo moments, hero headlines (admin console) |
| UI / Body | **DM Sans** | 400/500/700 | All user-app UI text, buttons, body copy |
| Technical / Mono | **IBM Plex Mono** | 400/600/700 | Risk scores, hashes, timestamps, code-like data, labels in admin console |

Type scale (base 16px, 1.25 ratio):
`12 / 14 / 16 / 20 / 25 / 31 / 39 / 49px`

## 4. Component & Visual Language

- **Cards**: 12–16px radius, subtle 1px border, soft shadow only in user app (`0 4px 12px rgba(15,23,42,0.06)`); admin console uses flat bordered panels, no shadows (data-density priority).
- **Risk badges**: pill-shaped, color-coded (green/amber/red), mono font, uppercase, letter-spacing 1px — consistent across user and admin surfaces so risk meaning is instantly recognizable.
- **Buttons**: primary = filled gradient (`--primary` → `--accent-violet` for AI-related actions), radius 10px, medium weight label.
- **Charts (admin)**: line/area charts with cyan/violet gradient fills on dark background; heatmaps using a green→amber→red scale matching risk semantics.

## 5. Motion / 3D & Animation

- **Transaction success**: lightweight Lottie or CSS-based checkmark draw-on animation (~400ms), spring easing.
- **Risk scoring "thinking" state**: subtle pulsing ring or scanning-line animation around the amount during the <500ms scoring window — communicates "AI is checking" without feeling slow.
- **Card balance reveal**: numbers count up on dashboard load (200–400ms ease-out).
- **3D/depth accents** (admin console only): low-poly or particle-style animated background grid (already established in `secureid-workflow.html` via the subtle grid overlay) — keep 3D usage decorative and performance-light; do **not** use heavy 3D (Three.js scenes) in the transaction-critical payment flow, since it must stay fast and accessible.
- **Agent flow visualization**: animated directional flow (node → node) for the SOC "agent orchestration" view, reusing the workflow diagram style already designed, with active-agent nodes pulsing in `--cyan`.
- **Micro-interactions**: button press scale (0.97), input focus glow using `--primary` at 20% opacity, toast notifications slide-in from top.

## 6. Accessibility

- Minimum contrast ratio 4.5:1 for body text in both themes.
- Risk states communicated by color **and** icon/label (never color alone).
- All animations respect `prefers-reduced-motion`.
- Touch targets ≥ 44px in the user app.

## 7. Reference Assets

Two HTML reference mockups already exist in the project and should be treated as the design source-of-truth for the admin/fraud-agent visualization style and the user-facing journey screens, respectively:
- `secureid-workflow.html` — fraud agent pipeline / SOC visual language (dark theme, mono+display type pairing).
- `secureid-journey.html` — user journey screen flow reference.