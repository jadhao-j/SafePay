"use client";

/**
 * Transaction Detail Page — full breakdown of a single transaction
 * with the SHAP-powered ExplanationPanel and a "Open Case" action.
 */
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ExplanationPanel from "@/components/user/ExplanationPanel";
import {
  fetchTransactions,
  fetchExplanation,
  openCase,
  type WalletTransaction,
  type TransactionExplanation,
} from "@/lib/fraud-api";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  completed: { bg: "rgba(16,185,129,0.12)", text: "#10B981", label: "Completed", icon: "✓" },
  approved:  { bg: "rgba(16,185,129,0.12)", text: "#10B981", label: "Approved",  icon: "✓" },
  challenged:{ bg: "rgba(245,158,11,0.12)", text: "#F59E0B", label: "Challenged",icon: "⚠" },
  blocked:   { bg: "rgba(239,68,68,0.12)",  text: "#EF4444", label: "Blocked",   icon: "✕" },
  pending:   { bg: "rgba(100,116,139,0.12)","text": "#64748B", label: "Pending", icon: "…" },
  failed:    { bg: "rgba(239,68,68,0.12)",  text: "#EF4444", label: "Failed",    icon: "✕" },
  reversed:  { bg: "rgba(139,92,246,0.12)", text: "#8B5CF6", label: "Reversed",  icon: "↩" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    weekday: "long", day: "2-digit", month: "long",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }): JSX.Element {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #F1F5F9", alignItems: "center" }}>
      <span style={{ fontSize: "13px", color: "#64748B" }}>{label}</span>
      <span style={{ fontSize: "13px", color: "#0F172A", fontWeight: 500, fontFamily: mono ? "var(--font-ibm-plex-mono)" : undefined, maxWidth: "60%", textAlign: "right", wordBreak: "break-all" }}>
        {value}
      </span>
    </div>
  );
}

export default function TransactionDetailPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const txnId = params?.id as string;

  const [txn, setTxn] = useState<WalletTransaction | null>(null);
  const [explanation, setExplanation] = useState<TransactionExplanation | null>(null);
  const [loading, setLoading] = useState(true);
  const [openingCase, setOpeningCase] = useState(false);
  const [caseOpened, setCaseOpened] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!txnId) return;
    Promise.all([
      fetchTransactions().then((list) => list.find((t) => t.id === txnId) ?? null),
      fetchExplanation(txnId).catch(() => null),
    ])
      .then(([t, exp]) => {
        setTxn(t);
        setExplanation(exp);
      })
      .catch(() => setError("Could not load transaction details."))
      .finally(() => setLoading(false));
  }, [txnId]);

  async function handleOpenCase(): Promise<void> {
    if (!txnId) return;
    setOpeningCase(true);
    try {
      await openCase(txnId, "Opened from transaction detail page.");
      setCaseOpened(true);
    } catch {
      alert("Could not open case. You may not have analyst permissions.");
    } finally {
      setOpeningCase(false);
    }
  }

  const statusStyle = txn ? (STATUS_STYLES[txn.status] ?? STATUS_STYLES.pending) : STATUS_STYLES.pending;
  const isDebit = txn ? ["p2p", "merchant", "qr", "upi", "withdrawal"].includes(txn.payment_type) : false;
  const isFlagged = txn && (txn.status === "challenged" || txn.status === "blocked");

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F9FC",
        fontFamily: "var(--font-dm-sans), sans-serif",
      }}
    >
      {/* Topbar */}
      <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E2E8F0", padding: "16px 32px", display: "flex", alignItems: "center", gap: "16px" }}>
        <button
          id="btn-back"
          onClick={() => router.back()}
          style={{ background: "none", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "6px 14px", fontSize: "13px", cursor: "pointer", color: "#64748B", display: "flex", alignItems: "center", gap: "6px" }}
        >
          ← Back
        </button>
        <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
          Transaction Detail
        </h1>
      </div>

      <div style={{ maxWidth: "740px", margin: "32px auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#64748B" }}>
            Loading details…
          </div>
        )}

        {error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid #EF4444", borderRadius: "12px", padding: "20px", color: "#EF4444", textAlign: "center" }}>
            {error}
          </div>
        )}

        {!loading && txn && (
          <>
            {/* Amount card */}
            <div
              style={{
                background: "#FFFFFF",
                border: isFlagged ? `1px solid ${statusStyle.text}40` : "1px solid #E2E8F0",
                borderRadius: "16px",
                padding: "32px",
                textAlign: "center",
                boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 16px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  background: statusStyle.bg,
                  color: statusStyle.text,
                  marginBottom: "16px",
                }}
              >
                <span>{statusStyle.icon}</span>
                <span>{statusStyle.label}</span>
              </div>
              <div
                style={{
                  fontSize: "42px",
                  fontWeight: 700,
                  fontFamily: "var(--font-ibm-plex-mono)",
                  color: isDebit ? "#EF4444" : "#10B981",
                  marginBottom: "8px",
                }}
              >
                {isDebit ? "−" : "+"}₹{parseFloat(txn.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: "14px", color: "#64748B" }}>{txn.currency}</div>
            </div>

            {/* Meta details */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "16px",
                padding: "20px 24px",
                boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "#64748B", marginBottom: "4px" }}>
                Transaction Details
              </div>
              <DetailRow label="Transaction ID" value={txn.id} mono />
              <DetailRow label="Type" value={txn.payment_type.toUpperCase()} />
              <DetailRow label="Amount" value={`${txn.currency} ${txn.amount}`} mono />
              <DetailRow label="Status" value={statusStyle.label} />
              <DetailRow label="Date" value={formatDate(txn.created_at)} />
              {txn.device_id && <DetailRow label="Device ID" value={txn.device_id} mono />}
              <DetailRow label="Idempotency Key" value={txn.idempotency_key} mono />
            </div>

            {/* Fraud Explanation Panel */}
            {explanation ? (
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "#64748B", marginBottom: "12px", paddingLeft: "4px" }}>
                  🤖 AI Fraud Analysis
                </div>
                <ExplanationPanel data={explanation} />
              </div>
            ) : (
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px dashed #E2E8F0",
                  borderRadius: "16px",
                  padding: "28px",
                  textAlign: "center",
                  color: "#94A3B8",
                  fontSize: "14px",
                }}
              >
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>🔍</div>
                No fraud analysis available for this transaction.
              </div>
            )}

            {/* Open case CTA — shown only for flagged transactions */}
            {isFlagged && (
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                {caseOpened ? (
                  <div style={{ padding: "10px 20px", borderRadius: "10px", fontSize: "14px", fontWeight: 600, background: "rgba(16,185,129,0.12)", color: "#10B981" }}>
                    ✓ Investigation case opened
                  </div>
                ) : (
                  <button
                    id="btn-open-case"
                    onClick={handleOpenCase}
                    disabled={openingCase}
                    style={{
                      padding: "10px 24px",
                      borderRadius: "10px",
                      fontSize: "14px",
                      fontWeight: 700,
                      border: "none",
                      background: "linear-gradient(135deg, #EF4444, #8B5CF6)",
                      color: "#FFFFFF",
                      cursor: openingCase ? "not-allowed" : "pointer",
                      opacity: openingCase ? 0.7 : 1,
                    }}
                  >
                    {openingCase ? "Opening…" : "🔎 Open Investigation Case"}
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {!loading && !txn && !error && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#64748B" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
            Transaction not found.
          </div>
        )}
      </div>
    </main>
  );
}
