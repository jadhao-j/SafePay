"use client";

/**
 * Admin Alerts Page — v2 premium dark
 * Fraud alert list with filter pills, mark-read, SHAP explanation drawer.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import AlertRow from "@/components/admin/AlertRow";
import ExplanationPanel from "@/components/user/ExplanationPanel";
import { fetchAlerts, markAlertRead, fetchExplanation, type FraudAlert, type TransactionExplanation } from "@/lib/fraud-api";

export default function AdminAlertsPage(): JSX.Element {
  const [alerts, setAlerts]   = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<"all"|"unread"|"fraud_block"|"fraud_challenge">("all");
  const [explanation, setExplanation] = useState<TransactionExplanation|null>(null);
  const [expLoading, setExpLoading]   = useState(false);
  const [drawerTxnId, setDrawerTxnId] = useState<string|null>(null);
  const router = useRouter();

  useEffect(() => { fetchAlerts().then(setAlerts).catch(()=>setAlerts([])).finally(()=>setLoading(false)); }, []);

  async function handleMarkRead(id:string): Promise<void> {
    await markAlertRead(id).catch(()=>null);
    setAlerts(prev=>prev.map(a=>a.id===id?{...a,is_read:true}:a));
  }
  async function handleOpenExplanation(txnId:string): Promise<void> {
    setDrawerTxnId(txnId); setExplanation(null); setExpLoading(true);
    try { setExplanation(await fetchExplanation(txnId)); }
    catch { setExplanation(null); }
    finally { setExpLoading(false); }
  }
  function handleMarkAllRead(): void {
    Promise.allSettled(alerts.filter(a=>!a.is_read).map(a=>markAlertRead(a.id)))
      .then(()=>setAlerts(prev=>prev.map(a=>({...a,is_read:true}))));
  }

  const filtered = alerts.filter(a=>{
    if(filter==="unread") return !a.is_read;
    if(filter==="fraud_block") return a.type==="fraud_block";
    if(filter==="fraud_challenge") return a.type==="fraud_challenge";
    return true;
  });
  const unreadCount = alerts.filter(a=>!a.is_read).length;

  const FILTER_LABELS: Record<string,string> = { all:"All", unread:"Unread", fraud_block:"Blocked", fraud_challenge:"Challenged" };

  return (
    <AdminPageShell active="/admin/alerts" title="Fraud Alerts" subtitle={`${alerts.length} total · ${unreadCount} unread`}>
      {/* Filter + actions row */}
      <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:20, flexWrap:"wrap" }}>
        {(["all","unread","fraud_block","fraud_challenge"] as const).map(f=>(
          <button key={f} id={`filter-${f}`} onClick={()=>setFilter(f)}
            style={{
              padding:"6px 14px", borderRadius:999, fontSize:11, fontWeight:600, cursor:"pointer",
              background:filter===f?"var(--admin-cyan)":"transparent",
              color:filter===f?"var(--admin-bg)":"var(--admin-dim)",
              border:filter===f?"none":"1px solid var(--admin-border)",
              fontFamily:"var(--font-ibm-plex-mono,monospace)", letterSpacing:"0.5px", textTransform:"uppercase",
              transition:"all .15s ease",
            }}>
            {FILTER_LABELS[f]}{f==="unread"&&unreadCount>0?` (${unreadCount})`:""}
          </button>
        ))}
        {unreadCount>0 && (
          <button id="btn-mark-all-read" onClick={handleMarkAllRead}
            style={{ padding:"6px 14px",borderRadius:999,fontSize:11,fontWeight:600,border:"1px solid var(--admin-border)",background:"transparent",color:"var(--admin-dim)",cursor:"pointer",marginLeft:"auto" }}>
            Mark all read
          </button>
        )}
      </div>

      {/* Two-col layout when drawer open */}
      <div style={{ display:"flex", gap:16 }}>
        {/* Alert list */}
        <div style={{ flex:drawerTxnId?"0 0 55%":"1", minWidth:0, transition:"flex .3s ease" }}>
          {loading && [1,2,3,4].map(i=><div key={i} style={{ height:72,borderRadius:12,background:"var(--admin-card)",marginBottom:8,animation:"sp-shimmer 1.4s ease-in-out infinite" }}/>)}
          {!loading && filtered.length===0 && (
            <div style={{ textAlign:"center",padding:"60px 0",color:"var(--admin-dim)",fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>
              <div style={{ fontSize:32,marginBottom:12 }}>✓</div>No alerts in this category
            </div>
          )}
          {!loading && filtered.map(alert=>(
            <AlertRow key={alert.id} alert={alert} onMarkRead={handleMarkRead} onOpenExplanation={handleOpenExplanation}/>
          ))}
        </div>

        {/* Explanation drawer */}
        {drawerTxnId && (
          <div style={{ flex:"0 0 45%", background:"var(--admin-card)", borderRadius:14, border:"1px solid var(--admin-border)", padding:20, overflowY:"auto", maxHeight:"80vh" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
              <span style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:11,letterSpacing:"1.5px",color:"var(--admin-cyan)",textTransform:"uppercase" }}>AI EXPLANATION</span>
              <button id="btn-close-drawer" onClick={()=>{setDrawerTxnId(null);setExplanation(null);}}
                style={{ background:"none",border:"1px solid var(--admin-border)",borderRadius:6,padding:"4px 10px",color:"var(--admin-dim)",cursor:"pointer",fontSize:14 }}>✕</button>
            </div>
            {expLoading && <div style={{ textAlign:"center",padding:"40px 0",color:"var(--admin-dim)" }}>⟳ Loading SHAP analysis…</div>}
            {!expLoading && explanation && <ExplanationPanel data={explanation}/>}
            {!expLoading && !explanation && <div style={{ textAlign:"center",padding:"40px 0",color:"var(--admin-dim)",fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:13 }}>No explanation available.</div>}
            <div style={{ marginTop:16,textAlign:"center" }}>
              <button id="btn-view-full" onClick={()=>router.push(`/admin/cases/${drawerTxnId}`)}
                style={{ padding:"10px 20px",borderRadius:8,fontSize:13,fontWeight:600,border:"1px solid var(--admin-border)",background:"transparent",color:"var(--admin-cyan)",cursor:"pointer" }}>
                View Full Transaction →
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}
