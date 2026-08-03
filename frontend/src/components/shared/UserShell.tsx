"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

const PRIMARY_NAV: NavItem[] = [
  { label: "Home",   href: "/home",   icon: "⊞" },
  { label: "Send",   href: "/send",   icon: "↗" },
  { label: "Scan",   href: "/scan",   icon: "◈" },
  { label: "Wallet", href: "/wallet", icon: "💳" },
];

const MORE_ITEMS: NavItem[] = [
  { label: "Analytics", href: "/analytics", icon: "📊" },
  { label: "Contacts",  href: "/contacts",  icon: "👥" },
  { label: "My QR",     href: "/my-qr",     icon: "⬡" },
  { label: "Merchant",  href: "/merchant",  icon: "🏪" },
  { label: "Profile",   href: "/profile",   icon: "👤" },
  { label: "History",   href: "/history",   icon: "🕒" },
  { label: "Copilot",   href: "/copilot",   icon: "🤖" },
];

const SIDEBAR_ITEMS: NavItem[] = [...PRIMARY_NAV, ...MORE_ITEMS];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function UserShell({ children }: Readonly<{ children: React.ReactNode }>): JSX.Element {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const inMore = MORE_ITEMS.some((m) => isActive(pathname, m.href));

  return (
    <>
      <style>{`
        .sp-shell { position:relative; min-height:100vh; background:#050608; color:#F5F6F8; overflow-x:hidden; }
        .sp-glow { position:fixed; pointer-events:none; width:420px; height:420px; opacity:.42; }
        .sp-glow-a { top:-120px; left:-120px; background:radial-gradient(circle,rgba(124,92,255,.38) 0%,rgba(124,92,255,.16) 35%,rgba(5,6,8,0) 70%); }
        .sp-glow-b { right:-160px; bottom:-160px; background:radial-gradient(circle,rgba(57,210,255,.28) 0%,rgba(57,210,255,.12) 35%,rgba(5,6,8,0) 70%); }

        /* ── Mobile bottom bar ── */
        .sp-bottom { display:flex; position:fixed; bottom:0; left:0; right:0; z-index:100; background:rgba(13,15,20,.96); border-top:1px solid rgba(255,255,255,.08); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); padding:6px 4px calc(6px + env(safe-area-inset-bottom)); }
        .sp-tab { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; min-height:54px; color:rgba(255,255,255,.4); text-decoration:none; border-radius:12px; transition:color .15s,background .15s; background:none; border:none; cursor:pointer; font-family:inherit; position:relative; }
        .sp-tab.active { color:#7C5CFF; background:rgba(124,92,255,.1); }
        .sp-tab.active::after { content:''; position:absolute; bottom:0; left:50%; transform:translateX(-50%); width:20px; height:2px; border-radius:2px 2px 0 0; background:#7C5CFF; }
        .sp-tab-icon { font-size:18px; line-height:1; }
        .sp-tab-label { font-size:10px; font-weight:600; letter-spacing:.03em; }

        /* ── More popup ── */
        .sp-more-backdrop { position:fixed; inset:0; z-index:98; background:rgba(0,0,0,.55); backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px); }
        .sp-more-popup { position:fixed; bottom:70px; left:10px; right:10px; z-index:99; background:rgba(13,15,20,.98); border:1px solid rgba(255,255,255,.1); border-radius:20px; padding:16px 10px 12px; box-shadow:0 -16px 48px rgba(0,0,0,.7); display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
        .sp-more-label { grid-column:1/-1; font-size:10px; font-weight:700; color:rgba(255,255,255,.3); letter-spacing:.12em; text-transform:uppercase; margin-bottom:6px; padding-left:4px; }
        .sp-more-item { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:12px 4px; border-radius:14px; text-decoration:none; gap:5px; border:1px solid transparent; transition:background .15s; }
        .sp-more-item.active { background:rgba(124,92,255,.15); border-color:rgba(124,92,255,.3); }
        .sp-more-item-icon { font-size:22px; }
        .sp-more-item-text { font-size:10px; font-weight:600; color:rgba(255,255,255,.5); text-align:center; }
        .sp-more-item.active .sp-more-item-text { color:#7C5CFF; }

        /* ── Content ── */
        .sp-content { position:relative; z-index:1; min-height:100vh; padding-bottom:80px; }

        /* ── Desktop sidebar ── */
        .sp-sidebar { display:none; }

        @media (min-width:1024px) {
          .sp-content { padding-bottom:0; padding-left:240px; }
          .sp-bottom { display:none; }
          .sp-sidebar {
            display:flex; flex-direction:column; align-items:stretch;
            position:fixed; inset:0 auto 0 0; width:240px;
            background:rgba(13,15,20,.92); border-right:1px solid rgba(255,255,255,.08);
            backdrop-filter:blur(22px); -webkit-backdrop-filter:blur(22px);
            padding:18px 0; z-index:50; overflow-y:auto;
          }
          .sp-brand { display:grid; place-items:center; margin:0 auto 20px; }
          .sp-rail { display:flex; flex-direction:column; gap:3px; padding:0 10px; }
          .sp-rail-item { position:relative; display:flex; align-items:center; gap:12px; min-height:46px; padding:0 12px 0 16px; color:rgba(255,255,255,.45); text-decoration:none; border-radius:12px; overflow:hidden; transition:color .15s,background .15s; font-size:13px; font-weight:500; letter-spacing:.01em; font-family:inherit; }
          .sp-rail-item:hover { background:rgba(255,255,255,.05); color:rgba(255,255,255,.8); }
          .sp-rail-item.active { background:rgba(124,92,255,.12); color:#7C5CFF; }
          .sp-rail-accent { position:absolute; left:0; top:8px; bottom:8px; width:3px; border-radius:0 3px 3px 0; background:transparent; }
          .sp-rail-item.active .sp-rail-accent { background:#7C5CFF; }
          .sp-rail-icon { width:22px; flex:0 0 22px; font-size:16px; text-align:center; }
          .sp-section-label { font-size:10px; font-weight:700; color:rgba(255,255,255,.25); letter-spacing:.12em; text-transform:uppercase; padding:14px 22px 6px; }
        }
      `}</style>

      <div className="sp-shell">
        <div className="sp-glow sp-glow-a" aria-hidden="true" />
        <div className="sp-glow sp-glow-b" aria-hidden="true" />

        <main className="sp-content">{children}</main>

        {/* ── Desktop sidebar ── */}
        <aside className="sp-sidebar" aria-label="Primary navigation">
          <div className="sp-brand">
            <div style={{ position:"relative", width:40, height:40, borderRadius:14, background:"conic-gradient(from 90deg,#7C5CFF,#39D2FF,#3DDC97,#7C5CFF)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ position:"absolute", inset:2, borderRadius:11, background:"rgba(13,15,20,0.92)" }} />
              <span style={{ position:"relative", zIndex:1, fontSize:14, fontWeight:800, color:"#fff", fontFamily:"var(--font-space-grotesk,sans-serif)", letterSpacing:"0.01em" }}>S</span>
            </div>
          </div>
          <div className="sp-rail">
            <div className="sp-section-label">Main</div>
            {PRIMARY_NAV.map((item) => (
              <Link key={item.href} href={item.href} className={`sp-rail-item${isActive(pathname, item.href) ? " active" : ""}`}>
                <span className="sp-rail-accent" aria-hidden="true" />
                <span className="sp-rail-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <div className="sp-section-label">More</div>
            {MORE_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className={`sp-rail-item${isActive(pathname, item.href) ? " active" : ""}`}>
                <span className="sp-rail-accent" aria-hidden="true" />
                <span className="sp-rail-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </aside>

        {/* ── Mobile bottom nav ── */}
        <nav className="sp-bottom" aria-label="Primary navigation">

          {/* More popup */}
          {moreOpen && (
            <>
              <div className="sp-more-backdrop" onClick={() => setMoreOpen(false)} />
              <div className="sp-more-popup">
                <div className="sp-more-label">More</div>
                {MORE_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sp-more-item${isActive(pathname, item.href) ? " active" : ""}`}
                    onClick={() => setMoreOpen(false)}
                    id={`nav-more-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    <span className="sp-more-item-icon">{item.icon}</span>
                    <span className="sp-more-item-text">{item.label}</span>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Primary tabs */}
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.label.toLowerCase()}`}
              className={`sp-tab${isActive(pathname, item.href) ? " active" : ""}`}
            >
              <span className="sp-tab-icon">{item.icon}</span>
              <span className="sp-tab-label">{item.label}</span>
            </Link>
          ))}

          {/* More button */}
          <button
            id="nav-more"
            className={`sp-tab${inMore || moreOpen ? " active" : ""}`}
            onClick={() => setMoreOpen((o) => !o)}
          >
            <span className="sp-tab-icon" style={{ fontSize:22, fontWeight:800, lineHeight:1 }}>⋯</span>
            <span className="sp-tab-label">More</span>
          </button>
        </nav>
      </div>
    </>
  );
}