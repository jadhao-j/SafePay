"use client";

/**
 * Merchant Dashboard — Phase 11E
 * Revenue analytics, daily chart, QR code, incoming payments table.
 * Accessible at /merchant/dashboard.
 * Redirects to /merchant/register if not yet a merchant.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";

interface MerchantProfile {
  id: string;
  business_name: string;
  upi_id: string;
  category: string | null;
  risk_rating: number;
  created_at: string;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_type: string;
  created_at: string;
}

interface Analytics {
  total_revenue: number;
  currency: string;
  days: number;
  daily: { date: string; revenue: number; count: number }[];
  today_transaction_count: number;
}

const STATUS_COLOR: Record<string, string> = {
  completed: "#3DDC97",
  approved:  "#39D2FF",
  challenged:"#FFB84D",
  blocked:   "#FF5C5C",
  pending:   "#9198A8",
};

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function RevenueChart({ daily }: { daily: Analytics["daily"] }) {
  if (!daily.length) return (
    <div style={{
      height: 100, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      color: "#6B7180", fontSize: 13, gap: 8,
    }}>
      <span style={{ fontSize: 28 }}>📊</span>
      No revenue data yet
    </div>
  );
  const max = Math.max(...daily.map((d) => d.revenue), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 100 }}>
      {daily.map((d, i) => {
        const h = Math.max(6, (d.revenue / max) * 84);
        return (
          <div
            key={i}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
            title={`${d.date}: ₹${d.revenue.toLocaleString("en-IN")}`}
          >
            <div style={{
              width: "100%", height: h, borderRadius: 6,
              background: "linear-gradient(135deg,#7C5CFF,#39D2FF)",
              transition: "height .4s cubic-bezier(.34,1.56,.64,1)",
              boxShadow: "0 4px 12px rgba(124,92,255,0.25)",
            }} />
            <span style={{ fontSize: 8, color: "#6B7180", whiteSpace: "nowrap" }}>
              {new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function MerchantDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { void load(days); }, [days]);

  async function load(d: number) {
    setLoading(true);
    try {
      const [profRes, payRes, analyticsRes] = await Promise.all([
        apiClient.get<MerchantProfile>("/merchant/me"),
        apiClient.get<{ payments: Payment[] }>("/merchant/payments"),
        apiClient.get<Analytics>(`/merchant/analytics?days=${d}`),
      ]);
      setProfile(profRes.data);
      setPayments(payRes.data.payments);
      setAnalytics(analyticsRes.data);
      setTimeout(() => renderQR(profRes.data.upi_id), 100);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        router.replace("/merchant/register");
      }
    } finally {
      setLoading(false);
    }
  }

  async function renderQR(data: string) {
    if (!canvasRef.current) return;
    try {
      const QRCode = (await import("qrcode")).default;
      await QRCode.toCanvas(canvasRef.current, `upi://pay?pa=${data}&cu=INR`, {
        width: 160, margin: 2,
        color: { dark: "#F5F6F8", light: "#0D0F14" },
      });
    } catch { /* fallback */ }
  }

  const card: React.CSSProperties = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 20,
    padding: "20px",
    marginBottom: 14,
  };

  if (loading && !profile) return (
    <div style={{
      minHeight: "100vh", background: "#050608",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        border: "3px solid rgba(124,92,255,0.2)",
        borderTopColor: "#7C5CFF",
        animation: "sp-spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes sp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050608",
      color: "#F5F6F8",
      fontFamily: "var(--font-dm-sans,'DM Sans',sans-serif)",
      padding: "24px 20px 100px",
      maxWidth: 560,
      margin: "0 auto",
    }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "rgba(124,92,255,0.15)",
            border: "1px solid rgba(124,92,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20,
          }}>
            🏪
          </div>
          <div>
            <h1 style={{
              fontSize: 20, fontWeight: 800, margin: 0,
              fontFamily: "var(--font-space-grotesk,'Space Grotesk',sans-serif)",
            }}>
              {profile?.business_name}
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: "#6B7180", fontFamily: "monospace" }}>
              {profile?.upi_id}
            </p>
          </div>
        </div>
        {profile?.category && (
          <span style={{
            display: "inline-block", marginLeft: 52,
            padding: "3px 10px", borderRadius: 20,
            background: "rgba(57,210,255,0.1)", border: "1px solid rgba(57,210,255,0.2)",
            fontSize: 11, color: "#39D2FF", fontWeight: 600,
          }}>
            {profile.category}
          </span>
        )}
      </div>

      {/* Time range pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            id={`merchant-range-${d}d`}
            onClick={() => setDays(d)}
            style={{
              padding: "6px 14px", borderRadius: 20,
              background: days === d ? "rgba(124,92,255,0.2)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${days === d ? "rgba(124,92,255,0.4)" : "rgba(255,255,255,0.08)"}`,
              color: days === d ? "#7C5CFF" : "#9198A8",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              transition: "all .15s ease",
            }}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div style={{ ...card, margin: 0 }}>
          <p style={{ fontSize: 11, color: "#6B7180", margin: "0 0 6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Revenue ({days}d)
          </p>
          <p style={{ fontSize: 22, fontWeight: 800, margin: 0, color: "#3DDC97" }}>
            ₹{(analytics?.total_revenue ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div style={{ ...card, margin: 0 }}>
          <p style={{ fontSize: 11, color: "#6B7180", margin: "0 0 6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Today
          </p>
          <p style={{ fontSize: 22, fontWeight: 800, margin: 0, color: "#39D2FF" }}>
            {analytics?.today_transaction_count ?? 0}
            <span style={{ fontSize: 13, fontWeight: 400, color: "#9198A8", marginLeft: 4 }}>txns</span>
          </p>
        </div>
      </div>

      {/* Revenue chart */}
      <div style={card}>
        <h2 style={{ fontSize: 11, fontWeight: 700, color: "#9198A8", margin: "0 0 16px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Daily Revenue
        </h2>
        <RevenueChart daily={analytics?.daily ?? []} />
      </div>

      {/* Merchant QR */}
      <div style={{ ...card, display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{
          padding: 3, borderRadius: 14,
          background: "conic-gradient(from 90deg,#7C5CFF,#39D2FF,#3DDC97,#7C5CFF)",
          animation: "sp-spin 10s linear infinite",
          flexShrink: 0,
        }}>
          <div style={{ borderRadius: 11, overflow: "hidden", background: "#0D0F14", padding: 4 }}>
            <canvas ref={canvasRef} width={160} height={160} style={{ display: "block" }} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#F5F6F8" }}>
            {profile?.business_name}
          </p>
          <p style={{ margin: "0 0 12px", fontSize: 10, color: "#9198A8", fontFamily: "monospace", wordBreak: "break-all" }}>
            {profile?.upi_id}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              id="btn-merchant-copy-upi"
              onClick={() => {
                navigator.clipboard.writeText(profile?.upi_id ?? "").catch(() => {});
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              style={{
                padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                background: "rgba(124,92,255,0.12)", border: "1px solid rgba(124,92,255,0.3)",
                color: "#7C5CFF", fontSize: 11, fontWeight: 600,
                transition: "all .15s ease",
              }}
            >
              {copied ? "✓ Copied" : "⎘ Copy UPI"}
            </button>
          </div>
        </div>
      </div>

      {/* Today's payments */}
      <div style={card}>
        <h2 style={{ fontSize: 11, fontWeight: 700, color: "#9198A8", margin: "0 0 16px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Incoming Payments
        </h2>
        {payments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#6B7180" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>💸</div>
            <p style={{ fontSize: 13, margin: 0 }}>
              No payments received yet.
            </p>
            <p style={{ fontSize: 12, margin: "4px 0 0", color: "#6B7180" }}>
              Share your QR code or UPI ID to get started!
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {payments.slice(0, 15).map((p, idx) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: idx < payments.slice(0, 15).length - 1
                    ? "1px solid rgba(255,255,255,0.04)"
                    : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 12,
                    background: `${STATUS_COLOR[p.status] ?? "#9198A8"}15`,
                    border: `1px solid ${STATUS_COLOR[p.status] ?? "#9198A8"}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, flexShrink: 0,
                  }}>
                    {p.status === "completed" || p.status === "approved" ? "✅"
                      : p.status === "challenged" ? "🔐"
                      : p.status === "blocked" ? "🚫" : "⏳"}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#F5F6F8" }}>
                      ₹{p.amount.toLocaleString("en-IN")}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9198A8" }}>
                      {timeAgo(p.created_at)}
                    </p>
                  </div>
                </div>
                <span style={{
                  padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                  background: `${STATUS_COLOR[p.status] ?? "#9198A8"}20`,
                  color: STATUS_COLOR[p.status] ?? "#9198A8",
                  border: `1px solid ${STATUS_COLOR[p.status] ?? "#9198A8"}40`,
                  letterSpacing: "0.06em",
                }}>
                  {p.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes sp-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
