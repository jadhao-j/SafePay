"use client";

/**
 * Admin Devices Page — v2 premium dark
 * Global device intelligence table: all devices, trust scores, filter by untrusted.
 */

import { useEffect, useState } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { fetchDevices, type AdminDevice } from "@/lib/admin-api";

function TrustBar({ score }: { score:number }): JSX.Element {
  const pct = Math.min(100,Math.max(0,score));
  const c = pct>=70?"var(--admin-green)":pct>=40?"var(--admin-amber)":"var(--admin-red)";
  return (
    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
      <div style={{ height:5,width:90,borderRadius:999,background:"var(--admin-border)",overflow:"hidden" }}>
        <div style={{ width:`${pct}%`,height:"100%",background:c,borderRadius:999,transition:"width .5s ease" }}/>
      </div>
      <span style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:11,color:c,fontWeight:700 }}>{pct.toFixed(0)}</span>
    </div>
  );
}

export default function AdminDevicesPage(): JSX.Element {
  const [devices, setDevices]       = useState<AdminDevice[]>([]);
  const [error, setError]           = useState<string|null>(null);
  const [untrustedOnly, setUntrustedOnly] = useState(false);

  useEffect(() => {
    fetchDevices(untrustedOnly).then(setDevices).catch(()=>setError("Could not load device data."));
  }, [untrustedOnly]);

  return (
    <AdminPageShell active="/admin/devices" title="Device Intelligence" subtitle={`${devices.length} devices · ordered by trust score`}>
      {/* Filter pills */}
      <div style={{ display:"flex",gap:8,marginBottom:20 }}>
        {[
          { label:"All Devices",    value:false, activeC:"var(--admin-cyan)" },
          { label:"Untrusted Only", value:true,  activeC:"var(--admin-red)"  },
        ].map(f=>(
          <button key={String(f.value)} onClick={()=>setUntrustedOnly(f.value)}
            style={{
              fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",
              padding:"6px 16px",borderRadius:6,cursor:"pointer",
              border:`1px solid ${untrustedOnly===f.value?f.activeC:"var(--admin-border)"}`,
              background:untrustedOnly===f.value?`${f.activeC}15`:"transparent",
              color:untrustedOnly===f.value?f.activeC:"var(--admin-dim)",
              transition:"all .15s ease",
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {error && <div style={{ background:"rgba(239,68,68,0.08)",border:"1px solid var(--admin-red)",borderRadius:10,padding:"12px 16px",color:"var(--admin-red)",fontSize:13,marginBottom:16 }}>{error}</div>}

      <div style={{ background:"var(--admin-card)",border:"1px solid var(--admin-border)",borderRadius:14,overflow:"auto" }}>
        <table style={{ width:"100%",borderCollapse:"collapse" }}>
          <thead>
            <tr>{["Device","OS / IP","Trust Score","Status","Last Active","User ID"].map(h=>(
              <th key={h} style={{ padding:"12px 16px",textAlign:"left",borderBottom:"1px solid var(--admin-border)",fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:10,color:"var(--admin-dim)",textTransform:"uppercase",letterSpacing:"0.1em" }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {devices.map(d=>(
              <tr key={d.id} style={{ borderBottom:"1px solid var(--admin-border)",transition:"background .12s ease" }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.02)"}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}>
                <td style={{ padding:"12px 16px" }}>
                  <p style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:12,color:"var(--admin-text)",margin:0 }}>{d.device_name??"Unknown"}</p>
                  <p style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:10,color:"var(--admin-dim)",margin:"2px 0 0" }}>{d.id.slice(0,8)}…</p>
                </td>
                <td style={{ padding:"12px 16px" }}>
                  <p style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:11,color:"var(--admin-text)",margin:0 }}>{d.os_signature??"—"}</p>
                  <p style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:10,color:"var(--admin-dim)",margin:"2px 0 0" }}>{d.ip_address??"—"}</p>
                </td>
                <td style={{ padding:"12px 16px" }}><TrustBar score={d.trust_score}/></td>
                <td style={{ padding:"12px 16px" }}>
                  <span style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:10,color:d.is_trusted?"var(--admin-green)":"var(--admin-red)",border:`1px solid ${d.is_trusted?"var(--admin-green)":"var(--admin-red)"}`,borderRadius:999,padding:"3px 10px",letterSpacing:"0.06em" }}>
                    {d.is_trusted?"TRUSTED":"UNTRUSTED"}
                  </span>
                </td>
                <td style={{ padding:"12px 16px",fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:11,color:"var(--admin-dim)" }}>
                  {d.last_active_at?new Date(d.last_active_at).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}):"—"}
                </td>
                <td style={{ padding:"12px 16px",fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:10,color:"var(--admin-dim)" }}>{d.user_id.slice(0,8)}…</td>
              </tr>
            ))}
            {devices.length===0 && (
              <tr><td colSpan={6} style={{ padding:"40px",textAlign:"center",fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:13,color:"var(--admin-dim)" }}>No devices found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminPageShell>
  );
}