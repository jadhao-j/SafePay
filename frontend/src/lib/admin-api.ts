import { apiClient } from "./api";

// ── Overview / KPIs ────────────────────────────────────────────────────────
export interface OverviewData {
  window: string;
  since: string;
  total_transactions: number;
  scored_transactions: number;
  approved_count: number;
  challenged_count: number;
  blocked_count: number;
  fraud_rate: number;
  avg_risk_score: number;
}

export async function fetchOverview(window = "24h"): Promise<OverviewData> {
  const res = await apiClient.get<OverviewData>("/admin/dashboard/overview", {
    params: { window },
  });
  return res.data;
}

// ── Risk Distribution ──────────────────────────────────────────────────────
export interface RiskDistribution {
  window: string;
  since: string;
  total_scored: number;
  avg_risk_score?: number;
  buckets: Record<string, number>;
}

export async function fetchRiskDistribution(
  window = "24h"
): Promise<RiskDistribution> {
  const res = await apiClient.get<RiskDistribution>(
    "/admin/dashboard/risk-distribution",
    { params: { window } }
  );
  return res.data;
}

// ── Heatmap ────────────────────────────────────────────────────────────────
export interface HeatmapData {
  window: string;
  since: string;
  heatmap: Record<string, Record<string, { count: number; avg_risk: number }>>;
}

export async function fetchHeatmap(window = "24h"): Promise<HeatmapData> {
  const res = await apiClient.get<HeatmapData>("/admin/dashboard/heatmap", {
    params: { window },
  });
  return res.data;
}

// ── Devices ────────────────────────────────────────────────────────────────
export interface AdminDevice {
  id: string;
  user_id: string;
  device_name: string | null;
  os_signature: string | null;
  ip_address: string | null;
  is_trusted: boolean;
  trust_score: number;
  last_active_at: string | null;
}

export async function fetchDevices(
  untrusted_only = false
): Promise<AdminDevice[]> {
  const res = await apiClient.get<AdminDevice[]>("/admin/devices", {
    params: { untrusted_only, limit: 50 },
  });
  return res.data;
}

// ── Merchants ──────────────────────────────────────────────────────────────
export interface AdminMerchant {
  id: string;
  business_name: string;
  upi_id: string;
  category: string;
  risk_rating: number;
}

export async function fetchMerchants(): Promise<AdminMerchant[]> {
  const res = await apiClient.get<AdminMerchant[]>("/admin/merchants");
  return res.data;
}

// ── Users ─────────────────────────────────────────────────────────────────
export interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  security_score: number;
  mfa_enabled: boolean;
  created_at: string;
}

export async function fetchUsers(): Promise<AdminUser[]> {
  const res = await apiClient.get<AdminUser[]>("/admin/users");
  return res.data;
}

export async function updateUserStatus(
  userId: string,
  newStatus: "active" | "suspended" | "frozen"
): Promise<AdminUser> {
  const res = await apiClient.patch<AdminUser>(
    `/admin/users/${userId}/status`,
    { status: newStatus }
  );
  return res.data;
}

// ── Behavioral Analytics ───────────────────────────────────────────────────
export interface BehavioralStats {
  total_users_with_events: number;
  avg_trust_score: number;
  trust_score_buckets: Record<string, number>;
  event_type_breakdown: Record<string, number>;
  high_risk_users: Array<{
    user_id: string;
    avg_trust_score: number;
    event_count: number;
  }>;
}

export async function fetchBehavioralAnalytics(): Promise<BehavioralStats> {
  const res = await apiClient.get<BehavioralStats>(
    "/admin/dashboard/behavioral-analytics"
  );
  return res.data;
}

// ── AI Copilot ─────────────────────────────────────────────────────────────
export interface CopilotAnswer {
  answer: string;
  sources: string[];
  tool_used: string | null;
  grounded: boolean;
}

export async function askCopilot(
  question: string,
  transaction_id?: string | null
): Promise<CopilotAnswer> {
  const res = await apiClient.post<CopilotAnswer>("/copilot/ask", {
    question,
    transaction_id: transaction_id ?? null,
  });
  return res.data;
}
