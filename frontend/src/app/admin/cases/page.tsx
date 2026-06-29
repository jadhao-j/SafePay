"use client";

/**
 * Admin Cases Page — investigation case queue.
 * Dark SOC theme. Lists all open/active cases with status badges.
 * Clicking a row navigates to /admin/cases/[id] for full detail.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CaseStatusBadge, { type CaseStatus } from "@/components/admin/CaseStatusBadge";
import { fetchAlerts, openCase, type FraudAlert } from "@/lib/fraud-api";

// We derive case stubs from the alerts table (since we don't have a case list endpoint,
// the analyst opens cases from alerts — this page shows cases they've opened this session
// plus allows opening new ones from challenged/blocked alerts).

interface CaseStub {
  caseId: string;
  transactionId: string;
  status: CaseStatus;
  alertType: string;
  message: string;
  createdAt: string;
}

export default function AdminCasesPage(): JSX.Element {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [cases, setCases] = useState<CaseStub[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingFor, setOpeningFor] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchAlerts()
      .then(setAlerts)
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleOpenCase(alert: FraudAlert): Promise<void> {
    if (!alert.transaction_id) return;
    setOpeningFor(alert.id);
    try {
      const result = await openCase(alert.transaction_id, `Opened from admin alerts. Alert type: ${alert.type}.`);
      const stub: CaseStub = {
        caseId: result.case_id,
        transactionId: alert.transaction_id,
        status: "open",
        alertType: alert.type,
        message: alert.message,
        createdAt: new Date().toISOString(),
      };
      setCases((prev) => [stub, ...prev]);
    } catch {
      alert.type; // silent — user may lack permission
    } finally {
      setOpeningFor(null);
    }
  }

  const fraudAlerts = alerts.filter(
    (a) => a.type === "fraud_block" || a.type === "fraud_challenge"
  );

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <main
      className="theme-admin"
      style={{
        minHeight: "100vh",
        fontFamily: "var(--font-dm-sans), sans-serif",
        position: "relative",
      }}
    >
      {/* Grid overlay */}
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

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div
          style={{
            background: "rgba(10,22,40,0.95)",
            borderBottom: "1px solid #162840",
            padding: "20px 32px",
            backdropFilter: "blur(8px)",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-bebas-neue), sans-serif",
              fontSize: "32px",
              letterSpacing: "2px",
              color: "#C5D8EF",
              margin: 0,
            }}
          >
            CASE MANAGEMENT
          </h1>
          <p style={{ fontSize: "13px", color: "#3D6080", margin: "4px 0 0", fontFamily: "var(--font-ibm-plex-mono)" }}>
            Investigation queue · {cases.length} active cases
          </p>
        </div>

        <div style={{ padding: "32px", maxWidth: "1100px" }}>
          {/* Active Cases */}
          {cases.length > 0 && (
            <section style={{ marginBottom: "40px" }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "#00D4FF",
                  fontFamily: "var(--font-ibm-plex-mono)",
                  marginBottom: "16px",
                }}
              >
                ● Active Cases
              </div>
              <div
                style={{
                  background: "#0A1628",
                  border: "1px solid #162840",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                {/* Table head */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 2fr 140px 130px 80px",
                    padding: "12px 20px",
                    borderBottom: "1px solid #162840",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    color: "#3D6080",
                    fontFamily: "var(--font-ibm-plex-mono)",
                  }}
                >
                  <span>Case ID</span>
                  <span>Transaction</span>
                  <span>Status</span>
                  <span>Opened</span>
                  <span>Action</span>
                </div>

                {cases.map((c) => (
                  <div
                    key={c.caseId}
                    id={`case-row-${c.caseId}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 2fr 140px 130px 80px",
                      padding: "14px 20px",
                      borderBottom: "1px solid #162840",
                      alignItems: "center",
                      cursor: "pointer",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(0,212,255,0.04)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                    onClick={() => router.push(`/admin/cases/${c.caseId}`)}
                  >
                    <span style={{ fontSize: "12px", fontFamily: "var(--font-ibm-plex-mono)", color: "#00D4FF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.caseId.slice(0, 8)}…
                    </span>
                    <span style={{ fontSize: "12px", fontFamily: "var(--font-ibm-plex-mono)", color: "#3D6080", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.transactionId}
                    </span>
                    <CaseStatusBadge status={c.status} size="sm" />
                    <span style={{ fontSize: "12px", fontFamily: "var(--font-ibm-plex-mono)", color: "#3D6080" }}>
                      {formatDate(c.createdAt)}
                    </span>
                    <span style={{ fontSize: "20px", color: "#3D6080" }}>›</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Alert → Open Case queue */}
          <section>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "#3D6080",
                fontFamily: "var(--font-ibm-plex-mono)",
                marginBottom: "16px",
              }}
            >
              Flagged Transactions — Open for Investigation
            </div>

            {loading && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#3D6080" }}>
                Loading alerts…
              </div>
            )}

            {!loading && fraudAlerts.length === 0 && (
              <div
                style={{
                  background: "#0A1628",
                  border: "1px dashed #162840",
                  borderRadius: "12px",
                  padding: "48px",
                  textAlign: "center",
                  color: "#3D6080",
                  fontFamily: "var(--font-ibm-plex-mono)",
                  fontSize: "13px",
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>✓</div>
                No flagged transactions requiring investigation.
              </div>
            )}

            {!loading && fraudAlerts.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {fraudAlerts.map((alert) => {
                  const isBlock = alert.type === "fraud_block";
                  const alreadyOpen = cases.some((c) => c.transactionId === alert.transaction_id);
                  return (
                    <div
                      key={alert.id}
                      style={{
                        background: "#0A1628",
                        border: `1px solid ${isBlock ? "rgba(239,68,68,0.25)" : "rgba(245,158,11,0.2)"}`,
                        borderLeft: `4px solid ${isBlock ? "#EF4444" : "#F59E0B"}`,
                        borderRadius: "12px",
                        padding: "16px 20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                      }}
                    >
                      {/* Badge */}
                      <div
                        style={{
                          padding: "4px 10px",
                          borderRadius: "999px",
                          fontSize: "10px",
                          fontWeight: 700,
                          letterSpacing: "1px",
                          background: isBlock ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                          color: isBlock ? "#EF4444" : "#F59E0B",
                          flexShrink: 0,
                          fontFamily: "var(--font-ibm-plex-mono)",
                        }}
                      >
                        {isBlock ? "BLOCKED" : "CHALLENGED"}
                      </div>

                      {/* Message */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13px", color: "#C5D8EF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {alert.message}
                        </div>
                        {alert.transaction_id && (
                          <div style={{ fontSize: "11px", fontFamily: "var(--font-ibm-plex-mono)", color: "#3D6080", marginTop: "3px" }}>
                            {alert.transaction_id}
                          </div>
                        )}
                      </div>

                      {/* Time */}
                      <div style={{ fontSize: "12px", color: "#3D6080", fontFamily: "var(--font-ibm-plex-mono)", flexShrink: 0 }}>
                        {formatDate(alert.created_at)}
                      </div>

                      {/* Action */}
                      <button
                        id={`open-case-${alert.id}`}
                        onClick={() => handleOpenCase(alert)}
                        disabled={alreadyOpen || openingFor === alert.id}
                        style={{
                          padding: "7px 16px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: 700,
                          border: "none",
                          background: alreadyOpen
                            ? "rgba(16,185,129,0.15)"
                            : "linear-gradient(135deg, #EF4444, #8B5CF6)",
                          color: alreadyOpen ? "#10B981" : "#FFFFFF",
                          cursor: alreadyOpen || openingFor === alert.id ? "not-allowed" : "pointer",
                          flexShrink: 0,
                          opacity: openingFor === alert.id ? 0.7 : 1,
                        }}
                      >
                        {alreadyOpen ? "✓ Case Open" : openingFor === alert.id ? "Opening…" : "Open Case"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
