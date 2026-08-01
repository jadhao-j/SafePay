"use client";

/**
 * Success Screen — Screen 13 (v2 dark/editorial)
 * Animated checkmark, receipt card, Send Another + Go Home CTAs.
 */

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SuccessContent(): JSX.Element {
  const router = useRouter();
  const params = useSearchParams();
  const txnId  = params?.get("txn")    ?? "";
  const amount = params?.get("amount") ?? "";
  const phone  = params?.get("phone")  ?? "";

  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t); }, []);

  const now = new Date().toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div style={{
      minHeight: "100vh", background: "var(--ink)", color: "var(--white)", position: "relative", zIndex: 1,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "32px 20px",
    }}>

      {/* Subtle success glow behind checkmark */}
      <div style={{
        position: "fixed", width: "360px", height: "360px",
        top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        borderRadius: "50%", pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(circle, rgba(61,220,151,0.12) 0%, rgba(5,6,8,0) 70%)",
        transition: "opacity 0.6s ease",
        opacity: visible ? 1 : 0,
      }} aria-hidden="true" />

      {/* Checkmark circle */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "96px", height: "96px", borderRadius: "50%",
        background: "var(--panel)", border: `3px solid var(--success)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "40px", marginBottom: "24px",
        boxShadow: "0 0 0 12px rgba(61,220,151,0.08)",
        transform: visible ? "scale(1)" : "scale(0.55)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.5s cubic-bezier(0.175,0.885,0.32,1.275), opacity 0.3s ease",
      }}>
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
          <path
            d="M10 22L19 31L34 14"
            stroke="var(--success)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="40"
            strokeDashoffset={visible ? 0 : 40}
            style={{ transition: "stroke-dashoffset 0.5s ease 0.3s" }}
          />
        </svg>
      </div>

      <div style={{
        position: "relative", zIndex: 1, textAlign: "center",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "all 0.4s ease 0.2s",
      }}>
        <h1 style={{
          fontSize: "26px", fontWeight: 700, color: "var(--white)", margin: "0 0 6px",
          fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)",
        }}>
          Payment Sent!
        </h1>
        <p style={{ fontSize: "13px", color: "var(--dim-2)", margin: "0 0 32px" }}>
          Your money is on its way
        </p>
      </div>

      {/* Receipt card */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: "400px",
        background: "var(--panel)", borderRadius: "20px", border: "1px solid var(--line)",
        overflow: "hidden",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: "all 0.4s ease 0.35s",
      }}>
        {/* Amount hero row */}
        <div style={{
          padding: "24px 24px 20px", textAlign: "center",
          borderBottom: "1px dashed var(--line-2)",
        }}>
          <p style={{
            fontSize: "11px", color: "var(--dim)", margin: "0 0 8px",
            letterSpacing: "0.12em", textTransform: "uppercase",
            fontFamily: "var(--font-ibm-plex-mono, monospace)", fontWeight: 500,
          }}>
            AMOUNT
          </p>
          <p style={{
            fontSize: "36px", fontWeight: 700, color: "var(--success)", margin: 0,
            fontFamily: "var(--font-ibm-plex-mono, monospace)", letterSpacing: "-0.02em",
          }}>
            ₹{amount ? parseFloat(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "—"}
          </p>
        </div>

        {/* Detail rows */}
        {[
          { label: "TO",             value: phone || "—",                              mono: true  },
          { label: "DATE",           value: now,                                       mono: false },
          { label: "TRANSACTION ID", value: txnId ? txnId.slice(0, 8) + "…" : "—",   mono: true  },
          { label: "STATUS",         value: "✓ COMPLETED",                            mono: true, accent: true },
        ].map((row, i, arr) => (
          <div
            key={row.label}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 24px",
              borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "none",
            }}
          >
            <span style={{
              fontSize: "11px", color: "var(--dim)", fontFamily: "var(--font-ibm-plex-mono, monospace)",
              letterSpacing: "0.08em",
            }}>
              {row.label}
            </span>
            <span style={{
              fontSize: "13px", fontWeight: 600,
              color: row.accent ? "var(--success)" : "var(--white)",
              fontFamily: row.mono ? "var(--font-ibm-plex-mono, monospace)" : "var(--font-dm-sans, sans-serif)",
            }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: "400px", marginTop: "20px",
        display: "flex", flexDirection: "column", gap: "10px",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.4s ease 0.5s",
      }}>
        <button
          id="btn-send-another"
          onClick={() => router.push("/send")}
          style={{
            padding: "17px", borderRadius: "100px", border: "none",
            background: "linear-gradient(90deg, var(--acc-2), var(--acc))",
            color: "var(--ink)", fontSize: "15px", fontWeight: 700, cursor: "pointer",
            fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)",
          }}
        >
          Send Another
        </button>
        <Link
          href="/home"
          id="btn-go-home"
          style={{
            padding: "15px", borderRadius: "100px",
            border: "1px solid var(--line)", background: "transparent",
            color: "var(--dim-2)", fontSize: "14px", fontWeight: 500,
            textAlign: "center", textDecoration: "none",
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage(): JSX.Element {
  return <Suspense><SuccessContent /></Suspense>;
}
