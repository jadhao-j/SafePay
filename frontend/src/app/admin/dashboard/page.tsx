"use client";

/**
 * Admin Dashboard — v2 premium dark
 * SOC console: live feed (WebSocket), KPI bar, risk distribution chart, recent alerts.
 */

import { useEffect, useState } from "react";
import { fetchRiskDistribution, type RiskDistribution } from "@/lib/admin-api";
import { AdminKpiPanel } from "@/components/admin/AdminKpiPanel";
import { AdminSocShell } from "@/components/admin/AdminSocShell";
import { fetchAlerts, type FraudAlert } from "@/lib/fraud-api";
import Link from "next/link";

/* ─── Admin nav (shared across pages via inline for now) ─────────────── */
const NAV = [
  { href:"/admin/dashboard", label:"Overview",    icon:"◈" },
  { href:"/admin/cases",     label:"Cases",       icon:"⬡" },
  { href:"/admin/alerts",    label:"Alerts",      icon:"⚠" },
  { href:"/admin/users",     label:"Users",       icon:"◔" },
  { href:"/admin/heatmap",   label:"Heatmap",     icon:"▣" },
  { href:"/admin/devices",   label:"Devices",     icon:"📱" },
  { href:"/admin/merchants", label:"Merchants",   icon:"◈" },
  { href:"/admin/behavioral",label:"Behavioral",  icon:"⚡" },
  { href:"/admin/copilot",   label:"Copilot",     icon:"✦" },
];

function AdminSidebar({ active }: { active:string }): JSX.Element {
  return (
    <aside style={{
      width:200, flexShrink:0, background:"var(--admin-surface)", borderRight:"1px solid var(--admin-border)",
      padding:"28px 0", display:"flex", flexDirection:"column",
    }}>
      {/* Logo */}
      <div style={{ padding:"0 20px 28px", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:32, height:32, borderRadius:9, background:"conic-gradient(from 90deg,#7C5CFF,#39D2FF,#3DDC97,#7C5CFF)", display:"flex", alignItems:"center", justifyContent:"center", animation:"sp-spin 8s linear infinite", position:"relative", flexShrink:0 }}>
          <div style={{ position:"absolute", inset:2, borderRadius:7, background:"var(--admin-surface)" }}/>
          <span style={{ position:"relative", zIndex:1, fontSize:12, fontWeight:700, color:"#fff", fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>S</span>
        </div>
        <div>
          <p style={{ fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)", fontSize:13, fontWeight:700, color:"var(--admin-text)", margin:0, letterSpacing:"1px" }}>SAFEPAY</p>
          <p style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:8, color:"var(--admin-dim)", margin:0, letterSpacing:"1px" }}>SOC CONSOLE</p>
        </div>
      </div>
      {/* Nav links */}
      {NAV.map(n => (
        <Link key={n.href} href={n.href} style={{
          display:"flex", alignItems:"center", gap:10, padding:"10px 20px",
          textDecoration:"none",
          background: active===n.href ? "rgba(0,212,255,0.07)" : "transparent",
          borderLeft: `2px solid ${active===n.href ? "var(--admin-cyan)" : "transparent"}`,
          color: active===n.href ? "var(--admin-cyan)" : "var(--admin-dim)",
          fontSize:13, fontWeight:500, transition:"all .15s ease",
        }}>
          <span style={{ fontSize:12, width:16, textAlign:"center" }}>{n.icon}</span>
          {n.label}
        </Link>
      ))}
    </aside>
  );
}

function RiskBarChart({ data }: { data:RiskDistribution }): JSX.Element {
  const buckets = Object.entries(data.buckets);
  const max = Math.max(...buckets.map(([,v])=>v),1);
  function color(label:string): string {
    const s = parseFloat(label.split("-")[0]);
    if(s<0.3) return "var(--admin-green)"; if(s<0.7) return "var(--admin-amber)"; return "var(--admin-red)";
  }
  return (
    <section style={{ background:"var(--admin-card)", border:"1px solid var(--admin-border)", borderRadius:14, padding:20 }}>
      <h3 style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:11, letterSpacing:"1.5px", color:"var(--admin-cyan)", textTransform:"uppercase", margin:"0 0 20px" }}>RISK SCORE DISTRIBUTION</h3>
      <div style={{ display:"flex", gap:6, alignItems:"flex-end", height:80 }}>
        {buckets.map(([label, count])=>(
          <div key={label} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <div style={{ width:"100%", borderRadius:"4px 4px 0 0", background:color(label), height:`${(count/max)*100}%`, minHeight:count>0?4:0, transition:"height 0.8s ease" }}/>
            <span style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:8, color:"var(--admin-dim)", letterSpacing:"0.5px" }}>{label}</span>
          </div>
        ))}
      </div>
      <p style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:10, color:"var(--admin-dim)", margin:"14px 0 0" }}>
        TOTAL SCORED: {data.total_scored} · AVG RISK: {(data.avg_risk_score ?? 0).toFixed(3)}
      </p>
    </section>
  );
}

