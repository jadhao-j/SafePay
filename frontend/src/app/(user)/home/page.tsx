"use client";

/**
 * Home Dashboard — v3 (Dashboard v3 reference design, ported to Next.js)
 * All live data hooks preserved. Aurora + starfield + spotlight cards applied.
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import {
  fetchTransactions,
  fetchAlerts,
  type WalletTransaction,
  type FraudAlert,
} from "@/lib/fraud-api";
import AuroraBackground from "@/components/AuroraBackground";

interface BalanceData  { balance: string; currency: string; }
interface SecurityData { security_score: number; behavioral_trust_score: number; baseline_established: boolean; }

/* ─── Payment type metadata (kept from original) ─────────── */
const TYPE_ICON: Record<string, string> = {
  p2p: "↔", merchant: "◈", qr: "⬡", upi: "⚡", topup: "↓", withdrawal: "↑", recurring: "↺",
};
const DEBIT_TYPES = new Set(["p2p", "merchant", "qr", "upi", "withdrawal"]);
const STATUS_LABEL: Record<string, string> = {
  completed: "COMPLETED", approved: "COMPLETED", challenged: "VERIFIED",
  blocked: "BLOCKED", failed: "FAILED", pending: "PENDING", reversed: "REVERSED",
};

/* ─── Skeleton shimmer ───────────────────────────────────── */
function Skeleton({ w, h, r = 8 }: { w: string | number; h: number; r?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: "rgba(255,255,255,0.10)",
      animation: "sp-shimmer 1.4s ease-in-out infinite",
    }} />
  );
}

/* ─── Inline SVG shorthand ───────────────────────────────── */
function Ico({ id, size = 20 }: { id: string; size?: number }) {
  return (
    <svg width={size} height={size} style={{ display: "block", flexShrink: 0 }}>
      <use href={`#${id}`} />
    </svg>
  );
}

/* ─── Quick Action Dock item ─────────────────────────────── */
const QUICK_ACTIONS = [
  { label: "Send\nMoney",       icon: "icon-send",       tone: "blue",    href: "/send"      },
  { label: "Scan &\nPay",       icon: "icon-scan",       tone: "purple",  href: "/scan"      },
  { label: "Add\nMoney",        icon: "icon-add-money",  tone: "emerald", href: "/wallet"    },
  { label: "Pay\nContacts",     icon: "icon-contacts",   tone: "rose",    href: "/contacts"  },
  { label: "Pay\nBills",        icon: "icon-bills",      tone: "amber",   href: "/history"   },
  { label: "Mobile\nRecharge",  icon: "icon-recharge",   tone: "cyan",    href: "/scan"      },
  { label: "Rewards\nHub",      icon: "icon-gift",       tone: "purple",  href: "/contacts"  },
  { label: "Security\nVault",   icon: "icon-shield",     tone: "emerald", href: "/profile"   },
];

const TONE_STYLE: Record<string, { bg: string; color: string; border: string; glow: string }> = {
  blue:    { bg: "linear-gradient(135deg,rgba(14,165,233,0.2),rgba(59,130,246,0.05))",  color: "#38BDF8", border: "rgba(56,189,248,0.3)",  glow: "var(--sky-glow,rgba(14,165,233,0.35))"   },
  purple:  { bg: "linear-gradient(135deg,rgba(139,92,246,0.2),rgba(168,85,247,0.05))",  color: "#C084FC", border: "rgba(192,132,252,0.3)", glow: "var(--purple-glow,rgba(139,92,246,0.35))" },
  emerald: { bg: "linear-gradient(135deg,rgba(16,185,129,0.2),rgba(34,197,94,0.05))",   color: "#34D399", border: "rgba(52,211,153,0.3)",  glow: "var(--emerald-glow,rgba(16,185,129,0.35))"},
  rose:    { bg: "linear-gradient(135deg,rgba(244,63,94,0.2),rgba(225,29,72,0.05))",    color: "#FB7185", border: "rgba(251,113,133,0.3)", glow: "var(--rose-glow,rgba(244,63,94,0.35))"   },
  amber:   { bg: "linear-gradient(135deg,rgba(245,158,11,0.2),rgba(217,119,6,0.05))",   color: "#FBBF24", border: "rgba(251,191,36,0.3)",  glow: "var(--amber-glow,rgba(245,158,11,0.35))" },
  cyan:    { bg: "linear-gradient(135deg,rgba(6,182,212,0.2),rgba(14,165,233,0.05))",   color: "#22D3EE", border: "rgba(34,211,238,0.3)",  glow: "var(--cyan-glow,rgba(6,182,212,0.35))"   },
};

