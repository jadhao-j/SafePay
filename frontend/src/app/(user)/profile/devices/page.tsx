"use client";

/**
 * Trusted Devices Page — Screen 18 (v2 premium dark)
 * Device list with trust bars, last-seen, 2-step revoke confirm.
 * DELETE /users/me/devices/{id}
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";

interface Device {
  id:string; device_name:string|null; os_signature:string|null;
  ip_address:string|null; is_trusted:boolean; trust_score:number; last_active_at:string|null;
}

function TrustBar({ score }: { score:number }): JSX.Element {
  const [w, setW] = useState(0);
  const color = score>=70?"#3DDC97":score>=40?"#FFB84D":"#FF5C5C";
  useEffect(()=>{ const t=setTimeout(()=>setW(Math.min(score,100)),120); return()=>clearTimeout(t); },[score]);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, height:5, borderRadius:999, background:"rgba(255,255,255,0.08)", overflow:"hidden" }}>
        <div style={{ height:"100%", borderRadius:999, background:color, width:`${w}%`, transition:"width 0.7s cubic-bezier(0.34,1.56,0.64,1)" }}/>
      </div>
      <span style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:11, color, fontWeight:700, minWidth:28 }}>{score}</span>
    </div>
  );
}

export default function DevicesPage(): JSX.Element {
  const router = useRouter();
  const [devices, setDevices]     = useState<Device[]>([]);
  const [loading, setLoading]     = useState(true);
  const [revokeId, setRevokeId]   = useState<string|null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError]         = useState<string|null>(null);

  useEffect(() => {
    apiClient.get<Device[]>("/users/me/devices")
      .then(r=>setDevices(r.data)).catch(()=>null).finally(()=>setLoading(false));
  }, []);

  async function handleRevoke(id:string): Promise<void> {
    setConfirming(true); setError(null);
    try {
      await apiClient.delete(`/users/me/devices/${id}`);
      setDevices(d=>d.filter(x=>x.id!==id));
      setRevokeId(null);
    } catch { setError("Failed to revoke. Try again."); }
    finally { setConfirming(false); }
  }

  function osIcon(sig:string|null): string {
    if(!sig) return "📱";
    const s=sig.toLowerCase();
    if(s.includes("android")) return "🤖";
    if(s.includes("ios")||s.includes("iphone")) return "🍎";
    if(s.includes("windows")) return "🪟";
    if(s.includes("mac")) return "🖥";
    return "📱";
  }

  return (
    <div style={{ minHeight:"100vh", background:"#050608", color:"#F5F6F8", fontFamily:"var(--font-dm-sans,'DM Sans',sans-serif)" }}>
      {/* Header */}
      <div style={{ padding:"28px 24px 0", display:"flex", alignItems:"center", gap:14 }}>
        <button onClick={()=>router.push("/profile")} aria-label="Back"
          style={{ width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",color:"rgba(255,255,255,.7)",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>←</button>
        <div>
          <h1 style={{ fontSize:20,fontWeight:700,color:"#F5F6F8",margin:0,fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>Trusted Devices</h1>
          <p style={{ fontSize:11,color:"rgba(255,255,255,.4)",margin:"2px 0 0",fontFamily:"var(--font-ibm-plex-mono,monospace)",letterSpacing:"0.08em" }}>{devices.length} DEVICE{devices.length!==1?"S":""} LINKED</p>
        </div>
      </div>

      <div style={{ padding:"24px 20px 32px", maxWidth:480, margin:"0 auto" }}>
        {/* Info banner */}
        <div style={{ background:"rgba(124,92,255,0.06)",border:"1px solid rgba(124,92,255,0.18)",borderRadius:14,padding:"14px 18px",marginBottom:20,display:"flex",gap:10,alignItems:"flex-start" }}>
          <span style={{ color:"#7C5CFF",flexShrink:0 }}>◎</span>
          <p style={{ fontSize:12,color:"rgba(255,255,255,.55)",margin:0,lineHeight:1.5 }}>
            Devices you have logged into. Revoking a device signs it out immediately.
          </p>
        </div>

        {loading && [1,2,3].map(i=>(
          <div key={i} style={{ height:90,borderRadius:16,background:"rgba(255,255,255,0.04)",marginBottom:10,animation:"sp-shimmer 1.4s ease-in-out infinite" }}/>
        ))}

        {!loading && devices.length===0 && (
          <div style={{ textAlign:"center",padding:"40px 20px" }}>
            <div style={{ fontSize:32,opacity:0.3,marginBottom:8 }}>📱</div>
            <p style={{ color:"#6B7180",fontSize:13,margin:0 }}>No devices found</p>
          </div>
        )}

        {!loading && devices.map(device => {
          const score = Math.round(device.trust_score*100);
          const active = device.last_active_at ? new Date(device.last_active_at).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "Never";
          return (
            <div key={device.id} style={{
              background:"rgba(255,255,255,0.04)", borderRadius:16, border:`1px solid ${revokeId===device.id?"rgba(255,92,92,0.3)":"rgba(255,255,255,0.07)"}`,
              padding:"18px 20px", marginBottom:10, transition:"border-color .2s ease",
            }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
                {/* OS icon */}
                <div style={{ width:44,height:44,borderRadius:12,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>
                  {osIcon(device.os_signature)}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8 }}>
                    <div>
                      <p style={{ fontSize:14,fontWeight:600,color:"#F5F6F8",margin:0 }}>{device.device_name??"Unknown Device"}</p>
                      <p style={{ fontSize:11,color:"#6B7180",margin:"2px 0 0",fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>{device.os_signature??"Unknown OS"}</p>
                    </div>
                    {device.is_trusted && (
                      <span style={{ fontSize:9,fontWeight:700,padding:"3px 9px",borderRadius:999,background:"rgba(61,220,151,0.1)",color:"#3DDC97",fontFamily:"var(--font-ibm-plex-mono,monospace)",letterSpacing:"0.06em",flexShrink:0 }}>TRUSTED</span>
                    )}
                  </div>
                  <div style={{ margin:"12px 0 8px" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
                      <span style={{ fontSize:11,color:"rgba(255,255,255,.4)",fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>TRUST SCORE</span>
                      <span style={{ fontSize:11,color:"#6B7180",fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>Last: {active}</span>
                    </div>
                    <TrustBar score={score}/>
                  </div>
                  {device.ip_address && (
                    <p style={{ fontSize:11,color:"rgba(255,255,255,.3)",margin:0,fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>IP: {device.ip_address}</p>
                  )}
                </div>
              </div>

              {/* Revoke */}
              {revokeId===device.id ? (
                <div style={{ marginTop:14,background:"rgba(255,92,92,0.08)",border:"1px solid rgba(255,92,92,0.2)",borderRadius:12,padding:"14px 16px" }}>
                  <p style={{ fontSize:13,color:"#FF5C5C",margin:"0 0 12px",fontWeight:600 }}>Revoke this device?</p>
                  {error && <p style={{ fontSize:12,color:"#FF5C5C",margin:"0 0 10px" }}>{error}</p>}
                  <div style={{ display:"flex",gap:8 }}>
                    <button onClick={()=>void handleRevoke(device.id)} disabled={confirming}
                      style={{ flex:1,padding:"10px 8px",borderRadius:10,border:"none",background:"#FF5C5C",color:"#fff",fontWeight:700,fontSize:13,cursor:confirming?"not-allowed":"pointer" }}>
                      {confirming?"Revoking…":"Yes, Revoke"}
                    </button>
                    <button onClick={()=>{ setRevokeId(null); setError(null); }}
                      style={{ flex:1,padding:"10px 8px",borderRadius:10,border:"1px solid rgba(255,255,255,0.12)",background:"transparent",color:"rgba(255,255,255,0.6)",fontSize:13,cursor:"pointer" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button id={`btn-revoke-${device.id}`} onClick={()=>setRevokeId(device.id)}
                  style={{ marginTop:12,width:"100%",padding:"9px",borderRadius:10,border:"1px solid rgba(255,92,92,0.3)",background:"rgba(255,92,92,0.06)",color:"#FF5C5C",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .15s ease" }}
                  onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background="rgba(255,92,92,0.12)"}
                  onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background="rgba(255,92,92,0.06)"}>
                  Revoke Device
                </button>
              )}
            </div>
          );
        })}
      </div>
      <style>{`@keyframes sp-shimmer{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>
    </div>
  );
}
