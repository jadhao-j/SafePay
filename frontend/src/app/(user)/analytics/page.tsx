"use client";

/**
 * Analytics Page — Phase 11B
 * Spending donut, weekly bar chart, risk timeline, insight cards.
 */

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";

interface SpendingData {
  total: number;
  currency: string;
  breakdown: Record<string, number>;
  days: number;
}

interface RiskPoint {
  transaction_id: string;
  risk_score: number;
  decision: string;
  amount: number;
  payment_type: string;
  date: string;
}

interface Insight {
  type: string;
  icon: string;
  title: string;
  body: string;
  color: string;
}

const PAYMENT_COLORS: Record<string, string> = {
  p2p: "#7C5CFF",
  merchant: "#39D2FF",
  topup: "#3DDC97",
  withdrawal: "#FF5C5C",
  upi: "#FFB84D",
  qr: "#FF79C6",
};

const INSIGHT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  green:  { bg: "rgba(61,220,151,0.08)",  border: "rgba(61,220,151,0.25)",  text: "#3DDC97" },
  amber:  { bg: "rgba(255,184,77,0.08)",  border: "rgba(255,184,77,0.25)",  text: "#FFB84D" },
  blue:   { bg: "rgba(57,210,255,0.08)",  border: "rgba(57,210,255,0.25)",  text: "#39D2FF" },
  red:    { bg: "rgba(255,92,92,0.08)",   border: "rgba(255,92,92,0.25)",   text: "#FF5C5C" },
};

function DonutChart({ breakdown, total }: { breakdown: Record<string, number>; total: number }) {
  const entries = Object.entries(breakdown).filter(([, v]) => v > 0);
  if (!entries.length) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#6B7180", fontSize: 13 }}>
        No spending data yet
      </div>
    );
  }

  // Simple CSS conic-gradient donut
  let cumulative = 0;
  const segments = entries.map(([type, value]) => {
    const pct = (value / total) * 100;
    const start = cumulative;
    cumulative += pct;
    return { type, value, pct, start, color: PAYMENT_COLORS[type] || "#9198A8" };
  });

  const gradient = segments
    .map((s) => `${s.color} ${s.start.toFixed(1)}% ${(s.start + s.pct).toFixed(1)}%`)
    .join(", ");

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{
          width: 140, height: 140, borderRadius: "50%",
          background: `conic-gradient(${gradient})`,
        }} />
        <div style={{
          position: "absolute", inset: 24, borderRadius: "50%",
          background: "#0D0F14",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 11, color: "#6B7180" }}>TOTAL</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#F5F6F8" }}>₹{total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        {segments.map((s) => (
          <div key={s.type} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#9198A8", flex: 1, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.type}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#F5F6F8" }}>₹{s.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
            <span style={{ fontSize: 11, color: "#6B7180" }}>{s.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskTimeline({ history }: { history: RiskPoint[] }) {
  if (!history.length) {
    return <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7180", fontSize: 13 }}>No risk data yet — make a transaction</div>;
  }
  const reversed = [...history].reverse();
  const max = Math.max(...reversed.map((r) => r.risk_score), 1);
  const barW = Math.max(16, Math.floor(320 / reversed.length) - 4);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120, overflowX: "auto", paddingBottom: 4 }}>
      {reversed.map((r, i) => {
        const h = Math.max(6, (r.risk_score / max) * 100);
        const col = r.risk_score < 0.35 ? "#3DDC97" : r.risk_score < 0.65 ? "#FFB84D" : "#FF5C5C";
        return (
          <div key={i} title={`${(r.risk_score * 100).toFixed(0)}% — ${r.decision} — ₹${r.amount}`}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
            <div style={{ width: barW, height: `${h}%`, background: col, borderRadius: 4, transition: "height .3s ease", minHeight: 6 }} />
            <span style={{ fontSize: 9, color: "#6B7180", transform: "rotate(-45deg)", transformOrigin: "top center", marginTop: 4 }}>
              {new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const [spending, setSpending] = useState<SpendingData | null>(null);
  const [riskHistory, setRiskHistory] = useState<RiskPoint[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, [days]);

  async function load() {
    setLoading(true);
    try {
      const [spRes, riskRes, insRes] = await Promise.all([
        apiClient.get<SpendingData>(`/analytics/spending?days=${days}`),
        apiClient.get<{ history: RiskPoint[] }>("/analytics/risk-history?limit=20"),
        apiClient.get<{ insights: Insight[] }>("/analytics/insights"),
      ]);
      setSpending(spRes.data);
      setRiskHistory(riskRes.data.history);
      setInsights(insRes.data.insights);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const card: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: "20px 22px",
    marginBottom: 16,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050608", color: "#F5F6F8", fontFamily: "var(--font-dm-sans,'DM Sans',sans-serif)", padding: "28px 20px 100px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px", fontFamily: "var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>Analytics</h1>
      <p style={{ fontSize: 13, color: "#6B7180", margin: "0 0 20px" }}>Spending patterns &amp; risk profile</p>

      {/* Time range pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[7, 30, 90].map((d) => (
          <button key={d} onClick={() => setDays(d)}
            style={{
              padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: days === d ? "linear-gradient(135deg,#7C5CFF,#39D2FF)" : "rgba(255,255,255,0.06)",
              border: days === d ? "none" : "1px solid rgba(255,255,255,0.1)",
              color: days === d ? "#fff" : "#9198A8",
            }}>
            {d}d
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#6B7180" }}>Loading…</div>
      ) : (
        <>
          {/* Spending donut */}
          <div style={card}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: "#9198A8", margin: "0 0 16px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Spending Breakdown — Last {days} Days
            </h2>
            {spending && <DonutChart breakdown={spending.breakdown} total={spending.total || 1} />}
          </div>

          {/* Risk Timeline */}
          <div style={card}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: "#9198A8", margin: "0 0 16px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Risk Score History
            </h2>
            <RiskTimeline history={riskHistory} />
            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              {[["🟢", "Low < 0.35"], ["🟡", "Medium < 0.65"], ["🔴", "High ≥ 0.65"]].map(([e, l]) => (
                <span key={l} style={{ fontSize: 11, color: "#6B7180" }}>{e} {l}</span>
              ))}
            </div>
          </div>

          {/* Insight cards */}
          {insights.length > 0 && (
            <div style={card}>
              <h2 style={{ fontSize: 13, fontWeight: 600, color: "#9198A8", margin: "0 0 14px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                AI Insights
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {insights.map((ins, i) => {
                  const c = INSIGHT_COLORS[ins.color] ?? INSIGHT_COLORS.blue;
                  return (
                    <div key={i} style={{
                      background: c.bg, border: `1px solid ${c.border}`,
                      borderRadius: 12, padding: "12px 16px",
                      display: "flex", gap: 12, alignItems: "flex-start",
                    }}>
                      <span style={{ fontSize: 22 }}>{ins.icon}</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: c.text, margin: "0 0 2px" }}>{ins.title}</p>
                        <p style={{ fontSize: 12, color: "#9198A8", margin: 0, lineHeight: 1.5 }}>{ins.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