/* ─── Transaction avatar colors ──────────────────────────── */
const TX_AVATAR_BG: Record<string, string> = {
  p2p:        "linear-gradient(135deg,#8B5CF6,#6D28D9)",
  merchant:   "linear-gradient(135deg,#F59E0B,#D97706)",
  topup:      "linear-gradient(135deg,#10B981,#059669)",
  qr:         "linear-gradient(135deg,#F43F5E,#E11D48)",
  upi:        "linear-gradient(135deg,#0EA5E9,#0284C7)",
  withdrawal: "linear-gradient(135deg,#8B5CF6,#6D28D9)",
  recurring:  "linear-gradient(135deg,#F59E0B,#D97706)",
};

/* ─── Main page component ────────────────────────────────── */
export default function HomePage(): JSX.Element {
  const router = useRouter();
  const [balance, setBalance]         = useState<BalanceData | null>(null);
  const [security, setSecurity]       = useState<SecurityData | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [, setUnreadCount]            = useState(0);
  const [loading, setLoading]         = useState(true);
  const [userName, setUserName]       = useState("User");
  const [greeting, setGreeting]       = useState("Good morning");
  const [displayBalance, setDisplayBalance] = useState(0);
  const [balHidden, setBalHidden]     = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeQa, setActiveQa]       = useState(0);
  const [nowStr, setNowStr]           = useState("");

  const animRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const mainRef    = useRef<HTMLDivElement>(null);
  const glowRef    = useRef<HTMLDivElement>(null);

  /* ─── Data fetch ─────────────────────────────────────────── */
  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      apiClient.get<BalanceData>("/wallet/balance").then((r) => setBalance(r.data)),
      apiClient.get<SecurityData>("/users/me/security-score").then((r) => setSecurity(r.data)),
      apiClient.get<{ name: string }>("/users/me").then((r) => setUserName(r.data.name?.split(" ")[0] ?? "User")),
      fetchTransactions().then((t) => setTransactions(t.slice(0, 5))),
      fetchAlerts().then((a) => setUnreadCount((a as FraudAlert[]).filter((x) => !x.is_read).length)),
    ]).finally(() => setLoading(false));
  }, []);

  /* ─── Greeting (client-only, avoids hydration mismatch) ─── */
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
    const update = () => {
      const now = new Date();
      setNowStr(now.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }));
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  /* ─── Balance count-up (cubic ease-out, ~900ms) ─────────── */
  useEffect(() => {
    if (!balance) return;
    const target = parseFloat(balance.balance);
    if (isNaN(target)) return;
    const duration = 900;
    const start = Date.now();
    if (animRef.current) clearInterval(animRef.current);
    animRef.current = setInterval(() => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayBalance(target * eased);
      if (p >= 1 && animRef.current) clearInterval(animRef.current);
    }, 16);
    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, [balance]);

  /* ─── Cursor glow + spotlight cards mouse tracking ───────── */
  useEffect(() => {
    const glow = glowRef.current;
    const main = mainRef.current;
    if (!main) return;

    const onMove = (e: MouseEvent) => {
      if (glow) {
        glow.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`;
      }
      main.querySelectorAll<HTMLElement>(".spotlight-card").forEach((card) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
        card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  /* ─── Format helpers ─────────────────────────────────────── */
  const fmt = (n: number) =>
    `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const fmtAmt = useCallback((amt: string, type: string) => {
    const isDebit = DEBIT_TYPES.has(type);
    return {
      sign: isDebit ? "−" : "+",
      val: `₹${parseFloat(amt).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      debit: isDebit,
    };
  }, []);

  /* ─── Search matches ─────────────────────────────────────── */
  const searchMatches = searchFocused && searchQuery.length >= 2
    ? transactions.filter((t) => t.recipient_identifier?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 4)
    : [];

  return (
    <div
      ref={mainRef}
      style={{ minHeight: "100vh", background: "var(--bg,#060710)", color: "var(--text-body,#E2E8F0)", position: "relative", overflow: "hidden" }}
    >
      {/* ── Ambient cursor glow ──────────────────────────── */}
      <div
        ref={glowRef}
        id="v3-cursor-glow"
        style={{
          position: "fixed", top: 0, left: 0,
          width: 600, height: 600,
          marginTop: -300, marginLeft: -300,
          background: "radial-gradient(circle,rgba(6,182,212,0.10) 0%,rgba(139,92,246,0.05) 40%,transparent 70%)",
          pointerEvents: "none", zIndex: 1,
          transform: "translate3d(0,0,0)",
          transition: "opacity 0.3s ease",
        }}
      />

      {/* ── Aurora background ────────────────────────────── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <AuroraBackground colorA="#06B6D4" colorB="#8B5CF6" colorC="#F43F5E" opacity={0.85} />
      </div>
      <div className="v3-starfield" />
      <div className="v3-scrim" />

      {/* ── Main scrollable content ──────────────────────── */}
      <div style={{ position: "relative", zIndex: 2, padding: "28px 32px 80px", maxWidth: 1380, margin: "0 auto" }}>

        {/* ═══ TOPBAR ══════════════════════════════════════ */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          {/* Search */}
          <div style={{
            flex: 1, display: "flex", alignItems: "center", gap: 12,
            background: "var(--glass,rgba(13,16,27,0.65))",
            border: `1px solid ${searchFocused ? "var(--cyan,#06B6D4)" : "var(--border,rgba(255,255,255,0.16))"}`,
            borderRadius: 14, padding: "11px 18px",
            backdropFilter: "var(--glass-blur,blur(20px) saturate(180%))",
            boxShadow: searchFocused ? "0 0 20px rgba(6,182,212,0.2)" : "none",
            transition: "all 0.25s var(--ease)",
            position: "relative",
          }}>
            <Ico id="icon-search" size={18} />
            <input
              id="home-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              placeholder="Search transactions, recipients, security logs..."
              style={{
                flex: 1, background: "none", border: "none", outline: "none",
                color: "var(--text-main,#FFFFFF)", fontSize: 14, fontFamily: "inherit",
              }}
            />
            <kbd style={{
              fontFamily: "var(--font-ibm-plex-mono,monospace)", fontSize: 11,
              color: "var(--text-muted,#94A3B8)",
              background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)",
              padding: "3px 7px", borderRadius: 6, fontWeight: 500,
            }}>⌘K</kbd>

            {/* Search dropdown */}
            {searchFocused && searchQuery.length >= 2 && (
              <div style={{
                position: "absolute", top: "100%", left: 0, right: 0, zIndex: 30,
                background: "rgba(8,10,18,0.98)", border: "1px solid var(--border)",
                borderRadius: 14, marginTop: 4, overflow: "hidden",
                backdropFilter: "blur(20px)",
              }}>
                {searchMatches.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { router.push(`/send?to=${encodeURIComponent(t.recipient_identifier ?? "")}`); setSearchQuery(""); }}
                    style={{
                      width: "100%", padding: "12px 16px", background: "none", border: "none",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                      textAlign: "left", color: "var(--text-main)",
                    }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#8B5CF6,#06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                      {(t.recipient_identifier ?? "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{t.recipient_identifier}</p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>Recent recipient · tap to send</p>
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => { router.push(`/send?to=${encodeURIComponent(searchQuery)}`); setSearchQuery(""); }}
                  style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textAlign: "left" }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(6,182,212,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, color: "var(--cyan)" }}>↗</div>
                  <p style={{ fontSize: 13, color: "var(--cyan,#06B6D4)", margin: 0, fontWeight: 500 }}>Send to &ldquo;{searchQuery}&rdquo;</p>
                </button>
              </div>
            )}
          </div>

          {/* Notification bell */}
          <Link
            href="/history"
            id="topbar-notifications"
            aria-label="Notifications"
            style={{
              width: 44, height: 44, borderRadius: 13, flexShrink: 0,
              background: "var(--glass)", border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "var(--glass-blur)", textDecoration: "none",
              color: "var(--text-body)", transition: "all 0.25s var(--ease)",
              position: "relative",
            }}
          >
            <Ico id="icon-bell" size={19} />
            <span style={{
              position: "absolute", top: 10, right: 10,
              width: 8, height: 8, borderRadius: "50%",
              background: "var(--rose,#F43F5E)",
              boxShadow: "0 0 8px var(--rose)",
            }} />
          </Link>

          {/* Profile chip */}
          <Link
            href="/profile"
            id="topbar-profile"
            aria-label="Account menu"
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "6px 14px 6px 6px", borderRadius: 14,
              border: "1px solid var(--border)",
              background: "var(--glass)", backdropFilter: "var(--glass-blur)",
              transition: "all 0.25s var(--ease)", textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "linear-gradient(135deg,var(--purple,#8B5CF6),var(--cyan,#06B6D4))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700, color: "#060710",
              boxShadow: "0 2px 10px var(--purple-glow)",
            }}>
              {userName[0]?.toUpperCase() ?? "U"}
            </div>
            <div style={{ display: "none" }} className="sp-profile-text-lg">
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)", lineHeight: 1.2 }}>{userName}</div>
              <div style={{ fontSize: 11, color: "var(--amber,#F59E0B)", fontWeight: 500, marginTop: 1 }}>VERIFIED</div>
            </div>
            <Ico id="icon-chevron-down" size={16} />
          </Link>
        </div>

        {/* ═══ WELCOME ROW ═════════════════════════════════ */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ color: "var(--text-dim,#CBD5E1)", fontSize: 15, fontWeight: 500 }}>
              {greeting},
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: "var(--text-main,#FFFFFF)", margin: "2px 0 0", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 10 }}>
              {userName} <span>👋</span>
            </h1>
            <div style={{ color: "var(--text-dim)", fontSize: 14, marginTop: 4, fontWeight: 400 }}>
              AI Shield is active · Zero anomalies detected today.
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)" }}>{nowStr}</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>System Status: Optimal</div>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end", marginTop: 8,
              background: "var(--glass)", border: "1px solid var(--border)",
              borderRadius: 12, padding: "8px 14px",
              backdropFilter: "var(--glass-blur)",
            }}>
              <svg width={20} height={20} style={{ color: "var(--emerald,#10B981)", filter: "drop-shadow(0 0 6px var(--emerald-glow))" }}>
                <use href="#icon-shield-check" />
              </svg>
              <span style={{ fontSize: 13, color: "var(--text-main)", fontWeight: 600 }}>
                {security ? `Score ${security.security_score}/100` : "Secure"}
              </span>
            </div>
          </div>
        </div>

        {/* ═══ HERO ROW ════════════════════════════════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: 20, marginBottom: 20 }}>

          {/* Balance card */}
          <div className="spotlight-card" style={{
            padding: "28px 32px", minHeight: 208,
            display: "flex", flexDirection: "column", justifyContent: "center",
            background: "linear-gradient(135deg,rgba(18,22,36,0.75) 0%,rgba(13,16,27,0.85) 100%)",
            position: "relative",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, position: "relative", zIndex: 2 }}>
              <span style={{ fontFamily: "var(--font-ibm-plex-mono,monospace)", fontSize: 12, letterSpacing: "0.12em", color: "var(--text-dim)", fontWeight: 600 }}>
                NET TOTAL BALANCE
              </span>
              <button
                id="balance-eye-btn"
                aria-label={balHidden ? "Show Balance" : "Hide Balance"}
                onClick={() => setBalHidden((h) => !h)}
                style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "var(--text-body)",
                  transition: "all 0.2s",
                }}
              >
                <Ico id={balHidden ? "icon-eye-off" : "icon-eye"} size={14} />
              </button>
            </div>

            {loading ? (
              <Skeleton w={240} h={54} r={8} />
            ) : (
              <div id="balance-amount" style={{
                fontSize: "clamp(32px,4vw,46px)", fontWeight: 700,
                color: "var(--text-main,#FFFFFF)",
                letterSpacing: "-0.03em", zIndex: 2, position: "relative",
                textShadow: "0 4px 20px rgba(0,0,0,0.6)",
              }}>
                {balHidden ? "₹ ••••••••" : fmt(displayBalance)}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 14, color: "var(--emerald,#10B981)", fontWeight: 600, zIndex: 2, position: "relative" }}>
              <Ico id="icon-trend-up" size={16} />
              <span style={{ color: "var(--text-dim)" }}>SafePay Wallet · {balance?.currency ?? "INR"}</span>
            </div>

            <button
              id="balance-add-capital"
              onClick={() => router.push("/wallet")}
              style={{
                position: "absolute", right: 28, bottom: 28,
                display: "inline-flex", alignItems: "center", gap: 10,
                background: "linear-gradient(135deg,var(--purple,#8B5CF6),var(--cyan,#06B6D4))",
                color: "#060710", fontWeight: 700, fontSize: 14,
                padding: "12px 22px", borderRadius: 12, border: "none",
                boxShadow: "0 4px 20px var(--cyan-glow)", cursor: "pointer",
                transition: "all 0.25s var(--ease)", zIndex: 2,
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-3px) scale(1.02)"; (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.1)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.filter = ""; }}
            >
              <Ico id="icon-plus" size={16} />
              Add Capital
            </button>
          </div>

          {/* AI Protection card */}
          <div className="spotlight-card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, position: "relative", zIndex: 2 }}>
              <div style={{
                width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                background: "linear-gradient(135deg,var(--emerald,#10B981),var(--cyan,#06B6D4))",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 16px var(--emerald-glow)", color: "#060710",
              }}>
                <Ico id="icon-shield-check" size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  AI Quantum Protection
                  <span style={{
                    fontFamily: "var(--font-ibm-plex-mono,monospace)", fontSize: 10.5,
                    letterSpacing: "0.06em", color: "var(--emerald,#10B981)",
                    background: "rgba(16,185,129,0.16)", border: "1px solid rgba(16,185,129,0.4)",
                    padding: "3px 10px", borderRadius: 999, fontWeight: 600,
                  }}>ACTIVE</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.5, marginTop: 6, fontWeight: 400 }}>
                  Continuous real-time anomaly detection via Federated Neural Nodes.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 18, marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)", position: "relative", zIndex: 2 }}>
              {[
                { icon: "icon-pulse",  label: "Realtime\nLatency 4ms"       },
                { icon: "icon-cpu",    label: security ? `Neural\nScore ${(security.behavioral_trust_score * 100).toFixed(0)}%` : "Neural\nRisk Score 0.01" },
                { icon: "icon-device", label: "Device\nEnclave Bound"       },
              ].map(({ icon, label }) => (
                <div key={icon} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--cyan,#06B6D4)" }}>
                    <Ico id={icon} size={15} />
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-dim)", lineHeight: 1.35, fontWeight: 500, whiteSpace: "pre-line" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ QUICK ACTIONS DOCK ══════════════════════════ */}
        <div style={{
          borderRadius: "var(--r-lg,20px)", border: "1px solid var(--border)",
          background: "var(--glass-card)", backdropFilter: "var(--glass-blur)",
          padding: 22,
          display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))", gap: 12,
          marginBottom: 20, position: "relative", zIndex: 2,
        }}>
          {QUICK_ACTIONS.map((qa, i) => {
            const t = TONE_STYLE[qa.tone];
            const isQaActive = activeQa === i;
            return (
              <Link
                key={qa.label}
                href={qa.href}
                id={`qa-${qa.label.toLowerCase().replace(/\W+/g, "-")}`}
                onClick={() => setActiveQa(i)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                  padding: "14px 8px", borderRadius: "var(--r-md,14px)",
                  background: isQaActive ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${isQaActive ? "var(--border-strong,rgba(255,255,255,0.28))" : "transparent"}`,
                  textDecoration: "none", cursor: "pointer",
                  transition: "all 0.3s var(--ease)",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(255,255,255,0.06)";
                  el.style.borderColor = "var(--border-strong,rgba(255,255,255,0.28))";
                  el.style.transform = "translateY(-4px)";
                  el.style.boxShadow = "0 10px 25px rgba(0,0,0,0.3)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.background = isQaActive ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)";
                  el.style.borderColor = isQaActive ? "var(--border-strong)" : "transparent";
                  el.style.transform = "";
                  el.style.boxShadow = "";
                }}
              >
                {/* Icon container */}
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative",
                  background: t.bg,
                  color: t.color,
                  border: `1px solid ${t.border}`,
                  backdropFilter: "blur(6px)",
                  boxShadow: isQaActive
                    ? `inset 0 1px 0 rgba(255,255,255,0.22), 0 0 0 2px rgba(255,255,255,0.14)`
                    : "inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -8px 16px -8px rgba(0,0,0,0.35)",
                  transition: "transform 0.3s var(--ease), box-shadow 0.3s var(--ease)",
                }}>
                  <Ico id={qa.icon} size={23} />
                </div>
                <span style={{
                  fontSize: 12.5, fontWeight: 600,
                  color: isQaActive ? "var(--text-main,#FFFFFF)" : "var(--text-dim,#CBD5E1)",
                  textAlign: "center", lineHeight: 1.25, whiteSpace: "pre-line",
                  transition: "color 0.2s",
                }}>
                  {qa.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* ═══ BODY GRID ═══════════════════════════════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 20 }}>

          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Spending Analytics */}
            <div className="spotlight-card" style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 16, fontWeight: 700, color: "var(--text-main)" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(6,182,212,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--cyan)" }}>
                    <Ico id="icon-bar-chart" size={16} />
                  </div>
                  Spending Analytics
                </div>
                <div style={{ fontFamily: "var(--font-ibm-plex-mono,monospace)", fontSize: 11.5, color: "var(--text-body)", background: "rgba(255,255,255,0.08)", border: "1px solid var(--border)", padding: "6px 14px", borderRadius: 999, display: "flex", alignItems: "center", gap: 8, fontWeight: 500 }}>
                  This Month
                  <Ico id="icon-chevron-down" size={12} />
                </div>
              </div>
              <div style={{ fontSize: 30, fontWeight: 700, color: "var(--text-main)", letterSpacing: "-0.02em" }}>₹ 48,420.00</div>
              <div style={{ fontSize: 13, color: "var(--emerald,#10B981)", fontWeight: 600, marginTop: 2 }}>↓ 8.2% reduction vs prior cycle</div>

              {/* Chart */}
              <div style={{ position: "relative", marginTop: 18 }}>
                <div style={{
                  position: "absolute", left: "54%", top: -10,
                  background: "#0d101b", border: "1px solid var(--cyan,#06B6D4)",
                  borderRadius: 10, padding: "8px 14px",
                  fontFamily: "var(--font-ibm-plex-mono,monospace)", fontSize: 12,
                  textAlign: "center", boxShadow: "0 10px 28px rgba(0,0,0,0.6)", zIndex: 5,
                  color: "var(--text-dim)",
                }}>
                  12 Sep, 2026
                  <b style={{ display: "block", fontSize: 14, fontFamily: "inherit", color: "var(--cyan)", fontWeight: 700 }}>₹ 12,450.00</b>
                </div>
                <svg viewBox="0 0 560 160" width="100%" height="150" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.45"/>
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <path d="M0,110 C40,95 60,60 100,70 C140,80 160,40 200,45 C240,50 260,100 300,95 C340,90 360,30 400,35 C440,40 460,85 500,80 C520,78 540,70 560,60 L560,160 L0,160 Z" fill="url(#areaGrad)"/>
                  <path d="M0,110 C40,95 60,60 100,70 C140,80 160,40 200,45 C240,50 260,100 300,95 C340,90 360,30 400,35 C440,40 460,85 500,80 C520,78 540,70 560,60" fill="none" stroke="#06B6D4" strokeWidth="3" strokeLinecap="round"/>
                  <circle cx="300" cy="95" r="6" fill="#060710" stroke="#06B6D4" strokeWidth="3"/>
                  <line x1="300" y1="95" x2="300" y2="160" stroke="rgba(6,182,212,0.4)" strokeWidth="1.5" strokeDasharray="4 4"/>
                </svg>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-ibm-plex-mono,monospace)", fontWeight: 500 }}>
                  {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep"].map((m) => <span key={m}>{m}</span>)}
                </div>
              </div>
            </div>

            {/* Split: Allocation + AI Insights */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

              {/* Allocation donut */}
              <div className="spotlight-card" style={{ padding: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)", marginBottom: 16 }}>Allocation</div>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <div style={{
                    width: 110, height: 110, borderRadius: "50%", flexShrink: 0, position: "relative",
                    background: "conic-gradient(var(--purple,#8B5CF6) 0% 28%,var(--sky,#0EA5E9) 28% 52%,var(--cyan,#06B6D4) 52% 68%,var(--amber,#F59E0B) 68% 80%,var(--rose,#F43F5E) 80% 100%)",
                    boxShadow: "0 0 20px rgba(0,0,0,0.4)",
                  }}>
                    <div style={{ position: "absolute", inset: 18, background: "#0c0f1d", borderRadius: "50%" }} />
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", zIndex: 2 }}>
                      <b style={{ fontSize: 15, color: "var(--text-main)", fontWeight: 700 }}>₹48.4k</b>
                      <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>TOTAL</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                    {[
                      { label: "Dining",   pct: "28%", color: "var(--purple)" },
                      { label: "Shopping", pct: "24%", color: "var(--sky)"    },
                      { label: "Travel",   pct: "16%", color: "var(--cyan)"   },
                      { label: "Bills",    pct: "12%", color: "var(--amber)"  },
                      { label: "Others",   pct: "20%", color: "var(--rose)"   },
                    ].map(({ label, pct, color }) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-dim)", fontWeight: 500 }}>
                          <span style={{ width: 9, height: 9, borderRadius: "50%", background: color, flexShrink: 0, display: "block" }} />
                          {label}
                        </div>
                        <b style={{ fontWeight: 700, color: "var(--text-main)" }}>{pct}</b>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Insights */}
              <div className="spotlight-card" style={{ padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)" }}>AI Insights</div>
                  <Link href="/analytics" style={{ fontSize: 13, color: "var(--cyan)", fontWeight: 600, textDecoration: "none" }}>View All →</Link>
                </div>
                {[
                  { icon: "icon-trend-up", bg: "rgba(16,185,129,0.15)", color: "var(--emerald)",
                    text: <>Outflow is <b style={{ color: "var(--emerald)" }}>8.2% lower</b> than predicted benchmark.</> },
                  { icon: "icon-shield",   bg: "rgba(6,182,212,0.15)",  color: "var(--cyan)",
                    text: <>Zero threat vectors detected during <b style={{ color: "var(--emerald)" }}>148</b> handshake events.</> },
                ].map(({ icon, bg, color, text }, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 0", borderTop: i === 0 ? "none" : "1px solid var(--border)" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color }}>
                      <Ico id={icon} size={18} />
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.5, fontWeight: 400 }}>{text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column — Recent Transactions */}
          <div>
            <div className="spotlight-card" style={{ padding: 24, height: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 16, fontWeight: 700, color: "var(--text-main)" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(6,182,212,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--cyan)" }}>
                    <Ico id="icon-clock" size={16} />
                  </div>
                  Recent Transactions
                </div>
                <Link href="/history" style={{ fontSize: 13, color: "var(--cyan)", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>History →</Link>
              </div>

              {/* Loading skeletons */}
              {loading && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[1, 2, 3].map((i) => <Skeleton key={i} w="100%" h={64} r={12} />)}
                </div>
              )}

              {/* Empty state */}
              {!loading && transactions.length === 0 && (
                <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.4 }}>◈</div>
                  <p style={{ margin: 0, fontSize: 13 }}>No transactions yet</p>
                </div>
              )}

              {/* Transaction rows */}
              {!loading && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {transactions.map((txn) => {
                    const { sign, val, debit } = fmtAmt(txn.amount, txn.payment_type);
                    const statusLabel = STATUS_LABEL[txn.status] ?? txn.status.toUpperCase();
                    const avatarBg = TX_AVATAR_BG[txn.payment_type] ?? "linear-gradient(135deg,#8B5CF6,#06B6D4)";
                    const avatarIcon = debit ? "icon-send" : "icon-plus";
                    const txnInitials = txn.recipient_identifier
                      ? txn.recipient_identifier.slice(0, 2).toUpperCase()
                      : null;
                    return (
                      <Link
                        key={txn.id}
                        href={`/history/${txn.id}`}
                        id={`txn-home-${txn.id}`}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "12px 14px", borderRadius: 12,
                          background: "rgba(255,255,255,0.02)", border: "1px solid transparent",
                          textDecoration: "none",
                          transition: "all 0.25s var(--ease)",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.06)";
                          (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)";
                          (e.currentTarget as HTMLAnchorElement).style.transform = "translateX(4px)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.02)";
                          (e.currentTarget as HTMLAnchorElement).style.borderColor = "transparent";
                          (e.currentTarget as HTMLAnchorElement).style.transform = "";
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div style={{
                            width: 42, height: 42, borderRadius: 12,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0, background: avatarBg,
                            fontSize: 14, fontWeight: 700, color: "#fff",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                          }}>
                            {txnInitials ?? <Ico id={avatarIcon} size={20} />}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)", textTransform: "capitalize" }}>
                              {txn.payment_type.replace(/_/g, " ")} transfer
                            </div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, fontWeight: 400 }}>
                              {new Date(txn.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{
                            fontFamily: "var(--font-ibm-plex-mono,monospace)", fontSize: 15, fontWeight: 700,
                            color: debit ? "var(--rose,#F43F5E)" : "var(--emerald,#10B981)",
                          }}>
                            {sign}{val}
                          </div>
                          <div style={{ fontSize: 9.5, color: "var(--text-muted)", marginTop: 2, letterSpacing: "0.5px" }}>
                            {statusLabel}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Responsive overrides ─────────────────────────── */}
      <style>{`
        @media (max-width: 1200px) {
          .v3-body-grid { grid-template-columns: 1fr !important; }
          .v3-hero-row  { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 900px) {
          .v3-split-row { grid-template-columns: 1fr !important; }
        }
        /* Show profile text on wider screens */
        @media (min-width: 1024px) {
          .sp-profile-text-lg { display: block !important; }
        }
      `}</style>
    </div>
  );
}
