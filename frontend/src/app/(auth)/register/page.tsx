"use client";

/**
 * Register Page — Screen 3 (v2 premium dark)
 * Name, email, phone, password + strength meter → POST /auth/register → /otp-verify
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

function pwStrength(p:string):{ score:number; label:string; color:string } {
  let s=0;
  if(p.length>=8) s++; if(p.length>=12) s++;
  if(/[A-Z]/.test(p)) s++; if(/[0-9]/.test(p)) s++; if(/[^a-zA-Z0-9]/.test(p)) s++;
  if(s<=1) return { score:s, label:"Weak", color:"#FF5C5C" };
  if(s<=3) return { score:s, label:"Fair", color:"#FFB84D" };
  return { score:s, label:"Strong", color:"#3DDC97" };
}

function DarkField({ id,label,value,onChange,type="text",placeholder,autoFocus }:
  { id:string;label:string;value:string;onChange:(v:string)=>void;type?:string;placeholder?:string;autoFocus?:boolean; }): JSX.Element {
  const [focused,setFocused]=useState(false);
  return (
    <div style={{ marginBottom:14 }}>
      <label htmlFor={id} style={{ display:"block", fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:10, letterSpacing:"1.5px", color:"rgba(255,255,255,.45)", textTransform:"uppercase", marginBottom:8 }}>{label}</label>
      <input id={id} type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus}
        onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
        style={{ width:"100%", padding:"14px 16px", background:"rgba(255,255,255,0.05)", border:`1px solid ${focused?"rgba(57,210,255,0.5)":"rgba(255,255,255,0.14)"}`, borderRadius:12, color:"#F5F6F8", fontSize:14, outline:"none", boxSizing:"border-box", transition:"border-color .15s ease", fontFamily:"var(--font-dm-sans,'DM Sans',sans-serif)" }}/>
    </div>
  );
}

export default function RegisterPage(): JSX.Element {
  const router = useRouter();
  const [form, setForm] = useState({ name:"", email:"", phone:"", password:"", confirm:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string|null>(null);
  const set = (k:keyof typeof form) => (v:string) => setForm(f=>({...f,[k]:v}));
  const pw = pwStrength(form.password);

  async function handleRegister(e:React.FormEvent): Promise<void> {
    e.preventDefault(); setError(null);
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/auth/register`,{
        name:form.name, email:form.email||null, phone:form.phone||null, password:form.password,
      });
      router.push(`/otp-verify?contact=${encodeURIComponent(form.email||form.phone)}`);
    } catch (err:unknown) {
      const msg = (err as { response?:{data?:{detail?:string}} })?.response?.data?.detail ?? "Registration failed.";
      setError(typeof msg==="string" ? msg : "Registration failed.");
    } finally { setLoading(false); }
  }

  return (
    <div style={{
      minHeight:"100vh", position:"relative", overflow:"hidden",
      background:`
        radial-gradient(130% 90% at 20% 0%, rgba(124,92,255,.5), transparent 55%),
        radial-gradient(130% 90% at 100% 30%, rgba(57,210,255,.4), transparent 55%),
        linear-gradient(180deg,#0B1220 0%,#060910 100%)
      `,
      display:"flex", flexDirection:"column", alignItems:"center", padding:"70px 24px 40px",
      fontFamily:"var(--font-dm-sans,'DM Sans',sans-serif)",
    }}>
      <div aria-hidden="true" style={{ position:"fixed", inset:0, backgroundImage:"radial-gradient(rgba(255,255,255,.05) 1px,transparent 1px)", backgroundSize:"20px 20px", pointerEvents:"none" }}/>

      {/* Spinning logo */}
      <div style={{ position:"relative", zIndex:1, marginBottom:16, width:56, height:56, borderRadius:18, background:"conic-gradient(from 90deg,#7C5CFF,#39D2FF,#3DDC97,#7C5CFF)", display:"flex", alignItems:"center", justifyContent:"center", animation:"sp-spin 8s linear infinite" }}>
        <div style={{ position:"absolute", inset:3, borderRadius:15, background:"#0B1220" }}/>
        <span style={{ position:"relative", zIndex:1, color:"#fff", fontSize:20, fontWeight:700, fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>S</span>
      </div>

      <h1 style={{ position:"relative", zIndex:1, fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)", fontWeight:700, fontSize:22, color:"#fff", margin:"0 0 4px" }}>Create Account</h1>
      <p style={{ position:"relative", zIndex:1, fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:10, letterSpacing:"2px", color:"rgba(255,255,255,.4)", margin:"0 0 32px" }}>JOIN SAFEPAY</p>

      <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:420, background:"rgba(255,255,255,.06)", backdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,.12)", borderRadius:22, padding:"26px 22px" }}>
        <form onSubmit={handleRegister}>
          <DarkField id="reg-name" label="Full Name" value={form.name} onChange={set("name")} placeholder="Arjun Sharma" autoFocus />
          <DarkField id="reg-email" label="Email" value={form.email} onChange={set("email")} type="email" placeholder="arjun@email.com" />
          <DarkField id="reg-phone" label="Phone" value={form.phone} onChange={set("phone")} type="tel" placeholder="9876543210" />
          <DarkField id="reg-password" label="Password" value={form.password} onChange={set("password")} type="password" placeholder="Min 8 characters" />

          {/* Strength meter */}
          {form.password.length>0 && (
            <div style={{ marginBottom:14 }}>
              <div style={{ height:3, borderRadius:999, background:"rgba(255,255,255,0.1)", overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:999, background:pw.color, width:`${(pw.score/5)*100}%`, transition:"width .3s ease, background .3s ease" }}/>
              </div>
              <p style={{ fontSize:10, color:pw.color, margin:"4px 0 0", fontFamily:"var(--font-ibm-plex-mono,monospace)", letterSpacing:"0.08em" }}>{pw.label.toUpperCase()}</p>
            </div>
          )}

          <DarkField id="reg-confirm" label="Confirm Password" value={form.confirm} onChange={set("confirm")} type="password" placeholder="Repeat password" />

          {error && <div style={{ background:"rgba(255,92,92,0.08)", border:"1px solid rgba(255,92,92,0.2)", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#FF5C5C", marginBottom:14 }}>{error}</div>}

          <button id="btn-register" type="submit" disabled={loading||!form.name||(!form.email&&!form.phone)||!form.password}
            style={{ width:"100%", padding:15, borderRadius:12, border:"none", fontWeight:700, fontSize:14,
              background: loading ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#7C5CFF,#39D2FF)",
              color: loading ? "rgba(255,255,255,0.3)" : "#fff",
              fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)",
              boxShadow: loading ? "none" : "0 12px 28px rgba(124,92,255,.35)", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>
      </div>

      <p style={{ position:"relative", zIndex:1, marginTop:20, fontSize:12, color:"rgba(255,255,255,.4)", textAlign:"center" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color:"#39D2FF", fontWeight:600, textDecoration:"none" }}>Sign in</Link>
      </p>

      <style>{`
        @keyframes sp-spin{to{transform:rotate(360deg)}}
        input::placeholder{color:rgba(255,255,255,0.3)}
        @media(prefers-reduced-motion:reduce){*{animation-duration:0.01ms!important}}
      `}</style>
    </div>
  );
}
