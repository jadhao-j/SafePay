"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { DashIcons } from "@/components/shared/DashIcons";

/* ─── Nav data ──────────────────────────────────────────── */
type NavItem = { label: string; href: string; icon: string };

const PRIMARY_NAV: NavItem[] = [
  { label: "Home",            href: "/home",      icon: "icon-grid"         },
  { label: "Send Money",      href: "/send",       icon: "icon-send"         },
  { label: "Scan & Pay",      href: "/scan",       icon: "icon-scan"         },
  { label: "Add Money",       href: "/wallet",     icon: "icon-add-money"    },
  { label: "Transactions",    href: "/history",    icon: "icon-transactions" },
  { label: "Cards & Accounts",href: "/wallet",     icon: "icon-card"         },
  { label: "Security Vault",  href: "/profile",    icon: "icon-shield"       },
  { label: "Rewards & Hub",   href: "/contacts",   icon: "icon-gift"         },
  { label: "Analytics",       href: "/analytics",  icon: "icon-bar-chart"    },
  { label: "Settings",        href: "/profile",    icon: "icon-settings"     },
];

const MOBILE_PRIMARY: NavItem[] = [
  { label: "Home",   href: "/home",    icon: "icon-grid"  },
  { label: "Send",   href: "/send",    icon: "icon-send"  },
  { label: "Scan",   href: "/scan",    icon: "icon-scan"  },
  { label: "Wallet", href: "/wallet",  icon: "icon-card"  },
];

