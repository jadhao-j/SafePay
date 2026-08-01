"use client";

/**
 * AdminKpiPanel — v2 premium dark (pure inline styles, no Tailwind dependency)
 * Six KPI cards on --admin-card surface.
 */

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";

interface OverviewData {
  window:string; total_transactions:number; scored_transactions:number;
  approved_count:number; challenged_count:number; blocked_count:number;
  fraud_rate:number; avg_risk_score:number;
}

function KpiCard({ label, value, accent }: { label:string; value:string; accent:string }): JSX.Element {
  return (
    <div style={{ background:"var(--admin-card)", border:"1px solid var(--admin-border)", borderRadius:12, padding:"16px 18px" }}>
      <p style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:10, letterSpacing:"1.5px", color:"var(--admin-dim)", textTransform:"uppercase", margin:"0 0 8px" }}>{label}</p>
      <p style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:28, fontWeight:700, color:accent, margin:0, lineHeight:1 }}>{value}</p>
    </div>
  );
}

export function AdminKpiPanel(): JSX.Element {
  const [data, setData]   = useState<OverviewData|null>(null);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    apiClient.get<OverviewData>("/admin/dashboard/overview",{ params:{ window:"24h" } })
      .then(r=>setData(r.data)).catch(()=>setError("Could not load overview KPIs."));
  }, []);

  if (error) return (
    <section style={{ background:"var(--admin-card)", border:"1px solid var(--admin-border)", borderRadius:12, padding:16, color:"var(--admin-red)" }}>{error}</section>
  );

  if (!data) return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:12 }}>
      {[1,2,3,4,5,6].map(i=>(
        <div key={i} style={{ height:72, borderRadius:12, background:"var(--admin-card)", animation:"sp-shimmer 1.4s ease-in-out infinite" }}/>
      ))}
    </div>
  );

  const kpis = [
    { label:"Total Txns",   value:String(data.total_transactions),           accent:"var(--admin-text)" },
    { label:"Scored",       value:String(data.scored_transactions),           accent:"var(--admin-text)" },
    { label:"Approved",     value:String(data.approved_count),                accent:"var(--admin-green)" },
    { label:"Challenged",   value:String(data.challenged_count),              accent:"var(--admin-amber)" },
    { label:"Blocked",      value:String(data.blocked_count),                 accent:"var(--admin-red)" },
    { label:"Fraud Rate",   value:`${(data.fraud_rate*100).toFixed(1)}%`,    accent:"var(--admin-violet)" },
  ];

  return (
    <section>
      <h3 style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:11, letterSpacing:"1.5px", color:"var(--admin-cyan)", textTransform:"uppercase", margin:"0 0 14px" }}>
        OVERVIEW — LAST {data.window.toUpperCase()}
      </h3>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:12 }}>
        {kpis.map(k=><KpiCard key={k.label} {...k}/>)}
      </div>
    </section>
  );
}