"use client";

/**
 * AI Copilot Chat Page — Screen 21 (v2 premium dark)
 * Dark chat interface, suggested prompts, grounded answers from fraud DB.
 */

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api";

interface CopilotMessage {
  id: string; role: "user"|"assistant"; content: string;
  sources?: string[]; tool_used?: string|null; grounded?: boolean; timestamp: Date;
}
interface CopilotAPIResponse { answer:string; sources:string[]; tool_used:string|null; grounded:boolean; }

const SUGGESTIONS = [
  "Why was my payment blocked?",
  "What is my current risk score?",
  "How can I improve my security?",
  "Explain my last fraud decision.",
];

function uid(): string { return Math.random().toString(36).slice(2,10); }
function formatTime(d:Date): string { return d.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}); }

function SourceTag({ source }: { source:string }): JSX.Element {
  const [type] = source.split(":");
  const colors: Record<string,{bg:string;text:string}> = {
    transaction:{bg:"rgba(57,210,255,0.1)",text:"#39D2FF"},
    fraud_score:{bg:"rgba(255,92,92,0.1)",text:"#FF5C5C"},
    fraud_explanation:{bg:"rgba(124,92,255,0.1)",text:"#7C5CFF"},
    alert:{bg:"rgba(255,184,77,0.1)",text:"#FFB84D"},
  };
  const c = colors[type]??{bg:"rgba(255,255,255,0.06)",text:"#9198A8"};
  return (
    <span style={{ display:"inline-flex", alignItems:"center", padding:"2px 8px", borderRadius:999,
      background:c.bg, color:c.text, fontSize:10, fontWeight:600, fontFamily:"var(--font-ibm-plex-mono,monospace)",
      letterSpacing:"0.05em", margin:"0 4px 4px 0" }}>
      {source}
    </span>
  );
}

