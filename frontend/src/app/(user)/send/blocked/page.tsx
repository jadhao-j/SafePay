"use client";

/**
 * Blocked Screen — Screen 14 (v2 dark/editorial)
 * Red blocked state, plain-language fraud reason, top SHAP factors, risk score bar.
 * CTAs: "Talk to Copilot" (pre-fills txn ID) and "Go Home".
 */

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchExplanation, type TransactionExplanation } from "@/lib/fraud-api";

const FACTOR_LABELS: Record<string, string> = {
  high_amount:        "Unusually high amount",
  new_device:         "Unrecognized device",
  low_trust:          "Low behavioral trust",
  new_recipient:      "First-time recipient",
  rapid_transaction:  "Rapid consecutive payment",
  unusual_time:       "Unusual transaction time",
  location_anomaly:   "Location anomaly",
};

function Skeleton({ h, r = 8 }: { h: number; r?: number }): JSX.Element {
  return (
    <div style={{
      width: "100%", height: h, borderRadius: r,
      background: "var(--panel-2)", animation: "sp-shimmer 1.4s ease-in-out infinite",
    }} />
  );
}

function BlockedContent(): JSX.Element {
  const router = useRouter();
  const params = useSearchParams();
  const txnId  = params?.get("txn") ?? "";

  const [explanation, setExplanation] = useState<TransactionExplanation | null>(null);
  const [loading, setLoading]         = useState(true);
  const [visible, setVisible]         = useState(false);

  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (!txnId) { setLoading(false); return; }
    fetchExplanation(txnId)
      .then(setExplanation)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [txnId]);

  const topFactors = explanation?.top_factors?.slice(0, 2) ?? [];
  const riskScore  = explanation ? parseFloat(explanation.final_risk_score) : null;

  return (
    <div style={{
      minHeight: "100vh", background: "var(--ink)", color: "var(--white)", position: "relative", zIndex: 1,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "32px 20px",
    }}>

      {/* Danger glow */}
      <div style={{
        position: "fixed", width: "400px", height: "400px",
        top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        borderRadius: "50%", pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(circle, rgba(255,92,92,0.1) 0%, rgba(5,6,8,0) 70%)",
        opacity: visible ? 1 : 0, transition: "opacity 0.6s ease",
      }} aria-hidden="true" />

      {/* Shield icon */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "96px", height: "96px", borderRadius: "50%",
        background: "var(--panel)", border: "3px solid var(--danger)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "38px", marginBottom: "24px",
        boxShadow: "0 0 0 12px rgba(255,92,92,0.08)",
        transform: visible ? "scale(1)" : "scale(0.6)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.5s cubic-bezier(0.175,0.885,0.32,1.275), opacity 0.3s ease",
      }}>
        🛡
      </div>

      <div style={{
        position: "relative", zIndex: 1, textAlign: "center",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(14px)",
        transition: "all 0.4s ease 0.2s",
      }}>
        <h1 style={{
          fontSize: "24px", fontWeight: 700, color: "var(--white)", margin: "0 0 6px",
          fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)",
        }}>
          Payment Blocked
        </h1>
        <p style={{ fontSize: "13px", color: "var(--dim-2)", margin: "0 0 28px", maxWidth: "300px", lineHeight: 1.5 }}>
          Our fraud detection system blocked this payment to protect your account.
        </p>
      </div>

      {/* Cards */}
      <div style={{
        position: "relative", zIndex: 1, width: "100%", maxWidth: "400px",
        display: "flex", flexDirection: "column", gap: "12px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.4s ease 0.35s",
      }}>

        {/* Reason card */}
        <div style={{
          background: "var(--panel)", borderRadius: "16px",
          border: "1px solid rgba(255,92,92,0.25)",
          borderLeft: "3px solid var(--danger)",
          padding: "20px 22px",
        }}>
          <p style={{
            fontSize: "10px", fontWeight: 700, color: "var(--danger)", margin: "0 0 10px",
            letterSpacing: "0.1em", fontFamily: "var(--font-ibm-plex-mono, monospace)",
          }}>
            WHY IT WAS BLOCKED
          </p>
          {loading ? <Skeleton h={40} /> : (
            <p style={{ fontSize: "14px", color: "var(--dim-2)", margin: 0, lineHeight: 1.6 }}>
              {explanation?.explanation_text ?? "Payment blocked due to high fraud risk signals detected by our AI engine."}
            </p>
          )}
        </div>

        {/* Risk score bar */}
        {riskScore !== null && (
          <div style={{
            background: "var(--panel)", borderRadius: "14px", border: "1px solid var(--line)",
            padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px",
          }}>
            <span style={{ fontSize: "12px", color: "var(--dim-2)", fontFamily: "var(--font-ibm-plex-mono, monospace)", letterSpacing: "0.06em" }}>
              FRAUD RISK
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, justifyContent: "flex-end" }}>
              <div style={{ width: "80px", height: "5px", borderRadius: "999px", background: "var(--panel-2)", overflow: "hidden" }}>
                <div style={{
                  width: `${riskScore * 100}%`, height: "100%",
                  background: riskScore > 0.7 ? "var(--danger)" : "var(--warning)",
                  borderRadius: "999px", transition: "width 0.9s ease",
                }} />
              </div>
              <span style={{
                fontSize: "14px", fontWeight: 700, color: "var(--danger)",
                fontFamily: "var(--font-ibm-plex-mono, monospace)",
                minWidth: "38px", textAlign: "right",
              }}>
                {(riskScore * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        )}

        {/* SHAP top factors */}
        {topFactors.length > 0 && (
          <div style={{
            background: "var(--panel)", borderRadius: "14px", border: "1px solid var(--line)",
            padding: "6px 0",
          }}>
            <p style={{
              fontSize: "10px", fontWeight: 700, color: "var(--dim)", margin: "12px 20px 8px",
              letterSpacing: "0.1em", fontFamily: "var(--font-ibm-plex-mono, monospace)",
            }}>
              TOP RISK SIGNALS
            </p>
            {topFactors.map((f, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "12px 20px",
                  borderTop: i > 0 ? "1px solid var(--line)" : "none",
                }}
              >
                <div style={{
                  width: "32px", height: "32px", borderRadius: "10px", flexShrink: 0,
                  background: "rgba(255,92,92,0.08)", border: "1px solid rgba(255,92,92,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--danger)", fontSize: "14px",
                }}>
                  ⚠
                </div>
                <span style={{ fontSize: "13px", color: "var(--dim-2)", flex: 1, lineHeight: 1.4 }}>
                  {FACTOR_LABELS[f.feature] ?? f.feature.replace(/_/g, " ")}
                </span>
                <span style={{
                  fontSize: "11px", fontWeight: 700, color: "var(--danger)",
                  background: "rgba(255,92,92,0.08)", padding: "3px 9px",
                  borderRadius: "999px", fontFamily: "var(--font-ibm-plex-mono, monospace)",
                  flexShrink: 0,
                }}>
                  +{Math.abs(f.shap_value).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Recommended action */}
        {explanation?.recommended_action && (
          <div style={{
            background: "rgba(124,92,255,0.06)", border: "1px solid rgba(124,92,255,0.18)",
            borderRadius: "12px", padding: "14px 18px",
            fontSize: "13px", color: "var(--dim-2)", display: "flex", gap: "10px",
          }}>
            <span style={{ color: "var(--acc)", flexShrink: 0 }}>◎</span>
            <span style={{ lineHeight: 1.5 }}>{explanation.recommended_action}</span>
          </div>
        )}

        {/* CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingTop: "4px" }}>
          <button
            id="btn-blocked-copilot"
            onClick={() => router.push(`/copilot?txn=${txnId}`)}
            style={{
              padding: "17px", borderRadius: "100px", border: "none",
              background: "linear-gradient(90deg, var(--acc-2), var(--acc))",
              color: "var(--ink)", fontSize: "15px", fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)",
            }}
          >
            <span>◎</span> Talk to Copilot
          </button>
          <button
            id="btn-blocked-home"
            onClick={() => router.push("/home")}
            style={{
              padding: "15px", borderRadius: "100px",
              border: "1px solid var(--line)", background: "transparent",
              color: "var(--dim-2)", fontSize: "14px", fontWeight: 500, cursor: "pointer",
            }}
          >
            Go Home
          </button>
        </div>
      </div>

      <style>{`
        @keyframes sp-shimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}

export default function BlockedPage(): JSX.Element {
  return <Suspense><BlockedContent /></Suspense>;
}
