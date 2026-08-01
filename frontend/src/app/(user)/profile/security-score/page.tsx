"use client";

/**
 * Security Score Page — Screen 19 (v2 premium dark)
 * Animated conic-gradient ring, factor breakdown bars, tips.
 * GET /users/me/security-score + GET /behavior/trust-score
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";

interface SecurityData {
  security_score: number; behavioral_trust_score: number;
  baseline_established: boolean; event_count: number;
}

const TIPS: { threshold:number; tips:string[] }[] = [
  { threshold:0,  tips:["Verify your account with OTP","Add a phone number","Enable MFA","Use the app regularly (20+ events build your baseline)"] },
  { threshold:40, tips:["Enable MFA on your account","Use the app regularly to build a behavioral baseline","Revoke any suspicious devices"] },
  { threshold:70, tips:["Your account security is strong 🎉","Continue using the app regularly","Review trusted devices periodically"] },
];
function getTips(score:number): string[] {
  return ([...TIPS].reverse().find(t=>score>=t.threshold)??TIPS[0]).tips;
}

const FACTORS = [
  { key:"account_verified",  label:"Account Verified",   icon:"✓", weight:25 },
  { key:"mfa_enabled",       label:"MFA Enabled",        icon:"🔒", weight:20 },
  { key:"behavioral_trust",  label:"Behavioral Trust",   icon:"⚡", weight:35 },
  { key:"device_trust",      label:"Device Trust",       icon:"📱", weight:20 },
];

function ScoreRing({ score }: { score:number }): JSX.Element {
  const [animScore, setAnimScore] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const p = Math.min((Date.now()-start)/1000,1);
      setAnimScore(Math.round(score*(1-Math.pow(1-p,3))));
      if(p>=1) clearInterval(timer);
    },16);
    return ()=>clearInterval(timer);
  }, [score]);

  const color = score>=70?"#3DDC97":score>=40?"#FFB84D":"#FF5C5C";
  const deg = (animScore/100)*360;

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", margin:"28px 0" }}>
      <div style={{ position:"relative", width:160, height:160 }}>
        {/* Outer conic ring */}
        <div style={{
          width:160, height:160, borderRadius:"50%",
          background:`conic-gradient(${color} ${deg}deg, rgba(255,255,255,0.08) ${deg}deg)`,
          display:"flex", alignItems:"center", justifyContent:"center",
          transition:"background 0.05s",
        }}>
          <div style={{ position:"absolute", inset:10, borderRadius:"50%", background:"#0D0F14" }}/>
        </div>
        {/* Score text */}
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:44, fontWeight:700, color, lineHeight:1 }}>{animScore}</span>
          <span style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:10, color:"rgba(255,255,255,.4)", letterSpacing:"0.12em", marginTop:4 }}>/ 100</span>
        </div>
      </div>
      <p style={{
        marginTop:12, fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:13, fontWeight:700,
        color, letterSpacing:"0.08em",
      }}>
        {score>=70?"EXCELLENT":score>=40?"MODERATE":"LOW"} SECURITY
      </p>
    </div>
  );
}

function FactorBar({ label, icon, pct, color }: { label:string; icon:string; pct:number; color:string }): JSX.Element {
  const [w, setW] = useState(0);
  useEffect(() => { const t=setTimeout(()=>setW(pct),100); return()=>clearTimeout(t); },[pct]);
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <span style={{ fontSize:14 }}>{icon}</span>
          <span style={{ fontSize:13, fontWeight:500, color:"#F5F6F8" }}>{label}</span>
        </div>
        <span style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:11, color, fontWeight:700 }}>{pct}%</span>
      </div>
      <div style={{ height:6, borderRadius:999, background:"rgba(255,255,255,0.08)", overflow:"hidden" }}>
        <div style={{ height:"100%", borderRadius:999, background:color, width:`${w}%`, transition:"width 0.8s cubic-bezier(0.34,1.56,0.64,1)" }}/>
      </div>
    </div>
  );
}

