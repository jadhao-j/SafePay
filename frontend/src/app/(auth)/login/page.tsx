"use client";

/**
 * Login page -- email + password form, stores access_token in localStorage,
 * then redirects to ?returnTo= (or /admin/cases as default for admin flows).
 */

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { setAuthToken } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

function LoginForm(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (searchParams?.get("returnTo")) {
      setSessionExpired(true);
    }
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        identifier: email,
        password,
      });

      const token: string = res.data?.access_token;
      if (!token) throw new Error("No token received.");
      setAuthToken(token);

      const returnTo = searchParams?.get("returnTo");
      router.push(returnTo ? decodeURIComponent(returnTo) : "/admin/cases");
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError("Invalid email or password.");
      } else {
        setError("Login failed. Please check your credentials or try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #04080F 0%, #0A1628 50%, #04080F 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "300px",
          background: "radial-gradient(ellipse, rgba(0,212,255,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "420px", padding: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              fontSize: "32px",
              fontWeight: 900,
              letterSpacing: "4px",
              background: "linear-gradient(135deg, #00D4FF, #3B82F6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "6px",
            }}
          >
            SAFEPAY
          </div>
          <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#3D6080", textTransform: "uppercase" }}>
            Fraud Intelligence Platform
          </div>
        </div>

        {sessionExpired && (
          <div
            style={{
              background: "rgba(234,179,8,0.08)",
              border: "1px solid rgba(234,179,8,0.25)",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "20px",
              fontSize: "13px",
              color: "#EAB308",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span>⚠</span>
            <span>Your session has expired. Please log in again to continue.</span>
          </div>
        )}

        <div
          style={{
            background: "rgba(10,22,40,0.9)",
            border: "1px solid #162840",
            borderRadius: "20px",
            padding: "40px",
            backdropFilter: "blur(20px)",
            boxShadow: "0 0 60px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: "#00D4FF",
              marginBottom: "24px",
            }}
          >
            SOC Analyst Sign-In
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label
                htmlFor="login-email"
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  color: "#3D6080",
                  marginBottom: "8px",
                }}
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="analyst@safepay.com"
                autoComplete="email"
                style={{
                  width: "100%",
                  background: "#04080F",
                  border: "1px solid #162840",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  fontSize: "14px",
                  color: "#C5D8EF",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  color: "#3D6080",
                  marginBottom: "8px",
                }}
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  width: "100%",
                  background: "#04080F",
                  border: "1px solid #162840",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  fontSize: "14px",
                  color: "#C5D8EF",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  color: "#EF4444",
                }}
              >
                {error}
              </div>
            )}

            <button
              id="btn-login"
              type="submit"
              disabled={loading}
              style={{
                marginTop: "8px",
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                background: loading ? "rgba(0,212,255,0.1)" : "linear-gradient(135deg, #00D4FF, #3B82F6)",
                color: loading ? "#3D6080" : "#04080F",
                fontSize: "15px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: "0.5px",
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "12px", color: "#1E3A5F" }}>
          SafePay Fraud Intelligence Platform · Internal Use Only
        </div>
      </div>
    </main>
  );
}

export default function LoginPage(): JSX.Element {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