function CopilotContent(): JSX.Element {
  const params = useSearchParams();
  const prefillTxn = params?.get("txn") ?? "";

  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput]       = useState(prefillTxn ? `Explain the fraud decision for transaction ${prefillTxn}` : "");
  const [sending, setSending]   = useState(false);
  const [ungrounded, setUngrounded] = useState(false);
  const [clearFlash, setClearFlash] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);
  useEffect(() => { if (prefillTxn && input) void sendMessage(); }, []); // eslint-disable-line

  async function sendMessage(overrideText?: string): Promise<void> {
    const text = (overrideText ?? input).trim();
    if (!text || sending) return;
    const userMsg: CopilotMessage = { id:uid(), role:"user", content:text, timestamp:new Date() };
    setMessages(m=>[...m, userMsg]);
    setInput(""); setSending(true);
    try {
      const res = await apiClient.post<CopilotAPIResponse>("/copilot/ask", { question: text });
      const d = res.data;
      if (!d.grounded) setUngrounded(true);
      const botMsg: CopilotMessage = { id:uid(), role:"assistant", content:d.answer, sources:d.sources, tool_used:d.tool_used, grounded:d.grounded, timestamp:new Date() };
      setMessages(m=>[...m, botMsg]);
    } catch {
      setMessages(m=>[...m, { id:uid(), role:"assistant", content:"Something went wrong. Please try again.", timestamp:new Date() }]);
    } finally { setSending(false); inputRef.current?.focus(); }
  }

  function handleKey(e:React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); }
  }

  function clearChat(): void {
    setMessages([]);
    setUngrounded(false);
    setInput("");
    setClearFlash(true);
    setTimeout(() => setClearFlash(false), 2000);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"#050608", color:"#F5F6F8", fontFamily:"var(--font-dm-sans,'DM Sans',sans-serif)", position:"relative" }}>

      {/* Header */}
      <div style={{
        padding:"28px 24px 18px", display:"flex", alignItems:"center", gap:14, flexShrink:0,
        background:"rgba(5,6,8,0.9)", backdropFilter:"blur(12px)",
        borderBottom:"1px solid rgba(255,255,255,0.07)", zIndex:10,
      }}>
        {/* Animated logo mark */}
        <div style={{
          width:40, height:40, borderRadius:12, position:"relative", flexShrink:0,
          background:"conic-gradient(from 90deg,#7C5CFF,#39D2FF,#3DDC97,#7C5CFF)",
          display:"flex", alignItems:"center", justifyContent:"center",
          animation:"sp-spin 8s linear infinite",
        }}>
          <div style={{ position:"absolute", inset:2, borderRadius:10, background:"#0D0F14" }}/>
          <span style={{ position:"relative", zIndex:1, fontSize:14, fontWeight:700, color:"#fff", fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>✦</span>
        </div>
        <div>
          <h1 style={{ fontSize:18, fontWeight:700, color:"#F5F6F8", margin:0, fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>AI Copilot</h1>
          <p style={{ fontSize:11, color:"#6B7180", margin:0, fontFamily:"var(--font-ibm-plex-mono,monospace)", letterSpacing:"0.08em" }}>POWERED BY GEMINI</p>
        </div>
        {/* Clear chat button — only show when there are messages */}
        {messages.length > 0 && (
          <button
            id="btn-copilot-clear"
            onClick={clearChat}
            title="Clear conversation"
            style={{
              marginLeft:"auto", background:"rgba(255,255,255,0.05)",
              border:"1px solid rgba(255,255,255,0.09)",
              borderRadius:10, padding:"7px 12px",
              color: clearFlash ? "#3DDC97" : "rgba(255,255,255,0.5)",
              fontSize:12, fontWeight:600, cursor:"pointer",
              fontFamily:"var(--font-ibm-plex-mono,monospace)",
              letterSpacing:"0.05em",
              transition:"color .2s ease, border-color .2s ease",
              borderColor: clearFlash ? "rgba(61,220,151,0.3)" : "rgba(255,255,255,0.09)",
            }}
          >
            {clearFlash ? "✓ CLEARED" : "🗑 CLEAR"}
          </button>
        )}
      </div>

      {/* Ungrounded warning */}
      {ungrounded && (
        <div style={{ padding:"10px 20px", background:"rgba(255,184,77,0.07)", borderBottom:"1px solid rgba(255,184,77,0.18)", display:"flex", gap:10, alignItems:"center", flexShrink:0 }}>
          <span style={{ color:"#FFB84D", fontSize:14 }}>⚠</span>
          <p style={{ fontSize:12, color:"#FFB84D", margin:0, lineHeight:1.4 }}>Some answers are not grounded in your data — responses may be general.</p>
        </div>
      )}

      {/* Messages area */}
      <div style={{ flex:1, overflowY:"auto", padding:"20px 20px 0" }}>
        {messages.length===0 && (
          <div style={{ paddingTop:20 }}>
            <div style={{ textAlign:"center", marginBottom:32 }}>
              <div style={{
                width:64, height:64, margin:"0 auto 16px", borderRadius:20,
                background:"linear-gradient(135deg,#7C5CFF,#39D2FF)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:28,
                boxShadow:"0 12px 32px rgba(124,92,255,.35)",
              }}>✦</div>
              <h2 style={{ fontSize:20, fontWeight:700, color:"#F5F6F8", margin:"0 0 6px", fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>How can I help?</h2>
              <p style={{ fontSize:13, color:"#6B7180", margin:0, lineHeight:1.5 }}>Ask about your transactions, risk score, or security.</p>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {SUGGESTIONS.map(s=>(
                <button key={s} onClick={()=>{ setInput(s); void sendMessage(s); }}
                  style={{
                    textAlign:"left", padding:"14px 18px", borderRadius:14, cursor:"pointer",
                    background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
                    color:"#9198A8", fontSize:13, fontWeight:500, transition:"all .15s ease",
                  }}
                  onMouseEnter={e=>{ (e.currentTarget as HTMLButtonElement).style.borderColor="rgba(124,92,255,0.4)"; (e.currentTarget as HTMLButtonElement).style.color="#F5F6F8"; }}
                  onMouseLeave={e=>{ (e.currentTarget as HTMLButtonElement).style.borderColor="rgba(255,255,255,0.08)"; (e.currentTarget as HTMLButtonElement).style.color="#9198A8"; }}>
                  <span style={{ marginRight:10, opacity:0.5 }}>✦</span>{s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} style={{ marginBottom:16, display:"flex", flexDirection:"column", alignItems:msg.role==="user"?"flex-end":"flex-start" }}>
            {msg.role==="assistant" && (
              <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,#7C5CFF,#39D2FF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#fff", flexShrink:0, marginTop:2 }}>✦</div>
                <div>
                  <div style={{
                    background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)",
                    borderRadius:"4px 18px 18px 18px", padding:"14px 18px", maxWidth:"min(340px,80vw)",
                  }}>
                    <p style={{ fontSize:14, color:"#F5F6F8", margin:0, lineHeight:1.65, whiteSpace:"pre-wrap" }}>{msg.content}</p>
                    {msg.sources && msg.sources.length>0 && (
                      <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid rgba(255,255,255,0.07)" }}>
                        <p style={{ fontSize:10, color:"#6B7180", margin:"0 0 6px", letterSpacing:"0.08em", fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>SOURCES</p>
                        {msg.sources.map(s=><SourceTag key={s} source={s}/>)}
                      </div>
                    )}
                    {msg.tool_used && (
                      <p style={{ fontSize:10, color:"#6B7180", margin:"8px 0 0", fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>
                        TOOL: {msg.tool_used}
                      </p>
                    )}
                  </div>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.25)", margin:"4px 0 0 6px", fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>{formatTime(msg.timestamp)}</p>
                </div>
              </div>
            )}

            {msg.role==="user" && (
              <div>
                <div style={{
                  background:"linear-gradient(135deg,#7C5CFF,#39D2FF)", borderRadius:"18px 4px 18px 18px",
                  padding:"13px 18px", maxWidth:"min(300px,75vw)",
                }}>
                  <p style={{ fontSize:14, color:"#fff", margin:0, lineHeight:1.6 }}>{msg.content}</p>
                </div>
                <p style={{ fontSize:10, color:"rgba(255,255,255,0.25)", margin:"4px 6px 0 0", textAlign:"right", fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>{formatTime(msg.timestamp)}</p>
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:16 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,#7C5CFF,#39D2FF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#fff", flexShrink:0 }}>✦</div>
            <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:"4px 18px 18px 18px", padding:"14px 18px", display:"flex", gap:4 }}>
              {[0,1,2].map(i=><div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#7C5CFF", animation:`sp-bounce .8s ${i*0.15}s ease-in-out infinite` }}/>)}
            </div>
          </div>
        )}

        <div ref={bottomRef}/>
      </div>

      {/* Input bar */}
      <div style={{
        padding:"14px 16px calc(14px + env(safe-area-inset-bottom))",
        background:"rgba(13,15,20,0.92)", backdropFilter:"blur(16px)",
        borderTop:"1px solid rgba(255,255,255,0.07)", flexShrink:0, zIndex:10,
        display:"flex", alignItems:"flex-end", gap:10,
      }}>
        <textarea
          ref={inputRef} id="copilot-input" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey}
          placeholder="Ask about your transactions…" rows={1}
          style={{
            flex:1, resize:"none", overflow:"hidden", background:"rgba(255,255,255,0.05)",
            border:"1px solid rgba(255,255,255,0.12)", borderRadius:14, padding:"12px 16px",
            color:"#F5F6F8", fontSize:14, outline:"none",
            fontFamily:"var(--font-dm-sans,'DM Sans',sans-serif)", lineHeight:1.4,
          }}
          onInput={e=>{ const el=e.currentTarget; el.style.height="auto"; el.style.height=`${el.scrollHeight}px`; }}
        />
        <button id="btn-copilot-send" onClick={()=>void sendMessage()} disabled={!input.trim()||sending}
          style={{
            width:44, height:44, borderRadius:12, border:"none", cursor:!input.trim()||sending?"not-allowed":"pointer", flexShrink:0,
            background: !input.trim()||sending ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#7C5CFF,#39D2FF)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, color:!input.trim()||sending ? "rgba(255,255,255,0.3)" : "#fff",
            transition:"all .15s ease",
          }}>
          ↑
        </button>
      </div>

      <style>{`
        @keyframes sp-spin { to { transform:rotate(360deg); } }
        @keyframes sp-bounce { 0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)} }
        textarea::placeholder{color:rgba(255,255,255,0.3)}
        @media(prefers-reduced-motion:reduce){*{animation-duration:0.01ms!important;transition-duration:0.01ms!important}}
      `}</style>
    </div>
  );
}

export default function CopilotPage(): JSX.Element {
  return <Suspense><CopilotContent/></Suspense>;
}
