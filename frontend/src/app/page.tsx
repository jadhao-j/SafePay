"use client";

/**
 * Landing Page — Screen 1
 * Hero, value props, trust badges, Sign Up / Login CTAs.
 * Dark theme matching the login page aesthetic.
 */

import { useEffect, useState } from "react";
import Link from "next/link";

const TRUST_BADGES = [
  { icon: "🛡", label: "AI Fraud Detection", sub: "Real-time scoring on every transaction" },
  { icon: "🔗", label: "Blockchain Secured", sub: "Immutable fraud ledger, zero PII" },
  { icon: "🤖", label: "AI Copilot", sub: "Explain any decision in plain English" },
  { icon: "🔒", label: "Federated Learning", sub: "Bank-grade privacy-preserving AI" },
];

const STATS = [
  { value: "99.8%", label: "Fraud Catch Rate" },
  { value: "<50ms", label: "Scoring Latency" },
  { value: "0 PII", label: "On Blockchain" },
];

export default function LandingPage(): JSX.Element {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #04080F 0%, #0A1628 60%, #04080F 100%)",
        fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background grid */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(0,212,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.025) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
      {/* Glow blobs */}
      <div style={{ position: "fixed", top: "10%", left: "50%", transform: "translateX(-50%)", width: "700px", height: "400px", background: "radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "10%", right: "10%", width: "400px", height: "300px", background: "radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* ── Nav ── */}
      <nav style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ fontSize: "20px", fontWeight: 900, letterSpacing: "4px", background: "linear-gradient(135deg, #00D4FF, #3B82F6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          SAFEPAY
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Link href="/login" id="nav-login" style={{ padding: "9px 20px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8", fontSize: "14px", fontWeight: 600, textDecoration: "none", transition: "all 0.15s ease" }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#FFFFFF"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.2)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#94A3B8"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
          >
            Sign In
          </Link>
          <Link href="/register" id="nav-register" style={{ padding: "9px 20px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #3B82F6, #1D4ED8)", color: "#FFFFFF", fontSize: "14px", fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 14px rgba(59,130,246,0.3)" }}>
            Get Started →
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "80px 24px 60px", maxWidth: "780px", margin: "0 auto" }}>
        <div
          style={{
            display: "inline-block", padding: "6px 16px", borderRadius: "999px",
            background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)",
            fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", color: "#00D4FF",
            textTransform: "uppercase", marginBottom: "28px",
            opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(-10px)",
            transition: "all 0.5s ease",
          }}
        >
          ✦ AI-Powered Fraud Intelligence Platform
        </div>

        <h1
          style={{
            fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 900, lineHeight: 1.1,
            margin: "0 0 20px",
            opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.5s ease 0.1s",
          }}
        >
          <span style={{ color: "#FFFFFF" }}>Payments that</span>
          <br />
          <span style={{ background: "linear-gradient(135deg, #00D4FF, #3B82F6, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            protect themselves
          </span>
        </h1>

        <p
          style={{
            fontSize: "18px", color: "#64748B", lineHeight: 1.7, maxWidth: "560px", margin: "0 auto 40px",
            opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.5s ease 0.2s",
          }}
        >
          SafePay uses real-time AI fraud scoring, explainable decisions, and blockchain immutability to keep every rupee safe.
        </p>

        {/* CTAs */}
        <div
          style={{
            display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap",
            opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.5s ease 0.3s",
          }}
        >
          <Link
            href="/register"
            id="hero-register"
            style={{ padding: "16px 36px", borderRadius: "14px", border: "none", background: "linear-gradient(135deg, #3B82F6, #1D4ED8)", color: "#FFFFFF", fontSize: "16px", fontWeight: 700, textDecoration: "none", boxShadow: "0 8px 24px rgba(59,130,246,0.35)", display: "inline-block" }}
          >
            Create Free Account
          </Link>
          <Link
            href="/login"
            id="hero-login"
            style={{ padding: "16px 36px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)", color: "#C5D8EF", fontSize: "16px", fontWeight: 600, textDecoration: "none", display: "inline-block", background: "rgba(255,255,255,0.03)" }}
          >
            Sign In →
          </Link>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex", gap: "40px", justifyContent: "center", marginTop: "56px", flexWrap: "wrap",
            opacity: visible ? 1 : 0, transition: "opacity 0.5s ease 0.4s",
          }}
        >
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <p style={{ fontSize: "28px", fontWeight: 900, margin: "0 0 4px", background: "linear-gradient(135deg, #00D4FF, #3B82F6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{s.value}</p>
              <p style={{ fontSize: "12px", color: "#3D6080", margin: 0, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Trust Badges ── */}
      <section style={{ position: "relative", zIndex: 10, maxWidth: "900px", margin: "0 auto", padding: "0 24px 80px" }}>
        <div
          style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px",
            opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.5s ease 0.5s",
          }}
        >
          {TRUST_BADGES.map(badge => (
            <div
              key={badge.label}
              style={{
                background: "rgba(10,22,40,0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px",
                padding: "24px 20px", backdropFilter: "blur(12px)",
                transition: "border-color 0.15s ease, transform 0.15s ease",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,212,255,0.2)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "14px" }}>{badge.icon}</div>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#C5D8EF", margin: "0 0 6px" }}>{badge.label}</p>
              <p style={{ fontSize: "12px", color: "#3D6080", margin: 0, lineHeight: 1.5 }}>{badge.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Demo Journey CTA ── */}
      <section
        style={{
          position: "relative", zIndex: 10, textAlign: "center", padding: "0 24px 80px",
          opacity: visible ? 1 : 0, transition: "opacity 0.5s ease 0.6s",
        }}
      >
        <div style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "20px", padding: "48px 32px", maxWidth: "560px", margin: "0 auto", backdropFilter: "blur(12px)" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#00D4FF", letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 12px" }}>See it in action</p>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#FFFFFF", margin: "0 0 12px" }}>Try the fraud detection demo</h2>
          <p style={{ fontSize: "14px", color: "#64748B", margin: "0 0 28px", lineHeight: 1.6 }}>Register, send a payment, and watch the AI block or challenge it in real time — with a full explanation.</p>
          <Link
            href="/register"
            id="demo-cta"
            style={{ display: "inline-block", padding: "14px 32px", borderRadius: "12px", background: "linear-gradient(135deg, #00D4FF, #3B82F6)", color: "#04080F", fontSize: "15px", fontWeight: 800, textDecoration: "none", letterSpacing: "0.5px" }}
          >
            Start Demo →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "24px", borderTop: "1px solid rgba(255,255,255,0.04)", fontSize: "12px", color: "#1E3A5F" }}>
        SafePay Fraud Intelligence Platform · FYP Demo · {new Date().getFullYear()}
      </footer>
    </main>
  );
}
