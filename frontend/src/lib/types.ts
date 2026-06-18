export type UserRole = "user" | "merchant" | "fraud_analyst" | "compliance_officer" | "admin";

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  password_hash: string | null;
  role: UserRole;
  pin_hash: string | null;
  mfa_enabled: boolean;
  security_score: number;
  status: "active" | "suspended" | "frozen";
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  user_id: string;
  device_fingerprint: string;
  device_name: string | null;
  os_signature: string | null;
  ip_address: string | null;
  is_trusted: boolean;
  trust_score: string;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BehavioralBaseline {
  id: string;
  user_id: string;
  keystroke_profile: Record<string, unknown>;
  mouse_profile: Record<string, unknown>;
  touch_profile: Record<string, unknown>;
  baseline_version: number;
  created_at: string;
  updated_at: string;
}

export interface BehavioralEvent {
  id: string;
  user_id: string;
  session_id: string | null;
  event_type: "keystroke" | "mouse" | "touch";
  payload: Record<string, unknown>;
  trust_score_at_event: string;
  captured_at: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_user_id: string | null;
  action: string;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: string;
  currency: string;
  status: "active" | "frozen";
  created_at: string;
  updated_at: string;
}

export interface Merchant {
  id: string;
  user_id: string;
  business_name: string;
  upi_id: string;
  category: string | null;
  risk_rating: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  sender_wallet_id: string;
  receiver_wallet_id: string | null;
  merchant_id: string | null;
  amount: string;
  currency: string;
  payment_type: "p2p" | "merchant" | "qr" | "upi" | "recurring";
  status: "pending" | "approved" | "challenged" | "blocked" | "completed" | "failed" | "reversed";
  device_id: string | null;
  idempotency_key: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentRequest {
  id: string;
  requester_wallet_id: string;
  payer_wallet_id: string;
  amount: string;
  status: "pending" | "fulfilled" | "declined" | "expired";
  created_at: string;
  updated_at: string;
}

export interface ScheduledPayment {
  id: string;
  wallet_id: string;
  receiver_upi_id: string;
  amount: string;
  frequency: "once" | "daily" | "weekly" | "monthly";
  next_run_at: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FraudScore {
  id: string;
  transaction_id: string;
  transaction_deviation_score: string;
  behavioral_deviation_score: string;
  device_risk_score: string;
  location_risk_score: string;
  merchant_risk_score: string;
  synthetic_identity_score: string;
  final_risk_score: string;
  decision: "approve" | "challenge" | "block";
  model_version: string | null;
  created_at: string;
  updated_at: string;
}

export interface FraudExplanation {
  id: string;
  fraud_score_id: string;
  top_factors: Array<{ factor: string; contribution: number; shap_value: number }>;
  explanation_text: string;
  confidence: string;
  recommended_action: string;
  created_at: string;
  updated_at: string;
}

export interface FraudCase {
  id: string;
  transaction_id: string;
  assigned_analyst_id: string | null;
  status: "open" | "investigating" | "confirmed_fraud" | "dismissed" | "closed";
  notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  transaction_id: string | null;
  type: "fraud_block" | "fraud_challenge" | "device_new" | "security_score_drop";
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlockchainFraudSignal {
  id: string;
  entity_type: "device" | "merchant" | "account";
  entity_hash: string;
  risk_indicator: string;
  on_chain_tx_hash: string;
  reported_by_institution: string;
  created_at: string;
  updated_at: string;
}

export interface ReputationScore {
  id: string;
  entity_hash: string;
  reputation_score: string;
  signal_count: number;
  last_updated_on_chain_at: string;
  created_at: string;
  updated_at: string;
}

export interface FLClient {
  id: string;
  institution_name: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface FLTrainingRound {
  id: string;
  round_number: number;
  global_model_version: string;
  participating_clients: string[];
  aggregate_metrics: Record<string, unknown>;
  completed_at: string;
  created_at: string;
  updated_at: string;
}
