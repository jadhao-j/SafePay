/**
 * fraud-api.ts — Typed helpers for all Phase 5 fraud endpoints.
 * Every function reads the token from localStorage and attaches it.
 */
import { apiClient } from "./api";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ShapFactor {
  feature: string;
  shap_value: number;
  contribution: "increases_risk" | "decreases_risk";
}

export interface TransactionExplanation {
  transaction_id: string;
  final_risk_score: string;
  decision: "approve" | "challenge" | "block";
  behavioral_risk: string;
  device_risk: string;
  transaction_risk: string;
  ml_score: string;
  model_version: string;
  explanation_text: string;
  top_factors: ShapFactor[];
  confidence: string;
  recommended_action: string;
}

export interface FraudAlert {
  id: string;
  transaction_id: string | null;
  type: "fraud_block" | "fraud_challenge" | "device_new" | "security_score_drop";
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface FraudCase {
  case_id: string;
  transaction_id: string;
  status: "open" | "investigating" | "confirmed_fraud" | "dismissed" | "closed";
  notes: string | null;
}

export interface WalletTransaction {
  id: string;
  sender_wallet_id: string;
  receiver_wallet_id: string | null;
  merchant_id: string | null;
  amount: string;
  currency: string;
  payment_type: "p2p" | "merchant" | "qr" | "upi" | "recurring" | "topup" | "withdrawal";
  status: "pending" | "approved" | "challenged" | "blocked" | "completed" | "failed" | "reversed";
  device_id: string | null;
  idempotency_key: string;
  created_at: string;
  updated_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function authHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("access_token") ?? "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── API calls ──────────────────────────────────────────────────────────────

/** Fetch the current user's transaction history. */
export async function fetchTransactions(): Promise<WalletTransaction[]> {
  const res = await apiClient.get<WalletTransaction[]>("/wallet/transactions", {
    headers: authHeader(),
  });
  return res.data;
}

/** Fetch SHAP explanation for a single transaction. */
export async function fetchExplanation(
  transactionId: string
): Promise<TransactionExplanation> {
  const res = await apiClient.get<TransactionExplanation>(
    `/fraud/transactions/${transactionId}/explanation`,
    { headers: authHeader() }
  );
  return res.data;
}

/** Fetch fraud alerts for the authenticated user. */
export async function fetchAlerts(): Promise<FraudAlert[]> {
  const res = await apiClient.get<FraudAlert[]>("/fraud/alerts", {
    headers: authHeader(),
  });
  return res.data;
}

/** Mark a single alert as read. */
export async function markAlertRead(alertId: string): Promise<void> {
  await apiClient.patch(
    `/fraud/alerts/${alertId}/read`,
    {},
    { headers: authHeader() }
  );
}

/** Fetch a fraud investigation case. */
export async function fetchCase(caseId: string): Promise<FraudCase> {
  const res = await apiClient.get<FraudCase>(`/fraud/case/${caseId}`, {
    headers: authHeader(),
  });
  return res.data;
}

/** Update case status and/or notes. */
export async function updateCase(
  caseId: string,
  payload: { status?: string; notes?: string }
): Promise<FraudCase> {
  const res = await apiClient.patch<FraudCase>(`/fraud/case/${caseId}`, payload, {
    headers: authHeader(),
  });
  return res.data;
}

/** Open a new investigation case for a transaction. */
export async function openCase(transactionId: string, notes?: string): Promise<FraudCase> {
  const res = await apiClient.post<FraudCase>(
    "/fraud/case",
    { transaction_id: transactionId, notes: notes ?? null },
    { headers: authHeader() }
  );
  return res.data;
}
