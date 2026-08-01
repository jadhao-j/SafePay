"use client";

/**
 * Admin Merchants Page — v2 premium dark
 * Searchable merchant table with risk rating bars.
 */

import { useEffect, useState } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { fetchMerchants, type AdminMerchant } from "@/lib/admin-api";

function RiskBar({ rating }: { rating:number }): JSX.Element {
  const pct = Math.min(100,Math.max(0,rating*100));
  const color = pct<30?"var(--admin-green)":pct<70?"var(--admin-amber)":"var(--admin-red)";
  return (
    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
      <div style={{ height:5,width:80,borderRadius:999,background:"var(--admin-border)",overflow:"hidden" }}>
        <div style={{ width:`${pct}%`,height:"100%",background:color,borderRadius:999 }}/>
      </div>
      <span style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:11,color,fontWeight:700 }}>{rating.toFixed(2)}</span>
    </div>
  );
}

export default function AdminMerchantsPage(): JSX.Element {
  const [merchants, setMerchants] = useState<AdminMerchant[]>([]);
  const [error, setError]         = useState<string|null>(null);
  const [search, setSearch]       = useState("");

  useEffect(() => { fetchMerchants().then(setMerchants).catch(()=>setError("Could not load merchant data.")); }, []);

  const filtered = merchants.filter(m=>
    m.business_name.toLowerCase().includes(search.toLowerCase()) ||
    m.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminPageShell active="/admin/merchants" title="Merchant Risk" subtitle={`${merchants.length} merchants · ordered by risk rating`}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or category…"
        style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:12,background:"var(--admin-card)",border:"1px solid var(--admin-border)",borderRadius:8,padding:"10px 16px",color:"var(--admin-text)",outline:"none",width:320,marginBottom:20 }}/>

      {error && <div style={{ background:"rgba(239,68,68,0.08)",border:"1px solid var(--admin-red)",borderRadius:10,padding:"12px 16px",color:"var(--admin-red)",fontSize:13,marginBottom:16 }}>{error}</div>}

      <div style={{ background:"var(--admin-card)",border:"1px solid var(--admin-border)",borderRadius:14,overflow:"auto" }}>
        <table style={{ width:"100%",borderCollapse:"collapse" }}>
          <thead>
            <tr>{["Business Name","UPI ID","Category","Risk Rating"].map(h=>(
              <th key={h} style={{ padding:"12px 16px",textAlign:"left",borderBottom:"1px solid var(--admin-border)",fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:10,color:"var(--admin-dim)",textTransform:"uppercase",letterSpacing:"0.1em" }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.map(m=>(
              <tr key={m.id} style={{ borderBottom:"1px solid var(--admin-border)",transition:"background .12s ease" }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.02)"}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}>
                <td style={{ padding:"12px 16px",fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:13,color:"var(--admin-text)",fontWeight:600 }}>{m.business_name}</td>
                <td style={{ padding:"12px 16px",fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:11,color:"var(--admin-dim)" }}>{m.upi_id}</td>
                <td style={{ padding:"12px 16px" }}>
                  <span style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:10,color:"var(--admin-blue)",border:"1px solid var(--admin-blue)",borderRadius:999,padding:"3px 10px",letterSpacing:"0.06em" }}>
                    {m.category}
                  </span>
                </td>
                <td style={{ padding:"12px 16px" }}><RiskBar rating={m.risk_rating}/></td>
              </tr>
            ))}
            {filtered.length===0 && (
              <tr><td colSpan={4} style={{ padding:"40px",textAlign:"center",fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:13,color:"var(--admin-dim)" }}>No merchants found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminPageShell>
  );
}