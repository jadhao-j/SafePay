"use client";

/**
 * Wallet Page — Screen 17 (v2 premium dark)
 * Balance hero, Add Money / Withdraw with PIN verification step.
 * Transaction history with Type + Month filter dropdowns.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { fetchTransactions, type WalletTransaction } from "@/lib/fraud-api";

interface BalanceData { balance: string; currency: string; }

const DEBIT = new Set(["p2p","merchant","qr","upi","withdrawal"]);
const TYPE_ICON: Record<string,string> = { p2p:"↔", merchant:"◈", qr:"⬡", upi:"⚡", topup:"↓", withdrawal:"↑", recurring:"↺" };
const STATUS_COLOR: Record<string,string> = {
  completed:"#3DDC97", approved:"#3DDC97", challenged:"#FFB84D",
  blocked:"#FF5C5C", failed:"#FF5C5C", pending:"#6B7180", reversed:"#7C5CFF",
};

function Skeleton({ h, r=8 }: { h:number; r?:number }): JSX.Element {
  return <div style={{ height:h, borderRadius:r, background:"rgba(255,255,255,0.07)", animation:"sp-shimmer 1.4s ease-in-out infinite", marginBottom:8 }} />;
}

/* ── PIN dot ──────────────────────────────────────────────────────────── */
function PinDot({ filled }: { filled: boolean }): JSX.Element {
  return (
    <div style={{
      width: 13, height: 13, borderRadius: "50%",
      background: filled ? "linear-gradient(135deg,#7C5CFF,#39D2FF)" : "rgba(255,255,255,0.15)",
      border: "1px solid rgba(255,255,255,0.2)",
      transition: "background .15s ease",
    }} />
  );
}

/* ── Filter select ──────────────────────────────────────────────────────── */
function FilterSelect({ id, label, value, onChange, options }: {
  id: string; label: string; value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}): JSX.Element {
  return (
    <div style={{ flex: 1 }}>
      <label htmlFor={id} style={{ display:"block", fontSize:9, letterSpacing:"0.1em", color:"rgba(255,255,255,0.35)", textTransform:"uppercase", fontFamily:"var(--font-ibm-plex-mono,monospace)", marginBottom:5 }}>{label}</label>
      <div style={{ position:"relative" }}>
        <select
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width:"100%", padding:"9px 30px 9px 12px", borderRadius:10, cursor:"pointer",
            background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)",
            color:"#F5F6F8", fontSize:12, fontFamily:"var(--font-dm-sans,'DM Sans',sans-serif)",
            outline:"none", appearance:"none", WebkitAppearance:"none",
          }}
        >
          {options.map(o => <option key={o.value} value={o.value} style={{ background:"#0D0F14" }}>{o.label}</option>)}
        </select>
        <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", fontSize:10, color:"rgba(255,255,255,0.4)" }}>▾</span>
      </div>
    </div>
  );
}

