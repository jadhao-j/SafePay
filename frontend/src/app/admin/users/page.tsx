"use client";

/**
 * Admin Users Page — v2 premium dark
 * Searchable user table, status/role badges, security score bars, freeze/suspend/unblock actions.
 */

import { useEffect, useState } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { fetchUsers, updateUserStatus, type AdminUser } from "@/lib/admin-api";

const STATUS_C: Record<string,string> = { active:"var(--admin-green)", suspended:"var(--admin-amber)", frozen:"var(--admin-red)", pending:"var(--admin-dim)" };
const ROLE_C: Record<string,string>   = { admin:"var(--admin-violet)", fraud_analyst:"var(--admin-cyan)", compliance_officer:"var(--admin-blue)", merchant:"var(--admin-amber)", user:"var(--admin-text)" };

function SecurityBar({ score }: { score:number }): JSX.Element {
  const pct = Math.min(100,Math.max(0,score??0));
  const c = pct>=70?"var(--admin-green)":pct>=40?"var(--admin-amber)":"var(--admin-red)";
  return (
    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
      <div style={{ height:5,width:60,borderRadius:999,background:"var(--admin-border)",overflow:"hidden" }}>
        <div style={{ width:`${pct}%`,height:"100%",background:c,borderRadius:999 }}/>
      </div>
      <span style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:10,color:c,fontWeight:700 }}>{pct}</span>
    </div>
  );
}

function Badge({ label, color }: { label:string; color:string }): JSX.Element {
  return <span style={{ fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:999,background:`${color}20`,color,fontFamily:"var(--font-ibm-plex-mono,monospace)",letterSpacing:"0.06em" }}>{label.toUpperCase()}</span>;
}

export default function AdminUsersPage(): JSX.Element {
  const [users, setUsers]     = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [actionFor, setActionFor] = useState<string|null>(null);

  useEffect(() => { fetchUsers().then(setUsers).catch(()=>setUsers([])).finally(()=>setLoading(false)); }, []);

  async function handleAction(id:string, action:"suspend"|"freeze"|"activate"): Promise<void> {
    setActionFor(id);
    const statusMap: Record<string,string> = { suspend:"suspended", freeze:"frozen", activate:"active" };
    try {
      await updateUserStatus(id, statusMap[action] as "suspended"|"frozen"|"active");
      setUsers(prev=>prev.map(u=>u.id===id?{...u,status:statusMap[action]}:u));
    } catch { /* silent */ } finally { setActionFor(null); }
  }

  const ROLES = ["all","user","admin","fraud_analyst","compliance_officer","merchant"];
  const filtered = users.filter(u=>{
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search);
    const matchRole = roleFilter==="all"||u.role===roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <AdminPageShell active="/admin/users" title="User Management" subtitle={`${users.length} total accounts`}>
      {/* Controls */}
      <div style={{ display:"flex",gap:12,marginBottom:20,flexWrap:"wrap" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, email, phone…"
          style={{ flex:1,minWidth:200,padding:"10px 16px",background:"var(--admin-card)",border:"1px solid var(--admin-border)",borderRadius:10,color:"var(--admin-text)",fontSize:13,outline:"none" }}/>
        <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}
          style={{ padding:"10px 14px",background:"var(--admin-card)",border:"1px solid var(--admin-border)",borderRadius:10,color:"var(--admin-text)",fontSize:12,cursor:"pointer",fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>
          {ROLES.map(r=><option key={r} value={r}>{r==="all"?"All Roles":r.replace(/_/g," ")}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background:"var(--admin-surface)",border:"1px solid var(--admin-border)",borderRadius:14,overflow:"hidden" }}>
        {/* Head */}
        <div style={{ display:"grid",gridTemplateColumns:"2fr 2fr 1fr 1fr 80px 100px",padding:"10px 20px",borderBottom:"1px solid var(--admin-border)",fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:10,letterSpacing:"1px",textTransform:"uppercase",color:"var(--admin-dim)" }}>
          <span>User</span><span>Contact</span><span>Role</span><span>Status</span><span>Security</span><span>Actions</span>
        </div>

        {loading && [1,2,3,4,5].map(i=>(
          <div key={i} style={{ height:60,borderBottom:"1px solid var(--admin-border)",background:"transparent",animation:"sp-shimmer 1.4s ease-in-out infinite",animationDelay:`${i*0.1}s` }}/>
        ))}

        {!loading && filtered.map(user=>(
          <div key={user.id} id={`user-row-${user.id}`}
            style={{ display:"grid",gridTemplateColumns:"2fr 2fr 1fr 1fr 80px 100px",padding:"14px 20px",borderBottom:"1px solid var(--admin-border)",alignItems:"center" }}>
            <div>
              <p style={{ fontSize:13,fontWeight:600,color:"var(--admin-text)",margin:0 }}>{user.name??"Unknown"}</p>
              <p style={{ fontSize:10,color:"var(--admin-dim)",margin:"2px 0 0",fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>{user.id.slice(0,8)}…</p>
            </div>
            <div style={{ minWidth:0 }}>
              <p style={{ fontSize:12,color:"var(--admin-dim)",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>{user.email??user.phone??"—"}</p>
            </div>
            <Badge label={user.role} color={ROLE_C[user.role]??"var(--admin-text)"}/>
            <Badge label={user.status} color={STATUS_C[user.status]??"var(--admin-dim)"}/>
            <SecurityBar score={user.security_score??0}/>
            <div style={{ display:"flex",gap:4 }}>
              {user.status==="active"&&(
                <>
                  <button onClick={()=>void handleAction(user.id,"suspend")} disabled={actionFor===user.id}
                    style={{ padding:"4px 8px",borderRadius:6,fontSize:10,border:"1px solid rgba(245,158,11,0.3)",background:"rgba(245,158,11,0.08)",color:"var(--admin-amber)",cursor:"pointer" }}>Suspend</button>
                  <button onClick={()=>void handleAction(user.id,"freeze")} disabled={actionFor===user.id}
                    style={{ padding:"4px 8px",borderRadius:6,fontSize:10,border:"1px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.08)",color:"var(--admin-red)",cursor:"pointer" }}>Freeze</button>
                </>
              )}
              {user.status!=="active"&&(
                <button onClick={()=>void handleAction(user.id,"activate")} disabled={actionFor===user.id}
                  style={{ padding:"4px 8px",borderRadius:6,fontSize:10,border:"1px solid rgba(16,185,129,0.3)",background:"rgba(16,185,129,0.08)",color:"var(--admin-green)",cursor:"pointer" }}>Activate</button>
              )}
            </div>
          </div>
        ))}

        {!loading && filtered.length===0 && (
          <div style={{ textAlign:"center",padding:"48px 0",color:"var(--admin-dim)",fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>No users match the filter.</div>
        )}
      </div>
    </AdminPageShell>
  );
}
