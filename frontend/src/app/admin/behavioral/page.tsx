"use client";

/**
 * Admin Behavioral Analytics Page — v2 premium dark
 * Trust score distribution, event type breakdown, high-risk users table.
 */

import { useEffect, useState } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { fetchBehavioralAnalytics, type BehavioralStats } from "@/lib/admin-api";

const TRUST_COLORS: Record<string,string> = {
  "0-25":"var(--admin-red)", "25-50":"var(--admin-amber)",
  "50-75":"var(--admin-blue)", "75-100":"var(--admin-green)",
};
const EVENT_COLORS = ["var(--admin-cyan)","var(--admin-violet)","var(--admin-amber)"];

function HBar({ label, value, max, color }: { label:string; value:number; max:number; color:string }): JSX.Element {
  const pct = max>0?(value/max)*100:0;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
      <span style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:11, color:"var(--admin-text)", width:80, textAlign:"right", flexShrink:0 }}>{label}</span>
      <div style={{ flex:1, height:22, borderRadius:4, background:"var(--admin-border)", overflow:"hidden", position:"relative" }}>
        <div style={{ height:"100%", borderRadius:4, background:color, width:`${Math.max(pct,value>0?2:0)}%`, transition:"width .7s ease" }}/>
      </div>
      <span style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:11, color, width:40, flexShrink:0 }}>{value}</span>
    </div>
  );
}

function StatCard({ label, value, color="var(--admin-cyan)" }: { label:string; value:string; color?:string }): JSX.Element {
  return (
    <div style={{ background:"var(--admin-card)", border:"1px solid var(--admin-border)", borderRadius:12, padding:"18px 20px" }}>
      <p style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--admin-dim)", margin:"0 0 8px" }}>{label}</p>
      <p style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:32, fontWeight:700, color, margin:0, lineHeight:1 }}>{value}</p>
    </div>
  );
}