export default function WalletPage(): JSX.Element {
  const router = useRouter();
  const [balance, setBalance]           = useState<BalanceData|null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [modal, setModal]               = useState<"add"|"withdraw"|null>(null);
  const [modalStep, setModalStep]       = useState<"amount"|"pin">("amount");
  const [modalAmt, setModalAmt]         = useState("");
  const [modalPin, setModalPin]         = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError]     = useState<string|null>(null);
  const [displayBal, setDisplayBal]     = useState(0);
  const animRef = useRef<ReturnType<typeof setInterval>|null>(null);

  // Filters
  const [filterType, setFilterType] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");

  useEffect(() => {
    Promise.allSettled([
      apiClient.get<BalanceData>("/wallet/balance").then(r => setBalance(r.data)),
      fetchTransactions().then(setTransactions),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!balance) return;
    const target = parseFloat(balance.balance);
    if (isNaN(target)) return;
    const start = Date.now();
    if (animRef.current) clearInterval(animRef.current);
    animRef.current = setInterval(() => {
      const p = Math.min((Date.now()-start)/900, 1);
      setDisplayBal(target * (1-Math.pow(1-p,3)));
      if (p>=1) { if(animRef.current) clearInterval(animRef.current); }
    }, 16);
    return () => { if(animRef.current) clearInterval(animRef.current); };
  }, [balance]);

  /* ── PIN numpad ─────────────────────────────────────────────────────── */
  function handlePinKey(val: string): void {
    if (val === "⌫") {
      setModalPin(p => p.slice(0, -1));
    } else if (modalPin.length < 4) {
      const next = modalPin + val;
      setModalPin(next);
      if (next.length === 4) setTimeout(() => void handleAction(next), 200);
    }
  }

  /* ── Submit wallet action ────────────────────────────────────────────── */
  async function handleAction(pinVal?: string): Promise<void> {
    const amt = parseFloat(modalAmt);
    if (!amt || amt <= 0 || modalLoading || !modal) return;
    setModalError(null); setModalLoading(true);
    try {
      await apiClient.post(modal==="add" ? "/wallet/add-money" : "/wallet/withdraw", {
        amount: amt,
        transaction_pin: pinVal ?? modalPin,
        idempotency_key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      });
      const [balRes, txnRes] = await Promise.all([
        apiClient.get<BalanceData>("/wallet/balance"),
        fetchTransactions(),
      ]);
      setBalance(balRes.data); setTransactions(txnRes);
      setModal(null); setModalAmt(""); setModalPin(""); setModalStep("amount");
    } catch (err: unknown) {
      const msg = (err as { response?:{data?:{detail?:string}} })?.response?.data?.detail ?? "Action failed.";
      setModalError(typeof msg === "string" ? msg : "Action failed.");
      setModalPin(""); // reset PIN on error
    } finally { setModalLoading(false); }
  }

  const fmt = (n:number) => `₹${n.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}`;

  /* ── Filter transactions ─────────────────────────────────────────────── */
  const now = new Date();
  const MONTH_OPTIONS = [
    { label: "All Time", value: "all" },
    ...Array.from({ length: 3 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return { label: d.toLocaleString("en-IN", { month: "long", year: "numeric" }), value: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}` };
    }),
  ];
  const TYPE_OPTIONS = [
    { label: "All Types", value: "all" },
    { label: "Debits", value: "debit" },
    { label: "Credits", value: "credit" },
    { label: "P2P", value: "p2p" },
    { label: "Topup", value: "topup" },
    { label: "Withdrawal", value: "withdrawal" },
    { label: "Merchant", value: "merchant" },
  ];

  const filteredTxns = transactions.filter(txn => {
    if (filterType !== "all") {
      if (filterType === "debit" && !DEBIT.has(txn.payment_type)) return false;
      if (filterType === "credit" && DEBIT.has(txn.payment_type)) return false;
      if (!["debit","credit"].includes(filterType) && txn.payment_type !== filterType) return false;
    }
    if (filterMonth !== "all") {
      const d = new Date(txn.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      if (key !== filterMonth) return false;
    }
    return true;
  });

  const numRows = [["1","2","3"],["4","5","6"],["7","8","9"],["","0","⌫"]];

  return (
    <div style={{ minHeight:"100vh", background:"#050608", color:"#F5F6F8", fontFamily:"var(--font-dm-sans,'DM Sans',sans-serif)" }}>

      {/* Hero banner */}
      <div style={{
        position:"relative", padding:"52px 24px 88px", overflow:"hidden",
        background:`
          radial-gradient(120% 90% at 15% 0%, rgba(124,92,255,.5), transparent 60%),
          radial-gradient(120% 90% at 100% 10%, rgba(57,210,255,.4), transparent 55%),
          linear-gradient(160deg,#0B1220 0%,#101a33 55%,#0B1220 100%)
        `,
      }}>
        <div aria-hidden="true" style={{
          position:"absolute", inset:0, pointerEvents:"none",
          backgroundImage:"radial-gradient(rgba(255,255,255,.06) 1px,transparent 1px)",
          backgroundSize:"18px 18px", opacity:0.5,
        }}/>
        <div style={{ display:"flex", alignItems:"center", gap:14, position:"relative", zIndex:1 }}>
          <button onClick={()=>router.push("/home")} aria-label="Back"
            style={{ width:34, height:34, borderRadius:"50%", background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.14)", color:"rgba(255,255,255,.8)", fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            ←
          </button>
          <h1 style={{ fontSize:20, fontWeight:700, color:"#fff", margin:0, fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>My Wallet</h1>
        </div>
      </div>

      {/* Balance card — dark glass overlapping hero (v2 §4) */}
      <div style={{ margin:"-64px 20px 0", position:"relative", zIndex:2 }}>
        <div style={{
          background:"rgba(13,15,20,0.82)",
          backdropFilter:"blur(24px) saturate(1.4)",
          WebkitBackdropFilter:"blur(24px) saturate(1.4)",
          border:"1px solid rgba(255,255,255,0.10)",
          borderRadius:22,
          padding:"26px 24px 20px",
          boxShadow:"0 24px 48px rgba(0,0,0,.45), 0 0 0 1px rgba(124,92,255,.08) inset",
        }}>
          <p style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:11, letterSpacing:"1.5px", color:"rgba(255,255,255,0.45)", textTransform:"uppercase", margin:"0 0 8px" }}>Total Balance</p>
          {loading ? <div style={{ height:42, width:200, borderRadius:8, background:"rgba(255,255,255,0.08)", animation:"sp-shimmer 1.4s ease-in-out infinite" }}/> : (
            <p style={{ fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)", fontWeight:700, fontSize:"clamp(32px,8vw,48px)", color:"#FFFFFF", margin:0, letterSpacing:"-0.5px" }}>{fmt(displayBal)}</p>
          )}
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.35)", margin:"8px 0 20px", fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>{balance?.currency??"INR"} · SafePay Wallet</p>

          {/* Action buttons */}
          <div style={{ display:"flex", gap:10 }}>
            {(["add","withdraw"] as const).map(t => (
              <button key={t} id={`btn-wallet-${t}`} onClick={()=>{ setModal(t); setModalAmt(""); setModalPin(""); setModalError(null); setModalStep("amount"); }}
                style={{
                  flex:1, padding:"12px 8px", borderRadius:12, cursor:"pointer",
                  background: t==="add" ? "linear-gradient(135deg,#7C5CFF,#39D2FF)" : "rgba(255,255,255,0.08)",
                  color: "#fff",
                  fontSize:13, fontWeight:700,
                  fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)",
                  boxShadow: t==="add" ? "0 8px 20px rgba(124,92,255,.3)" : "none",
                  border: t==="withdraw" ? "1px solid rgba(255,255,255,0.12)" : "none",
                }}>
                {t==="add" ? "＋ Add Money" : "↑ Withdraw"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction list */}
      <div style={{ padding:"24px 20px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <h2 style={{ fontSize:15, fontWeight:600, color:"#F5F6F8", margin:0, fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>All Transactions</h2>
          <span style={{ fontSize:12, color:"#6B7180" }}>{filteredTxns.length} result{filteredTxns.length!==1?"s":""}</span>
        </div>

        {/* Filter dropdowns */}
        <div style={{ display:"flex", gap:10, marginBottom:16 }}>
          <FilterSelect id="filter-type" label="Type" value={filterType} onChange={setFilterType} options={TYPE_OPTIONS} />
          <FilterSelect id="filter-month" label="Month" value={filterMonth} onChange={setFilterMonth} options={MONTH_OPTIONS} />
        </div>

        {loading && [1,2,3,4].map(i=><Skeleton key={i} h={64} r={14}/>)}

        {!loading && filteredTxns.length===0 && (
          <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:14, border:"1px solid rgba(255,255,255,0.07)", padding:32, textAlign:"center" }}>
            <div style={{ fontSize:28, opacity:0.4, marginBottom:8 }}>◈</div>
            <p style={{ color:"#6B7180", fontSize:13, margin:0 }}>No transactions{filterType!=="all"||filterMonth!=="all"?" for selected filters":""}</p>
          </div>
        )}

        {!loading && filteredTxns.map(txn => {
          const debit = DEBIT.has(txn.payment_type);
          const sc = STATUS_COLOR[txn.status]??"#6B7180";
          return (
            <Link key={txn.id} href={`/history/${txn.id}`} id={`txn-wallet-${txn.id}`}
              style={{
                display:"flex", alignItems:"center", gap:12, marginBottom:10,
                background:"rgba(255,255,255,0.04)", borderRadius:14, padding:"13px 16px",
                border:"1px solid rgba(255,255,255,0.07)", textDecoration:"none",
                transition:"border-color .15s ease",
              }}
              onMouseEnter={e=>(e.currentTarget as HTMLAnchorElement).style.borderColor="rgba(255,255,255,0.14)"}
              onMouseLeave={e=>(e.currentTarget as HTMLAnchorElement).style.borderColor="rgba(255,255,255,0.07)"}>
              <div style={{ width:38, height:38, borderRadius:11, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15,
                background: debit ? "rgba(255,92,92,0.12)" : "rgba(61,220,151,0.12)",
                color: debit ? "#FF5C5C" : "#3DDC97" }}>
                {TYPE_ICON[txn.payment_type]??"↔"}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13.5, fontWeight:500, color:"#F5F6F8", margin:0, textTransform:"capitalize" }}>{txn.payment_type.replace(/_/g," ")} transfer</p>
                <p style={{ fontSize:11, color:"#6B7180", margin:"2px 0 0" }}>{new Date(txn.created_at).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</p>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <p style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:13.5, fontWeight:700, color: debit?"#FF5C5C":"#3DDC97", margin:0 }}>
                  {debit?"−":"+"}₹{parseFloat(txn.amount).toLocaleString("en-IN",{minimumFractionDigits:2})}
                </p>
                <span style={{ fontSize:9, color:sc, letterSpacing:"0.5px", fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>{txn.status.toUpperCase()}</span>
              </div>
            </Link>
          );
        })}
        <div style={{ height:24 }}/>
      </div>

      {/* ── Modal ── */}
      {modal && (
        <div style={{ position:"fixed", inset:0, zIndex:100, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}
          onClick={()=>{ setModal(null); setModalStep("amount"); setModalPin(""); }}>
          <div style={{ position:"absolute", inset:0, background:"rgba(5,6,8,0.7)", backdropFilter:"blur(4px)" }}/>
        <div onClick={e=>e.stopPropagation()}
            style={{ position:"relative", background:"#0D0F14", borderRadius:"24px 24px 0 0", border:"1px solid rgba(255,255,255,0.1)", padding:"28px 24px 48px", maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ width:40, height:4, borderRadius:2, background:"rgba(255,255,255,0.15)", margin:"0 auto 24px" }}/>

            {/* ─ STEP 1: Amount ─ */}
            {modalStep === "amount" && (
              <>
                <h3 style={{ fontSize:18, fontWeight:700, color:"#F5F6F8", margin:"0 0 6px", fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>
                  {modal==="add" ? "Add Money" : "Withdraw"}
                </h3>
                <p style={{ fontSize:12, color:"#6B7180", margin:"0 0 20px" }}>
                  {modal==="add" ? "Top up your SafePay wallet" : "Withdraw to your bank account"}
                </p>
                <label style={{ fontSize:10, letterSpacing:"1.5px", color:"rgba(255,255,255,.45)", fontFamily:"var(--font-ibm-plex-mono,monospace)", display:"block", marginBottom:8, textTransform:"uppercase" }}>Amount (₹)</label>
                <input
                  id="wallet-amount-input"
                  type="number" value={modalAmt} onChange={e=>setModalAmt(e.target.value)}
                  placeholder="0.00" autoFocus
                  style={{ width:"100%", padding:"14px 16px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.14)", borderRadius:12, color:"#F5F6F8", fontSize:18, fontFamily:"var(--font-ibm-plex-mono,monospace)", outline:"none", boxSizing:"border-box", marginBottom:12 }}/>
                {/* Quick amounts */}
                <div style={{ display:"flex", gap:8, marginBottom:20 }}>
                  {["500","1000","2000","5000"].map(q=>(
                    <button key={q} onClick={()=>setModalAmt(q)}
                      style={{ flex:1, padding:"8px 4px", borderRadius:999, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"var(--font-ibm-plex-mono,monospace)",
                        background: modalAmt===q ? "rgba(57,210,255,0.15)" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${modalAmt===q ? "#39D2FF" : "rgba(255,255,255,0.12)"}`,
                        color: modalAmt===q ? "#39D2FF" : "rgba(255,255,255,0.6)" }}>
                      ₹{q}
                    </button>
                  ))}
                </div>
                {modalError && <div style={{ fontSize:13, color:"#FF5C5C", marginBottom:12, background:"rgba(255,92,92,0.08)", borderRadius:8, padding:"10px 14px", border:"1px solid rgba(255,92,92,0.2)" }}>{modalError}</div>}
                <button id={`btn-wallet-${modal}-next`}
                  onClick={()=>{ if(parseFloat(modalAmt)>0){ setModalStep("pin"); setModalPin(""); setModalError(null); }}}
                  disabled={!modalAmt||parseFloat(modalAmt)<=0}
                  style={{ width:"100%", padding:16, borderRadius:14, border:"none", cursor:"pointer",
                    background: !modalAmt||parseFloat(modalAmt)<=0 ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#7C5CFF,#39D2FF)",
                    color: !modalAmt||parseFloat(modalAmt)<=0 ? "rgba(255,255,255,0.3)" : "#fff",
                    fontSize:15, fontWeight:700, fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)",
                    boxShadow: parseFloat(modalAmt)>0 ? "0 8px 20px rgba(124,92,255,.3)" : "none" }}>
                  Continue →
                </button>
              </>
            )}

            {/* ─ STEP 2: PIN ─ */}
            {modalStep === "pin" && (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                <button onClick={()=>{ setModalStep("amount"); setModalPin(""); setModalError(null); }}
                  style={{ alignSelf:"flex-start", background:"none", border:"none", color:"rgba(255,255,255,0.5)", fontSize:18, cursor:"pointer", padding:"0 0 16px", marginLeft:-4 }}>
                  ←
                </button>
                <div style={{ width:44, height:44, borderRadius:14, background:"linear-gradient(135deg,#7C5CFF,#39D2FF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, marginBottom:12 }}>
                  🔒
                </div>
                <h3 style={{ fontSize:17, fontWeight:700, color:"#F5F6F8", margin:"0 0 4px", fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>Enter PIN</h3>
                <p style={{ fontSize:12, color:"#6B7180", margin:"0 0 4px", textAlign:"center" }}>
                  Confirm {modal==="add"?"top-up of":"withdrawal of"}{" "}
                  <strong style={{ color:"#F5F6F8", fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>
                    ₹{parseFloat(modalAmt).toLocaleString("en-IN",{minimumFractionDigits:2})}
                  </strong>
                </p>
                {modalError && <div style={{ fontSize:12, color:"#FF5C5C", margin:"10px 0", background:"rgba(255,92,92,0.08)", borderRadius:8, padding:"8px 14px", border:"1px solid rgba(255,92,92,0.2)", width:"100%", textAlign:"center" }}>{modalError}</div>}
                {/* Dots */}
                <div style={{ display:"flex", gap:14, margin:"18px 0 22px" }}>
                  {[0,1,2,3].map(i => <PinDot key={i} filled={i < modalPin.length} />)}
                </div>
                {/* Numpad */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 64px)", gap:8 }}>
                  {numRows.flat().map((k, i) => (
                    <button key={i} onClick={()=>handlePinKey(k)}
                      style={{
                        width:"100%", aspectRatio:"1", borderRadius:14,
                        background: k==="" ? "transparent" : "rgba(255,255,255,0.06)",
                        border: k==="" ? "none" : "1px solid rgba(255,255,255,0.09)",
                        color:"#F5F6F8", fontSize: k==="⌫" ? 18 : 20, fontWeight:600,
                        cursor: k==="" ? "default" : "pointer",
                        fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)",
                        pointerEvents: k==="" ? "none" : "auto",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        transition:"background .1s ease",
                      }}>
                      {k}
                    </button>
                  ))}
                </div>
                {modalLoading && (
                  <p style={{ marginTop:14, fontSize:11, color:"#6B7180", fontFamily:"var(--font-ibm-plex-mono,monospace)", letterSpacing:"0.08em" }}>PROCESSING…</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes sp-shimmer { 0%,100%{opacity:1}50%{opacity:0.45} }
        input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
        input[type=number]{-moz-appearance:textfield}
        input::placeholder{color:rgba(255,255,255,0.3)}
        select option { background: #0D0F14; color: #F5F6F8; }
        @media(prefers-reduced-motion:reduce){*{animation-duration:0.01ms!important;transition-duration:0.01ms!important}}
      `}</style>
    </div>
  );
}
