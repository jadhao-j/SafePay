"use client";

/**
 * CaseStatusBadge — color-coded fraud case status pill for admin views.
 */

export type CaseStatus = "open" | "investigating" | "confirmed_fraud" | "dismissed" | "closed";

const STATUS_MAP: Record<CaseStatus, { label: string; color: string; bg: string; dot: string }> = {
  open:             { label: "Open",             color: "#00D4FF", bg: "rgba(0,212,255,0.12)",  dot: "#00D4FF" },
  investigating:    { label: "Investigating",    color: "#F59E0B", bg: "rgba(245,158,11,0.12)", dot: "#F59E0B" },
  confirmed_fraud:  { label: "Confirmed Fraud",  color: "#EF4444", bg: "rgba(239,68,68,0.14)",  dot: "#EF4444" },
  dismissed:        { label: "Dismissed",        color: "#3D6080", bg: "rgba(61,96,128,0.15)",  dot: "#3D6080" },
  closed:           { label: "Closed",           color: "#10B981", bg: "rgba(16,185,129,0.12)", dot: "#10B981" },
};

interface CaseStatusBadgeProps {
  status: CaseStatus;
  size?: "sm" | "md";
}

export default function CaseStatusBadge({ status, size = "md" }: CaseStatusBadgeProps): JSX.Element {
  const s = STATUS_MAP[status] ?? STATUS_MAP.open;
  const padding = size === "sm" ? "3px 9px" : "5px 13px";
  const fontSize = size === "sm" ? "10px" : "11px";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding,
        borderRadius: "999px",
        fontSize,
        fontWeight: 700,
        letterSpacing: "0.8px",
        textTransform: "uppercase",
        fontFamily: "var(--font-ibm-plex-mono)",
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.color}30`,
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: s.dot,
          flexShrink: 0,
          boxShadow: status === "open" || status === "investigating" ? `0 0 5px ${s.dot}` : "none",
        }}
      />
      {s.label}
    </span>
  );
}
