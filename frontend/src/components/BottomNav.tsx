"use client";

/**
 * BottomNav — v2 dark theme, 5 tabs + Analytics accessible via Profile.
 * Tabs: Home, Send, Scan, Wallet, More (Analytics / Contacts / My QR).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const PRIMARY_TABS = [
  { label: "Home",   href: "/home",    icon: "⊞" },
  { label: "Send",   href: "/send",    icon: "↗" },
  { label: "Scan",   href: "/scan",    icon: "⬡" },
  { label: "Wallet", href: "/wallet",  icon: "💳" },
  { label: "More",   href: null,       icon: "⋯" },
];

const MORE_ITEMS = [
  { label: "Analytics",  href: "/analytics", icon: "📊" },
  { label: "Contacts",   href: "/contacts",  icon: "👥" },
  { label: "My QR",      href: "/my-qr",     icon: "⬡" },
  { label: "Merchant",   href: "/merchant",  icon: "🏪" },
  { label: "Profile",    href: "/profile",   icon: "👤" },
  { label: "History",    href: "/history",   icon: "🕒" },
  { label: "Copilot",    href: "/copilot",   icon: "🤖" },
];

export default function BottomNav(): JSX.Element {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  // Determine if current page is a "More" sub-page
  const moreHrefs = MORE_ITEMS.map((m) => m.href);
  const inMore = moreHrefs.some((h) => pathname === h || pathname.startsWith(h + "/"));

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <>
          <div
            onClick={() => setShowMore(false)}
            style={{ position: "fixed", inset: 0, zIndex: 95 }}
          />
          <div style={{
            position: "fixed", bottom: 72, left: 12, right: 12, zIndex: 100,
            background: "#0D0F14", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 20, padding: "12px 8px",
            boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4,
          }}>
            {MORE_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  id={`nav-more-${item.label.toLowerCase()}`}
                  onClick={() => setShowMore(false)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", padding: "14px 8px", borderRadius: 14,
                    textDecoration: "none", gap: 6,
                    background: isActive ? "rgba(124,92,255,0.15)" : "transparent",
                    border: isActive ? "1px solid rgba(124,92,255,0.3)" : "1px solid transparent",
                  }}
                >
                  <span style={{ fontSize: 22 }}>{item.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? "#7C5CFF" : "#9198A8", letterSpacing: "0.02em" }}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Bottom bar */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(13,15,20,0.96)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        display: "flex", alignItems: "stretch",
        zIndex: 100,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.4)",
      }}>
        {PRIMARY_TABS.map((tab) => {
          if (tab.href === null) {
            // "More" button
            const isActive = inMore || showMore;
            return (
              <button
                key="more"
                id="nav-more"
                onClick={() => setShowMore((s) => !s)}
                style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  padding: "10px 0 14px", background: "none",
                  border: "none", cursor: "pointer", gap: 4, position: "relative",
                  color: isActive ? "#7C5CFF" : "#9198A8",
                  transition: "color 0.15s ease",
                }}
              >
                <span style={{ fontSize: 20, lineHeight: 1, fontWeight: 700 }}>{tab.icon}</span>
                <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, letterSpacing: "0.3px", fontFamily: "var(--font-dm-sans,'DM Sans',sans-serif)" }}>
                  {tab.label}
                </span>
                {isActive && (
                  <span style={{ position: "absolute", bottom: 0, width: 24, height: 3, borderRadius: "3px 3px 0 0", background: "#7C5CFF" }} />
                )}
              </button>
            );
          }

          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              id={`nav-${tab.label.toLowerCase()}`}
              style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: "10px 0 14px", textDecoration: "none",
                color: isActive ? "#7C5CFF" : "#9198A8",
                transition: "color 0.15s ease", gap: 4, position: "relative",
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>{tab.icon}</span>
              <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, letterSpacing: "0.3px", fontFamily: "var(--font-dm-sans,'DM Sans',sans-serif)" }}>
                {tab.label}
              </span>
              {isActive && (
                <span style={{ position: "absolute", bottom: 0, width: 24, height: 3, borderRadius: "3px 3px 0 0", background: "#7C5CFF" }} />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
