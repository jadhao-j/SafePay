"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/home", icon: "\u2302" },
  { label: "Send", href: "/send", icon: "\u2197" },
  { label: "Scan", href: "/scan", icon: "\u25C8" },
  { label: "Wallet", href: "/wallet", icon: "\u25AB" },
  { label: "Profile", href: "/profile", icon: "\u25D4" }
];

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function UserShell({ children }: Readonly<{ children: React.ReactNode }>): JSX.Element {
  const pathname = usePathname();

  return (
    <div className="user-shell">
      <div className="grain" aria-hidden="true" />
      <div className="glow user-shell-glow user-shell-glow-a" aria-hidden="true" />
      <div className="glow user-shell-glow user-shell-glow-b" aria-hidden="true" />

      <div className="user-shell__frame">
        <main className="user-shell__content">{children}</main>

        <nav className="user-shell__nav user-shell__nav--mobile" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`user-shell__tab${active ? " is-active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <span className="user-shell__icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="user-shell__label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <aside className="user-shell__nav user-shell__nav--desktop" aria-label="Primary">
          <div className="user-shell__brand" aria-hidden="true">
            <div style={{ position:"relative", width:40, height:40, borderRadius:14, background:"conic-gradient(from 90deg,#7C5CFF,#39D2FF,#3DDC97,#7C5CFF)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ position:"absolute", inset:2, borderRadius:11, background:"rgba(13,15,20,0.92)" }}/>
              <span style={{ position:"relative", zIndex:1, fontSize:14, fontWeight:800, color:"#fff", fontFamily:"var(--font-space-grotesk, sans-serif)", letterSpacing:"0.01em" }}>S</span>
            </div>
          </div>
          <div className="user-shell__rail">
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`user-shell__rail-item${active ? " is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="user-shell__rail-accent" aria-hidden="true" />
                  <span className="user-shell__rail-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="user-shell__rail-label">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </aside>
      </div>

      <style jsx>{`
        .user-shell {
          position: relative;
          min-height: 100vh;
          background: var(--ink);
          color: var(--white);
          overflow-x: hidden;
        }

        .user-shell__frame {
          position: relative;
          min-height: 100vh;
        }

        .user-shell__content {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          padding-bottom: 92px;
        }

        .user-shell__nav {
          position: fixed;
          left: 0;
          right: 0;
          z-index: 20;
        }

        .user-shell__nav--mobile {
          display: flex;
          bottom: 0;
          gap: 0;
          padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
          background: rgba(13, 15, 20, 0.88);
          border-top: 1px solid var(--line);
          backdrop-filter: blur(22px);
        }

        .user-shell__tab {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 60px;
          color: var(--dim-2);
          text-decoration: none;
          border-radius: 16px;
          transition: color 180ms ease, background-color 180ms ease, transform 180ms ease;
        }

        .user-shell__tab.is-active {
          color: var(--acc-2);
          background: rgba(57, 210, 255, 0.08);
        }

        .user-shell__icon {
          font-size: 18px;
          line-height: 1;
        }

        .user-shell__label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        .user-shell__nav--desktop {
          display: none;
        }

        .user-shell-glow {
          width: 420px;
          height: 420px;
          opacity: 0.42;
        }

        .user-shell-glow-a {
          top: -120px;
          left: -120px;
          background: radial-gradient(circle, rgba(124, 92, 255, 0.38) 0%, rgba(124, 92, 255, 0.16) 35%, rgba(5, 6, 8, 0) 70%);
        }

        .user-shell-glow-b {
          right: -160px;
          bottom: -160px;
          background: radial-gradient(circle, rgba(57, 210, 255, 0.28) 0%, rgba(57, 210, 255, 0.12) 35%, rgba(5, 6, 8, 0) 70%);
        }

        @media (prefers-reduced-motion: reduce) {
          .user-shell__tab,
          .user-shell__rail-item {
            transition: none;
          }
        }

        @media (min-width: 1024px) {
          .user-shell__content {
            padding-bottom: 0;
            padding-left: 240px;
            min-height: 100vh;
          }

          .user-shell__nav--mobile {
            display: none;
          }

          .user-shell__nav--desktop {
            display: flex;
            inset: 0 auto 0 0;
            width: 240px;
            flex-direction: column;
            align-items: stretch;
            padding: 18px 0;
            background: rgba(13, 15, 20, 0.9);
            border-right: 1px solid var(--line);
            backdrop-filter: blur(22px);
          }

          .user-shell__brand {
            display: grid;
            place-items: center;
            width: 52px;
            height: 52px;
            margin: 0 auto 18px;
            border-radius: 14px;
          }

          .user-shell__rail {
            display: flex;
            flex-direction: column;
            gap: 6px;
            padding: 0 10px;
          }

          .user-shell__rail-item {
            position: relative;
            display: flex;
            align-items: center;
            gap: 12px;
            min-height: 52px;
            padding: 0 12px 0 16px;
            color: var(--dim-2);
            text-decoration: none;
            border-radius: 16px;
            overflow: hidden;
            transition: color 180ms ease, background-color 180ms ease, transform 180ms ease;
          }

          .user-shell__rail-item:hover {
            background: rgba(255, 255, 255, 0.04);
          }

          .user-shell__rail-item.is-active {
            background: rgba(57, 210, 255, 0.08);
            color: var(--acc-2);
          }

          .user-shell__rail-accent {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 3px;
            background: transparent;
          }

          .user-shell__rail-item.is-active .user-shell__rail-accent {
            background: var(--acc);
          }

          .user-shell__rail-icon {
            width: 24px;
            flex: 0 0 24px;
            font-size: 18px;
            text-align: center;
            color: inherit;
          }

          .user-shell__rail-label {
            font-size: 13px;
            font-weight: 500;
            letter-spacing: 0.01em;
            white-space: nowrap;
          }
        }
      `}</style>
    </div>
  );
}