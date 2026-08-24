"use client";

/**
 * /merchant — Smart router.
 * Checks if user has a merchant profile.
 *   • Yes  → redirect to /merchant/dashboard
 *   • No   → redirect to /merchant/register
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";

export default function MerchantRouter() {
  const router = useRouter();

  useEffect(() => {
    apiClient
      .get("/merchant/me")
      .then(() => router.replace("/merchant/dashboard"))
      .catch((err) => {
        if (err?.response?.status === 404) {
          router.replace("/merchant/register");
        } else {
          // Any other error (auth, network) → still send to register
          router.replace("/merchant/register");
        }
      });
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050608",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        border: "3px solid rgba(124,92,255,0.2)",
        borderTopColor: "#7C5CFF",
        animation: "sp-spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes sp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
