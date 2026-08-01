"use client";

/**
 * Scan QR Page — Screen 9 (v2 premium dark)
 * Camera QR scanner + animated scan line + manual fallback.
 */

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";

type Mode = "camera" | "manual";
interface QRPayResponse { transaction_id:string; status:string; amount:string; }

/* Explicit L-shaped corner brackets — 4 corners of the scan viewfinder */
const CORNERS: React.CSSProperties[] = [
  { top:12,    left:12,  borderTop:"2px solid #39D2FF", borderLeft:"2px solid #39D2FF",  borderBottom:"none", borderRight:"none" },
  { top:12,    right:12, borderTop:"2px solid #39D2FF", borderRight:"2px solid #39D2FF", borderBottom:"none", borderLeft:"none"  },
  { bottom:12, left:12,  borderBottom:"2px solid #39D2FF", borderLeft:"2px solid #39D2FF",  borderTop:"none", borderRight:"none" },
  { bottom:12, right:12, borderBottom:"2px solid #39D2FF", borderRight:"2px solid #39D2FF", borderTop:"none", borderLeft:"none"  },
];

function parseQR(raw:string): { upiId:string; amount:string } {
  try { const o=JSON.parse(raw); if(o.merchant_upi_id) return { upiId:o.merchant_upi_id, amount:o.amount?String(o.amount):"" }; } catch {}
  if (/^upi:\/\//i.test(raw)) {
    try { const url=new URL(raw.replace(/^upi:\/\//i,"https://upi/")); return { upiId:url.searchParams.get("pa")??"", amount:url.searchParams.get("am")??"" }; } catch {}
  }
  return { upiId:raw.trim(), amount:"" };
}

export default function ScanPage(): JSX.Element {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode]         = useState<Mode>("camera");
  const [cameraStarted, setCameraStarted] = useState(false);
  const [scanning, setScanning]  = useState(false);
  const [cameraError, setCameraError] = useState<string|null>(null);
  const [upiId, setUpiId]       = useState("");
  const [amount, setAmount]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string|null>(null);
  const streamRef = useRef<MediaStream|null>(null);

  /* Cleanup stream when unmounting or switching mode */
  useEffect(() => {
    if (!cameraStarted || mode !== "camera") {
      streamRef.current?.getTracks().forEach(t=>t.stop());
    }
    return () => { streamRef.current?.getTracks().forEach(t=>t.stop()); };
  }, [mode, cameraStarted]);

  async function startCamera(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:"environment" } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject=stream; await videoRef.current.play(); }
      if (!("BarcodeDetector" in window)) {
        // Browser doesn't support BarcodeDetector — soft fallback to manual mode
        setMode("manual");
        setCameraError(null);
        streamRef.current?.getTracks().forEach(t=>t.stop());
        return;
      }
      setScanning(true);
      const bd = new (window as unknown as { BarcodeDetector: new(opts:{formats:string[]})=>{ detect:(el:HTMLVideoElement)=>Promise<{rawValue:string}[]> } }).BarcodeDetector({ formats:["qr_code"] });
      const scan = async () => {
        if (!videoRef.current||!streamRef.current?.active) return;
        try {
          const codes = await bd.detect(videoRef.current);
          if (codes.length>0) { streamRef.current?.getTracks().forEach(t=>t.stop()); setScanning(false); void handleQR(codes[0].rawValue); return; }
        } catch {}
        requestAnimationFrame(scan);
      };
      requestAnimationFrame(scan);
    } catch { setCameraError("Camera access denied. Use manual entry below."); }
  }

  async function handleQR(raw:string): Promise<void> {
    const { upiId:id, amount:amt } = parseQR(raw);
    setUpiId(id); setAmount(amt);
    setMode("manual");
  }

  async function handlePay(): Promise<void> {
    if(!upiId||!amount||loading) return;
    setError(null); setLoading(true);
    try {
      const res = await apiClient.post<QRPayResponse>("/payments/qr/pay",{
        merchant_upi_id:upiId, amount:parseFloat(amount),
        idempotency_key:`${Date.now()}-${Math.random().toString(36).slice(2)}`,
      });
      const { transaction_id, status, amount:amt } = res.data;
      if (status==="challenged") router.push(`/send/challenge?txn=${transaction_id}&amount=${amt}&phone=${upiId}`);
      else if (status==="blocked"||status==="failed") router.push(`/send/blocked?txn=${transaction_id}`);
      else router.push(`/send/success?txn=${transaction_id}&amount=${amt}&phone=${upiId}`);
    } catch(err:unknown) {
      setError((err as {response?:{data?:{detail?:string}}})?.response?.data?.detail??"Payment failed.");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight:"100vh",background:"#050608",color:"#F5F6F8",fontFamily:"var(--font-dm-sans,'DM Sans',sans-serif)" }}>
      {/* Header */}
      <div style={{ padding:"28px 24px 20px",display:"flex",alignItems:"center",gap:14 }}>
        <button onClick={()=>router.push("/home")} aria-label="Back"
          style={{ width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",color:"rgba(255,255,255,.7)",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>←</button>
        <h1 style={{ fontSize:20,fontWeight:700,color:"#F5F6F8",margin:0,fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>Scan QR</h1>
        <button onClick={()=>setMode(m=>m==="camera"?"manual":"camera")} style={{ marginLeft:"auto",padding:"8px 16px",borderRadius:999,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",color:"#9198A8",fontSize:12,cursor:"pointer" }}>
          {mode==="camera"?"Manual":"Camera"}
        </button>
      </div>

      {mode==="camera" && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"0 20px 8px" }}>
          {/* Compact viewfinder — max 300px square */}
          <div style={{ position:"relative", width:"100%", maxWidth:300, aspectRatio:"1", borderRadius:20, overflow:"hidden", border:"1px solid rgba(255,255,255,0.1)", background:"#0D0F14" }}>
            <video ref={videoRef} muted playsInline style={{ width:"100%",height:"100%",objectFit:"cover" }}/>

            {/* Tap-to-start overlay — shown until user triggers camera */}
            {!cameraStarted && !cameraError && (
              <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16 }}>
                <div style={{ width:60,height:60,borderRadius:"50%",background:"rgba(57,210,255,0.12)",border:"1px solid rgba(57,210,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24 }}>📷</div>
                <button id="btn-start-camera" onClick={()=>{ setCameraStarted(true); void startCamera(); }}
                  style={{ padding:"12px 28px",borderRadius:999,background:"linear-gradient(135deg,#7C5CFF,#39D2FF)",border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>
                  Start Camera
                </button>
                <p style={{ fontSize:11,color:"rgba(255,255,255,.3)",margin:0,fontFamily:"var(--font-ibm-plex-mono,monospace)",letterSpacing:"0.08em" }}>TAP TO SCAN QR CODE</p>
              </div>
            )}

            {/* Scan line + corner brackets — shown while scanning */}
            {scanning && !cameraError && (
              <>
                {CORNERS.map((corner,i)=>(
                  <div key={i} style={{ position:"absolute", width:20, height:20, borderRadius:3, ...corner }}/>
                ))}
                <div style={{ position:"absolute",left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#39D2FF,transparent)",animation:"sp-scanline 2s ease-in-out infinite",top:"50%" }}/>
              </>
            )}
            {cameraError && (
              <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,textAlign:"center" }}>
                <div style={{ fontSize:32,marginBottom:12 }}>📷</div>
                <p style={{ color:"#6B7180",fontSize:13,lineHeight:1.5 }}>{cameraError}</p>
              </div>
            )}
            {cameraStarted && !scanning && !cameraError && (
              <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
                <div style={{ width:8,height:8,borderRadius:"50%",background:"#39D2FF",animation:"sp-pulse 1.6s ease-in-out infinite" }}/>
                <span style={{ marginLeft:10,fontSize:12,color:"#6B7180",fontFamily:"var(--font-ibm-plex-mono,monospace)",letterSpacing:"0.1em" }}>INITIALIZING…</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual entry */}
      <div style={{ padding:"24px 20px" }}>
        {mode==="camera" && <p style={{ fontSize:12,color:"rgba(255,255,255,.35)",margin:"0 0 20px",textAlign:"center" }}>Point at a SafePay or UPI QR code</p>}
        <div style={{ marginBottom:16 }}>
          <label style={{ display:"block",fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:10,letterSpacing:"1.5px",color:"rgba(255,255,255,.45)",textTransform:"uppercase",marginBottom:8 }}>UPI ID / Merchant</label>
          <input value={upiId} onChange={e=>setUpiId(e.target.value)} placeholder="merchant@upi" style={{ width:"100%",padding:"14px 16px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.14)",borderRadius:12,color:"#F5F6F8",fontSize:14,outline:"none",boxSizing:"border-box" }}/>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ display:"block",fontFamily:"var(--font-ibm-plex-mono,monospace)",fontSize:10,letterSpacing:"1.5px",color:"rgba(255,255,255,.45)",textTransform:"uppercase",marginBottom:8 }}>Amount (₹)</label>
          <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" style={{ width:"100%",padding:"14px 16px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.14)",borderRadius:12,color:"#F5F6F8",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"var(--font-ibm-plex-mono,monospace)" }}/>
        </div>
        {error && <div style={{ background:"rgba(255,92,92,0.08)",border:"1px solid rgba(255,92,92,0.2)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#FF5C5C",marginBottom:14 }}>{error}</div>}
        <button id="btn-qr-pay" onClick={()=>void handlePay()} disabled={!upiId||!amount||loading}
          style={{ width:"100%",padding:16,borderRadius:14,border:"none",fontWeight:700,fontSize:15,
            background:upiId&&amount&&!loading?"linear-gradient(135deg,#7C5CFF,#39D2FF)":"rgba(255,255,255,0.08)",
            color:upiId&&amount&&!loading?"#fff":"rgba(255,255,255,0.3)",
            fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)",
            boxShadow:upiId&&amount?"0 12px 28px rgba(124,92,255,.3)":"none",
            cursor:upiId&&amount&&!loading?"pointer":"not-allowed" }}>
          {loading?"Processing…":"Pay Now"}
        </button>
      </div>

      <style>{`
        @keyframes sp-scanline{0%{top:10%}50%{top:90%}100%{top:10%}}
        @keyframes sp-pulse{0%,100%{box-shadow:0 0 0 0 rgba(57,210,255,.5)}50%{box-shadow:0 0 0 8px rgba(57,210,255,0)}}
        input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
        input::placeholder{color:rgba(255,255,255,0.3)}
        input:focus{border-color:rgba(57,210,255,0.4)!important}
      `}</style>
    </div>
  );
}
