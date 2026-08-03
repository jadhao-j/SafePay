"use client";

/**
 * Send Money Page — Screen 8 (v2 premium dark)
 * Recipient → Amount → PIN → Success flow.
 * POST /payments/p2p  →  success screen with Send Again + Share Receipt.
 */

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api";

interface SavedContact {
  id: string;
  name: string;
  phone: string | null;
  upi_id: string | null;
}

type Step = "form" | "pin" | "success" | "error" | "challenge";

interface P2PResponse {
  transaction_id: string;
  status: string;
  amount: string;
  recipient?: string;
}

const PRESET_AMOUNTS = ["100", "500", "1000", "2000"];

/* ── PIN digit cell ──────────────────────────────────────────────────── */
function PinDot({ filled }: { filled: boolean }): JSX.Element {
  return (
    <div style={{
      width: 14, height: 14, borderRadius: "50%",
      background: filled ? "linear-gradient(135deg,#7C5CFF,#39D2FF)" : "rgba(255,255,255,0.15)",
      border: "1px solid rgba(255,255,255,0.2)",
      transition: "background .15s ease, transform .1s ease",
      transform: filled ? "scale(1.1)" : "scale(1)",
    }} />
  );
}

/* ── Numpad key ───────────────────────────────────────────────────────── */
function NumKey({ label, onPress }: { label: string; onPress: () => void }): JSX.Element {
  return (
    <button
      onClick={onPress}
      style={{
        width: "100%", aspectRatio: "1", borderRadius: 16,
        background: label === "" ? "transparent" : "rgba(255,255,255,0.06)",
        border: label === "" ? "none" : "1px solid rgba(255,255,255,0.09)",
        color: "#F5F6F8", fontSize: label === "⌫" ? 20 : 22,
        fontWeight: 600, cursor: label === "" ? "default" : "pointer",
        fontFamily: "var(--font-space-grotesk,'Space Grotesk',sans-serif)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background .12s ease, transform .08s ease",
        pointerEvents: label === "" ? "none" : "auto",
      }}
      onMouseDown={e => {
        if (label !== "") (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.92)";
      }}
      onMouseUp={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
      }}
      onTouchStart={e => {
        if (label !== "") (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)";
      }}
      onTouchEnd={e => {
        (e.currentTarget as HTMLButtonElement).style.background = label === "" ? "transparent" : "rgba(255,255,255,0.06)";
      }}
    >
      {label}
    </button>
  );
}