export default function AdminDashboardPage(): JSX.Element {
  const [riskData, setRiskData] = useState<RiskDistribution|null>(null);
  const [alerts, setAlerts]     = useState<FraudAlert[]>([]);

  useEffect(() => {
    fetchRiskDistribution().then(setRiskData).catch(()=>null);
    fetchAlerts().then(a=>setAlerts(a.slice(0,5))).catch(()=>null);
  }, []);

  const ALERT_COLOR: Record<string,string> = {
    fraud_block:"var(--admin-red)",
    fraud_challenge:"var(--admin-amber)",
    device_new:"var(--admin-cyan)",
    security_score_drop:"var(--admin-violet)",
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"var(--admin-bg)", fontFamily:"var(--font-dm-sans,'DM Sans',sans-serif)" }}>
      {/* Sidebar — hidden on mobile */}
      <div style={{ display:"none" }} className="admin-sidebar-wrap">
        <AdminSidebar active="/admin/dashboard"/>
      </div>
      <style>{`.admin-sidebar-wrap{display:flex!important}@media(max-width:768px){.admin-sidebar-wrap{display:none!important}}`}</style>

      <main style={{ flex:1, padding:"28px 28px 40px", overflowY:"auto", minWidth:0 }}>
        {/* Page header */}
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)", fontSize:22, fontWeight:700, color:"var(--admin-text)", margin:0 }}>Dashboard</h1>
          <p style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:11, color:"var(--admin-dim)", margin:"4px 0 0", letterSpacing:"0.08em" }}>FRAUD INTELLIGENCE OVERVIEW · LAST 24H</p>
        </div>

        {/* KPI row */}
        <div style={{ marginBottom:24 }}><AdminKpiPanel/></div>

        {/* Live feed + risk chart grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
          <AdminSocShell/>
          {riskData ? <RiskBarChart data={riskData}/> : (
            <div style={{ background:"var(--admin-card)", border:"1px solid var(--admin-border)", borderRadius:14, animation:"sp-shimmer 1.4s ease-in-out infinite" }}/>
          )}
        </div>

        {/* Recent alerts */}
        <section style={{ background:"var(--admin-card)", border:"1px solid var(--admin-border)", borderRadius:14, padding:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <h2 style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:11, letterSpacing:"1.5px", color:"var(--admin-cyan)", textTransform:"uppercase", margin:0 }}>RECENT ALERTS</h2>
            <Link href="/admin/alerts" style={{ fontSize:12, color:"var(--admin-cyan)", textDecoration:"none", fontWeight:600 }}>See all →</Link>
          </div>
          {alerts.map(a=>(
            <div key={a.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:"1px solid var(--admin-border)" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:ALERT_COLOR[a.type]??"var(--admin-dim)", flexShrink:0 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, color:"var(--admin-text)", margin:0, fontWeight:a.is_read?400:600 }}>{a.message}</p>
                <p style={{ fontSize:11, color:"var(--admin-dim)", margin:"2px 0 0", fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>
                  {new Date(a.created_at).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}
                </p>
              </div>
              {!a.is_read && <span style={{ fontSize:9, padding:"3px 8px", borderRadius:999, background:"rgba(239,68,68,0.1)", color:"var(--admin-red)", fontFamily:"var(--font-ibm-plex-mono,monospace)", fontWeight:700, letterSpacing:"0.06em" }}>NEW</span>}
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}