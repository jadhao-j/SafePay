"use client";

/**
 * Home Dashboard — Screen 7 (v2 dark/editorial — premium reference applied)
 * Hero banner with violet+blue radial gradients + dot grid overlay.
 * Balance card: frosted glass overlapping the hero.
 * Shield: conic-gradient spinning ring with security score.
 */

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { fetchTransactions, fetchAlerts, type WalletTransaction, type FraudAlert } from "@/lib/fraud-api";
import { NotificationBell } from "@/components/NotificationBell";

interface BalanceData { balance: string; currency: string; }
interface SecurityData { security_score: number; behavioral_trust_score: number; baseline_established: boolean; }

/* ─── Conic shield ring (signature) ─────────────────────────────────── */
function ShieldRing({ score }: { score: number }): JSX.Element {
  const color = score >= 70 ? "#3DDC97" : score >= 40 ? "#FFB84D" : "#FF5C5C";
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div
        aria-hidden="true"
        style={{
          width: "52px", height: "52px", borderRadius: "50%",
          background: "conic-gradient(from 0deg, #7C5CFF, #39D2FF, #3DDC97, #7C5CFF)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "sp-spin 6s linear infinite",
          position: "relative",
        }}
      >
        {/* Inner dark cutout */}
        <div style={{
          position: "absolute", inset: "2px", borderRadius: "50%",
          background: "rgba(13,15,20,0.92)",
        }} />
        <span style={{
          position: "relative", zIndex: 1,
          fontSize: "13px", fontWeight: 700, color,
          fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)",
          lineHeight: 1,
        }}>
          {score === 0 ? "—" : score}
        </span>
      </div>
      <p style={{
        fontSize: "9px", color: "rgba(255,255,255,0.45)", margin: "5px 0 0",
        letterSpacing: "0.12em", fontFamily: "var(--font-ibm-plex-mono, monospace)",
        textTransform: "uppercase", textAlign: "center",
      }}>
        SECURITY
      </p>
    </div>
  );
}

/* ─── Skeleton shimmer ───────────────────────────────────────────────── */
function Skeleton({ w, h, r = 8 }: { w: string | number; h: number; r?: number }): JSX.Element {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: "rgba(255,255,255,0.12)",
      animation: "sp-shimmer 1.4s ease-in-out infinite",
    }} />
  );
}



/* ─── Payment type metadata ──────────────────────────────────────────── */
const TYPE_ICON: Record<string, string> = {
  p2p: "↔", merchant: "◈", qr: "⬡", upi: "⚡", topup: "↓", withdrawal: "↑", recurring: "↺",
};
const DEBIT_TYPES = new Set(["p2p", "merchant", "qr", "upi", "withdrawal"]);

const STATUS_LABEL: Record<string, string> = {
  completed: "COMPLETED", approved: "COMPLETED", challenged: "VERIFIED",
  blocked: "BLOCKED", failed: "FAILED", pending: "PENDING", reversed: "REVERSED",
};

