"use client";

/**
 * My QR Code Page — Phase 11C
 * Shows the user's personal UPI QR code for receiving money.
 * Uses qrcode.toDataURL to generate a PNG rendered as an <img>.
 */

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";

export default function MyQRPage() {
  const [qrData, setQrData] = useState<{ upi_id: string; name: string; payload: string } | null>(null);
  const [qrImageSrc, setQrImageSrc] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // Fetch QR data on mount + generate QR image
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<{ upi_id: string; name: string; payload: string }>("/payments/qr/my-qr");
        setQrData(res.data);

        // Generate QR as data URL (base64 PNG) — no canvas needed
        const QRCode = (await import("qrcode")).default;
        const dataUrl = await QRCode.toDataURL(res.data.payload, {
          width: 280,
          margin: 2,
          color: { dark: "#F5F6F8", light: "#0D0F14" },
        });
        setQrImageSrc(dataUrl);
      } catch {
        setError("Could not load your QR code. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function handleDownload() {
    if (!qrImageSrc) return;
    const link = document.createElement("a");
    link.download = "safepay-qr.png";
    link.href = qrImageSrc;
    link.click();
  }

  async function handleShare() {
    if (!qrImageSrc) return;
    try {
      // Convert data URL to blob for sharing
      const resp = await fetch(qrImageSrc);
      const blob = await resp.blob();
      const file = new File([blob], "safepay-qr.png", { type: "image/png" });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: "Pay me on SafePay", text: `Send money to ${qrData?.upi_id}`, files: [file] });
      } else {
        // Fallback: copy UPI ID
        await navigator.clipboard.writeText(qrData?.upi_id ?? "");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch { /* ignore */ }
  }

  async function copyUPI() {
    await navigator.clipboard.writeText(qrData?.upi_id ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050608", color: "#F5F6F8", fontFamily: "var(--font-dm-sans,'DM Sans',sans-serif)", padding: "28px 20px 100px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px", fontFamily: "var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>My QR Code</h1>
        <p style={{ fontSize: 13, color: "#6B7180", margin: "0 0 28px" }}>Share to receive payments instantly</p>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "#6B7180" }}>Loading...</div>
        ) : error ? (
          <div style={{ textAlign: "center", color: "#FF5C5C", padding: 40 }}>{error}</div>
        ) : (
          <>
            {/* QR Card */}
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 24,
              padding: "28px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Glow ring */}
              <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,92,255,0.15),transparent 70%)", pointerEvents: "none" }} />

              {/* SafePay logo above QR */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: -8, zIndex: 1 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "conic-gradient(from 90deg,#7C5CFF,#39D2FF,#3DDC97,#7C5CFF)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  <div style={{ inset: 2, position: "absolute", borderRadius: 6, background: "#0D0F14" }} />
                  <span style={{ position: "relative", fontSize: 11, fontWeight: 800, color: "#fff" }}>S</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", color: "#F5F6F8" }}>SAFEPAY</span>
              </div>

              {/* QR image with gradient border wrapper */}
              <div style={{ padding: 3, borderRadius: 18, background: "conic-gradient(from 90deg,#7C5CFF,#39D2FF,#3DDC97,#7C5CFF)", zIndex: 1 }}>
                <div style={{ borderRadius: 16, overflow: "hidden", background: "#0D0F14", padding: 8 }}>
                  {qrImageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrImageSrc}
                      alt="Your SafePay QR Code"
                      width={240}
                      height={240}
                      style={{ display: "block", borderRadius: 8 }}
                    />
                  ) : (
                    <div style={{ width: 240, height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7180", fontSize: 13 }}>
                      QR unavailable
                    </div>
                  )}
                </div>
              </div>

              {/* Name + UPI */}
              <div style={{ textAlign: "center", zIndex: 1 }}>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#F5F6F8" }}>{qrData?.name}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 4 }}>
                  <span style={{ fontSize: 13, color: "#9198A8", fontFamily: "monospace" }}>{qrData?.upi_id}</span>
                  <button onClick={copyUPI} title="Copy UPI ID" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: copied ? "#3DDC97" : "#6B7180" }}>
                    {copied ? "\u2713" : "\u2398"}
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button onClick={handleShare}
                style={{ flex: 1, padding: "14px", borderRadius: 14, background: "linear-gradient(135deg,#7C5CFF,#39D2FF)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                Share
              </button>
              <button onClick={handleDownload}
                style={{ flex: 1, padding: "14px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F6F8", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Download
              </button>
            </div>

            <p style={{ textAlign: "center", fontSize: 12, color: "#6B7180", marginTop: 16, lineHeight: 1.5 }}>
              Anyone with SafePay can scan this QR to send you money instantly.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
