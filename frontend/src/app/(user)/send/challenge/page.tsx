"use client";

/**
 * Challenge Screen — Screen 12 (v2 dark/editorial)
 * OTP prompt with 60s countdown. Calls POST /payments/{id}/verify-challenge.
 */

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import { fetchExplanation } from "@/lib/fraud-api";

interface VerifyResponse { transaction_id: string; status: string; amount: string; }

function ChallengeForm(): JSX.Element {
  const router = useRouter();
  const params = useSearchParams();
  const txnId  = params?.get("txn")    ?? "";
  const amount = params?.get("amount") ?? "";
  const phone  = params?.get("phone")  ?? "";

  const [code, setCode]       = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [reason, setReason]   = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (txnId) {
      fetchExplanation(txnId)
        .then(e => setReason(e.explanation_text))
        .catch(() => setReason(null));
    }
  }, [txnId]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  function handleDigit(idx: number, value: string): void {
    if (!/^\d?$/.test(value)) return;
    const next = [...code];
    next[idx] = value;
    setCode(next);
    if (value && idx < 5) inputRefs.current[idx + 1]?.focus();
    if (!value && idx > 0) inputRefs.current[idx - 1]?.focus();
  }

  async function handleVerify(): Promise<void> {
    const otp = code.join("");
    if (otp.length < 6 || loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.post<VerifyResponse>(`/payments/${txnId}/verify-challenge`, { code: otp });
      router.push(`/send/success?txn=${res.data.transaction_id}&amount=${amount}&phone=${phone}`);
    } catch {
      setError("Incorrect OTP. Please try again.");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setLoading(false);
    }
  }

  const otpFull = code.join("").length === 6;

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)", color: "var(--white)", position: "relative", zIndex: 1 }}>

      {/* Header */}
      <div style={{ padding: "28px 24px 0", display: "flex", alignItems: "center", gap: "14px" }}>
        <button
          onClick={() => router.push("/send")}
          aria-label="Back to send"
          style={{
            width: "40px", height: "40px", borderRadius: "12px",
            background: "var(--panel)", border: "1px solid var(--line)",
            color: "var(--dim-2)", fontSize: "18px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          ←
        </button>
        <div>
          <h1 style={{
            fontSize: "20px", fontWeight: 700, color: "var(--white)", margin: 0,
            fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)",
          }}>
            Verification Required
          </h1>
          <p style={{ fontSize: "12px", color: "var(--dim)", margin: "2px 0 0", fontFamily: "var(--font-ibm-plex-mono, monospace)" }}>
            EXTRA CHECK ON THIS PAYMENT
          </p>
        </div>
      </div>

      {/* Constrained content */}
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "28px 20px 32px" }}>

        {/* Warning banner */}
        <div style={{
          background: "rgba(255,184,77,0.07)", border: "1px solid rgba(255,184,77,0.22)",
          borderRadius: "14px", padding: "16px 18px", marginBottom: "24px",
          display: "flex", gap: "12px", alignItems: "flex-start",
        }}>
          <span style={{ fontSize: "18px", flexShrink: 0, color: "var(--warning)" }}>⚠</span>
          <div>
            <p style={{
              fontSize: "12px", fontWeight: 700, color: "var(--warning)", margin: "0 0 5px",
              letterSpacing: "0.06em", fontFamily: "var(--font-ibm-plex-mono, monospace)",
            }}>
              PAYMENT FLAGGED
            </p>
            <p style={{ fontSize: "13px", color: "var(--dim-2)", margin: 0, lineHeight: 1.55 }}>
              {reason ?? "Our system detected unusual patterns. Please verify with OTP to proceed."}
            </p>
          </div>
        </div>

        {/* Amount display */}
        {amount && (
          <div style={{ textAlign: "center", margin: "0 0 28px" }}>
            <p style={{
              fontSize: "11px", color: "var(--dim)", margin: "0 0 8px",
              fontFamily: "var(--font-ibm-plex-mono, monospace)", letterSpacing: "0.1em",
            }}>
              PAYMENT OF
            </p>
            <p style={{
              fontSize: "40px", fontWeight: 700, color: "var(--white)", margin: 0,
              fontFamily: "var(--font-ibm-plex-mono, monospace)", letterSpacing: "-0.02em",
            }}>
              ₹{parseFloat(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            {phone && (
              <p style={{ fontSize: "13px", color: "var(--dim-2)", margin: "6px 0 0", fontFamily: "var(--font-ibm-plex-mono, monospace)" }}>
                TO {phone}
              </p>
            )}
          </div>
        )}

        {/* OTP box */}
        <div style={{
          background: "var(--panel)", borderRadius: "20px", border: "1px solid var(--line)",
          padding: "28px 24px",
        }}>
          <p style={{
            fontSize: "12px", fontWeight: 500, color: "var(--dim-2)", textAlign: "center",
            margin: "0 0 20px", letterSpacing: "0.08em",
            fontFamily: "var(--font-ibm-plex-mono, monospace)",
          }}>
            ENTER 6-DIGIT OTP
          </p>

          {/* OTP cells */}
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "20px" }}>
            {code.map((d, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => e.key === "Backspace" && !d && i > 0 && inputRefs.current[i - 1]?.focus()}
                style={{
                  width: "44px", height: "54px", textAlign: "center",
                  fontSize: "22px", fontWeight: 700,
                  color: "var(--white)",
                  background: d ? "rgba(124,92,255,0.15)" : "var(--panel-2)",
                  border: `1.5px solid ${d ? "var(--acc)" : "var(--line-2)"}`,
                  borderRadius: "12px", outline: "none",
                  fontFamily: "var(--font-ibm-plex-mono, monospace)",
                  transition: "border-color 130ms ease, background 130ms ease",
                }}
              />
            ))}
          </div>

          {/* Timer */}
          <div style={{ textAlign: "center", marginBottom: error ? "14px" : "0" }}>
            {timeLeft > 0 ? (
              <p style={{ fontSize: "12px", color: "var(--dim)", margin: 0, fontFamily: "var(--font-ibm-plex-mono, monospace)" }}>
                EXPIRES IN{" "}
                <span style={{ color: timeLeft <= 10 ? "var(--danger)" : "var(--acc-2)", fontWeight: 700 }}>
                  {String(timeLeft).padStart(2, "0")}s
                </span>
              </p>
            ) : (
              <button
                onClick={() => setTimeLeft(60)}
                style={{
                  background: "none", border: "none", color: "var(--acc-2)",
                  fontWeight: 700, fontSize: "13px", cursor: "pointer",
                  fontFamily: "var(--font-ibm-plex-mono, monospace)",
                }}
              >
                RESEND OTP
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginTop: "12px", background: "rgba(255,92,92,0.08)", border: "1px solid rgba(255,92,92,0.2)",
              borderRadius: "10px", padding: "10px 14px",
              fontSize: "13px", color: "var(--danger)", textAlign: "center",
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Verify CTA */}
        <button
          id="btn-verify-otp"
          onClick={() => void handleVerify()}
          disabled={!otpFull || loading}
          style={{
            width: "100%", marginTop: "16px", padding: "17px",
            borderRadius: "100px", border: "none",
            background: otpFull && !loading
              ? "linear-gradient(90deg, var(--acc-2), var(--acc))"
              : "var(--panel-2)",
            color: otpFull && !loading ? "var(--ink)" : "var(--dim)",
            fontSize: "15px", fontWeight: 700,
            cursor: otpFull && !loading ? "pointer" : "not-allowed",
            fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)",
            transition: "opacity 150ms ease",
          }}
        >
          {loading ? "Verifying…" : "Verify & Send"}
        </button>

        {/* Cancel */}
        <button
          onClick={() => router.push("/home")}
          style={{
            width: "100%", marginTop: "10px", padding: "14px",
            borderRadius: "100px", border: "1px solid var(--line)",
            background: "transparent", color: "var(--dim-2)",
            fontSize: "14px", fontWeight: 500, cursor: "pointer",
          }}
        >
          Cancel Payment
        </button>

      </div>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          * { transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}

export default function ChallengePage(): JSX.Element {
  return <Suspense><ChallengeForm /></Suspense>;
}
