"use client";

/**
 * Admin Heatmap Page — v2 premium dark
 * Decision distribution by payment type, avg risk color-coded, time-window selector.
 */

import { useEffect, useState } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { fetchHeatmap, type HeatmapData } from "@/lib/admin-api";

const DECISIONS = ["approve","challenge","block"];
const DC: Record<string,string> = { approve:"var(--admin-green)", challenge:"var(--admin-amber)", block:"var(--admin-red)" };
function riskBg(r:number): string { if(r<0.3) return "#10B98122"; if(r<0.7) return "#F59E0B33"; return "#EF444444"; }
function riskBorder(r:number): string { if(r<0.3) return "var(--admin-green)"; if(r<0.7) return "var(--admin-amber)"; return "var(--admin-red)"; }

export default function AdminHeatmapPage(): JSX.Element {
  const [data, setData]     = useState<HeatmapData|null>(null);
  const [error, setError]   = useState<string|null>(null);
  const [win, setWin]       = useState("24h");

  useEffect(() => { setData(null); fetchHeatmap(win).then(setData).catch(()=>setError("Could not load heatmap.")); }, [win]);

  const payTypes = data ? Object.keys(data.heatmap) : [];

  return (
    <AdminPageShell active="/admin/heatmap" title="Fraud Heatmap" subtitle="Decision distribution by payment type · avg risk color-coded">
      {/* Window pills */}
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        {["1h","24h","7d"].map(w=>(
          <button key={w} onClick={()=>setWin(w)}
            style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",padding:"6px 16px",borderRadius:6,border:`1px solid ${w===win?"var(--admin-cyan)":"var(--admin-border)"}`,background:w===win?"rgba(0,212,255,0.08)":"transparent",color:w===win?"var(--admin-cyan)":"var(--admin-dim)",cursor:"pointer" }}>
            {w}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display:"flex",gap:16,alignItems:"center",marginBottom:16,flexWrap:"wrap" }}>
        <span style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:11,color:"var(--admin-dim)" }}>Cell: count / avg_risk</span>
        {["Low risk (<0.3)","Medium (0.3–0.7)","High (>0.7)"].map((l,i)=>(
          <div key={l} style={{ display:"flex",alignItems:"center",gap:6 }}>
            <div style={{ width:10,height:10,borderRadius:3,background:["var(--admin-green)","var(--admin-amber)","var(--admin-red)"][i],opacity:.7 }}/>
            <span style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:11,color:"var(--admin-dim)" }}>{l}</span>
          </div>
        ))}
      </div>

      {error && <div style={{ background:"rgba(239,68,68,0.08)",border:"1px solid var(--admin-red)",borderRadius:10,padding:"12px 16px",color:"var(--admin-red)",fontSize:13,marginBottom:16 }}>{error}</div>}

      {!data && !error && (
        <div style={{ height:200,borderRadius:14,background:"var(--admin-card)",animation:"sp-shimmer 1.4s ease-in-out infinite" }}/>
      )}

      {data && (
        <div style={{ background:"var(--admin-card)",border:"1px solid var(--admin-border)",borderRadius:14,overflow:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead>
              <tr>
                <th style={{ borderBottom:"1px solid var(--admin-border)",borderRight:"1px solid var(--admin-border)",padding:"12px 16px",textAlign:"left",fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:10,color:"var(--admin-dim)",textTransform:"uppercase",letterSpacing:"0.1em" }}>Payment Type</th>
                {DECISIONS.map(d=>(
                  <th key={d} style={{ borderBottom:"1px solid var(--admin-border)",padding:"12px 16px",textAlign:"center",fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:10,color:DC[d],textTransform:"uppercase",letterSpacing:"0.1em" }}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payTypes.map(pt=>(
                <tr key={pt}>
                  <td style={{ borderBottom:"1px solid var(--admin-border)",borderRight:"1px solid var(--admin-border)",padding:"12px 16px",fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:12,color:"var(--admin-text)",textTransform:"uppercase" }}>{pt}</td>
                  {DECISIONS.map(d=>{
                    const cell = data.heatmap[pt]?.[d];
                    return (
                      <td key={d} style={{ borderBottom:"1px solid var(--admin-border)",padding:"12px 16px",textAlign:"center",background:cell?riskBg(cell.avg_risk):"transparent",borderLeft:cell?`2px solid ${riskBorder(cell.avg_risk)}`:"none" }}>
                        {cell ? (
                          <>
                            <div style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:20,fontWeight:700,color:DC[d] }}>{cell.count}</div>
                            <div style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:10,color:"var(--admin-dim)",marginTop:2 }}>avg {cell.avg_risk.toFixed(2)}</div>
                          </>
                        ) : <span style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:11,color:"var(--admin-border)" }}>—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {payTypes.length===0 && (
                <tr><td colSpan={4} style={{ padding:"40px",textAlign:"center",fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:13,color:"var(--admin-dim)" }}>No scored transactions in window.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminPageShell>
  );
}