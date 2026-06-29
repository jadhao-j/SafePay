"use client";

/**
 * Transaction History Page — lists all wallet transactions with status badges.
 * Clicking a row navigates to /history/[id] for the full explanation.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchTransactions, type WalletTransaction } from "@/lib/fraud-api";

const PAYMENT_ICONS: Record<string, string> = {
  p2p: "↔",
  merchant: "🏪",
  qr: "⬡",
  upi: "⚡",
  topup: "↓",
  withdrawal: "↑",
  recurring: "🔄",
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  completed: { bg: "rgba(16,185,129,0.12)", text: "#10B981", label: "Completed" },
  approved:  { bg: "rgba(16,185,129,0.12)", text: "#10B981", label: "Approved" },
  challenged:{ bg: "rgba(245,158,11,0.12)", text: "#F59E0B", label: "Challenged" },
  blocked:   { bg: "rgba(239,68,68,0.12)",  text: "#EF4444", label: "Blocked" },
  pending:   { bg: "rgba(100,116,139,0.12)","text": "#64748B", label: "Pending" },
  failed:    { bg: "rgba(239,68,68,0.12)",  text: "#EF4444", label: "Failed" },
  reversed:  { bg: "rgba(139,92,246,0.12)", text: "#8B5CF6", label: "Reversed" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(amount: string, type: string): string {
  const num = parseFloat(amount);
  const isDebit = ["p2p", "merchant", "qr", "upi", "withdrawal"].includes(type);
  return `${isDebit ? "−" : "+"}₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export default function HistoryPage(): JSX.Element {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const router = useRouter();

  useEffect(() => {
    fetchTransactions()
      .then(setTransactions)
      .catch(() => setError("Could not load transactions. Please log in."))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "all"
      ? transactions
      : transactions.filter((t) => t.status === filter || t.payment_type === filter);

  const hasFraud = (t: WalletTransaction) =>
    t.status === "challenged" || t.status === "blocked";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F9FC",
        padding: "0",
        fontFamily: "var(--font-dm-sans), sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
          padding: "24px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
            Transaction History
          </h1>
          <p style={{ fontSize: "14px", color: "#64748B", margin: "4px 0 0" }}>
            {transactions.length} transactions total
          </p>
        </div>
        {/* Filters */}
        <div style={{ display: "flex", gap: "8px" }}>
          {["all", "completed", "challenged", "blocked"].map((f) => (
            <button
              key={f}
              id={`filter-${f}`}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 14px",
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: 600,
                border: filter === f ? "none" : "1px solid #E2E8F0",
                background: filter === f ? "#3B82F6" : "#FFFFFF",
                color: filter === f ? "#FFFFFF" : "#64748B",
                cursor: "pointer",
                textTransform: "capitalize",
                transition: "all 0.15s ease",
              }}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: "860px", margin: "32px auto", padding: "0 24px" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#64748B" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px", animation: "spin 1s linear infinite" }}>⟳</div>
            Loading transactions…
          </div>
        )}

        {error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid #EF4444", borderRadius: "12px", padding: "20px", color: "#EF4444", textAlign: "center" }}>
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#64748B" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div>
            No transactions found.
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filtered.map((txn) => {
              const statusStyle = STATUS_STYLES[txn.status] ?? STATUS_STYLES.pending;
              const isFraud = hasFraud(txn);
              const isDebit = ["p2p", "merchant", "qr", "upi", "withdrawal"].includes(txn.payment_type);
              return (
                <div
                  key={txn.id}
                  id={`txn-${txn.id}`}
                  onClick={() => router.push(`/history/${txn.id}`)}
                  style={{
                    background: "#FFFFFF",
                    border: isFraud ? `1px solid ${statusStyle.text}40` : "1px solid #E2E8F0",
                    borderLeft: isFraud ? `4px solid ${statusStyle.text}` : "4px solid transparent",
                    borderRadius: "12px",
                    padding: "18px 20px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    transition: "box-shadow 0.15s ease, transform 0.1s ease",
                    boxShadow: "0 2px 6px rgba(15,23,42,0.04)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 20px rgba(15,23,42,0.1)";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 6px rgba(15,23,42,0.04)";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: isDebit ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      flexShrink: 0,
                    }}
                  >
                    {PAYMENT_ICONS[txn.payment_type] ?? "↔"}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A", textTransform: "capitalize" }}>
                      {txn.payment_type.toUpperCase()} Transfer
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748B", fontFamily: "var(--font-ibm-plex-mono)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {txn.id}
                    </div>
                    <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>
                      {formatDate(txn.created_at)}
                    </div>
                  </div>

                  {/* Amount + Status */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        fontFamily: "var(--font-ibm-plex-mono)",
                        color: isDebit ? "#EF4444" : "#10B981",
                      }}
                    >
                      {formatAmount(txn.amount, txn.payment_type)}
                    </div>
                    <div
                      style={{
                        display: "inline-block",
                        marginTop: "6px",
                        padding: "3px 10px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        background: statusStyle.bg,
                        color: statusStyle.text,
                      }}
                    >
                      {statusStyle.label}
                    </div>
                  </div>

                  {/* Chevron */}
                  <div style={{ color: "#CBD5E1", fontSize: "18px", marginLeft: "4px" }}>›</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
