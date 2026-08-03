"use client";

/**
 * NotificationBell — Phase 11A
 * Bell icon with unread badge + slide-in drawer of notifications.
 * Drop this into any page header.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  ref_id: string | null;
  created_at: string;
}

const TYPE_ICON: Record<string, string> = {
  payment_success:    "✅",
  payment_challenged: "🔐",
  payment_blocked:    "🚫",
  fraud_alert:        "⚠️",
  pin_changed:        "🔑",
  device_revoked:     "📱",
  security_alert:     "🛡️",
  system:             "ℹ️",
};

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const drawerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiClient.get<{ notifications: Notification[]; unread_count: number }>("/notifications/");
      setNotifications(res.data.notifications);
      setUnread(res.data.unread_count);
    } catch {
      // silently fail — bell is non-critical
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close drawer on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function handleOpen() {
    setOpen((o) => !o);
    if (!open && unread > 0) {
      // Mark all as read when drawer opens
      try {
        await apiClient.patch("/notifications/read-all");
        setUnread(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      } catch { /* ignore */ }
    }
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        id="btn-notification-bell"
        onClick={handleOpen}
        style={{
          width: 40, height: 40, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)",
          background: open ? "rgba(124,92,255,0.15)" : "rgba(255,255,255,0.05)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, position: "relative", transition: "all .15s ease",
        }}
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: "absolute", top: 6, right: 6,
            width: 8, height: 8, borderRadius: "50%",
            background: "#FF5C5C", border: "1.5px solid #050608",
            animation: "sp-pulse 2s infinite",
          }} />
        )}
      </button>

      {/* Drawer */}
      {open && (
        <div
          ref={drawerRef}
          style={{
            position: "absolute", top: "calc(100% + 10px)", right: 0,
            width: "min(340px, 90vw)",
            background: "#0D0F14", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16, boxShadow: "0 24px 48px rgba(0,0,0,.6)",
            zIndex: 200, overflow: "hidden",
            animation: "sp-slideDown .15s ease",
          }}
        >
          {/* Header */}
          <div style={{
            padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#F5F6F8" }}>Notifications</span>
            {notifications.length > 0 && (
              <button
                onClick={async () => {
                  await apiClient.patch("/notifications/read-all").catch(() => {});
                  setUnread(0);
                  setNotifications((p) => p.map((n) => ({ ...n, read: true })));
                }}
                style={{
                  fontSize: 11, color: "#7C5CFF", background: "none", border: "none",
                  cursor: "pointer", fontWeight: 600, letterSpacing: "0.05em",
                }}
              >
                MARK ALL READ
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "32px 18px", textAlign: "center", color: "#6B7180", fontSize: 13 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)",
                    display: "flex", gap: 12, alignItems: "flex-start",
                    background: n.read ? "transparent" : "rgba(124,92,255,0.05)",
                    transition: "background .2s",
                  }}
                >
                  <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>
                    {TYPE_ICON[n.type] ?? "ℹ️"}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#F5F6F8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {n.title}
                      </span>
                      {!n.read && (
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#7C5CFF", flexShrink: 0 }} />
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: "#9198A8", margin: "2px 0 4px", lineHeight: 1.4 }}>{n.body}</p>
                    <span style={{ fontSize: 10, color: "#6B7180", fontFamily: "monospace" }}>{timeAgo(n.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes sp-slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}
