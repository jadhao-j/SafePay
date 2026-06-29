"use client";

/**
 * Admin Alerts Page — dark SOC theme.
 * Shows all fraud alerts with type, message, read state.
 * Supports mark-as-read and inline explanation modal.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AlertRow from "@/components/admin/AlertRow";
import ExplanationPanel from "@/components/user/ExplanationPanel";
import {
  fetchAlerts,
  markAlertRead,
  fetchExplanation,
  type FraudAlert,
  type TransactionExplanation,
} from "@/lib/fraud-api";

export default function AdminAlertsPage(): JSX.Element {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "fraud_block" | "fraud_challenge">("all");
  const [explanation, setExplanation] = useState<TransactionExplanation | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [drawerTxnId, setDrawerTxnId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchAlerts()
      .then(setAlerts)
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleMarkRead(id: string): Promise<void> {
    await markAlertRead(id).catch(() => null);
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_read: true } : a))
    );
  }

  async function handleOpenExplanation(txnId: string): Promise<void> {
    setDrawerTxnId(txnId);
    setExplanation(null);
    setExplanationLoading(true);
    try {
      const exp = await fetchExplanation(txnId);
      setExplanation(exp);
    } catch {
      setExplanation(null);
    } finally {
      setExplanationLoading(false);
    }
  }

  function handleMarkAllRead(): void {
    const unread = alerts.filter((a) => !a.is_read);
    Promise.allSettled(unread.map((a) => markAlertRead(a.id))).then(() => {
      setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    });
  }

  const filtered = alerts.filter((a) => {
    if (filter === "unread") return !a.is_read;
    if (filter === "fraud_block") return a.type === "fraud_block";
    if (filter === "fraud_challenge") return a.type === "fraud_challenge";
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <main
      className="theme-admin"
      style={{
        minHeight: "100vh",
        fontFamily: "var(--font-dm-sans), sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Animated grid background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1, flex: 1 }}>
        {/* Header */}
        <div
          style={{
            background: "rgba(10,22,40,0.95)",
            borderBottom: "1px solid #162840",
            padding: "20px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backdropFilter: "blur(8px)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h1
                style={{
                  fontFamily: "var(--font-bebas-neue), sans-serif",
                  fontSize: "32px",
                  letterSpacing: "2px",
                  color: "#C5D8EF",
                  margin: 0,
                }}
              >
                FRAUD ALERTS
              </h1>
              {unreadCount > 0 && (
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: 700,
                    background: "rgba(239,68,68,0.2)",
                    color: "#EF4444",
                    fontFamily: "var(--font-ibm-plex-mono)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    animation: "pulse 2s infinite",
                  }}
                >
                  {unreadCount} NEW
                </span>
              )}
            </div>
            <p style={{ fontSize: "13px", color: "#3D6080", margin: "4px 0 0", fontFamily: "var(--font-ibm-plex-mono)" }}>
              {alerts.length} total · {unreadCount} unread
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {/* Filter pills */}
            {(["all", "unread", "fraud_block", "fraud_challenge"] as const).map((f) => (
              <button
                key={f}
                id={`filter-${f}`}
                onClick={() => setFilter(f)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 600,
                  border: filter === f ? "none" : "1px solid #162840",
                  background: filter === f ? "#00D4FF" : "transparent",
                  color: filter === f ? "#04080F" : "#3D6080",
                  cursor: "pointer",
                  fontFamily: "var(--font-ibm-plex-mono)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {f === "fraud_block" ? "Blocked" : f === "fraud_challenge" ? "Challenged" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            {unreadCount > 0 && (
              <button
                id="btn-mark-all-read"
                onClick={handleMarkAllRead}
                style={{
                  padding: "6px 14px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 600,
                  border: "1px solid #162840",
                  background: "transparent",
                  color: "#3D6080",
                  cursor: "pointer",
                }}
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Two-column layout when drawer open */}
        <div style={{ display: "flex", height: "calc(100vh - 81px)" }}>
          {/* Alert list */}
          <div
            style={{
              flex: drawerTxnId ? "0 0 50%" : "1",
              overflowY: "auto",
              borderRight: drawerTxnId ? "1px solid #162840" : "none",
              transition: "flex 0.3s ease",
            }}
          >
            {loading && (
              <div style={{ textAlign: "center", padding: "80px 0", color: "#3D6080" }}>
                <div style={{ fontSize: "28px", marginBottom: "12px" }}>⟳</div>
                Loading alerts…
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "80px 0", color: "#3D6080" }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>✓</div>
                <div style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>No alerts in this category</div>
              </div>
            )}

            {!loading && filtered.length > 0 &&
              filtered.map((alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  onMarkRead={handleMarkRead}
                  onOpenExplanation={handleOpenExplanation}
                />
              ))}
          </div>

          {/* Explanation drawer */}
          {drawerTxnId && (
            <div
              style={{
                flex: "0 0 50%",
                overflowY: "auto",
                padding: "24px",
                background: "#04080F",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "#3D6080", fontFamily: "var(--font-ibm-plex-mono)" }}>
                  AI Explanation
                </div>
                <button
                  id="btn-close-drawer"
                  onClick={() => { setDrawerTxnId(null); setExplanation(null); }}
                  style={{ background: "none", border: "1px solid #162840", borderRadius: "6px", padding: "4px 10px", color: "#3D6080", cursor: "pointer", fontSize: "14px" }}
                >
                  ✕
                </button>
              </div>

              {explanationLoading && (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#3D6080" }}>
                  <div style={{ fontSize: "24px", marginBottom: "8px" }}>⟳</div>
                  Fetching SHAP analysis…
                </div>
              )}

              {!explanationLoading && explanation && (
                <ExplanationPanel data={explanation} />
              )}

              {!explanationLoading && !explanation && (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#3D6080", fontFamily: "var(--font-ibm-plex-mono)", fontSize: "13px" }}>
                  No explanation available for this transaction.
                </div>
              )}

              {/* Link to full detail */}
              <div style={{ marginTop: "20px", textAlign: "center" }}>
                <button
                  id="btn-view-full"
                  onClick={() => router.push(`/admin/cases/${drawerTxnId}`)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                    border: "1px solid #162840",
                    background: "transparent",
                    color: "#00D4FF",
                    cursor: "pointer",
                  }}
                >
                  View Full Transaction →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </main>
  );
}
