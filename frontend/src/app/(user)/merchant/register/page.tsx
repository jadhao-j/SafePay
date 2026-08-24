"use client";

/**
 * Merchant Registration — Phase 11E
 * Dedicated /merchant/register page.
 * If user already has a merchant profile, redirects to /merchant/dashboard.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";

const CATEGORIES = [
  "Food & Beverage",
  "Retail",
  "Services",
  "Healthcare",
  "Education",
  "Entertainment",
  "Travel",
  "Technology",
  "Fashion",
  "Other",
];

export default function MerchantRegisterPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [form, setForm] = useState({ business_name: "", category: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  // Check if already a merchant → redirect to dashboard
  useEffect(() => {
    apiClient
      .get("/merchant/me")
      .then(() => router.replace("/merchant/dashboard"))
      .catch((err) => {
        if (err?.response?.status === 404) setChecking(false);
        else setChecking(false);
      });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.business_name.trim()) {
      setError("Business name is required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await apiClient.post("/merchant/register", {
        business_name: form.business_name.trim(),
        category: form.category || null,
      });
      setSuccess(true);
      setTimeout(() => router.push("/merchant/dashboard"), 1400);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Registration failed. Please try again.");
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <div style={{
        minHeight: "100vh", background: "#050608", display: "flex",
        alignItems: "center", justifyContent: "center",
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
  }

  const inputStyle = (field: string): React.CSSProperties => ({
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    background: focused === field ? "rgba(124,92,255,0.08)" : "rgba(255,255,255,0.04)",
    border: `1px solid ${focused === field ? "rgba(124,92,255,0.5)" : "rgba(255,255,255,0.08)"}`,
    color: "#F5F6F8",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "all .2s ease",
    fontFamily: "var(--font-dm-sans,'DM Sans',sans-serif)",
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050608",
      color: "#F5F6F8",
      fontFamily: "var(--font-dm-sans,'DM Sans',sans-serif)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background glows */}
      <div style={{
        position: "fixed", top: -180, left: -180, width: 480, height: 480,
        borderRadius: "50%", pointerEvents: "none",
        background: "radial-gradient(circle, rgba(124,92,255,.22) 0%, rgba(5,6,8,0) 70%)",
      }} />
      <div style={{
        position: "fixed", bottom: -160, right: -160, width: 440, height: 440,
        borderRadius: "50%", pointerEvents: "none",
        background: "radial-gradient(circle, rgba(57,210,255,.16) 0%, rgba(5,6,8,0) 70%)",
      }} />

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>

        {/* Conic Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18,
            background: "conic-gradient(from 90deg,#7C5CFF,#39D2FF,#3DDC97,#7C5CFF)",
            animation: "sp-spin 8s linear infinite",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}>
            <div style={{
              position: "absolute", inset: 3, borderRadius: 14,
              background: "#0D0F14",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{
                fontSize: 20, fontWeight: 800, color: "#fff",
                fontFamily: "var(--font-space-grotesk,sans-serif)",
              }}>🏪</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{
            fontSize: 28, fontWeight: 800, margin: "0 0 8px",
            fontFamily: "var(--font-space-grotesk,'Space Grotesk',sans-serif)",
            background: "linear-gradient(135deg,#fff 0%,rgba(255,255,255,.7) 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Become a Merchant
          </h1>
          <p style={{ fontSize: 14, color: "#9198A8", margin: 0 }}>
            Register your business to accept payments on SafePay
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24,
          padding: "28px 24px",
          backdropFilter: "blur(20px)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}>
          {success ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{
                fontSize: 52, marginBottom: 16,
                animation: "sp-bounce .5s ease",
              }}>✅</div>
              <h2 style={{
                fontSize: 20, fontWeight: 700, margin: "0 0 8px",
                fontFamily: "var(--font-space-grotesk,sans-serif)",
              }}>
                You&rsquo;re a merchant!
              </h2>
              <p style={{ fontSize: 13, color: "#9198A8", margin: 0 }}>
                Redirecting to your dashboard…
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Business name */}
              <div>
                <label style={{ fontSize: 12, color: "#9198A8", fontWeight: 600, letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
                  BUSINESS NAME *
                </label>
                <input
                  id="merchant-business-name"
                  placeholder="e.g. Rohan's Café"
                  value={form.business_name}
                  onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))}
                  onFocus={() => setFocused("name")}
                  onBlur={() => setFocused(null)}
                  style={inputStyle("name")}
                  autoComplete="organization"
                />
              </div>

              {/* Category */}
              <div>
                <label style={{ fontSize: 12, color: "#9198A8", fontWeight: 600, letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
                  CATEGORY
                </label>
                <select
                  id="merchant-category"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  onFocus={() => setFocused("cat")}
                  onBlur={() => setFocused(null)}
                  style={{ ...inputStyle("cat"), appearance: "none", cursor: "pointer" }}
                >
                  <option value="">Select a category (optional)</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} style={{ background: "#0D0F14" }}>{c}</option>
                  ))}
                </select>
              </div>

              {/* What you get section */}
              <div style={{
                padding: "14px 16px", borderRadius: 14,
                background: "rgba(124,92,255,0.06)",
                border: "1px solid rgba(124,92,255,0.15)",
                marginTop: 4,
              }}>
                <p style={{ fontSize: 12, color: "#9198A8", margin: "0 0 8px", fontWeight: 600, letterSpacing: "0.05em" }}>
                  YOU GET
                </p>
                {[
                  { icon: "⬡", text: "Unique merchant UPI ID & QR code" },
                  { icon: "📊", text: "Revenue analytics & daily chart" },
                  { icon: "💸", text: "Real-time payment tracking" },
                ].map((item) => (
                  <div key={item.icon} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 14 }}>{item.icon}</span>
                    <span style={{ fontSize: 12, color: "#9198A8" }}>{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  padding: "10px 14px", borderRadius: 10,
                  background: "rgba(255,92,92,0.08)",
                  border: "1px solid rgba(255,92,92,0.2)",
                  fontSize: 13, color: "#FF5C5C",
                }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                id="btn-merchant-register"
                type="submit"
                disabled={submitting}
                style={{
                  width: "100%", padding: "15px 0",
                  borderRadius: 16, border: "none",
                  background: submitting
                    ? "rgba(124,92,255,0.4)"
                    : "linear-gradient(135deg,#7C5CFF 0%,#39D2FF 100%)",
                  color: "#fff", fontSize: 15, fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer",
                  transition: "all .2s ease",
                  letterSpacing: "0.02em",
                  fontFamily: "var(--font-space-grotesk,sans-serif)",
                  boxShadow: submitting ? "none" : "0 8px 32px rgba(124,92,255,0.3)",
                }}
              >
                {submitting ? "Registering…" : "Register as Merchant →"}
              </button>

              <p style={{ fontSize: 12, color: "#6B7180", textAlign: "center", margin: 0 }}>
                By registering, you agree to SafePay&rsquo;s merchant terms.
              </p>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes sp-spin { to { transform: rotate(360deg); } }
        @keyframes sp-bounce { 0%,100% { transform: scale(1); } 50% { transform: scale(1.2); } }
      `}</style>
    </div>
  );
}
