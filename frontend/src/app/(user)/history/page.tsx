"use client";

/**
 * Transaction History Page (v2 premium dark)
 * Filterable list, status badges, tap → /history/[id]
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchTransactions, type WalletTransaction } from "@/lib/fraud-api";

const DEBIT = new Set(["p2p","merchant","qr","upi","withdrawal"]);
const TYPE_ICON: Record<string,string> = { p2p:"↔", merchant:"◈", qr:"⬡", upi:"⚡", topup:"↓", withdrawal:"↑", recurring:"↺" };
const STATUS: Record<string,{color:string;label:string}> = {
  completed:{color:"#3DDC97",label:"DONE"}, approved:{color:"#3DDC97",label:"DONE"},
  challenged:{color:"#FFB84D",label:"VERIFIED"}, blocked:{color:"#FF5C5C",label:"BLOCKED"},
  failed:{color:"#FF5C5C",label:"FAILED"}, pending:{color:"#6B7180",label:"PENDING"},
  reversed:{color:"#7C5CFF",label:"REVERSED"},
};
const FILTERS = ["All","Approved","Challenged","Blocked"];

export default function HistoryPage(): JSX.Element {
  const router = useRouter();
  const [txns, setTxns]       = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("All");
  const [search, setSearch]   = useState("");

  useEffect(() => { fetchTransactions().then(setTxns).catch(()=>[]).finally(()=>setLoading(false)); }, []);

  const filtered = txns.filter(t => {
    const matchFilter = filter==="All" || t.status.toLowerCase()===filter.toLowerCase() ||
      (filter==="Approved" && (t.status==="approved"||t.status==="completed"));
    const matchSearch = !search || t.payment_type.includes(search.toLowerCase()) ||
      t.id.includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div style={{ minHeight:"100vh", background:"#050608", color:"#F5F6F8", fontFamily:"var(--font-dm-sans,'DM Sans',sans-serif)" }}>

      {/* Header */}
      <div style={{ padding:"28px 24px 0", display:"flex", alignItems:"center", gap:14 }}>
        <button onClick={()=>router.push("/home")} aria-label="Back"
          style={{ width:34, height:34, borderRadius:"50%", background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.12)", color:"rgba(255,255,255,.7)", fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>←</button>
        <h1 style={{ fontSize:20, fontWeight:700, color:"#F5F6F8", margin:0, fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>Transaction History</h1>
      </div>

      {/* Search */}
      <div style={{ padding:"18px 20px 0" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by type or ID…"
          style={{ width:"100%", padding:"12px 16px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, color:"#F5F6F8", fontSize:14, outline:"none", boxSizing:"border-box" }}/>
      </div>

      {/* Filter pills */}
      <div style={{ padding:"14px 20px 0", display:"flex", gap:8, flexWrap:"wrap" }}>
        {FILTERS.map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            style={{
              padding:"8px 16px", borderRadius:999, fontSize:12, fontWeight:600, cursor:"pointer",
              background: filter===f ? "rgba(57,210,255,0.15)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${filter===f ? "#39D2FF" : "rgba(255,255,255,0.1)"}`,
              color: filter===f ? "#39D2FF" : "rgba(255,255,255,0.5)",
              transition:"all .15s ease",
            }}>{f}</button>
        ))}
      </div>

      {/* List */}
      <div style={{ padding:"16px 20px 32px" }}>
        {loading && [1,2,3,4,5].map(i=>(
          <div key={i} style={{ height:68, borderRadius:14, background:"rgba(255,255,255,0.04)", marginBottom:8, animation:"sp-shimmer 1.4s ease-in-out infinite" }}/>
        ))}

        {!loading && filtered.length===0 && (
          <div style={{ textAlign:"center", padding:"40px 20px" }}>
            <div style={{ fontSize:28, opacity:0.3, marginBottom:8 }}>◈</div>
            <p style={{ color:"#6B7180", fontSize:13, margin:0 }}>No transactions found</p>
          </div>
        )}

        {!loading && filtered.map(txn => {
          const debit = DEBIT.has(txn.payment_type);
          const s = STATUS[txn.status]??{color:"#6B7180",label:txn.status.toUpperCase()};
          return (
            <Link key={txn.id} href={`/history/${txn.id}`} id={`txn-hist-${txn.id}`}
              style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8, background:"rgba(255,255,255,0.04)", borderRadius:14, padding:"14px 16px", border:"1px solid rgba(255,255,255,0.07)", textDecoration:"none", transition:"border-color .15s ease" }}
              onMouseEnter={e=>(e.currentTarget as HTMLAnchorElement).style.borderColor="rgba(255,255,255,0.15)"}
              onMouseLeave={e=>(e.currentTarget as HTMLAnchorElement).style.borderColor="rgba(255,255,255,0.07)"}>
              <div style={{ width:38, height:38, borderRadius:11, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15,
                background: debit ? "rgba(255,92,92,0.12)" : "rgba(61,220,151,0.12)",
                color: debit ? "#FF5C5C" : "#3DDC97" }}>
                {TYPE_ICON[txn.payment_type]??"↔"}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13.5, fontWeight:500, color:"#F5F6F8", margin:0, textTransform:"capitalize" }}>{txn.payment_type.replace(/_/g," ")} transfer</p>
                <p style={{ fontSize:11, color:"#6B7180", margin:"2px 0 0", fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>
                  {new Date(txn.created_at).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}
                </p>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <p style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:13.5, fontWeight:700, color: debit?"#FF5C5C":"#3DDC97", margin:0 }}>
                  {debit?"−":"+"}₹{parseFloat(txn.amount).toLocaleString("en-IN",{minimumFractionDigits:2})}
                </p>
                <span style={{ fontSize:9, color:s.color, letterSpacing:"0.5px", fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>{s.label}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <style>{`
        @keyframes sp-shimmer{0%,100%{opacity:1}50%{opacity:0.45}}
        input::placeholder{color:rgba(255,255,255,0.3)}
        input:focus{border-color:rgba(57,210,255,0.4)!important}
      `}</style>
    </div>
  );
}
