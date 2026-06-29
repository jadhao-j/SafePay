"use client";

/**
 * Admin Case Detail Page — full investigation case view.
 * Shows case status, analyst controls (status update + notes),
 * and the full SHAP explanation panel for the linked transaction.
 */
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CaseStatusBadge, { type CaseStatus } from "@/components/admin/CaseStatusBadge";
import ExplanationPanel from "@/components/user/ExplanationPanel";
import {
  fetchCase,
  updateCase,
  fetchExplanation,
  type FraudCase,
  type TransactionExplanation,
} from "@/lib/fraud-api";

const STATUS_FLOW: CaseStatus[] = [
  "open",
  "investigating",
  "confirmed_fraud",
  "dismissed",
  "closed",
];

const STATUS_DESCRIPTIONS: Record<CaseStatus, string> = {
  open: "Case is open and awaiting assignment.",
  investigating: "Analyst is actively reviewing signals.",
  confirmed_fraud: "Fraud confirmed. Blockchain signal publishing recommended.",
  dismissed: "Alert was a false positive. No action needed.",
  closed: "Investigation complete. Case archived.",
};

export default function AdminCaseDetailPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const caseId = params?.id as string;

  const [caseData, setCaseData] = useState<FraudCase | null>(null);
  const [explanation, setExplanation] = useState<TransactionExplanation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<CaseStatus>("open");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) return;
    fetchCase(caseId)
      .then(async (c) => {
        setCaseData(c);
        setNotes(c.notes ?? "");
        setSelectedStatus(c.status as CaseStatus);
        // Load explanation for the linked transaction
        const exp = await fetchExplanation(c.transaction_id).catch(() => null);
        setExplanation(exp);
      })
      .catch(() => setError("Could not load case. It may not exist or you lack permissions."))
      .finally(() => setLoading(false));
  }, [caseId]);

  async function handleSave(): Promise<void> {
    if (!caseData) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const updated = await updateCase(caseId, {
        status: selectedStatus,
        notes,
      });
      setCaseData(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setError("Failed to update case. Check your permissions.");
    } finally {
      setSaving(false);
    }
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
        {/* Topbar */}
        <div
          style={{
            background: "rgba(10,22,40,0.95)",
            borderBottom: "1px solid #162840",
            padding: "16px 32px",
            display: "flex",
            alignItems: "center",
            gap: "20px",
            backdropFilter: "blur(8px)",
          }}
        >
          <button
            id="btn-back"
            onClick={() => router.back()}
            style={{
              background: "none",
              border: "1px solid #162840",
              borderRadius: "8px",
              padding: "6px 14px",
              fontSize: "13px",
              cursor: "pointer",
              color: "#3D6080",
            }}
          >
            ← Cases
          </button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span
                style={{
                  fontFamily: "var(--font-bebas-neue)",
                  fontSize: "24px",
                  letterSpacing: "2px",
                  color: "#C5D8EF",
                }}
              >
                CASE DETAIL
              </span>
              {caseData && <CaseStatusBadge status={caseData.status as CaseStatus} />}
            </div>
            <div style={{ fontSize: "11px", fontFamily: "var(--font-ibm-plex-mono)", color: "#3D6080" }}>
              ID: {caseId}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "32px", maxWidth: "1100px", margin: "0 auto" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "80px 0", color: "#3D6080" }}>
              <div style={{ fontSize: "28px", marginBottom: "12px" }}>⟳</div>
              Loading case…
            </div>
          )}

          {error && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", padding: "20px", color: "#EF4444", textAlign: "center" }}>
              {error}
            </div>
          )}

          {!loading && caseData && (
            <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "24px", alignItems: "start" }}>
              {/* Left: Case controls */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Case info */}
                <div
                  style={{
                    background: "#0A1628",
                    border: "1px solid #162840",
                    borderRadius: "12px",
                    padding: "20px",
                  }}
                >
                  <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#3D6080", fontFamily: "var(--font-ibm-plex-mono)", marginBottom: "16px" }}>
                    Case Information
                  </div>

                  {[
                    { label: "Case ID", value: caseId.slice(0, 8) + "…" },
                    { label: "Transaction ID", value: caseData.transaction_id },
                    { label: "Current Status", value: caseData.status },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #162840" }}>
                      <span style={{ fontSize: "12px", color: "#3D6080" }}>{label}</span>
                      <span style={{ fontSize: "12px", fontFamily: "var(--font-ibm-plex-mono)", color: "#C5D8EF", maxWidth: "55%", textAlign: "right", wordBreak: "break-all" }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Status update */}
                <div
                  style={{
                    background: "#0A1628",
                    border: "1px solid #162840",
                    borderRadius: "12px",
                    padding: "20px",
                  }}
                >
                  <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#3D6080", fontFamily: "var(--font-ibm-plex-mono)", marginBottom: "16px" }}>
                    Update Status
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                    {STATUS_FLOW.map((s) => (
                      <button
                        key={s}
                        id={`status-${s}`}
                        onClick={() => setSelectedStatus(s)}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: 600,
                          border: selectedStatus === s ? "none" : "1px solid #162840",
                          background: selectedStatus === s ? "rgba(0,212,255,0.12)" : "transparent",
                          color: selectedStatus === s ? "#00D4FF" : "#3D6080",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.15s ease",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        {selectedStatus === s && <span style={{ color: "#00D4FF" }}>●</span>}
                        {selectedStatus !== s && <span style={{ color: "#162840" }}>○</span>}
                        <CaseStatusBadge status={s} size="sm" />
                      </button>
                    ))}
                  </div>

                  <div style={{ fontSize: "12px", color: "#3D6080", fontStyle: "italic", marginBottom: "16px", padding: "10px", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
                    {STATUS_DESCRIPTIONS[selectedStatus]}
                  </div>

                  {/* Notes */}
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "#3D6080", display: "block", marginBottom: "8px" }}>
                      Analyst Notes
                    </label>
                    <textarea
                      id="case-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      placeholder="Add investigation notes…"
                      style={{
                        width: "100%",
                        borderRadius: "8px",
                        border: "1px solid #162840",
                        background: "#04080F",
                        color: "#C5D8EF",
                        padding: "10px 12px",
                        fontSize: "13px",
                        fontFamily: "var(--font-dm-sans)",
                        resize: "vertical",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <button
                    id="btn-save-case"
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      fontSize: "14px",
                      fontWeight: 700,
                      border: "none",
                      background: saveSuccess
                        ? "rgba(16,185,129,0.2)"
                        : "linear-gradient(135deg, #00D4FF, #3B82F6)",
                      color: saveSuccess ? "#10B981" : "#04080F",
                      cursor: saving ? "not-allowed" : "pointer",
                      opacity: saving ? 0.7 : 1,
                      transition: "all 0.2s ease",
                    }}
                  >
                    {saveSuccess ? "✓ Saved" : saving ? "Saving…" : "Save Changes"}
                  </button>

                  {/* Confirmed fraud → publish hint */}
                  {selectedStatus === "confirmed_fraud" && (
                    <div
                      style={{
                        marginTop: "14px",
                        padding: "12px",
                        borderRadius: "8px",
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        fontSize: "12px",
                        color: "#EF4444",
                        lineHeight: "1.5",
                      }}
                    >
                      ⛓ After saving, consider publishing an anonymized fraud signal to the blockchain ledger via <strong>/blockchain/fraud-signal/publish</strong> (Phase 6).
                    </div>
                  )}
                </div>
              </div>

              {/* Right: SHAP Explanation */}
              <div>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: "#00D4FF",
                    fontFamily: "var(--font-ibm-plex-mono)",
                    marginBottom: "14px",
                  }}
                >
                  ● AI Fraud Analysis — Transaction Evidence
                </div>

                {explanation ? (
                  <ExplanationPanel data={explanation} />
                ) : (
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
                    <div style={{ fontSize: "28px", marginBottom: "12px" }}>🔍</div>
                    No SHAP explanation available for this transaction.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
