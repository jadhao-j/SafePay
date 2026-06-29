"use client";

/**
 * AlertRow — single row in the admin fraud alert table.
 * Dark command-center theme. Shows type badge, message, mark-as-read button.
 */
import type { FraudAlert } from "@/lib/fraud-api";

const TYPE_STYLES: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  fraud_block:      { label: "BLOCKED",    color: "#EF4444", bg: "rgba(239,68,68,0.15)",  icon: "🛑" },
  fraud_challenge:  { label: "CHALLENGED", color: "#F59E0B", bg: "rgba(245,158,11,0.15)", icon: "⚠" },
  device_new:       { label: "NEW DEVICE", color: "#00D4FF", bg: "rgba(0,212,255,0.12)",  icon: "📱" },
  security_score_drop: { label: "SCORE DROP", color: "#8B5CF6", bg: "rgba(139,92,246,0.15)", icon: "↓" },
};

interface AlertRowProps {
  alert: FraudAlert;
  onMarkRead: (id: string) => void;
  onOpenExplanation: (txnId: string) => void;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function AlertRow({ alert, onMarkRead, onOpenExplanation }: AlertRowProps): JSX.Element {
  const style = TYPE_STYLES[alert.type] ?? TYPE_STYLES.fraud_challenge;

  return (
    <div
      id={`alert-${alert.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "16px 20px",
        background: alert.is_read ? "transparent" : "rgba(0,212,255,0.03)",
        borderBottom: "1px solid #162840",
        borderLeft: alert.is_read ? "3px solid transparent" : "3px solid #00D4FF",
        transition: "background 0.2s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "rgba(0,212,255,0.06)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = alert.is_read ? "transparent" : "rgba(0,212,255,0.03)";
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          background: style.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
          flexShrink: 0,
        }}
      >
        {style.icon}
      </div>

      {/* Type badge */}
      <div
        style={{
          padding: "4px 10px",
          borderRadius: "999px",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "1px",
          background: style.bg,
          color: style.color,
          flexShrink: 0,
          fontFamily: "var(--font-ibm-plex-mono)",
          border: `1px solid ${style.color}30`,
        }}
      >
        {style.label}
      </div>

      {/* Message */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "13px",
            color: alert.is_read ? "#3D6080" : "#C5D8EF",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {alert.message}
        </div>
        {alert.transaction_id && (
          <div style={{ fontSize: "11px", fontFamily: "var(--font-ibm-plex-mono)", color: "#3D6080", marginTop: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            txn: {alert.transaction_id}
          </div>
        )}
      </div>

      {/* Time */}
      <div style={{ fontSize: "12px", color: "#3D6080", fontFamily: "var(--font-ibm-plex-mono)", flexShrink: 0 }}>
        {formatTime(alert.created_at)}
      </div>

      {/* Unread dot */}
      {!alert.is_read && (
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#00D4FF",
            flexShrink: 0,
            boxShadow: "0 0 6px rgba(0,212,255,0.6)",
          }}
        />
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        {alert.transaction_id && (
          <button
            id={`alert-explain-${alert.id}`}
            onClick={(e) => { e.stopPropagation(); onOpenExplanation(alert.transaction_id!); }}
            style={{
              padding: "5px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              border: "1px solid #00D4FF40",
              background: "rgba(0,212,255,0.08)",
              color: "#00D4FF",
              cursor: "pointer",
            }}
          >
            Explain
          </button>
        )}
        {!alert.is_read && (
          <button
            id={`alert-read-${alert.id}`}
            onClick={(e) => { e.stopPropagation(); onMarkRead(alert.id); }}
            style={{
              padding: "5px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              border: "1px solid #3D6080",
              background: "transparent",
              color: "#3D6080",
              cursor: "pointer",
            }}
          >
            Mark Read
          </button>
        )}
      </div>
    </div>
  );
}
