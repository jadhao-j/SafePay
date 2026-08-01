"use client";

/**
 * OTP Verification Page — Screen 4 (v2 premium dark)
 * 6-digit segmented input, paste support, 60s resend, POST /auth/otp/verify → /login
 */

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api";

function OtpForm(): JSX.Element {
  const router = useRouter();
  const params = useSearchParams();
  const contact = params?.get("contact") ? decodeURIComponent(params.get("contact")!) : params?.get("identifier") ? decodeURIComponent(params.get("identifier")!) : "";

  const [identifier, setIdentifier] = useState(contact);
  const [code, setCode]     = useState(["","","","","",""]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]   = useState<string|null>(null);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement|null)[]>([]);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);
  useEffect(() => {
    if (timeLeft<=0) return;
    const t = setTimeout(()=>setTimeLeft(n=>n-1),1000);
    return ()=>clearTimeout(t);
  }, [timeLeft]);

  function handleDigit(idx:number,val:string): void {
    if(!/^\d?$/.test(val)) return;
    const next=[...code]; next[idx]=val; setCode(next);
    if(val&&idx<5) inputRefs.current[idx+1]?.focus();
    if(!val&&idx>0) inputRefs.current[idx-1]?.focus();
  }

  async function handleVerify(): Promise<void> {
    const otp=code.join("");
    if(otp.length<6||loading) return;
    setError(null); setLoading(true);
    try {
      await apiClient.post("/auth/otp/verify",{ identifier, code:otp });
      setSuccess(true);
      setTimeout(()=>router.push("/login"),1500);
    } catch(err:unknown) {
      const msg=(err as {response?:{data?:{detail?:string}}})?.response?.data?.detail??"Invalid OTP.";
      setError(typeof msg==="string"?msg:"Invalid OTP.");
      setCode(["","","","","",""]); inputRefs.current[0]?.focus();
    } finally { setLoading(false); }
  }

  async function handleResend(): Promise<void> {
    setResending(true); setError(null);
    try { await apiClient.post("/auth/otp/send",{ identifier }); setTimeLeft(60); }
    catch { setError("Could not resend OTP."); }
    finally { setResending(false); }
  }

  const otpFull = code.join("").length===6;

  if (success) return (
    <div style={{ minHeight:"100vh", background:"#050608", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-dm-sans,'DM Sans',sans-serif)" }}>
      <div style={{ width:80,height:80,borderRadius:"50%",background:"var(--panel)",border:"3px solid #3DDC97",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,boxShadow:"0 0 0 12px rgba(61,220,151,0.08)",marginBottom:20 }}>✓</div>
      <h2 style={{ color:"#F5F6F8",fontSize:22,fontWeight:700,margin:"0 0 8px",fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>Verified!</h2>
      <p style={{ color:"#6B7180",fontSize:14,margin:0 }}>Redirecting to login…</p>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", position:"relative", overflow:"hidden",
      background:"radial-gradient(130% 90% at 20% 0%,rgba(124,92,255,.5),transparent 55%), radial-gradient(130% 90% at 100% 30%,rgba(57,210,255,.4),transparent 55%), linear-gradient(180deg,#0B1220,#060910)",
      display:"flex", flexDirection:"column", alignItems:"center", padding:"80px 24px 40px",
      fontFamily:"var(--font-dm-sans,'DM Sans',sans-serif)" }}>
      <div aria-hidden="true" style={{ position:"fixed",inset:0,backgroundImage:"radial-gradient(rgba(255,255,255,.05) 1px,transparent 1px)",backgroundSize:"20px 20px",pointerEvents:"none" }}/>

      <div style={{ position:"relative",zIndex:1,width:56,height:56,borderRadius:18,background:"conic-gradient(from 90deg,#7C5CFF,#39D2FF,#3DDC97,#7C5CFF)",display:"flex",alignItems:"center",justifyContent:"center",animation:"sp-spin 8s linear infinite",marginBottom:16 }}>
        <div style={{ position:"absolute",inset:3,borderRadius:15,background:"#0B1220" }}/>
        <span style={{ position:"relative",zIndex:1,color:"#fff",fontSize:20,fontWeight:700,fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>S</span>
      </div>

      <h1 style={{ position:"relative",zIndex:1,color:"#fff",fontSize:22,fontWeight:700,margin:"0 0 4px",fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>Verify Your Account</h1>
      <p style={{ position:"relative",zIndex:1,color:"rgba(255,255,255,.45)",fontSize:13,margin:"0 0 32px",textAlign:"center",lineHeight:1.5 }}>
        Enter the 6-digit OTP sent to <strong style={{ color:"rgba(255,255,255,0.8)" }}>{identifier||"your contact"}</strong>
      </p>

      <div style={{ position:"relative",zIndex:1,width:"100%",maxWidth:420,background:"rgba(255,255,255,.06)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,.12)",borderRadius:22,padding:"28px 22px" }}>
        {/* OTP cells */}
        <div style={{ display:"flex",gap:8,justifyContent:"center",marginBottom:20 }}>
          {code.map((d,i)=>(
            <input key={i} ref={el=>{inputRefs.current[i]=el;}} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={d}
              onChange={e=>handleDigit(i,e.target.value)}
              onKeyDown={e=>e.key==="Backspace"&&!d&&i>0&&inputRefs.current[i-1]?.focus()}
              onPaste={i===0?e=>{e.preventDefault();const t=e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);const arr=["","","","","",""];t.split("").forEach((c,j)=>{arr[j]=c;});setCode(arr);inputRefs.current[Math.min(t.length,5)]?.focus();}:undefined}
              style={{ width:44,height:54,textAlign:"center",fontSize:22,fontWeight:700,color:"#F5F6F8",background:d?"rgba(124,92,255,0.15)":"rgba(255,255,255,0.05)",border:`1.5px solid ${d?"#7C5CFF":"rgba(255,255,255,0.14)"}`,borderRadius:12,outline:"none",fontFamily:"var(--font-ibm-plex-mono,monospace)",transition:"border-color .13s ease,background .13s ease" }}/>
          ))}
        </div>

        <div style={{ textAlign:"center",marginBottom:12 }}>
          {timeLeft>0 ? (
            <p style={{ fontSize:12,color:"rgba(255,255,255,.4)",margin:0,fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>
              RESEND IN <span style={{ color:timeLeft<=10?"#FF5C5C":"#39D2FF",fontWeight:700 }}>{timeLeft}s</span>
            </p>
          ) : (
            <button onClick={()=>void handleResend()} disabled={resending}
              style={{ background:"none",border:"none",color:"#39D2FF",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>
              {resending?"SENDING…":"RESEND OTP"}
            </button>
          )}
        </div>

        {!identifier && (
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block",fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:10,letterSpacing:"1.5px",color:"rgba(255,255,255,.45)",textTransform:"uppercase",marginBottom:8 }}>Email / Phone</label>
            <input type="text" value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="your@email.com"
              style={{ width:"100%",padding:"12px 16px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.14)",borderRadius:12,color:"#F5F6F8",fontSize:14,outline:"none",boxSizing:"border-box" }}/>
          </div>
        )}

        {error && <div style={{ background:"rgba(255,92,92,0.08)",border:"1px solid rgba(255,92,92,0.2)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#FF5C5C",marginBottom:14 }}>{error}</div>}

        <button id="btn-verify-otp" onClick={()=>void handleVerify()} disabled={!otpFull||loading}
          style={{ width:"100%",padding:15,borderRadius:12,border:"none",fontWeight:700,fontSize:14,
            background:otpFull&&!loading?"linear-gradient(135deg,#7C5CFF,#39D2FF)":"rgba(255,255,255,0.08)",
            color:otpFull&&!loading?"#fff":"rgba(255,255,255,0.3)",
            fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)",
            boxShadow:otpFull&&!loading?"0 12px 28px rgba(124,92,255,.35)":"none",
            cursor:otpFull&&!loading?"pointer":"not-allowed" }}>
          {loading?"Verifying…":"Verify Account"}
        </button>
      </div>

      <style>{`@keyframes sp-spin{to{transform:rotate(360deg)}}input::placeholder{color:rgba(255,255,255,0.3)}@media(prefers-reduced-motion:reduce){*{animation-duration:0.01ms!important}}`}</style>
    </div>
  );
}

export default function OtpVerifyPage(): JSX.Element { return <Suspense><OtpForm/></Suspense>; }
