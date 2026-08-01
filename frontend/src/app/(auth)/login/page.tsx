"use client";

/**
 * Login Page (v2 premium dark — matches safepay-premium-redesign.html SOC sign-in)
 * Conic-gradient spinning logo mark, radial gradient + dot grid bg, glassmorphism card.
 * Role-based redirect: admin/analyst/compliance_officer → /admin/cases, user → /home
 */

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { setAuthToken } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

function LoginForm(): JSX.Element {
  const router = useRouter();
  const params = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword]    = useState("");
  const [showPw, setShowPw]        = useState(false);
  const [loading, setLoading]      = useState(false);
  const [error, setError]          = useState<string|null>(null);
  const [expired, setExpired]      = useState(false);

  useEffect(() => { if (params?.get("returnTo")) setExpired(true); }, [params]);

  async function handleLogin(e:React.FormEvent): Promise<void> {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/login`,{ identifier, password });
      const token:string = res.data?.access_token;
      if (!token) throw new Error("No token");
      setAuthToken(token);

      /* Role-based redirect */
      let role = "user";
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        role = payload.role ?? "user";
      } catch { /* ignore */ }

      const returnTo = params?.get("returnTo");
      if (returnTo) { router.push(decodeURIComponent(returnTo)); return; }
      const adminRoles = ["admin","fraud_analyst","compliance_officer","super_admin"];
      router.push(adminRoles.includes(role) ? "/admin/cases" : "/home");
    } catch (err:unknown) {
      if (axios.isAxiosError(err) && err.response?.status===401) setError("Invalid email or password.");
      else setError("Login failed. Please check your credentials.");
    } finally { setLoading(false); }
  }

  return (
    <div style={{
      minHeight:"100vh", position:"relative", overflow:"hidden",
      background:`
        radial-gradient(130% 90% at 20% 0%, rgba(124,92,255,.5), transparent 55%),
        radial-gradient(130% 90% at 100% 30%, rgba(57,210,255,.45), transparent 55%),
        linear-gradient(180deg,#0B1220 0%,#060910 100%)
      `,
      display:"flex", flexDirection:"column", alignItems:"center", padding:"80px 28px 40px",
      fontFamily:"var(--font-dm-sans,'DM Sans',sans-serif)",
    }}>
      {/* Dot grid */}
      <div aria-hidden="true" style={{ position:"fixed", inset:0, backgroundImage:"radial-gradient(rgba(255,255,255,.05) 1px,transparent 1px)", backgroundSize:"20px 20px", pointerEvents:"none" }}/>

      {/* Spinning logo mark — from reference */}
      <div style={{ position:"relative", zIndex:1, marginBottom:16,
        width:64, height:64, borderRadius:20,
        background:"conic-gradient(from 90deg,#7C5CFF,#39D2FF,#3DDC97,#7C5CFF)",
        display:"flex", alignItems:"center", justifyContent:"center",
        animation:"sp-spin 8s linear infinite",
      }}>
        <div style={{ position:"absolute", inset:3, borderRadius:17, background:"#0B1220" }}/>
        <span style={{ position:"relative", zIndex:1, color:"#fff", fontSize:24, fontWeight:700, fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>S</span>
      </div>

      <h1 style={{ position:"relative", zIndex:1, fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)", fontWeight:700, fontSize:26, color:"#fff", letterSpacing:"2px", margin:"0 0 4px" }}>SAFEPAY</h1>
      <p style={{ position:"relative", zIndex:1, fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:10.5, letterSpacing:"2.5px", color:"rgba(255,255,255,.4)", margin:"0 0 40px" }}>FRAUD INTELLIGENCE PLATFORM</p>

      {expired && (
        <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:400, marginBottom:16,
          background:"rgba(255,184,77,0.07)", border:"1px solid rgba(255,184,77,0.2)", borderRadius:12, padding:"12px 16px",
          display:"flex", gap:10, alignItems:"center", fontSize:12, color:"#FFB84D" }}>
          <span>⚠</span><span>Your session has expired. Please sign in again.</span>
        </div>
      )}

      {/* Glass card */}
      <div style={{
        position:"relative", zIndex:1, width:"100%", maxWidth:400,
        background:"rgba(255,255,255,.06)", backdropFilter:"blur(20px)",
        border:"1px solid rgba(255,255,255,.12)", borderRadius:22, padding:"26px 22px",
      }}>
        <p style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:10, letterSpacing:"1.5px", color:"rgba(255,255,255,.45)", textTransform:"uppercase", margin:"0 0 22px" }}>
          Sign In
        </p>

        <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:0 }}>
          <label htmlFor="login-identifier" style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:10, letterSpacing:"1.5px", color:"rgba(255,255,255,.45)", textTransform:"uppercase", display:"block", marginBottom:8 }}>Email or Phone</label>
          <input id="login-identifier" type="text" value={identifier} onChange={e=>setIdentifier(e.target.value)} required
            placeholder="analyst@safepay.dev or 9876543210" autoComplete="username"
            style={{ width:"100%", padding:"14px 16px", borderRadius:12, border:"1px solid rgba(255,255,255,.14)", background:"rgba(255,255,255,.05)", color:"#fff", fontFamily:"var(--font-dm-sans,'DM Sans',sans-serif)", fontSize:14, marginBottom:16, outline:"none", boxSizing:"border-box" }}/>

          <label htmlFor="login-password" style={{ fontFamily:"var(--font-ibm-plex-mono,monospace)", fontSize:10, letterSpacing:"1.5px", color:"rgba(255,255,255,.45)", textTransform:"uppercase", display:"block", marginBottom:8 }}>Password</label>
          <div style={{ position:"relative", marginBottom:16 }}>
            <input id="login-password" type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} required
              placeholder="••••••••" autoComplete="current-password"
              style={{ width:"100%", padding:"14px 48px 14px 16px", borderRadius:12, border:"1px solid rgba(255,255,255,.14)", background:"rgba(255,255,255,.05)", color:"#fff", fontFamily:"var(--font-dm-sans,'DM Sans',sans-serif)", fontSize:14, outline:"none", boxSizing:"border-box" }}/>
            <button type="button" id="btn-toggle-password" onClick={()=>setShowPw(v=>!v)}
              aria-label={showPw?"Hide password":"Show password"}
              style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:16, color:"rgba(255,255,255,0.4)", padding:4, lineHeight:1 }}>
              {showPw?"🙈":"👁"}
            </button>
          </div>

          {error && (
            <div style={{ background:"rgba(255,92,92,0.08)", border:"1px solid rgba(255,92,92,0.2)", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#FF5C5C", marginBottom:16 }}>{error}</div>
          )}

          <button id="btn-login" type="submit" disabled={loading}
            style={{
              width:"100%", padding:15, borderRadius:12, border:"none", fontWeight:700, fontSize:14,
              background: loading ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#7C5CFF,#39D2FF)",
              color: loading ? "rgba(255,255,255,0.3)" : "#fff",
              fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)",
              boxShadow: loading ? "none" : "0 12px 28px rgba(124,92,255,.35)",
              cursor: loading ? "not-allowed" : "pointer",
            }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>

      <p style={{ position:"relative", zIndex:1, marginTop:18, fontSize:12, color:"rgba(255,255,255,.4)", textAlign:"center" }}>
        Don&apos;t have an account?{" "}
        <a href="/register" style={{ color:"#39D2FF", fontWeight:600, textDecoration:"none" }}>Create account</a>
      </p>

      <p style={{ position:"relative", zIndex:1, marginTop:14, fontSize:12, color:"rgba(255,255,255,.25)", textAlign:"center" }}>
        Protected by <strong style={{ color:"rgba(255,255,255,0.5)", fontWeight:500 }}>behavioral biometrics</strong>
      </p>

      <style>{`
        @keyframes sp-spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.3); }
        input:focus { border-color: rgba(57,210,255,0.5) !important; }
        @media(prefers-reduced-motion:reduce){*{animation-duration:0.01ms!important}}
      `}</style>
    </div>
  );
}

export default function LoginPage(): JSX.Element {
  return <Suspense><LoginForm/></Suspense>;
}