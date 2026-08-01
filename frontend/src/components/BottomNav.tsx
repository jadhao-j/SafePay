"use client";

/**
 * BottomNav — mobile-style sticky navigation bar for the (user) group.
 * 5 tabs: Home, Send, Scan, Wallet, Profile.
 * Active tab highlighted in blue with a bottom indicator bar.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Home",    href: "/home",    icon: "⊞" },
  { label: "Send",    href: "/send",    icon: "↗" },
  { label: "Scan",    href: "/scan",    icon: "⬡" },
  { label: "Wallet",  href: "/wallet",  icon: "💳" },
  { label: "Profile", href: "/profile", icon: "👤" },
];

export default function BottomNav(): JSX.Element {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#FFFFFF",
        borderTop: "1px solid #E2E8F0",
        display: "flex",
        alignItems: "stretch",
        zIndex: 100,
        boxShadow: "0 -4px 20px rgba(15,23,42,0.06)",
      }}
    >
      {TABS.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            id={`nav-${tab.label.toLowerCase()}`}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 0 14px",
              textDecoration: "none",
              color: isActive ? "#3B82F6" : "#94A3B8",
              transition: "color 0.15s ease",
              gap: "4px",
            }}
          >
            <span style={{ fontSize: "20px", lineHeight: 1 }}>{tab.icon}</span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: isActive ? 700 : 500,
                letterSpacing: "0.3px",
                fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
              }}
            >
              {tab.label}
            </span>
            {isActive && (
              <span
                style={{
                  position: "absolute",
                  bottom: 0,
                  width: "24px",
                  height: "3px",
                  borderRadius: "3px 3px 0 0",
                  background: "#3B82F6",
                }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
