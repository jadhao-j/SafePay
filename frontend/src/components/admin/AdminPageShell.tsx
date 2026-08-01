"use client";

/**
 * AdminPageShell — v2 shared layout for all admin pages.
 * Dark SOC sidebar + top breadcrumb. Pass `active` = current href.
 */

import Link from "next/link";

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

function Sidebar({ active }: { active:string }): JSX.Element {
  return (
    <aside style={{ width:200, flexShrink:0, background:"var(--admin-surface)", borderRight:"1px solid var(--admin-border)", padding:"28px 0", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"0 20px 28px", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:32,height:32,borderRadius:9, background:"conic-gradient(from 90deg,#7C5CFF,#39D2FF,#3DDC97,#7C5CFF)", display:"flex",alignItems:"center",justifyContent:"center", animation:"sp-spin 8s linear infinite", position:"relative", flexShrink:0 }}>
          <div style={{ position:"absolute",inset:2,borderRadius:7,background:"var(--admin-surface)" }}/>
          <span style={{ position:"relative",zIndex:1,fontSize:12,fontWeight:700,color:"#fff",fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>S</span>
        </div>
        <div>
          <p style={{ fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)",fontSize:13,fontWeight:700,color:"var(--admin-text)",margin:0,letterSpacing:"1px" }}>SAFEPAY</p>
          <p style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:8,color:"var(--admin-dim)",margin:0,letterSpacing:"1px" }}>SOC CONSOLE</p>
        </div>
      </div>
      {NAV.map(n=>(
        <Link key={n.href} href={n.href} style={{
          display:"flex",alignItems:"center",gap:10,padding:"10px 20px",textDecoration:"none",
          background: active===n.href?"rgba(0,212,255,0.07)":"transparent",
          borderLeft:`2px solid ${active===n.href?"var(--admin-cyan)":"transparent"}`,
          color: active===n.href?"var(--admin-cyan)":"var(--admin-dim)",
          fontSize:13,fontWeight:500,transition:"all .15s ease",
        }}>
          <span style={{ fontSize:12,width:16,textAlign:"center" }}>{n.icon}</span>{n.label}
        </Link>
      ))}
      <div style={{ flex:1 }}/>
      <div style={{ padding:"0 20px 10px" }}>
        <Link href="/login" style={{ fontSize:11,color:"var(--admin-dim)",textDecoration:"none",fontFamily:"var(--font-ibm-plex-mono,monospace)",letterSpacing:"0.08em" }}>↗ SIGN OUT</Link>
      </div>
    </aside>
  );
}

export function AdminPageShell({ active, title, subtitle, children }: {
  active:string; title:string; subtitle?:string; children:React.ReactNode;
}): JSX.Element {
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"var(--admin-bg)", fontFamily:"var(--font-dm-sans,'DM Sans',sans-serif)" }}>
      <Sidebar active={active}/>
      <main style={{ flex:1, padding:"28px 28px 40px", overflowY:"auto", minWidth:0 }}>
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)", fontSize:22, fontWeight:700, color:"var(--admin-text)", margin:0 }}>{title}</h1>
          {subtitle && <p style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:11, color:"var(--admin-dim)", margin:"4px 0 0", letterSpacing:"0.08em", textTransform:"uppercase" }}>{subtitle}</p>}
        </div>
        {children}
      </main>
      <style>{`@keyframes sp-spin{to{transform:rotate(360deg)}}@keyframes sp-shimmer{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>
    </div>
  );
}