export default function AdminBehavioralPage(): JSX.Element {
  const [data, setData]       = useState<BehavioralStats|null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string|null>(null);

  useEffect(() => {
    fetchBehavioralAnalytics().then(d=>{setData(d);setLoading(false);})
      .catch(()=>{setError("Could not load behavioral analytics.");setLoading(false);});
  }, []);

  const trustEntries = data ? Object.entries(data.trust_score_buckets) : [];
  const eventEntries = data ? Object.entries(data.event_type_breakdown) : [];
  const maxTrust = Math.max(...trustEntries.map(([,v])=>v),1);
  const maxEvent = Math.max(...eventEntries.map(([,v])=>v),1);

  return (
    <AdminPageShell active="/admin/behavioral" title="Behavioral Analytics" subtitle="Trust score distribution · event type breakdown">
      {error && <div style={{ background:"rgba(239,68,68,0.08)",border:"1px solid var(--admin-red)",borderRadius:10,padding:"12px 16px",color:"var(--admin-red)",fontSize:13,marginBottom:20 }}>{error}</div>}

      {loading && !error && (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12,marginBottom:24 }}>
          {[1,2,3,4].map(i=><div key={i} style={{ height:80,borderRadius:12,background:"var(--admin-card)",animation:"sp-shimmer 1.4s ease-in-out infinite" }}/>)}
        </div>
      )}

      {data && (
        <>
          {/* KPI row */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12, marginBottom:24 }}>
            <StatCard label="Users w/ Events" value={String(data.total_users_with_events)}/>
            <StatCard label="Avg Trust Score" value={data.avg_trust_score.toFixed(1)}
              color={data.avg_trust_score>=70?"var(--admin-green)":data.avg_trust_score>=40?"var(--admin-amber)":"var(--admin-red)"}/>
            <StatCard label="High-Risk Users" value={String(data.high_risk_users.length)}
              color={data.high_risk_users.length>0?"var(--admin-red)":"var(--admin-green)"}/>
            <StatCard label="Event Types" value={String(Object.keys(data.event_type_breakdown).length)} color="var(--admin-violet)"/>
          </div>

          {/* Charts 2-col */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
            {/* Trust distribution */}
            <div style={{ background:"var(--admin-card)",border:"1px solid var(--admin-border)",borderRadius:14,padding:20 }}>
              <h2 style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--admin-cyan)",margin:"0 0 18px" }}>Trust Score Distribution</h2>
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {trustEntries.map(([l,c])=><HBar key={l} label={l} value={c} max={maxTrust} color={TRUST_COLORS[l]??"var(--admin-text)"}/>)}
                {trustEntries.length===0 && <p style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:12,color:"var(--admin-dim)" }}>No events recorded yet.</p>}
              </div>
              <div style={{ display:"flex",gap:12,flexWrap:"wrap",marginTop:14 }}>
                {trustEntries.map(([l])=>(
                  <div key={l} style={{ display:"flex",gap:5,alignItems:"center" }}>
                    <div style={{ width:8,height:8,borderRadius:2,background:TRUST_COLORS[l] }}/>
                    <span style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:9,color:"var(--admin-dim)" }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Event breakdown */}
            <div style={{ background:"var(--admin-card)",border:"1px solid var(--admin-border)",borderRadius:14,padding:20 }}>
              <h2 style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--admin-cyan)",margin:"0 0 18px" }}>Telemetry Event Breakdown</h2>
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {eventEntries.map(([t,c],i)=><HBar key={t} label={t} value={c} max={maxEvent} color={EVENT_COLORS[i%EVENT_COLORS.length]}/>)}
                {eventEntries.length===0 && <p style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:12,color:"var(--admin-dim)" }}>No events recorded yet.</p>}
              </div>
              {eventEntries.length>0 && (
                <div style={{ display:"flex",gap:12,flexWrap:"wrap",marginTop:14 }}>
                  {eventEntries.map(([t,c],i)=>{
                    const total=eventEntries.reduce((a,[,v])=>a+v,0);
                    return (
                      <div key={t} style={{ display:"flex",gap:5,alignItems:"center" }}>
                        <div style={{ width:8,height:8,borderRadius:2,background:EVENT_COLORS[i%EVENT_COLORS.length] }}/>
                        <span style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:9,color:"var(--admin-dim)" }}>{t} {total>0?((c/total)*100).toFixed(1):0}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* High risk users */}
          {data.high_risk_users.length>0 ? (
            <div style={{ background:"var(--admin-card)",border:"1px solid var(--admin-red)",borderRadius:14,padding:20 }}>
              <h2 style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--admin-red)",margin:"0 0 16px" }}>⚠ High-Risk Users (avg trust &lt;40, ≥5 events)</h2>
              <table style={{ width:"100%",borderCollapse:"collapse" }}>
                <thead>
                  <tr>{["User ID","Avg Trust Score","Event Count"].map(h=><th key={h} style={{ padding:"8px 12px",textAlign:"left",borderBottom:"1px solid var(--admin-border)",fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:10,color:"var(--admin-dim)",textTransform:"uppercase",letterSpacing:"0.1em" }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {data.high_risk_users.map(u=>(
                    <tr key={u.user_id} style={{ borderBottom:"1px solid var(--admin-border)" }}>
                      <td style={{ padding:"10px 12px",fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:11,color:"var(--admin-dim)" }}>{u.user_id.slice(0,12)}…</td>
                      <td style={{ padding:"10px 12px",fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:13,fontWeight:700,color:"var(--admin-red)" }}>{u.avg_trust_score.toFixed(1)}</td>
                      <td style={{ padding:"10px 12px",fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:12,color:"var(--admin-text)" }}>{u.event_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ background:"rgba(16,185,129,0.05)",border:"1px solid var(--admin-green)",borderRadius:14,padding:20,display:"flex",gap:12,alignItems:"center" }}>
              <span style={{ fontSize:20 }}>✓</span>
              <span style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:13,color:"var(--admin-green)" }}>No high-risk users detected.</span>
            </div>
          )}
        </>
      )}
    </AdminPageShell>
  );
}