export default function SecurityScorePage(): JSX.Element {
  const router = useRouter();
  const [data, setData]       = useState<SecurityData|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<SecurityData>("/users/me/security-score")
      .then(r=>setData(r.data)).catch(()=>null).finally(()=>setLoading(false));
  }, []);

  const score = data?.security_score ?? 0;
  const trust = data?.behavioral_trust_score ?? 0;

  const factors = [
    { ...FACTORS[0], pct:75 },
    { ...FACTORS[1], pct:data?.baseline_established?80:10 },
    { ...FACTORS[2], pct:Math.round(trust*100) },
    { ...FACTORS[3], pct:60 },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#050608", color:"#F5F6F8", fontFamily:"var(--font-dm-sans,'DM Sans',sans-serif)" }}>
      {/* Header */}
      <div style={{ padding:"28px 24px 0", display:"flex", alignItems:"center", gap:14 }}>
        <button onClick={()=>router.push("/profile")} aria-label="Back"
          style={{ width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",color:"rgba(255,255,255,.7)",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>←</button>
        <div>
          <h1 style={{ fontSize:20,fontWeight:700,color:"#F5F6F8",margin:0,fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>Security Score</h1>
          <p style={{ fontSize:11,color:"rgba(255,255,255,.4)",margin:"2px 0 0",fontFamily:"var(--font-ibm-plex-mono,monospace)",letterSpacing:"0.08em" }}>ACCOUNT PROTECTION LEVEL</p>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:"0 20px 32px" }}>
        {loading ? (
          <div style={{ height:200,borderRadius:16,background:"rgba(255,255,255,0.04)",animation:"sp-shimmer 1.4s ease-in-out infinite",margin:"28px 0" }}/>
        ) : <ScoreRing score={score}/>}

        {/* Stats row */}
        {data && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:24 }}>
            {[
              { label:"Events Logged", value:data.event_count??0, icon:"⚡", mono:true },
              { label:"Baseline", value:data.baseline_established?"ESTABLISHED":"BUILDING", icon:"◉", mono:true, color:data.baseline_established?"#3DDC97":"#FFB84D" },
            ].map(s=>(
              <div key={s.label} style={{ background:"rgba(255,255,255,0.04)",borderRadius:14,border:"1px solid rgba(255,255,255,0.07)",padding:"16px 18px" }}>
                <p style={{ fontSize:10,color:"rgba(255,255,255,.4)",margin:"0 0 6px",letterSpacing:"0.1em",fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>{s.label.toUpperCase()}</p>
                <p style={{ fontSize:18,fontWeight:700,color:s.color??"#F5F6F8",margin:0,fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>{String(s.value)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Factor bars */}
        <div style={{ background:"rgba(255,255,255,0.04)",borderRadius:16,border:"1px solid rgba(255,255,255,0.07)",padding:"20px 22px",marginBottom:20 }}>
          <h2 style={{ fontSize:14,fontWeight:600,color:"#F5F6F8",margin:"0 0 20px",fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>Score Breakdown</h2>
          {loading ? [1,2,3,4].map(i=><div key={i} style={{ height:40,borderRadius:8,background:"rgba(255,255,255,0.06)",marginBottom:12,animation:"sp-shimmer 1.4s ease-in-out infinite" }}/>) : (
            factors.map(f=><FactorBar key={f.key} label={f.label} icon={f.icon} pct={f.pct} color={f.pct>=70?"#3DDC97":f.pct>=40?"#FFB84D":"#FF5C5C"}/>)
          )}
        </div>

        {/* Tips */}
        {!loading && (
          <div style={{ background:"rgba(124,92,255,0.06)",border:"1px solid rgba(124,92,255,0.18)",borderRadius:16,padding:"20px 22px" }}>
            <h2 style={{ fontSize:14,fontWeight:600,color:"#F5F6F8",margin:"0 0 14px",fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>Recommendations</h2>
            {getTips(score).map((tip,i)=>(
              <div key={i} style={{ display:"flex",gap:10,alignItems:"flex-start",marginBottom:i<getTips(score).length-1?12:0 }}>
                <span style={{ color:"#7C5CFF",flexShrink:0,fontSize:14,marginTop:1 }}>◎</span>
                <p style={{ fontSize:13,color:"rgba(255,255,255,.65)",margin:0,lineHeight:1.55 }}>{tip}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes sp-shimmer{0%,100%{opacity:1}50%{opacity:0.45}}@media(prefers-reduced-motion:reduce){*{animation-duration:0.01ms!important;transition-duration:0.01ms!important}}`}</style>
    </div>
  );
}
