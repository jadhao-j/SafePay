"use client";

/**
 * Admin Copilot Page — v2 premium dark SOC edition
 * Analyst-level AI chat with full DB grounding via askCopilot.
 * Same visual language as user copilot but dark navy SOC palette.
 */

import { useEffect, useRef, useState } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { askCopilot, type CopilotAnswer } from "@/lib/admin-api";

interface Message {
  id:string; role:"user"|"copilot"; text:string;
  sources?:string[]; tool_used?:string|null; grounded?:boolean;
  timestamp:Date; loading?:boolean;
}

const QUICK_PROMPTS = [
  { icon:"🚫", label:"Fraud Patterns",         text:"What are the top fraud patterns in the last 24h?" },
  { icon:"📊", label:"Risk Distribution",      text:"Show me the risk score distribution breakdown." },
  { icon:"⚡", label:"High-Risk Users",        text:"Which users have the lowest behavioral trust scores?" },
  { icon:"⚠", label:"Blocked Transactions",   text:"Summarize all blocked transactions today." },
];

const TOOL_LABELS: Record<string,string> = {
  explain_transaction:"Transaction Explanation",
  get_fraud_score:"Fraud Score Lookup",
  get_user_behavior:"Behavioral Analysis",
  search_transactions:"Transaction Search",
};

function uid() { return Math.random().toString(36).slice(2,10); }
function fmtTime(d:Date) { return d.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}); }

function SourceTag({ s }:{ s:string }): JSX.Element {
  const colors: Record<string,{bg:string;c:string}> = {
    transaction:{bg:"rgba(0,212,255,0.08)",c:"var(--admin-cyan)"},
    fraud_score:{bg:"rgba(239,68,68,0.08)",c:"var(--admin-red)"},
    fraud_explanation:{bg:"rgba(139,92,246,0.08)",c:"var(--admin-violet)"},
    alert:{bg:"rgba(245,158,11,0.08)",c:"var(--admin-amber)"},
  };
  const [type] = s.split(":");
  const cl = colors[type]??{bg:"rgba(255,255,255,0.04)",c:"var(--admin-dim)"};
  return <span style={{ display:"inline-flex",alignItems:"center",padding:"2px 8px",borderRadius:999,background:cl.bg,color:cl.c,fontSize:10,fontWeight:600,fontFamily:"var(--font-ibm-plex-mono,monospace)",letterSpacing:"0.05em",margin:"0 4px 4px 0" }}>{s}</span>;
}