const MOBILE_MORE: NavItem[] = [
  { label: "Analytics", href: "/analytics", icon: "icon-bar-chart"    },
  { label: "Contacts",  href: "/contacts",  icon: "icon-contacts"     },
  { label: "My QR",     href: "/my-qr",     icon: "icon-scan"         },
  { label: "Merchant",  href: "/merchant",  icon: "icon-bag"          },
  { label: "Profile",   href: "/profile",   icon: "icon-settings"     },
  { label: "History",   href: "/history",   icon: "icon-clock"        },
  { label: "Copilot",   href: "/copilot",   icon: "icon-cpu"          },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

/* ─── Shared icon shorthand ─────────────────────────────── */
function Icon({ id, size = 20 }: { id: string; size?: number }) {
  return (
    <svg width={size} height={size} style={{ display: "block", flexShrink: 0 }}>
      <use href={`#${id}`} />
    </svg>
  );
}

export function UserShell({
  children,
}: Readonly<{ children: React.ReactNode }>): JSX.Element {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const inMore = MOBILE_MORE.some((m) => isActive(pathname, m.href));

  return (
    <>
      {/* ── Shared SVG icon sprite (display:none, zero cost) ── */}
      <DashIcons />

      <style>{`
        /* ─── Shell base ──────────────────────────────── */
        .sp-shell {
          position: relative;
          min-height: 100vh;
          background: var(--bg, #060710);
          color: var(--text-body, #E2E8F0);
          overflow-x: hidden;
        }

        /* ─── Desktop sidebar ─────────────────────────── */
        .sp-sidebar {
          display: none;
        }

        /* ─── Mobile bottom bar ───────────────────────── */
        .sp-bottom {
          display: flex;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 100;
          background: rgba(8,10,18,0.96);
          border-top: 1px solid var(--border, rgba(255,255,255,0.16));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 6px 4px calc(6px + env(safe-area-inset-bottom));
        }
        .sp-tab {
          flex: 1;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 4px; min-height: 54px;
          color: var(--text-muted, #94A3B8);
          text-decoration: none;
          border-radius: 12px;
          transition: color .2s, background .2s;
          background: none; border: none; cursor: pointer;
          font-family: inherit;
          position: relative;
        }
        .sp-tab:hover { color: var(--text-body, #E2E8F0); }
        .sp-tab.active { color: var(--cyan, #06B6D4); background: rgba(6,182,212,0.08); }
        .sp-tab.active::after {
          content: '';
          position: absolute; bottom: 0; left: 50%;
          transform: translateX(-50%);
          width: 20px; height: 2px;
          border-radius: 2px 2px 0 0;
          background: var(--cyan, #06B6D4);
        }
        .sp-tab-label { font-size: 10px; font-weight: 600; letter-spacing: .03em; }

        /* ─── More popup ──────────────────────────────── */
        .sp-more-backdrop {
          position: fixed; inset: 0; z-index: 98;
          background: rgba(0,0,0,.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
        .sp-more-popup {
          position: fixed; bottom: 70px; left: 10px; right: 10px; z-index: 99;
          background: rgba(8,10,18,.98);
          border: 1px solid var(--border, rgba(255,255,255,0.16));
          border-radius: 20px;
          padding: 16px 10px 12px;
          box-shadow: 0 -16px 48px rgba(0,0,0,.7);
          display: grid; grid-template-columns: repeat(4,1fr); gap: 6px;
        }
        .sp-more-label {
          grid-column: 1/-1;
          font-size: 10px; font-weight: 700;
          color: var(--text-faint, #64748B);
          letter-spacing: .12em; text-transform: uppercase;
          margin-bottom: 6px; padding-left: 4px;
        }
        .sp-more-item {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 12px 4px; border-radius: 14px;
          text-decoration: none; gap: 5px;
          border: 1px solid transparent;
          color: var(--text-muted, #94A3B8);
          transition: background .2s, border-color .2s, color .2s;
        }
        .sp-more-item:hover { background: rgba(255,255,255,.04); color: var(--text-body); }
        .sp-more-item.active {
          background: rgba(6,182,212,0.12);
          border-color: rgba(6,182,212,0.3);
          color: var(--cyan, #06B6D4);
        }
        .sp-more-item-text { font-size: 10px; font-weight: 600; text-align: center; }

        /* ─── Content area ────────────────────────────── */
        .sp-content {
          position: relative;
          min-height: 100vh;
          padding-bottom: 80px;
        }

        /* ─── Desktop breakpoint ──────────────────────── */
        @media (min-width: 1024px) {
          .sp-content {
            padding-bottom: 0;
            padding-left: 260px;
          }
          .sp-bottom { display: none; }

          .sp-sidebar {
            display: flex; flex-direction: column;
            position: fixed; inset: 0 auto 0 0; width: 260px;
            background: var(--bg-sidebar, #080a12);
            border-right: 1px solid var(--border, rgba(255,255,255,0.16));
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            padding: 24px 16px;
            z-index: 50;
            overflow-y: auto;
          }

          /* Brand */
          .sp-brand {
            display: flex; align-items: center; gap: 12px;
            padding: 4px 8px 26px;
          }
          .sp-brand-mark {
            width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
            background: linear-gradient(135deg, var(--purple, #8B5CF6), var(--cyan, #06B6D4));
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 4px 20px var(--purple-glow, rgba(139,92,246,0.35));
            color: #060710;
            position: relative;
          }
          .sp-brand-mark::after {
            content: '';
            position: absolute; inset: -1px; border-radius: 13px;
            background: linear-gradient(135deg, rgba(255,255,255,0.4), transparent);
            pointer-events: none;
          }
          .sp-brand-name {
            font-weight: 700; font-size: 18px;
            color: var(--text-main, #FFFFFF);
            letter-spacing: -0.02em;
          }
          .sp-brand-sub {
            font-size: 11px; color: var(--text-muted, #94A3B8);
            font-weight: 500; margin-top: 1px; letter-spacing: 0.04em;
          }

          /* Nav items */
          .sp-rail { display: flex; flex-direction: column; gap: 4px; }
          .sp-rail-item {
            display: flex; align-items: center; gap: 14px;
            padding: 11px 14px;
            border-radius: var(--r-sm, 10px);
            color: var(--text-dim, #CBD5E1);
            font-size: 14px; font-weight: 500;
            position: relative;
            transition: all 0.25s var(--ease, cubic-bezier(0.16,1,0.3,1));
            text-decoration: none; overflow: hidden;
          }
          .sp-rail-item .sp-rail-icon-box {
            width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
            transition: transform 0.3s var(--ease), color 0.25s;
            color: var(--text-muted, #94A3B8);
          }
          .sp-rail-item svg {
            transition: color 0.25s, filter 0.25s;
          }
          .sp-rail-item:hover {
            color: var(--text-main, #FFFFFF);
            background: rgba(255,255,255,0.05);
            transform: translateX(3px);
          }
          .sp-rail-item:hover .sp-rail-icon-box {
            color: var(--cyan, #06B6D4);
            transform: scale(1.1);
          }
          .sp-rail-item:hover svg {
            color: var(--cyan, #06B6D4);
            filter: drop-shadow(0 0 6px var(--cyan-glow, rgba(6,182,212,0.35)));
          }
          .sp-rail-item.active {
            background: linear-gradient(90deg, rgba(6,182,212,0.18), rgba(6,182,212,0.02));
            color: var(--text-main, #FFFFFF);
            font-weight: 600;
            border-left: 3px solid var(--cyan, #06B6D4);
            border-radius: 0 var(--r-sm,10px) var(--r-sm,10px) 0;
          }
          .sp-rail-item.active .sp-rail-icon-box { color: var(--cyan, #06B6D4); }
          .sp-rail-item.active svg {
            color: var(--cyan, #06B6D4);
            filter: drop-shadow(0 0 8px var(--cyan-glow, rgba(6,182,212,0.35)));
          }
          .sp-rail-item:focus-visible {
            outline: none;
            box-shadow: 0 0 0 2px var(--bg, #060710), 0 0 0 4px var(--cyan, #06B6D4);
          }

          /* Security score card */
          .sp-score-card {
            margin-top: auto;
            padding-top: 16px;
          }
          .sp-score-inner {
            background: linear-gradient(145deg, rgba(139,92,246,0.12), rgba(6,182,212,0.05));
            border: 1px solid var(--border-strong, rgba(255,255,255,0.28));
            border-radius: var(--r-md, 14px);
            padding: 16px;
            position: relative; overflow: hidden;
            transition: all 0.3s var(--ease);
          }
          .sp-score-inner:hover {
            transform: translateY(-3px);
            border-color: var(--cyan, #06B6D4);
            box-shadow: 0 8px 24px var(--purple-glow, rgba(139,92,246,0.35));
          }
          .sp-score-top {
            display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
          }
          .sp-score-icon {
            width: 32px; height: 32px; border-radius: 10px; flex-shrink: 0;
            background: linear-gradient(135deg, var(--purple,#8B5CF6), var(--cyan,#06B6D4));
            display: flex; align-items: center; justify-content: center;
            color: #060710;
          }
          .sp-score-label { font-size: 12px; color: var(--text-dim,#CBD5E1); font-weight: 500; }
          .sp-score-value {
            font-size: 20px; font-weight: 700; color: var(--text-main,#FFFFFF);
          }
          .sp-score-value span { color: var(--text-muted,#94A3B8); font-size: 13px; font-weight: 400; }
          .sp-score-bar {
            height: 6px; border-radius: 3px;
            background: rgba(255,255,255,0.12); overflow: hidden;
          }
          .sp-score-fill {
            height: 100%; width: 92%; border-radius: 3px;
            background: linear-gradient(90deg, var(--purple,#8B5CF6), var(--cyan,#06B6D4));
          }
        }
      `}</style>

      <div className="sp-shell">
        <main className="sp-content">{children}</main>

        {/* ── Desktop sidebar ───────────────────────────────── */}
        <aside className="sp-sidebar" aria-label="Primary navigation">
          {/* Brand */}
          <div className="sp-brand">
            <div className="sp-brand-mark">
              <Icon id="icon-shield-check" size={22} />
            </div>
            <div>
              <div className="sp-brand-name">SafePay</div>
              <div className="sp-brand-sub">ENTERPRISE SECURE</div>
            </div>
          </div>

          {/* Nav rail */}
          <nav className="sp-rail">
            {PRIMARY_NAV.map((item) => {
              const active = isActive(pathname, item.href);
              // Avoid duplicate active for wallet/profile hrefs
              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className={`sp-rail-item${active ? " active" : ""}`}
                  id={`sidebar-${item.label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`}
                >
                  <span className="sp-rail-icon-box">
                    <Icon id={item.icon} size={20} />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Security health score card */}
          <div className="sp-score-card">
            <div className="sp-score-inner">
              <div className="sp-score-top">
                <div className="sp-score-icon">
                  <Icon id="icon-check" size={16} />
                </div>
                <div>
                  <div className="sp-score-label">Security Health</div>
                  <div className="sp-score-value">
                    98<span>/100</span>
                  </div>
                </div>
              </div>
              <div className="sp-score-bar">
                <div className="sp-score-fill" />
              </div>
            </div>
          </div>
        </aside>

        {/* ── Mobile bottom nav ─────────────────────────────── */}
        <nav className="sp-bottom" aria-label="Primary navigation">
          {moreOpen && (
            <>
              <div
                className="sp-more-backdrop"
                onClick={() => setMoreOpen(false)}
              />
              <div className="sp-more-popup">
                <div className="sp-more-label">More</div>
                {MOBILE_MORE.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sp-more-item${isActive(pathname, item.href) ? " active" : ""}`}
                    onClick={() => setMoreOpen(false)}
                    id={`nav-more-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    <Icon id={item.icon} size={22} />
                    <span className="sp-more-item-text">{item.label}</span>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Primary tabs */}
          {MOBILE_PRIMARY.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              id={`nav-${tab.label.toLowerCase()}`}
              className={`sp-tab${isActive(pathname, tab.href) ? " active" : ""}`}
            >
              <Icon id={tab.icon} size={20} />
              <span className="sp-tab-label">{tab.label}</span>
            </Link>
          ))}

          {/* More button */}
          <button
            id="nav-more"
            className={`sp-tab${inMore || moreOpen ? " active" : ""}`}
            onClick={() => setMoreOpen((o) => !o)}
          >
            <svg width={20} height={20} viewBox="0 0 24 24">
              <circle cx="5" cy="12" r="1.5" fill="currentColor" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              <circle cx="19" cy="12" r="1.5" fill="currentColor" />
            </svg>
            <span className="sp-tab-label">More</span>
          </button>
        </nav>
      </div>
    </>
  );
}