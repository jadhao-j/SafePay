"use client";

/**
 * ExplanationPanel — renders SHAP-based fraud explanation for a transaction.
 * Shows component risk scores as horizontal bars + top SHAP factors list.
 */
import type { TransactionExplanation } from "@/lib/fraud-api";

interface ExplanationPanelProps {
  data: TransactionExplanation;
}

const RISK_COLORS = {
  approve: { bar: "#10B981", label: "Approved", bg: "rgba(16,185,129,0.12)", text: "#10B981" },
  challenge: { bar: "#F59E0B", label: "Challenged", bg: "rgba(245,158,11,0.12)", text: "#F59E0B" },
  block: { bar: "#EF4444", label: "Blocked", bg: "rgba(239,68,68,0.12)", text: "#EF4444" },
};

function riskColor(score: number): string {
  if (score < 0.3) return "#10B981";
  if (score <= 0.7) return "#F59E0B";
  return "#EF4444";
}

interface ScoreBarProps {
  label: string;
  value: number;
  description: string;
}

function ScoreBar({ label, value, description }: ScoreBarProps): JSX.Element {
  const pct = Math.round(value * 100);
  const color = riskColor(value);
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#0F172A" }}>{label}</span>
        <span style={{ fontSize: "13px", fontFamily: "var(--font-ibm-plex-mono)", color }}>
          {pct}%
        </span>
      </div>
      <div
        style={{
          height: "8px",
          borderRadius: "4px",
          background: "#E2E8F0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: "4px",
            transition: "width 0.6s ease",
          }}
        />
      </div>
      <span style={{ fontSize: "11px", color: "#64748B", marginTop: "3px", display: "block" }}>
        {description}
      </span>
    </div>
  );
}

export default function ExplanationPanel({ data }: ExplanationPanelProps): JSX.Element {
  const decision = data.decision as "approve" | "challenge" | "block";
  const colors = RISK_COLORS[decision] ?? RISK_COLORS.challenge;
  const finalScore = parseFloat(data.final_risk_score);
  const confidence = Math.round(parseFloat(data.confidence) * 100);

  // Max absolute SHAP value for normalising bar widths
  const maxShap = Math.max(...data.top_factors.map((f) => Math.abs(f.shap_value)), 0.01);

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: "16px",
        padding: "28px",
        boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
        fontFamily: "var(--font-dm-sans), sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: colors.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
          }}
        >
          {decision === "approve" ? "✓" : decision === "challenge" ? "⚠" : "✕"}
        </div>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: colors.text }}>
            {colors.label}
          </div>
          <div style={{ fontSize: "22px", fontFamily: "var(--font-ibm-plex-mono)", fontWeight: 700, color: "#0F172A" }}>
            Risk Score: {Math.round(finalScore * 100)}
            <span style={{ fontSize: "14px", color: "#64748B", fontWeight: 400 }}>/100</span>
          </div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: "#64748B" }}>Model Confidence</div>
          <div style={{ fontSize: "18px", fontFamily: "var(--font-ibm-plex-mono)", fontWeight: 700, color: "#0F172A" }}>
            {confidence}%
          </div>
          <div style={{ fontSize: "11px", color: "#64748B", fontFamily: "var(--font-ibm-plex-mono)" }}>
            {data.model_version}
          </div>
        </div>
      </div>

      {/* Explanation text */}
      <div
        style={{
          background: colors.bg,
          border: `1px solid ${colors.text}30`,
          borderRadius: "10px",
          padding: "14px 16px",
          marginBottom: "24px",
          fontSize: "14px",
          color: "#0F172A",
          lineHeight: "1.6",
        }}
      >
        <span style={{ fontWeight: 600, color: colors.text }}>AI Analysis: </span>
        {data.explanation_text}
      </div>

      {/* Component Risk Scores */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "#64748B", marginBottom: "14px" }}>
          Risk Components
        </div>
        <ScoreBar
          label="Behavioral Risk"
          value={parseFloat(data.behavioral_risk)}
          description="Based on your typing and interaction patterns"
        />
        <ScoreBar
          label="Device Risk"
          value={parseFloat(data.device_risk)}
          description="Trust level of the originating device"
        />
        <ScoreBar
          label="Transaction Risk"
          value={parseFloat(data.transaction_risk)}
          description="Amount relative to your typical transactions"
        />
        <ScoreBar
          label="ML Model Score"
          value={parseFloat(data.ml_score)}
          description="XGBoost classifier probability"
        />
      </div>

      {/* SHAP Top Factors */}
      {data.top_factors.length > 0 && (
        <div>
          <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "#64748B", marginBottom: "14px" }}>
            Top AI Signals (SHAP)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {data.top_factors.map((factor) => {
              const absVal = Math.abs(factor.shap_value);
              const pct = Math.round((absVal / maxShap) * 100);
              const isRisk = factor.contribution === "increases_risk";
              const barColor = isRisk ? "#EF4444" : "#10B981";
              return (
                <div key={factor.feature} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: barColor,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: "140px", fontSize: "13px", fontFamily: "var(--font-ibm-plex-mono)", color: "#0F172A", fontWeight: 600 }}>
                    {factor.feature}
                  </div>
                  <div style={{ flex: 1, height: "6px", borderRadius: "3px", background: "#F1F5F9", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: barColor,
                        borderRadius: "3px",
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      minWidth: "52px",
                      fontSize: "11px",
                      fontFamily: "var(--font-ibm-plex-mono)",
                      color: barColor,
                      fontWeight: 700,
                      textAlign: "right",
                    }}
                  >
                    {isRisk ? "+" : ""}{factor.shap_value.toFixed(3)}
                  </div>
                  <div
                    style={{
                      padding: "2px 8px",
                      borderRadius: "999px",
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      background: isRisk ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
                      color: barColor,
                      minWidth: "90px",
                      textAlign: "center",
                    }}
                  >
                    {isRisk ? "↑ Increases Risk" : "↓ Reduces Risk"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommended Action */}
      {data.recommended_action && (
        <div
          style={{
            marginTop: "24px",
            padding: "14px 16px",
            background: "#F7F9FC",
            borderRadius: "10px",
            borderLeft: `4px solid ${colors.text}`,
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "18px" }}>💡</span>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748B", marginBottom: "3px" }}>
              Recommended Action
            </div>
            <div style={{ fontSize: "14px", color: "#0F172A", textTransform: "capitalize" }}>
              {data.recommended_action}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
