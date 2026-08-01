"use client";

/**
 * Profile / Settings Page — Screen 20 (v2 premium dark)
 * Avatar card, role/status badges, settings groups, logout.
 * Admin role → "Admin Console" link.
 * MFA toggle + Edit profile sheet.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api";

interface UserProfile { id:string; name:string; email:string|null; phone:string|null; role:string; status:string; mfa_enabled:boolean; security_score:number; }

const ROLE_COLOR: Record<string,string> = { user:"#39D2FF", admin:"#FF5C5C", fraud_analyst:"#FFB84D", compliance_officer:"#7C5CFF" };
const STATUS_COLOR: Record<string,string> = { active:"#3DDC97", pending:"#FFB84D", suspended:"#FF5C5C", frozen:"#7C5CFF" };
const ADMIN_ROLES = new Set(["admin","fraud_analyst","compliance_officer","super_admin"]);

/* ── Edit profile sheet ─────────────────────────────────────────────── */
function EditProfileSheet({
  profile, onClose, onSave,
}: { profile: UserProfile; onClose: () => void; onSave: (p: UserProfile) => void; }): JSX.Element {
  const [name, setName]   = useState(profile.name ?? "");
  const [email, setEmail] = useState(profile.email ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr]     = useState<string|null>(null);

  async function save(): Promise<void> {
    setSaving(true); setErr(null);
    try {
      const res = await apiClient.patch<UserProfile>("/users/me", { name: name.trim(), email: email.trim()||null, phone: phone.trim()||null });
      onSave(res.data);
    } catch (e: unknown) {
      const msg = (e as { response?:{data?:{detail?:string}} })?.response?.data?.detail ?? "Update failed.";
      setErr(typeof msg === "string" ? msg : "Update failed.");
    } finally { setSaving(false); }
  }

  const fieldStyle: React.CSSProperties = {
    width:"100%", padding:"13px 16px", background:"rgba(255,255,255,0.05)",
    border:"1px solid rgba(255,255,255,0.14)", borderRadius:12, color:"#F5F6F8",
    fontSize:14, outline:"none", boxSizing:"border-box", marginBottom:14,
    fontFamily:"var(--font-dm-sans,'DM Sans',sans-serif)", transition:"border-color .15s ease",
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}
      onClick={onClose}>
      <div style={{ position:"absolute", inset:0, background:"rgba(5,6,8,0.7)", backdropFilter:"blur(4px)" }}/>
      <div onClick={e=>e.stopPropagation()}
        style={{ position:"relative", background:"#0D0F14", borderRadius:"24px 24px 0 0", border:"1px solid rgba(255,255,255,0.1)", padding:"28px 24px 40px" }}>
        <div style={{ width:40, height:4, borderRadius:2, background:"rgba(255,255,255,0.15)", margin:"0 auto 20px" }}/>
        <h3 style={{ fontSize:18, fontWeight:700, color:"#F5F6F8", margin:"0 0 20px", fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>Edit Profile</h3>

        <label style={{ display:"block", fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:10, letterSpacing:"1.5px", color:"rgba(255,255,255,.45)", textTransform:"uppercase", marginBottom:8 }}>Full Name</label>
        <input id="edit-name" value={name} onChange={e=>setName(e.target.value)} style={fieldStyle}
          onFocus={e=>(e.currentTarget.style.borderColor="rgba(57,210,255,0.5)")}
          onBlur={e=>(e.currentTarget.style.borderColor="rgba(255,255,255,0.14)")}/>

        <label style={{ display:"block", fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:10, letterSpacing:"1.5px", color:"rgba(255,255,255,.45)", textTransform:"uppercase", marginBottom:8 }}>Email</label>
        <input id="edit-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} style={fieldStyle}
          onFocus={e=>(e.currentTarget.style.borderColor="rgba(57,210,255,0.5)")}
          onBlur={e=>(e.currentTarget.style.borderColor="rgba(255,255,255,0.14)")}/>

        <label style={{ display:"block", fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:10, letterSpacing:"1.5px", color:"rgba(255,255,255,.45)", textTransform:"uppercase", marginBottom:8 }}>Phone</label>
        <input id="edit-phone" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} style={{...fieldStyle, marginBottom:6}}
          onFocus={e=>(e.currentTarget.style.borderColor="rgba(57,210,255,0.5)")}
          onBlur={e=>(e.currentTarget.style.borderColor="rgba(255,255,255,0.14)")}/>

        {err && <div style={{ fontSize:13, color:"#FF5C5C", marginBottom:12, background:"rgba(255,92,92,0.08)", borderRadius:8, padding:"10px 14px", border:"1px solid rgba(255,92,92,0.2)" }}>{err}</div>}

        <button id="btn-save-profile" onClick={()=>void save()} disabled={saving || !name.trim()}
          style={{ width:"100%", padding:15, borderRadius:14, border:"none", cursor: saving||!name.trim() ? "not-allowed" : "pointer",
            background: saving||!name.trim() ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#7C5CFF,#39D2FF)",
            color: saving||!name.trim() ? "rgba(255,255,255,0.3)" : "#fff",
            fontSize:15, fontWeight:700, fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)",
            boxShadow: !saving && name.trim() ? "0 8px 20px rgba(124,92,255,.3)" : "none" }}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

/* ── MFA toggle row ─────────────────────────────────────────────────── */
function MfaToggle({ enabled, onToggle }: { enabled: boolean; onToggle: (v: boolean) => void }): JSX.Element {
  const [busy, setBusy] = useState(false);

  async function toggle(): Promise<void> {
    if (busy) return;
    setBusy(true);
    try {
      await apiClient.patch("/users/me", { mfa_enabled: !enabled });
      onToggle(!enabled);
    } catch { /* ignore */ } finally { setBusy(false); }
  }

  return (
    <div style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px", cursor:"pointer" }}
      onClick={()=>void toggle()}
      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.04)"}
      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}>
      <div style={{ width:36, height:36, borderRadius:10, background:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>🔐</div>
      <div style={{ flex:1 }}>
        <p style={{ fontSize:14, fontWeight:500, color:"#F5F6F8", margin:0 }}>Two-Factor Auth (MFA)</p>
        <p style={{ fontSize:12, color:"#6B7180", margin:"2px 0 0" }}>
          {enabled ? "Enabled — extra login verification active" : "Disabled — enable for stronger security"}
        </p>
      </div>
      {/* Toggle pill */}
      <div style={{
        width:44, height:24, borderRadius:12, flexShrink:0, position:"relative",
        background: enabled ? "linear-gradient(135deg,#7C5CFF,#39D2FF)" : "rgba(255,255,255,0.12)",
        transition:"background .2s ease", opacity: busy ? 0.5 : 1,
      }}>
        <div style={{
          position:"absolute", top:3, left: enabled ? 23 : 3, width:18, height:18,
          borderRadius:"50%", background:"#fff", transition:"left .2s ease",
          boxShadow:"0 1px 4px rgba(0,0,0,0.4)",
        }}/>
      </div>
    </div>
  );
}

export default function ProfilePage(): JSX.Element {
  const router = useRouter();
  const [profile, setProfile]   = useState<UserProfile|null>(null);
  const [loading, setLoading]   = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [isAdmin, setIsAdmin]   = useState(false);

  useEffect(() => {
    apiClient.get<UserProfile>("/users/me")
      .then(r=>setProfile(r.data)).catch(()=>null).finally(()=>setLoading(false));

    // Detect admin role from JWT
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setIsAdmin(ADMIN_ROLES.has(payload.role ?? ""));
      }
    } catch { /* ignore */ }
  }, []);

  function handleLogout(): void {
    const token = typeof window!=="undefined" ? localStorage.getItem("refresh_token")??"" : "";
    apiClient.post("/auth/logout",{ refresh_token:token }).catch(()=>null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/login");
  }

  const SECTIONS = [
    { title:"Security", items:[
      { id:"profile-security",  icon:"🛡", label:"Security Score", sub:"View your protection level", href:"/profile/security-score" },
      { id:"profile-devices",   icon:"📱", label:"Trusted Devices", sub:"Manage linked devices", href:"/profile/devices" },
      { id:"profile-pin",       icon:"🔑", label:"Change PIN", sub:"Update transaction PIN", href:"/set-pin" },
    ]},
    { title:"Payments", items:[
      { id:"profile-history",   icon:"⏱", label:"Transaction History", sub:"Full payment log", href:"/history" },
      { id:"profile-wallet",    icon:"◈", label:"Wallet", sub:"Balance, add money, withdraw", href:"/wallet" },
    ]},
    { title:"Account", items:[
      { id:"profile-edit",      icon:"✏️", label:"Edit Profile", sub:"Change name, email, phone", action:()=>setShowEdit(true) },
      { id:"profile-copilot",   icon:"✦", label:"AI Copilot", sub:"Ask about your transactions", href:"/copilot" },
      ...(isAdmin ? [{ id:"profile-admin", icon:"⚙️", label:"Admin Console", sub:"Switch to SOC dashboard", href:"/admin/dashboard" }] : []),
      { id:"profile-logout",    icon:"↗", label:"Sign Out", sub:"Log out of SafePay", action:handleLogout, danger:true },
    ]},
  ];

  const initials = profile?.name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() ?? "SP";
  const scoreColor = profile?.security_score ? (profile.security_score>=70?"#3DDC97":profile.security_score>=40?"#FFB84D":"#FF5C5C") : "#6B7180";

  return (
    <div style={{ minHeight:"100vh", background:"#050608", color:"#F5F6F8", fontFamily:"var(--font-dm-sans,'DM Sans',sans-serif)" }}>

      {/* Header hero */}
      <div style={{
        position:"relative", padding:"52px 24px 100px", overflow:"hidden",
        background:`
          radial-gradient(120% 90% at 15% 0%, rgba(124,92,255,.5), transparent 60%),
          radial-gradient(120% 90% at 100% 10%, rgba(57,210,255,.4), transparent 55%),
          linear-gradient(160deg,#0B1220 0%,#101a33 55%,#0B1220 100%)
        `,
      }}>
        <div aria-hidden="true" style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(rgba(255,255,255,.06) 1px,transparent 1px)", backgroundSize:"18px 18px", opacity:0.5 }}/>
        <h1 style={{ position:"relative", zIndex:1, fontSize:20, fontWeight:700, color:"#fff", margin:0, fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>Profile</h1>
      </div>

      {/* Avatar card — dark glass overlapping hero (v2 §4) */}
      <div style={{ margin:"-68px 20px 0", position:"relative", zIndex:2 }}>
        <div style={{
          background:"rgba(13,15,20,0.82)",
          backdropFilter:"blur(24px) saturate(1.4)",
          WebkitBackdropFilter:"blur(24px) saturate(1.4)",
          border:"1px solid rgba(255,255,255,0.10)",
          borderRadius:22,
          padding:"22px 24px",
          boxShadow:"0 24px 48px rgba(0,0,0,.45), 0 0 0 1px rgba(124,92,255,.08) inset",
          display:"flex", alignItems:"center", gap:16,
        }}>
          {/* Avatar — gradient circle */}
          <div style={{
            width:60, height:60, borderRadius:"50%", flexShrink:0,
            background:"linear-gradient(135deg,#7C5CFF,#39D2FF)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:22, fontWeight:700, color:"#fff",
            fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)",
          }}>
            {loading ? "…" : initials}
          </div>

          <div style={{ flex:1, minWidth:0 }}>
            {loading ? (
              <>
                <div style={{ height:20, width:140, borderRadius:6, background:"rgba(255,255,255,0.08)", marginBottom:8, animation:"sp-shimmer 1.4s ease-in-out infinite" }}/>
                <div style={{ height:14, width:100, borderRadius:6, background:"rgba(255,255,255,0.08)", animation:"sp-shimmer 1.4s ease-in-out infinite" }}/>
              </>
            ) : (
              <>
                <p style={{ fontSize:17, fontWeight:700, color:"#FFFFFF", margin:"0 0 4px", fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>{profile?.name}</p>
                <p style={{ fontSize:12, color:"rgba(255,255,255,0.45)", margin:0, fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>{profile?.email ?? profile?.phone}</p>
              </>
            )}
            {/* Badges */}
            {profile && (
              <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
                <span style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:999, letterSpacing:"0.06em",
                  background:`${ROLE_COLOR[profile.role]??ROLE_COLOR.user}22`, color:ROLE_COLOR[profile.role]??ROLE_COLOR.user,
                  fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>
                  {profile.role.replace(/_/g," ").toUpperCase()}
                </span>
                <span style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:999, letterSpacing:"0.06em",
                  background:`${STATUS_COLOR[profile.status]??STATUS_COLOR.active}22`, color:STATUS_COLOR[profile.status]??STATUS_COLOR.active,
                  fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>
                  {profile.status.toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Score ring */}
          <div style={{ textAlign:"center", flexShrink:0 }}>
            {loading ? (
              <div style={{ width:48, height:48, borderRadius:"50%", background:"rgba(255,255,255,0.08)", animation:"sp-shimmer 1.4s ease-in-out infinite" }}/>
            ) : profile ? (
              <div style={{
                width:48, height:48, borderRadius:"50%",
                background:`conic-gradient(${scoreColor} ${(profile.security_score??0)*3.6}deg, rgba(255,255,255,0.12) 0deg)`,
                display:"flex", alignItems:"center", justifyContent:"center", position:"relative",
              }}>
                <div style={{ position:"absolute", inset:3, borderRadius:"50%", background:"rgba(13,15,20,0.92)" }}/>
                <span style={{ position:"relative", zIndex:1, fontSize:12, fontWeight:700, color:scoreColor, fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>
                  {profile.security_score ?? "--"}
                </span>
              </div>
            ) : null}
            {!loading && <p style={{ fontSize:9, color:"rgba(255,255,255,0.35)", margin:"4px 0 0", letterSpacing:"0.1em", fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>SCORE</p>}
          </div>
        </div>
      </div>

      {/* Settings sections */}
      <div style={{ padding:"24px 20px 32px" }}>

        {/* MFA section */}
        {profile && (
          <div style={{ marginBottom:24 }}>
            <p style={{ fontSize:11, color:"#6B7180", letterSpacing:"0.12em", fontFamily:"var(--font-ibm-plex-mono,monospace)", margin:"0 0 10px", textTransform:"uppercase" }}>Authentication</p>
            <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:16, border:"1px solid rgba(255,255,255,0.07)", overflow:"hidden" }}>
              <MfaToggle
                enabled={profile.mfa_enabled}
                onToggle={v => setProfile(p => p ? {...p, mfa_enabled: v} : p)}
              />
            </div>
          </div>
        )}

        {SECTIONS.map(section => (
          <div key={section.title} style={{ marginBottom:24 }}>
            <p style={{ fontSize:11, color:"#6B7180", letterSpacing:"0.12em", fontFamily:"var(--font-ibm-plex-mono,monospace)", margin:"0 0 10px", textTransform:"uppercase" }}>{section.title}</p>
            <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:16, border:"1px solid rgba(255,255,255,0.07)", overflow:"hidden" }}>
              {section.items.map((item, i) => {
                const isLast = i === section.items.length-1;
                const inner = (
                  <div style={{
                    display:"flex", alignItems:"center", gap:14, padding:"14px 18px",
                    borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.06)",
                    cursor:"pointer", transition:"background .15s ease",
                  }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.04)"}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}>
                    <div style={{ width:36, height:36, borderRadius:10, background:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{item.icon}</div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:14, fontWeight:500, color: item.danger?"#FF5C5C":"#F5F6F8", margin:0 }}>{item.label}</p>
                      <p style={{ fontSize:12, color:"#6B7180", margin:"2px 0 0" }}>{item.sub}</p>
                    </div>
                    <span style={{ color:"rgba(255,255,255,0.25)", fontSize:14 }}>›</span>
                  </div>
                );
                return item.href ? (
                  <Link key={item.id} id={item.id} href={item.href} style={{ textDecoration:"none", display:"block" }}>{inner}</Link>
                ) : (
                  <div key={item.id} id={item.id} onClick={item.action}>{inner}</div>
                );
              })}
            </div>
          </div>
        ))}

        <p style={{ textAlign:"center", fontSize:11, color:"rgba(255,255,255,0.2)", fontFamily:"var(--font-ibm-plex-mono,monospace)", letterSpacing:"0.08em" }}>
          SAFEPAY v2.0 · FRAUD INTELLIGENCE PLATFORM
        </p>
      </div>

      {/* Edit profile bottom sheet */}
      {showEdit && profile && (
        <EditProfileSheet
          profile={profile}
          onClose={() => setShowEdit(false)}
          onSave={updated => { setProfile(updated); setShowEdit(false); }}
        />
      )}

      <style>{`
        @keyframes sp-shimmer { 0%,100%{opacity:1}50%{opacity:0.45} }
        @media(prefers-reduced-motion:reduce){*{animation-duration:0.01ms!important;transition-duration:0.01ms!important}}
      `}</style>
    </div>
  );
}
