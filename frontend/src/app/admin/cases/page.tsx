"use client";

/**
 * Admin Cases Page — v2 premium dark
 * Investigation case queue. Opens cases from fraud alerts.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import CaseStatusBadge, { type CaseStatus } from "@/components/admin/CaseStatusBadge";
import { fetchAlerts, openCase, type FraudAlert } from "@/lib/fraud-api";

interface CaseStub {
  caseId:string; transactionId:string; status:CaseStatus;
  alertType:string; message:string; createdAt:string;
}

function fmt(iso:string): string { return new Date(iso).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}); }

export default function AdminCasesPage(): JSX.Element {
  const [alerts, setAlerts]     = useState<FraudAlert[]>([]);
  const [cases, setCases]       = useState<CaseStub[]>([]);
  const [loading, setLoading]   = useState(true);
  const [openingFor, setOpeningFor] = useState<string|null>(null);
  const router = useRouter();

  useEffect(() => { fetchAlerts().then(setAlerts).catch(()=>setAlerts([])).finally(()=>setLoading(false)); }, []);

  async function handleOpenCase(alert:FraudAlert): Promise<void> {
    if(!alert.transaction_id) return;
    setOpeningFor(alert.id);
    try {
      const result = await openCase(alert.transaction_id, `Opened from admin alerts. Alert type: ${alert.type}.`);
      setCases(prev=>[{ caseId:result.case_id, transactionId:alert.transaction_id!, status:"open" as CaseStatus, alertType:alert.type, message:alert.message, createdAt:new Date().toISOString() }, ...prev]);
    } catch { /* silent */ } finally { setOpeningFor(null); }
  }

  const fraudAlerts = alerts.filter(a=>a.type==="fraud_block"||a.type==="fraud_challenge");

  return (
    <AdminPageShell active="/admin/cases" title="Case Management" subtitle={`Investigation queue · ${cases.length} active cases`}>
      {/* Active cases */}
      {cases.length>0 && (
        <section style={{ marginBottom:32 }}>
          <p style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:11, letterSpacing:"1.5px", color:"var(--admin-cyan)", textTransform:"uppercase", margin:"0 0 14px" }}>● ACTIVE CASES</p>
          <div style={{ background:"var(--admin-surface)", border:"1px solid var(--admin-border)", borderRadius:14, overflow:"hidden" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr 140px 130px 40px", padding:"10px 20px", borderBottom:"1px solid var(--admin-border)", fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:10, letterSpacing:"1px", textTransform:"uppercase", color:"var(--admin-dim)" }}>
              <span>Case ID</span><span>Transaction</span><span>Status</span><span>Opened</span><span/>
            </div>
            {cases.map(c=>(
              <div key={c.caseId} id={`case-row-${c.caseId}`}
                onClick={()=>router.push(`/admin/cases/${c.caseId}`)}
                style={{ display:"grid", gridTemplateColumns:"1fr 2fr 140px 130px 40px", padding:"14px 20px", borderBottom:"1px solid var(--admin-border)", alignItems:"center", cursor:"pointer", transition:"background .15s ease" }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="rgba(0,212,255,0.04)"}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}>
                <span style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:12, color:"var(--admin-cyan)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.caseId.slice(0,8)}…</span>
                <span style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:11, color:"var(--admin-dim)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.transactionId}</span>
                <CaseStatusBadge status={c.status} size="sm"/>
                <span style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:11, color:"var(--admin-dim)" }}>{fmt(c.createdAt)}</span>
                <span style={{ fontSize:20, color:"var(--admin-dim)" }}>›</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Alert queue */}
      <section>
        <p style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:11, letterSpacing:"1.5px", color:"var(--admin-dim)", textTransform:"uppercase", margin:"0 0 14px" }}>FLAGGED TRANSACTIONS — OPEN FOR INVESTIGATION</p>

        {loading && [1,2,3].map(i=><div key={i} style={{ height:72, borderRadius:12, background:"var(--admin-card)", marginBottom:10, animation:"sp-shimmer 1.4s ease-in-out infinite" }}/>)}

        {!loading && fraudAlerts.length===0 && (
          <div style={{ background:"var(--admin-surface)", border:"1px dashed var(--admin-border)", borderRadius:12, padding:48, textAlign:"center", color:"var(--admin-dim)", fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:13 }}>
            <div style={{ fontSize:32, marginBottom:12 }}>✓</div>No flagged transactions requiring investigation.
          </div>
        )}

        {!loading && fraudAlerts.map(alert=>{
          const isBlock = alert.type==="fraud_block";
          const alreadyOpen = cases.some(c=>c.transactionId===alert.transaction_id);
          return (
            <div key={alert.id} style={{
              background:"var(--admin-surface)",
              border:`1px solid ${isBlock?"rgba(239,68,68,0.25)":"rgba(245,158,11,0.2)"}`,
              borderLeft:`4px solid ${isBlock?"var(--admin-red)":"var(--admin-amber)"}`,
              borderRadius:12, padding:"16px 20px", marginBottom:10,
              display:"flex", alignItems:"center", gap:16,
            }}>
              <span style={{ padding:"4px 10px", borderRadius:999, fontSize:10, fontWeight:700, letterSpacing:"1px",
                background:isBlock?"rgba(239,68,68,0.15)":"rgba(245,158,11,0.15)",
                color:isBlock?"var(--admin-red)":"var(--admin-amber)",
                flexShrink:0, fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>
                {isBlock?"BLOCKED":"CHALLENGED"}
              </span>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, color:"var(--admin-text)", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{alert.message}</p>
                {alert.transaction_id && <p style={{ fontSize:11, fontFamily:"var(--font-ibm-plex-mono,monospace)", color:"var(--admin-dim)", margin:"3px 0 0" }}>{alert.transaction_id}</p>}
              </div>
              <span style={{ fontSize:11, color:"var(--admin-dim)", fontFamily:"var(--font-ibm-plex-mono,monospace)", flexShrink:0 }}>{fmt(alert.created_at)}</span>
              <button id={`open-case-${alert.id}`} onClick={()=>void handleOpenCase(alert)} disabled={alreadyOpen||openingFor===alert.id}
                style={{
                  padding:"7px 16px", borderRadius:8, fontSize:12, fontWeight:700, border:"none", flexShrink:0,
                  background:alreadyOpen?"rgba(16,185,129,0.15)":"linear-gradient(135deg,#EF4444,#8B5CF6)",
                  color:alreadyOpen?"var(--admin-green)":"#fff",
                  cursor:alreadyOpen||openingFor===alert.id?"not-allowed":"pointer",
                  opacity:openingFor===alert.id?.7:1,
                }}>
                {alreadyOpen?"✓ Case Open":openingFor===alert.id?"Opening…":"Open Case"}
              </button>
            </div>
          );
        })}
      </section>
    </AdminPageShell>
  );
}