function SendForm(): JSX.Element {
  const router = useRouter();
  const params = useSearchParams();
  const prefillTo = params?.get("to") ?? "";

  /* Form state */
  const [recipient, setRecipient] = useState(prefillTo ? decodeURIComponent(prefillTo) : "");
  const [amount, setAmount]       = useState("");
  const [note, setNote]           = useState("");
  const [step, setStep]           = useState<Step>("form");
  const [pin, setPin]             = useState("");
  const [loading, setLoading]     = useState(false);
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);
  const [txnResult, setTxnResult] = useState<P2PResponse | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [challengeTxnId, setChallengeTxnId] = useState<string | null>(null);
  const [otpCode, setOtpCode]     = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError]   = useState<string | null>(null);
  const [contacts, setContacts]   = useState<SavedContact[]>([]);

  // Load contacts on mount
  useEffect(() => {
    apiClient.get<{ contacts: SavedContact[] }>("/contacts/")
      .then((r) => setContacts(r.data.contacts))
      .catch(() => {});
  }, []);

  // Filter contacts by current recipient input
  const matchingContacts = contacts.filter((c) => {
    if (!recipient) return true;
    const q = recipient.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.phone ?? "").includes(q);
  }).slice(0, 6);

  /* ── Numpad input ──────────────────────────────────────────────────── */
  function handleNumKey(val: string): void {
    if (val === "⌫") {
      setPin(p => p.slice(0, -1));
    } else if (pin.length < 4) {
      const next = pin + val;
      setPin(next);
      if (next.length === 4) {
        // auto-submit after short delay so last dot animates
        setTimeout(() => void submitPayment(next), 200);
      }
    }
  }

  /* ── Submit payment ────────────────────────────────────────────────── */
  async function submitPayment(pinVal: string): Promise<void> {
    if (loading) return;
    setLoading(true);
    setErrorMsg(null);
    const idempotency_key = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const rec = recipient.trim();
    try {
      // Route: if recipient has '@' → UPI send; otherwise → P2P phone transfer
      const isUpi = rec.includes("@");
      const res = await apiClient.post<P2PResponse>(
        isUpi ? "/payments/upi/send" : "/payments/p2p/transfer",
        isUpi
          ? {
              recipient_upi_id: rec.includes("@safepay") ? rec : `${rec.split("@")[0]}@safepay`,
              amount: parseFloat(amount),
              note: note.trim() || undefined,
              transaction_pin: pinVal,
              idempotency_key,
            }
          : {
              receiver_phone: rec,
              amount: parseFloat(amount),
              note: note.trim() || undefined,
              transaction_pin: pinVal,
              idempotency_key,
            }
      );
      setTxnResult(res.data);
      // If fraud system challenged → show OTP screen instead of success
      if (res.data.status === "challenged") {
        setChallengeTxnId(res.data.transaction_id);
        setStep("challenge");
      } else {
        setStep("success");
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        ?? "Payment failed. Please try again.";
      setErrorMsg(typeof msg === "string" ? msg : "Payment failed.");
      setStep("error");
      setPin("");
    } finally {
      setLoading(false);
    }
  }

  /* ── Share receipt ─────────────────────────────────────────────────── */
  async function handleShare(): Promise<void> {
    const text = `SafePay Receipt\nTo: ${recipient}\nAmount: ₹${parseFloat(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}\n${note ? `Note: ${note}\n` : ""}Status: ${txnResult?.status?.toUpperCase() ?? "COMPLETED"}\nRef: ${txnResult?.transaction_id ?? ""}`;
    if (navigator.share) {
      try { await navigator.share({ title: "SafePay Receipt", text }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2500);
    }
  }

  /* ── Validate form ─────────────────────────────────────────────────── */
  const amtNum = parseFloat(amount);
  const formValid = recipient.trim().length >= 3 && !isNaN(amtNum) && amtNum > 0;

  /* ════════════════════════════════════════════════════════════════════
     CHALLENGE SCREEN — Fraud verification OTP required
  ════════════════════════════════════════════════════════════════════ */
  if (step === "challenge") {
    async function submitOtp(): Promise<void> {
      if (!challengeTxnId || otpCode.length < 4) return;
      setOtpLoading(true); setOtpError(null);
      try {
        const res = await apiClient.post<P2PResponse>(`/payments/${challengeTxnId}/verify-challenge`, {
          code: otpCode,
        });
        setTxnResult(res.data);
        setStep("success");
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
          ?? "Verification failed. Please try again.";
        setOtpError(typeof msg === "string" ? msg : "Verification failed.");
        setOtpCode("");
      } finally { setOtpLoading(false); }
    }
    return (
      <div style={{ minHeight:"100vh", background:"#050608", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", padding:"40px 24px",
        fontFamily:"var(--font-dm-sans,'DM Sans',sans-serif)" }}>
        {/* Icon */}
        <div style={{ width:80, height:80, borderRadius:"50%", background:"rgba(255,184,77,0.1)",
          border:"3px solid #FFB84D", display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:36, marginBottom:20, boxShadow:"0 0 0 16px rgba(255,184,77,0.06)" }}>🔐</div>
        <h1 style={{ fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)",
          fontSize:22, fontWeight:700, color:"#fff", margin:"0 0 8px", textAlign:"center" }}>
          Verification Required
        </h1>
        <p style={{ fontSize:13, color:"#6B7180", margin:"0 0 6px", textAlign:"center", maxWidth:320 }}>
          SafePay's fraud protection flagged this payment for review.
        </p>
        <p style={{ fontSize:12, color:"#FFB84D", margin:"0 0 28px", textAlign:"center",
          fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>
          Check your console / email for the OTP code
        </p>

        {/* OTP input */}
        <input
          id="otp-input"
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={otpCode}
          onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))}
          placeholder="Enter OTP code"
          style={{ width:"100%", maxWidth:300, padding:"14px 16px", textAlign:"center",
            background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,184,77,0.4)",
            borderRadius:12, color:"#F5F6F8", fontSize:20, fontWeight:700, letterSpacing:"0.25em",
            outline:"none", fontFamily:"var(--font-ibm-plex-mono,monospace)", marginBottom:12 }}
        />

        {otpError && <div style={{ fontSize:13, color:"#FF5C5C", marginBottom:16, textAlign:"center",
          background:"rgba(255,92,92,0.08)", border:"1px solid rgba(255,92,92,0.2)",
          borderRadius:8, padding:"10px 16px", maxWidth:300 }}>{otpError}</div>}

        <button
          id="btn-verify-challenge"
          onClick={() => void submitOtp()}
          disabled={otpCode.length < 4 || otpLoading}
          style={{ width:"100%", maxWidth:300, padding:15, borderRadius:14, border:"none",
            background: otpCode.length >= 4 && !otpLoading ? "linear-gradient(135deg,#FFB84D,#FF8C00)" : "rgba(255,255,255,0.08)",
            color: otpCode.length >= 4 && !otpLoading ? "#fff" : "rgba(255,255,255,0.3)",
            fontSize:15, fontWeight:700, cursor: otpCode.length >= 4 ? "pointer" : "not-allowed",
            fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)",
            boxShadow: otpCode.length >= 4 ? "0 12px 28px rgba(255,184,77,.3)" : "none",
            marginBottom:12 }}>
          {otpLoading ? "Verifying…" : "Verify & Complete Payment"}
        </button>
        <button
          onClick={() => { setStep("form"); setOtpCode(""); setChallengeTxnId(null); }}
          style={{ background:"none", border:"none", color:"rgba(255,255,255,0.35)", fontSize:13,
            cursor:"pointer", fontFamily:"var(--font-dm-sans,'DM Sans',sans-serif)" }}>
          Cancel
        </button>

        <p style={{ marginTop:24, fontSize:11, color:"rgba(255,255,255,0.2)",
          fontFamily:"var(--font-ibm-plex-mono,monospace)", letterSpacing:"0.08em", textAlign:"center" }}>
          REF: {challengeTxnId?.slice(0,16).toUpperCase()}
        </p>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════════
     SUCCESS SCREEN
  ════════════════════════════════════════════════════════════════════ */
  if (step === "success") {
    return (
      <div style={{
        minHeight: "100vh", background: "#050608", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "40px 24px",
        fontFamily: "var(--font-dm-sans,'DM Sans',sans-serif)",
      }}>
        {/* Success ring */}
        <div style={{
          width: 88, height: 88, borderRadius: "50%",
          background: "rgba(61,220,151,0.1)",
          border: "3px solid #3DDC97",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 40, marginBottom: 20,
          boxShadow: "0 0 0 16px rgba(61,220,151,0.06), 0 0 0 32px rgba(61,220,151,0.03)",
          animation: "sp-pop .4s cubic-bezier(0.34,1.56,0.64,1)",
        }}>✓</div>

        <h1 style={{
          fontFamily: "var(--font-space-grotesk,'Space Grotesk',sans-serif)",
          fontSize: 26, fontWeight: 700, color: "#fff", margin: "0 0 6px", textAlign: "center",
        }}>
          Payment Sent!
        </h1>
        <p style={{ fontSize: 14, color: "#6B7180", margin: "0 0 6px", textAlign: "center" }}>
          To <strong style={{ color: "#F5F6F8" }}>{recipient}</strong>
        </p>
        <p style={{
          fontFamily: "var(--font-ibm-plex-mono,monospace)",
          fontSize: 28, fontWeight: 700, color: "#3DDC97", margin: "0 0 28px",
        }}>
          ₹{amtNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </p>

        {txnResult?.transaction_id && (
          <p style={{
            fontFamily: "var(--font-ibm-plex-mono,monospace)",
            fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em",
            margin: "0 0 36px", textTransform: "uppercase",
          }}>
            REF: {txnResult.transaction_id.slice(0, 16).toUpperCase()}
          </p>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 360 }}>
          <button
            id="btn-send-again"
            onClick={() => {
              setStep("form");
              setRecipient(""); setAmount(""); setNote(""); setPin(""); setTxnResult(null);
            }}
            style={{
              width: "100%", padding: 15, borderRadius: 14, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg,#7C5CFF,#39D2FF)",
              color: "#fff", fontSize: 15, fontWeight: 700,
              fontFamily: "var(--font-space-grotesk,'Space Grotesk',sans-serif)",
              boxShadow: "0 12px 28px rgba(124,92,255,.35)",
            }}
          >
            ↗ Send Again
          </button>

          <button
            id="btn-share-receipt"
            onClick={() => void handleShare()}
            style={{
              width: "100%", padding: 15, borderRadius: 14, cursor: "pointer",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: shareSuccess ? "#3DDC97" : "#F5F6F8",
              fontSize: 15, fontWeight: 600,
              fontFamily: "var(--font-space-grotesk,'Space Grotesk',sans-serif)",
              transition: "color .2s ease",
            }}
          >
            {shareSuccess ? "✓ Copied to clipboard!" : "⬆ Share Receipt"}
          </button>

          <button
            id="btn-goto-home"
            onClick={() => router.push("/home")}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.35)", fontSize: 13, padding: "8px 0",
              fontFamily: "var(--font-dm-sans,'DM Sans',sans-serif)",
            }}
          >
            Back to Home
          </button>
        </div>

        <style>{`
          @keyframes sp-pop { 0%{transform:scale(0.5);opacity:0} 100%{transform:scale(1);opacity:1} }
        `}</style>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════════
     PIN PAD SCREEN
  ════════════════════════════════════════════════════════════════════ */
  if (step === "pin" || step === "error") {
    const numRows = [["1","2","3"],["4","5","6"],["7","8","9"],["","0","⌫"]];
    return (
      <div style={{
        minHeight: "100vh", background: "#050608", display: "flex", flexDirection: "column",
        alignItems: "center", padding: "52px 28px 40px",
        fontFamily: "var(--font-dm-sans,'DM Sans',sans-serif)",
      }}>
        {/* Header */}
        <button
          onClick={() => { setStep("form"); setPin(""); setErrorMsg(null); }}
          style={{
            alignSelf: "flex-start", background: "none", border: "none",
            color: "rgba(255,255,255,0.5)", fontSize: 22, cursor: "pointer", padding: 0, marginBottom: 40,
          }}
        >←</button>

        <div style={{
          width: 52, height: 52, borderRadius: 16,
          background: "conic-gradient(from 90deg,#7C5CFF,#39D2FF,#3DDC97,#7C5CFF)",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", marginBottom: 20,
        }}>
          <div style={{ position: "absolute", inset: 2, borderRadius: 14, background: "#0D0F14" }} />
          <span style={{ position: "relative", zIndex: 1, fontSize: 22 }}>🔒</span>
        </div>

        <h1 style={{
          fontFamily: "var(--font-space-grotesk,'Space Grotesk',sans-serif)",
          fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 0 4px", textAlign: "center",
        }}>Enter PIN</h1>
        <p style={{ fontSize: 13, color: "#6B7180", margin: "0 0 8px", textAlign: "center" }}>
          Sending <strong style={{ color: "#F5F6F8", fontFamily: "var(--font-ibm-plex-mono,monospace)" }}>
            ₹{amtNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </strong> to <strong style={{ color: "#F5F6F8" }}>{recipient}</strong>
        </p>

        {step === "error" && errorMsg && (
          <div style={{
            background: "rgba(255,92,92,0.08)", border: "1px solid rgba(255,92,92,0.2)",
            borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#FF5C5C",
            marginBottom: 16, textAlign: "center", maxWidth: 320,
          }}>{errorMsg}</div>
        )}

        {/* PIN dots */}
        <div style={{ display: "flex", gap: 16, margin: "24px 0 40px" }}>
          {[0,1,2,3].map(i => <PinDot key={i} filled={i < pin.length} />)}
        </div>

        {/* Numpad */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 72px)", gap: 10, width: "100%", maxWidth: 240 }}>
          {numRows.flat().map((k, i) => (
            <NumKey key={i} label={k} onPress={() => handleNumKey(k)} />
          ))}
        </div>

        {loading && (
          <p style={{
            marginTop: 24, fontSize: 12, color: "#6B7180",
            fontFamily: "var(--font-ibm-plex-mono,monospace)", letterSpacing: "0.08em",
          }}>
            PROCESSING…
          </p>
        )}
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════════
     SEND FORM
  ════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{
      minHeight: "100vh", background: "#050608",
      fontFamily: "var(--font-dm-sans,'DM Sans',sans-serif)",
    }}>

      {/* Hero banner */}
      <div style={{
        position: "relative", padding: "52px 24px 80px", overflow: "hidden",
        background: `
          radial-gradient(120% 90% at 15% 0%, rgba(124,92,255,.55), transparent 60%),
          radial-gradient(120% 90% at 100% 10%, rgba(57,210,255,.5), transparent 55%),
          linear-gradient(160deg,#0B1220 0%,#101a33 55%,#0B1220 100%)
        `,
      }}>
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)",
          backgroundSize: "18px 18px", opacity: 0.5,
        }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 1 }}>
          <button
            onClick={() => router.push("/home")}
            aria-label="Back"
            style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.14)",
              color: "rgba(255,255,255,.8)", fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >←</button>
          <h1 style={{
            fontSize: 20, fontWeight: 700, color: "#fff", margin: 0,
            fontFamily: "var(--font-space-grotesk,'Space Grotesk',sans-serif)",
          }}>Send Money</h1>
        </div>
      </div>

      {/* Form card — dark glass overlapping hero */}
      <div style={{ margin: "-56px 20px 0", position: "relative", zIndex: 2 }}>
        <div style={{
          background: "rgba(13,15,20,0.85)",
          backdropFilter: "blur(24px) saturate(1.4)",
          WebkitBackdropFilter: "blur(24px) saturate(1.4)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 22, padding: "26px 22px",
          boxShadow: "0 24px 48px rgba(0,0,0,.45), 0 0 0 1px rgba(124,92,255,.08) inset",
        }}>

          {/* Recipient */}
          <label
            htmlFor="send-recipient"
            style={{
              display: "block",
              fontFamily: "var(--font-ibm-plex-mono,monospace)",
              fontSize: 10, letterSpacing: "1.5px",
              color: "rgba(255,255,255,.45)", textTransform: "uppercase", marginBottom: 8,
            }}
          >
            To (UPI ID / Phone / Email)
          </label>
          <input
            id="send-recipient"
            type="text"
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
            placeholder="9876543210 or user@upi"
            autoFocus
            style={{
              width: "100%", padding: "14px 16px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 12, color: "#F5F6F8", fontSize: 14,
              outline: "none", boxSizing: "border-box",
              fontFamily: "var(--font-dm-sans,'DM Sans',sans-serif)",
              marginBottom: matchingContacts.length ? 10 : 18, transition: "border-color .15s ease",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "rgba(57,210,255,0.5)")}
            onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)")}
          />

          {/* Contacts quick-pick */}
          {matchingContacts.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
              {matchingContacts.map((c, i) => {
                const COLORS = ["#7C5CFF","#39D2FF","#3DDC97","#FFB84D","#FF79C6","#FF5C5C"];
                const col = COLORS[i % COLORS.length];
                const initials = c.name.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();
                const fillVal = c.phone || c.upi_id || "";
                return (
                  <button
                    key={c.id}
                    onClick={() => setRecipient(fillVal)}
                    title={`${c.name} — ${fillVal}`}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                      background: "none", border: "none", cursor: "pointer", flexShrink: 0, padding: "4px 2px",
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: col + "22", border: `1.5px solid ${col}44`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 700, color: col,
                      transition: "transform .1s ease",
                    }}>{initials}</div>
                    <span style={{ fontSize: 10, color: "#9198A8", maxWidth: 52, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Amount */}
          <label
            htmlFor="send-amount"
            style={{
              display: "block",
              fontFamily: "var(--font-ibm-plex-mono,monospace)",
              fontSize: 10, letterSpacing: "1.5px",
              color: "rgba(255,255,255,.45)", textTransform: "uppercase", marginBottom: 8,
            }}
          >
            Amount (₹)
          </label>
          <input
            id="send-amount"
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            min="1"
            style={{
              width: "100%", padding: "14px 16px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 12, color: "#F5F6F8", fontSize: 18,
              fontFamily: "var(--font-ibm-plex-mono,monospace)",
              fontWeight: 700, outline: "none", boxSizing: "border-box",
              marginBottom: 10, transition: "border-color .15s ease",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "rgba(57,210,255,0.5)")}
            onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)")}
          />

          {/* Preset chips */}
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {PRESET_AMOUNTS.map(q => (
              <button
                key={q}
                onClick={() => setAmount(q)}
                style={{
                  flex: 1, padding: "8px 4px", borderRadius: 999,
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  fontFamily: "var(--font-ibm-plex-mono,monospace)",
                  background: amount === q ? "rgba(57,210,255,0.15)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${amount === q ? "#39D2FF" : "rgba(255,255,255,0.12)"}`,
                  color: amount === q ? "#39D2FF" : "rgba(255,255,255,0.6)",
                  transition: "all .15s ease",
                }}
              >
                ₹{q}
              </button>
            ))}
          </div>

          {/* Note */}
          <label
            htmlFor="send-note"
            style={{
              display: "block",
              fontFamily: "var(--font-ibm-plex-mono,monospace)",
              fontSize: 10, letterSpacing: "1.5px",
              color: "rgba(255,255,255,.45)", textTransform: "uppercase", marginBottom: 8,
            }}
          >
            Note (optional)
          </label>
          <input
            id="send-note"
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Dinner split, rent…"
            maxLength={120}
            style={{
              width: "100%", padding: "13px 16px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 12, color: "#F5F6F8", fontSize: 14,
              outline: "none", boxSizing: "border-box",
              fontFamily: "var(--font-dm-sans,'DM Sans',sans-serif)",
              marginBottom: 22, transition: "border-color .15s ease",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "rgba(57,210,255,0.5)")}
            onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)")}
          />

          {/* CTA */}
          <button
            id="btn-proceed-send"
            disabled={!formValid}
            onClick={() => { setStep("pin"); setPin(""); setErrorMsg(null); }}
            style={{
              width: "100%", padding: 15, borderRadius: 14, border: "none",
              background: formValid ? "linear-gradient(135deg,#7C5CFF,#39D2FF)" : "rgba(255,255,255,0.08)",
              color: formValid ? "#fff" : "rgba(255,255,255,0.3)",
              fontSize: 15, fontWeight: 700, cursor: formValid ? "pointer" : "not-allowed",
              fontFamily: "var(--font-space-grotesk,'Space Grotesk',sans-serif)",
              boxShadow: formValid ? "0 12px 28px rgba(124,92,255,.35)" : "none",
              transition: "all .18s ease",
            }}
          >
            Continue →
          </button>
        </div>
      </div>

      <div style={{ height: 40 }} />

      <style>{`
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
        input::placeholder { color: rgba(255,255,255,0.3); }
        @media(prefers-reduced-motion:reduce){*{animation-duration:0.01ms!important;transition-duration:0.01ms!important}}
      `}</style>
    </div>
  );
}

/* Suspense wrapper required for useSearchParams in Next.js */
export default function SendPage(): JSX.Element {
  return <Suspense><SendForm /></Suspense>;
}