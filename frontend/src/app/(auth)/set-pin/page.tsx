"use client";

/**
 * Set PIN Page — Screen 6 (v2 premium dark)
 * Custom numpad, 4-dot indicator, enter + confirm 2-step, success screen.
 * Calls PATCH /users/me/pin to persist the PIN securely on the backend.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";

type Step = "enter" | "confirm" | "saving" | "done";

const PIN_LENGTH = 4;

function PinPad({ value, onChange, onSubmit, label, submitLabel, disabled }: {
  value: string; onChange: (v: string) => void; onSubmit: () => void;
  label: string; submitLabel: string; disabled?: boolean;
}): JSX.Element {
  const DIGITS = ["1","2","3","4","5","6","7","8","9","","0","⌫"];
  function press(d: string): void {
    if (d === "⌫") { onChange(value.slice(0, -1)); return; }
    if (!d || value.length >= PIN_LENGTH) return;
    onChange(value + d);
  }
  return (
    <div>
      <p style={{ fontSize:12, color:"rgba(255,255,255,.45)", textAlign:"center", margin:"0 0 20px", fontFamily:"var(--font-ibm-plex-mono,monospace)", letterSpacing:"0.1em" }}>{label}</p>
      {/* Dots */}
      <div style={{ display:"flex", gap:14, justifyContent:"center", marginBottom:36 }}>
        {Array.from({length: PIN_LENGTH}).map((_, i) => (
          <div key={i} style={{
            width:14, height:14, borderRadius:"50%",
            background: i < value.length ? "linear-gradient(135deg,#7C5CFF,#39D2FF)" : "rgba(255,255,255,0.12)",
            transition:"background .15s ease",
            boxShadow: i < value.length ? "0 0 10px rgba(124,92,255,0.5)" : "none",
          }}/>
        ))}
      </div>
      {/* Keypad */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
        {DIGITS.map((d, i) => (
          <button key={i} onClick={() => press(d)} disabled={!d && d !== "0"}
            style={{
              height:64, borderRadius:16, border:"1px solid rgba(255,255,255,0.1)",
              background: !d ? "transparent" : "rgba(255,255,255,0.06)",
              color:"#F5F6F8",
              fontSize: d === "⌫" ? "20px" : "22px", fontWeight:600, cursor:d ? "pointer" : "default",
              fontFamily:"var(--font-ibm-plex-mono,monospace)", transition:"all .12s ease",
            }}
            onMouseEnter={e => { if (d) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={e => { if (d) (e.currentTarget as HTMLButtonElement).style.background = d ? "rgba(255,255,255,0.06)" : "transparent"; }}>
            {d}
          </button>
        ))}
      </div>
      <button id="btn-pin-submit" onClick={onSubmit} disabled={value.length < PIN_LENGTH || disabled}
        style={{ width:"100%", marginTop:20, padding:16, borderRadius:14, border:"none", fontWeight:700, fontSize:15,
          background: value.length === PIN_LENGTH && !disabled ? "linear-gradient(135deg,#7C5CFF,#39D2FF)" : "rgba(255,255,255,0.08)",
          color: value.length === PIN_LENGTH && !disabled ? "#fff" : "rgba(255,255,255,0.3)",
          fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)",
          boxShadow: value.length === PIN_LENGTH && !disabled ? "0 12px 28px rgba(124,92,255,.3)" : "none",
          cursor: value.length === PIN_LENGTH && !disabled ? "pointer" : "not-allowed" }}>
        {submitLabel}
      </button>
    </div>
  );
}

export default function SetPinPage(): JSX.Element {
  const router = useRouter();
  const [step, setStep]       = useState<Step>("enter");
  const [pin, setPin]         = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError]     = useState<string | null>(null);

  async function handleConfirm(): Promise<void> {
    if (pin !== confirm) {
      setError("PINs do not match. Try again.");
      setConfirm("");
      return;
    }
    setStep("saving");
    setError(null);
    try {
      await apiClient.patch("/users/me/pin", { pin });
      setStep("done");
      setTimeout(() => router.push("/home"), 2000);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        ?? "Failed to save PIN. Please try again.";
      setError(typeof msg === "string" ? msg : "Failed to save PIN.");
      setStep("confirm");
      setConfirm("");
    }
  }

  if (step === "saving") return (
    <div style={{ minHeight:"100vh", background:"#050608", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-dm-sans,'DM Sans',sans-serif)" }}>
      <div style={{ width:60, height:60, borderRadius:"50%", border:"3px solid rgba(124,92,255,0.4)", borderTopColor:"#7C5CFF", animation:"sp-spin 0.8s linear infinite", marginBottom:20 }}/>
      <p style={{ color:"rgba(255,255,255,0.5)", fontSize:14 }}>Saving PIN securely…</p>
      <style>{`@keyframes sp-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (step === "done") return (
    <div style={{ minHeight:"100vh", background:"#050608", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-dm-sans,'DM Sans',sans-serif)" }}>
      <div style={{ width:80, height:80, borderRadius:"50%", background:"rgba(13,15,20,1)", border:"3px solid #3DDC97", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, boxShadow:"0 0 0 12px rgba(61,220,151,0.08)", marginBottom:20 }}>🔑</div>
      <h2 style={{ color:"#F5F6F8", fontSize:22, fontWeight:700, margin:"0 0 8px", fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>PIN Updated!</h2>
      <p style={{ color:"#6B7180", fontSize:14, margin:0 }}>Your {PIN_LENGTH}-digit transaction PIN is saved securely</p>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#050608", color:"#F5F6F8", fontFamily:"var(--font-dm-sans,'DM Sans',sans-serif)" }}>
      {/* Header */}
      <div style={{ padding:"28px 24px 0", display:"flex", alignItems:"center", gap:14 }}>
        <button onClick={() => step === "confirm" ? setStep("enter") : router.push("/home")} aria-label="Back"
          style={{ width:34, height:34, borderRadius:"50%", background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.12)", color:"rgba(255,255,255,.7)", fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>←</button>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:"#F5F6F8", margin:0, fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>
            {step === "enter" ? "Set Transaction PIN" : "Confirm PIN"}
          </h1>
          <p style={{ fontSize:11, color:"rgba(255,255,255,.4)", margin:"2px 0 0", fontFamily:"var(--font-ibm-plex-mono,monospace)", letterSpacing:"0.08em" }}>
            STEP {step === "enter" ? 1 : 2} OF 2
          </p>
        </div>
      </div>

      <div style={{ maxWidth:380, margin:"0 auto", padding:"32px 24px" }}>
        {error && <div style={{ background:"rgba(255,92,92,0.08)", border:"1px solid rgba(255,92,92,0.2)", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#FF5C5C", marginBottom:20, textAlign:"center" }}>{error}</div>}
        {step === "enter" ? (
          <PinPad value={pin} onChange={setPin} onSubmit={() => { setPin(pin); setStep("confirm"); setError(null); }} label={`Enter your ${PIN_LENGTH}-digit PIN`} submitLabel="Continue →"/>
        ) : (
          <PinPad value={confirm} onChange={v => { setConfirm(v); setError(null); }} onSubmit={() => void handleConfirm()} label="Re-enter your PIN to confirm" submitLabel="Set PIN"/>
        )}
      </div>
    </div>
  );
}