export default function AdminCopilotPage(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [sending, setSending]   = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  async function sendMessage(overrideText?:string): Promise<void> {
    const text=(overrideText??input).trim();
    if(!text||sending) return;
    const userMsg:Message={id:uid(),role:"user",text,timestamp:new Date()};
    const loaderId=uid();
    const loaderMsg:Message={id:loaderId,role:"copilot",text:"",loading:true,timestamp:new Date()};
    setMessages(m=>[...m,userMsg,loaderMsg]);
    setInput(""); setSending(true);
    try {
      const res:CopilotAnswer = await askCopilot(text);
      setMessages(m=>m.map(msg=>msg.id===loaderId?{id:uid(),role:"copilot",text:res.answer,sources:res.sources,tool_used:res.tool_used,grounded:res.grounded,timestamp:new Date()}:msg));
    } catch {
      setMessages(m=>m.map(msg=>msg.id===loaderId?{id:uid(),role:"copilot",text:"Connection error. Please try again.",timestamp:new Date()}:msg));
    } finally { setSending(false); inputRef.current?.focus(); }
  }

  function handleKey(e:React.KeyboardEvent<HTMLTextAreaElement>): void {
    if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void sendMessage();}
  }

  return (
    <AdminPageShell active="/admin/copilot" title="SOC Copilot" subtitle="Powered by Gemini · Grounded in fraud DB">
      <div style={{ display:"flex",flexDirection:"column",height:"calc(100vh - 140px)" }}>
        {/* Messages */}
        <div style={{ flex:1,overflowY:"auto",paddingBottom:16 }}>
          {messages.length===0 && (
            <div style={{ paddingTop:20 }}>
              <div style={{ textAlign:"center",marginBottom:28 }}>
                <div style={{ width:56,height:56,margin:"0 auto 14px",borderRadius:16,background:"conic-gradient(from 90deg,#7C5CFF,#39D2FF,#3DDC97,#7C5CFF)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,animation:"sp-spin 8s linear infinite",position:"relative" }}>
                  <div style={{ position:"absolute",inset:3,borderRadius:13,background:"var(--admin-card)" }}/>
                  <span style={{ position:"relative",zIndex:1,color:"#fff",fontWeight:700 }}>✦</span>
                </div>
                <p style={{ color:"var(--admin-text)",fontSize:16,fontWeight:600,margin:"0 0 4px",fontFamily:"var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>Ask the SOC Copilot</p>
                <p style={{ color:"var(--admin-dim)",fontSize:12,margin:0,fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>Grounded answers from your fraud intelligence database</p>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                {QUICK_PROMPTS.map(p=>(
                  <button key={p.label} onClick={()=>void sendMessage(p.text)}
                    style={{ textAlign:"left",padding:"14px 16px",borderRadius:12,cursor:"pointer",background:"var(--admin-card)",border:"1px solid var(--admin-border)",color:"var(--admin-dim)",fontSize:12,fontWeight:500,transition:"all .15s ease" }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="var(--admin-cyan)";(e.currentTarget as HTMLButtonElement).style.color="var(--admin-text)";}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="var(--admin-border)";(e.currentTarget as HTMLButtonElement).style.color="var(--admin-dim)";}}>
                    <span style={{ marginRight:8 }}>{p.icon}</span>{p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg=>(
            <div key={msg.id} style={{ marginBottom:14,display:"flex",flexDirection:"column",alignItems:msg.role==="user"?"flex-end":"flex-start" }}>
              {msg.role==="copilot" && (
                <div style={{ display:"flex",gap:8,alignItems:"flex-start" }}>
                  <div style={{ width:26,height:26,borderRadius:7,background:"linear-gradient(135deg,#7C5CFF,#39D2FF)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",flexShrink:0,marginTop:2 }}>✦</div>
                  <div>
                    <div style={{ background:"var(--admin-card)",border:"1px solid var(--admin-border)",borderRadius:"4px 14px 14px 14px",padding:"14px 18px",maxWidth:"min(600px,80vw)" }}>
                      {msg.loading ? (
                        <div style={{ display:"flex",gap:4,alignItems:"center" }}>
                          {[0,1,2].map(i=><div key={i} style={{ width:6,height:6,borderRadius:"50%",background:"var(--admin-cyan)",animation:`sp-bounce .8s ${i*0.15}s ease-in-out infinite` }}/>)}
                        </div>
                      ) : (
                        <>
                          <p style={{ fontSize:13,color:"var(--admin-text)",margin:0,lineHeight:1.65,whiteSpace:"pre-wrap" }}>{msg.text}</p>
                          {msg.sources&&msg.sources.length>0&&(
                            <div style={{ marginTop:10,paddingTop:10,borderTop:"1px solid var(--admin-border)" }}>
                              <p style={{ fontSize:9,color:"var(--admin-dim)",margin:"0 0 6px",letterSpacing:"0.08em",fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>SOURCES</p>
                              {msg.sources.map(s=><SourceTag key={s} s={s}/>)}
                            </div>
                          )}
                          {msg.tool_used&&<p style={{ fontSize:9,color:"var(--admin-dim)",margin:"6px 0 0",fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>TOOL: {TOOL_LABELS[msg.tool_used]??msg.tool_used}</p>}
                          {msg.grounded===false&&<p style={{ fontSize:9,color:"var(--admin-amber)",margin:"4px 0 0",fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>⚠ NOT GROUNDED IN DB</p>}
                        </>
                      )}
                    </div>
                    <p style={{ fontSize:9,color:"rgba(255,255,255,0.2)",margin:"3px 0 0 6px",fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>{fmtTime(msg.timestamp)}</p>
                  </div>
                </div>
              )}
              {msg.role==="user" && (
                <div>
                  <div style={{ background:"linear-gradient(135deg,#7C5CFF,#39D2FF)",borderRadius:"14px 4px 14px 14px",padding:"12px 18px",maxWidth:"min(500px,75vw)" }}>
                    <p style={{ fontSize:13,color:"#fff",margin:0,lineHeight:1.6 }}>{msg.text}</p>
                  </div>
                  <p style={{ fontSize:9,color:"rgba(255,255,255,0.2)",margin:"3px 6px 0 0",textAlign:"right",fontFamily:"var(--font-ibm-plex-mono,monospace)" }}>{fmtTime(msg.timestamp)}</p>
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef}/>
        </div>

        {/* Input bar */}
        <div style={{ borderTop:"1px solid var(--admin-border)",paddingTop:14,display:"flex",gap:10,alignItems:"flex-end" }}>
          <textarea ref={inputRef} id="copilot-admin-input" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey}
            placeholder="Ask about transactions, fraud scores, behavioral patterns…" rows={1}
            style={{ flex:1,resize:"none",overflow:"hidden",background:"var(--admin-card)",border:"1px solid var(--admin-border)",borderRadius:12,padding:"12px 16px",color:"var(--admin-text)",fontSize:13,outline:"none",fontFamily:"var(--font-dm-sans,'DM Sans',sans-serif)",lineHeight:1.4 }}
            onInput={e=>{const el=e.currentTarget;el.style.height="auto";el.style.height=`${el.scrollHeight}px`;}}/>
          <button id="btn-admin-copilot-send" onClick={()=>void sendMessage()} disabled={!input.trim()||sending}
            style={{ width:44,height:44,borderRadius:10,border:"none",flexShrink:0,cursor:!input.trim()||sending?"not-allowed":"pointer",background:!input.trim()||sending?"var(--admin-card)":"linear-gradient(135deg,#7C5CFF,#39D2FF)",color:!input.trim()||sending?"var(--admin-dim)":"#fff",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s ease" }}>↑</button>
        </div>
      </div>
      <style>{`@keyframes sp-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}textarea::placeholder{color:var(--admin-dim)}`}</style>
    </AdminPageShell>
  );
}
