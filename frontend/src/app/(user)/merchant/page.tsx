"use client";

/**
 * Merchant Dashboard — Phase 11E
 * Register as merchant, view payments, revenue analytics + QR.
 */

import { useEffect, useRef, useState } from "react";
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

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function RevenueChart({ daily }: { daily: Analytics["daily"] }) {
  if (!daily.length) return (
    <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7180", fontSize: 13 }}>
      No revenue data yet
    </div>
  );
  const max = Math.max(...daily.map((d) => d.revenue), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
      {daily.map((d, i) => {
        const h = Math.max(6, (d.revenue / max) * 68);
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
            title={`${d.date}: ₹${d.revenue.toLocaleString("en-IN")}`}>
            <div style={{ width: "100%", height: h, borderRadius: 6, background: "linear-gradient(135deg,#7C5CFF,#39D2FF)", transition: "height .3s ease" }} />
            <span style={{ fontSize: 9, color: "#6B7180" }}>
              {new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function MerchantDashboard() {
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [notMerchant, setNotMerchant] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [form, setForm] = useState({ business_name: "", category: "" });
  const [regError, setRegError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [profRes, payRes, analyticsRes] = await Promise.all([
        apiClient.get<MerchantProfile>("/merchant/me"),
        apiClient.get<{ payments: Payment[] }>("/merchant/payments"),
        apiClient.get<Analytics>("/merchant/analytics?days=7"),
      ]);
      setProfile(profRes.data);
      setPayments(payRes.data.payments);
      setAnalytics(analyticsRes.data);
      // Render QR
      setTimeout(() => renderQR(profRes.data.upi_id), 100);
    } catch (err: any) {
      if (err?.response?.status === 404) setNotMerchant(true);
    } finally {
      setLoading(false);
    }
  }

  async function renderQR(data: string) {
    if (!canvasRef.current) return;
    try {
      const QRCode = (await import("qrcode")).default;
      await QRCode.toCanvas(canvasRef.current, `upi://pay?pa=${data}&cu=INR`, {
        width: 180, margin: 2,
        color: { dark: "#F5F6F8", light: "#0D0F14" },
      });
    } catch { /* fallback */ }
  }

  async function handleRegister() {
    if (!form.business_name.trim()) { setRegError("Business name is required."); return; }
    setRegistering(true); setRegError("");
    try {
      await apiClient.post("/merchant/register", { business_name: form.business_name, category: form.category || null });
      await load();
      setNotMerchant(false);
    } catch (e: any) {
      setRegError(e?.response?.data?.detail || "Registration failed.");
    } finally { setRegistering(false); }
  }

  const card: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, padding: "18px 20px", marginBottom: 14,
  };
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)", color: "#F5F6F8", fontSize: 14,
    outline: "none", boxSizing: "border-box", marginBottom: 10,
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#050608", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7180", fontFamily: "sans-serif" }}>
      Loading merchant portal…
    </div>
  );

  // Registration screen
  if (notMerchant) return (
    <div style={{ minHeight: "100vh", background: "#050608", color: "#F5F6F8", fontFamily: "var(--font-dm-sans,'DM Sans',sans-serif)", padding: "52px 20px 100px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ fontSize: 48, textAlign: "center", marginBottom: 16 }}>🏪</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, textAlign: "center", margin: "0 0 8px", fontFamily: "var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>
          Become a Merchant
        </h1>
        <p style={{ fontSize: 13, color: "#6B7180", textAlign: "center", margin: "0 0 28px" }}>
          Register your business to accept payments on SafePay
        </p>
        <input placeholder="Business name *" value={form.business_name} onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))} style={inputStyle} />
        <input placeholder="Category (e.g. Food, Retail, Services)" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} style={inputStyle} />
        {regError && <p style={{ color: "#FF5C5C", fontSize: 12, margin: "0 0 12px" }}>{regError}</p>}
        <button onClick={handleRegister} disabled={registering}
          style={{ width: "100%", padding: 14, borderRadius: 14, background: "linear-gradient(135deg,#7C5CFF,#39D2FF)", border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: registering ? 0.7 : 1 }}>
          {registering ? "Registering…" : "Register as Merchant"}
        </button>
      </div>
    </div>
  );

  const STATUS_COLOR: Record<string, string> = { completed: "#3DDC97", approved: "#39D2FF", challenged: "#FFB84D", blocked: "#FF5C5C", pending: "#9198A8" };

  return (
    <div style={{ minHeight: "100vh", background: "#050608", color: "#F5F6F8", fontFamily: "var(--font-dm-sans,'DM Sans',sans-serif)", padding: "28px 20px 100px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 2px", fontFamily: "var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>
        {profile?.business_name}
      </h1>
      <p style={{ fontSize: 12, color: "#6B7180", margin: "0 0 20px", fontFamily: "monospace" }}>{profile?.upi_id}</p>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div style={{ ...card, margin: 0 }}>
          <p style={{ fontSize: 11, color: "#6B7180", margin: "0 0 4px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Revenue (7d)</p>
          <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#3DDC97" }}>
            ₹{(analytics?.total_revenue ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div style={{ ...card, margin: 0 }}>
          <p style={{ fontSize: 11, color: "#6B7180", margin: "0 0 4px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Today</p>
          <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#39D2FF" }}>
            {analytics?.today_transaction_count ?? 0} txns
          </p>
        </div>
      </div>

      {/* Revenue chart */}
      <div style={card}>
        <h2 style={{ fontSize: 12, fontWeight: 600, color: "#9198A8", margin: "0 0 14px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Daily Revenue</h2>
        <RevenueChart daily={analytics?.daily ?? []} />
      </div>

      {/* My QR */}
      <div style={{ ...card, display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ padding: 4, borderRadius: 12, background: "conic-gradient(from 90deg,#7C5CFF,#39D2FF,#3DDC97,#7C5CFF)", animation: "sp-spin 8s linear infinite", flexShrink: 0 }}>
          <div style={{ borderRadius: 9, overflow: "hidden", background: "#0D0F14", padding: 4 }}>
            <canvas ref={canvasRef} width={180} height={180} style={{ display: "block" }} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 4px" }}>{profile?.business_name}</p>
          <p style={{ fontSize: 11, color: "#9198A8", margin: "0 0 10px", fontFamily: "monospace" }}>{profile?.upi_id}</p>
          <button onClick={() => { navigator.clipboard.writeText(profile?.upi_id ?? ""); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(124,92,255,0.15)", border: "1px solid rgba(124,92,255,0.3)", color: "#7C5CFF", fontSize: 12, cursor: "pointer" }}>
            {copied ? "✓ Copied" : "⎘ Copy UPI"}
          </button>
        </div>
      </div>

      {/* Recent payments */}
      <div style={card}>
        <h2 style={{ fontSize: 12, fontWeight: 600, color: "#9198A8", margin: "0 0 14px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Recent Payments</h2>
        {payments.length === 0 ? (
          <p style={{ fontSize: 13, color: "#6B7180", textAlign: "center", padding: "20px 0" }}>No payments received yet. Share your QR to get started!</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {payments.slice(0, 10).map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#F5F6F8" }}>₹{p.amount.toLocaleString("en-IN")}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9198A8" }}>{timeAgo(p.created_at)}</p>
                </div>
                <span style={{
                  padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: (STATUS_COLOR[p.status] || "#9198A8") + "22",
                  color: STATUS_COLOR[p.status] || "#9198A8",
                  border: `1px solid ${STATUS_COLOR[p.status] || "#9198A8"}44`,
                }}>{p.status.toUpperCase()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes sp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