/* ─── Main page ──────────────────────────────────────────────────────── */
export default function HomePage(): JSX.Element {
  const router = useRouter();
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [security, setSecurity] = useState<SecurityData | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("User");
  const [greeting, setGreeting] = useState("Good morning");
  const [displayBalance, setDisplayBalance] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      apiClient.get<BalanceData>("/wallet/balance").then(r => setBalance(r.data)),
      apiClient.get<SecurityData>("/users/me/security-score").then(r => setSecurity(r.data)),
      apiClient.get<{ name: string }>("/users/me").then(r => setUserName(r.data.name?.split(" ")[0] ?? "User")),
      fetchTransactions().then(t => setTransactions(t.slice(0, 5))),
      fetchAlerts().then(a => setUnreadCount((a as FraudAlert[]).filter(x => !x.is_read).length)),
    ]).finally(() => setLoading(false));
  }, []);

  /* Client-only greeting — avoids SSR/hydration mismatch */
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);

  /* Balance count-up — cubic ease-out ~900ms (matches reference JS) */
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
      if (p >= 1) { if (animRef.current) clearInterval(animRef.current); }
    }, 16);
    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, [balance]);

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtAmt = (amt: string, type: string) => {
    const isDebit = DEBIT_TYPES.has(type);
    return { sign: isDebit ? "−" : "+", val: `₹${parseFloat(amt).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, debit: isDebit };
  };



  const QUICK_ACTIONS = [
    { label: "Send",      icon: "↗", bg: "linear-gradient(135deg,#7C5CFF,#39D2FF)" },
    { label: "Scan QR",   icon: "◈", bg: "linear-gradient(135deg,#8B5CF6,#6D28D9)" },
    { label: "Add Money", icon: "↓", bg: "linear-gradient(135deg,#3DDC97,#059669)" },
    { label: "Copilot",   icon: "✦", bg: "linear-gradient(135deg,#1e293b,#0f172a)" },
  ];
  const ACTION_HREF = ["/send", "/scan", "/wallet", "/copilot"];

  return (
    <div style={{ minHeight: "100vh", background: "#050608", fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}>

      {/* ══════════════════════════════════════════════════════════════
          HERO BANNER — violet + blue radial gradients + dot grid
      ══════════════════════════════════════════════════════════════ */}
      <div style={{
        position: "relative", padding: "52px 24px 88px", overflow: "hidden",
        background: `
          radial-gradient(120% 90% at 15% 0%, rgba(124,92,255,.55), transparent 60%),
          radial-gradient(120% 90% at 100% 10%, rgba(57,210,255,.5), transparent 55%),
          linear-gradient(160deg, #0B1220 0%, #101a33 55%, #0B1220 100%)
        `,
      }}>
        {/* Dot grid overlay */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)",
          backgroundSize: "18px 18px", opacity: 0.5,
        }} />

        {/* Greeting */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ color: "rgba(255,255,255,.6)", fontSize: "13px", margin: 0, fontFamily: "var(--font-dm-sans, sans-serif)" }}>
            {greeting}
          </p>
          <h1 style={{
            color: "#fff", fontSize: "24px", fontWeight: 700, margin: "2px 0 0",
            fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)",
          }}>
            {userName} 👋
          </h1>
        </div>

        {/* Notification Bell */}
        <div style={{ position: "absolute", top: "52px", right: "24px", zIndex: 10 }}>
          <NotificationBell />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          BALANCE CARD — dark glass panel, overlaps hero (v2 §4)
      ══════════════════════════════════════════════════════════════ */}
      <div style={{ margin: "-64px 20px 0", position: "relative", zIndex: 2 }}>
        <div style={{
          background: "rgba(13,15,20,0.82)",
          backdropFilter: "blur(24px) saturate(1.4)",
          WebkitBackdropFilter: "blur(24px) saturate(1.4)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: "22px",
          padding: "26px 24px 22px",
          boxShadow: "0 24px 48px rgba(0,0,0,.45), 0 0 0 1px rgba(124,92,255,.08) inset",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <p style={{
                fontFamily: "var(--font-ibm-plex-mono, monospace)", fontSize: "11px",
                letterSpacing: "1.5px", color: "rgba(255,255,255,0.45)",
                textTransform: "uppercase", margin: "0 0 8px",
              }}>
                Total Balance
              </p>
              {loading ? (
                <Skeleton w={200} h={42} r={8} />
              ) : (
                <p style={{
                  fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)",
                  fontWeight: 700,
                  fontSize: "clamp(32px, 8vw, 48px)",
                  color: "#FFFFFF",
                  margin: 0, letterSpacing: "-0.5px", lineHeight: 1,
                }}>
                  {fmt(displayBalance)}
                </p>
              )}
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", margin: "8px 0 0", fontFamily: "var(--font-ibm-plex-mono, monospace)" }}>
                {balance?.currency ?? "INR"} · SafePay Wallet
              </p>
            </div>

            {/* Shield ring — dark inner for dark card */}
            {!loading && security && <ShieldRing score={security.security_score} />}
            {!loading && !security && null}
            {loading && <Skeleton w={52} h={52} r={26} />}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          QUICK ACTIONS — gradient icon chips, light surface
      ══════════════════════════════════════════════════════════════ */}
      <div style={{ display: "flex", gap: "10px", margin: "20px 20px 0" }}>
        {QUICK_ACTIONS.map((action, i) => (
          <button
            key={action.label}
            id={`quick-${action.label.toLowerCase().replace(/\s+/g, "-")}`}
            onClick={() => router.push(ACTION_HREF[i])}
            style={{
              flex: 1, background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px", padding: "16px 8px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
              cursor: "pointer", transition: "transform .15s ease, border-color .15s ease",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.18)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
            }}
          >
            <div style={{
              width: "38px", height: "38px", borderRadius: "12px",
              background: action.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "16px", color: "#fff",
            }}>
              {action.icon}
            </div>
            <span style={{ fontSize: "11px", fontWeight: 500, color: "rgba(255,255,255,0.7)", letterSpacing: "0.01em" }}>
              {action.label}
            </span>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SEARCH BAR — quick contact send
      ══════════════════════════════════════════════════════════════ */}
      <div style={{ margin: "16px 20px 0", position: "relative" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${searchFocused ? "rgba(57,210,255,0.5)" : "rgba(255,255,255,0.09)"}`,
          borderRadius: 14, padding: "12px 16px",
          transition: "border-color .15s ease",
        }}>
          <span style={{ fontSize: 15, opacity: 0.4 }}>🔍</span>
          <input
            id="home-search"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            placeholder="Search contacts or UPI ID to send…"
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: "#F5F6F8", fontSize: 14,
              fontFamily: "var(--font-dm-sans,'DM Sans',sans-serif)",
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.3)", cursor:"pointer", fontSize:14, padding:0 }}>✕</button>
          )}
        </div>
        {/* Dropdown results */}
        {searchFocused && searchQuery.length >= 2 && (() => {
          const q = searchQuery.toLowerCase();
          const matches = transactions
            .filter(t => t.recipient_identifier?.toLowerCase().includes(q))
            .slice(0, 4);
          if (matches.length === 0) return null;
          return (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0, zIndex: 30,
              background: "rgba(13,15,20,0.98)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14, marginTop: 4, overflow: "hidden",
              backdropFilter: "blur(20px)",
            }}>
              {matches.map(t => (
                <button
                  key={t.id}
                  onClick={() => { router.push(`/send?to=${encodeURIComponent(t.recipient_identifier ?? "")}`); setSearchQuery(""); }}
                  style={{
                    width: "100%", padding: "12px 16px", background: "none", border: "none",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                    textAlign: "left", transition: "background .12s ease",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "none"}
                >
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#7C5CFF,#39D2FF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {(t.recipient_identifier ?? "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#F5F6F8", margin: 0 }}>{t.recipient_identifier}</p>
                    <p style={{ fontSize: 11, color: "#6B7180", margin: 0 }}>Recent recipient · tap to send</p>
                  </div>
                </button>
              ))}
              {/* Manual entry */}
              <button
                onClick={() => { router.push(`/send?to=${encodeURIComponent(searchQuery)}`); setSearchQuery(""); }}
                style={{ width:"100%", padding:"12px 16px", background:"none", border:"none", display:"flex", alignItems:"center", gap:10, cursor:"pointer", textAlign:"left" }}
              >
                <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(57,210,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>↗</div>
                <p style={{ fontSize:13, color:"#39D2FF", margin:0, fontWeight:500 }}>Send to &ldquo;{searchQuery}&rdquo;</p>
              </button>
            </div>
          );
        })()}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          RECENT ACTIVITY
      ══════════════════════════════════════════════════════════════ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "26px 20px 12px" }}>
        <h2 style={{
          fontSize: "15px", fontWeight: 600, color: "#F5F6F8", margin: 0,
          fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)",
        }}>
          Recent Activity
        </h2>
        <Link href="/history" style={{ fontSize: "12px", color: "#39D2FF", fontWeight: 500, textDecoration: "none" }}>
          See all →
        </Link>
      </div>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "0 20px" }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              height: "68px", borderRadius: "16px",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
              animation: "sp-shimmer 1.4s ease-in-out infinite",
            }} />
          ))}
        </div>
      )}

      {!loading && transactions.length === 0 && (
        <div style={{
          margin: "0 20px", background: "rgba(255,255,255,0.04)", borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.06)", padding: "32px", textAlign: "center",
        }}>
          <div style={{ fontSize: "28px", marginBottom: "8px", opacity: 0.4 }}>◈</div>
          <p style={{ margin: 0, fontSize: "13px", color: "#6B7180" }}>No transactions yet</p>
        </div>
      )}

      {!loading && transactions.map(txn => {
        const { sign, val, debit } = fmtAmt(txn.amount, txn.payment_type);
        const statusLabel = STATUS_LABEL[txn.status] ?? txn.status.toUpperCase();
        return (
          <Link
            key={txn.id}
            href={`/history/${txn.id}`}
            id={`txn-home-${txn.id}`}
            style={{
              display: "flex", alignItems: "center", gap: "12px",
              margin: "0 20px 10px",
              background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "14px 16px",
              border: "1px solid rgba(255,255,255,0.06)",
              textDecoration: "none", transition: "border-color .15s ease",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.14)"}
            onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.06)"}
          >
            {/* Icon chip — tinted like reference */}
            <div style={{
              width: "38px", height: "38px", borderRadius: "11px", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px",
              background: debit ? "rgba(255,92,92,0.12)" : "rgba(61,220,151,0.12)",
              color: debit ? "#FF5C5C" : "#3DDC97",
            }}>
              {TYPE_ICON[txn.payment_type] ?? "↔"}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "13.5px", fontWeight: 500, color: "#F5F6F8", margin: 0, textTransform: "capitalize" }}>
                {txn.payment_type.replace(/_/g, " ")} transfer
              </p>
              <p style={{ fontSize: "11px", color: "#6B7180", margin: "2px 0 0" }}>
                {new Date(txn.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
              </p>
            </div>

            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p style={{
                fontFamily: "var(--font-ibm-plex-mono, monospace)", fontSize: "13.5px", fontWeight: 700,
                color: debit ? "#FF5C5C" : "#3DDC97", margin: 0,
              }}>
                {sign}{val}
              </p>
              <p style={{ fontSize: "9.5px", color: "#6B7180", margin: "2px 0 0", letterSpacing: "0.5px" }}>
                {statusLabel}
              </p>
            </div>
          </Link>
        );
      })}

      {/* Spacer for bottom nav */}
      <div style={{ height: "32px" }} />

      <style>{`
        @keyframes sp-spin { to { transform: rotate(360deg); } }
        @keyframes sp-shimmer { 0%,100% { opacity:1; } 50% { opacity:0.45; } }
        @media (prefers-reduced-motion: reduce) {
          .sp-spin { animation: none !important; }
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}
