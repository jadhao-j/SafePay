const fs = require("fs");

const content = `/**
 * blockchain-api.ts — Typed helpers for Phase 6 blockchain fraud intelligence endpoints.
 * Every function reads the token from localStorage and attaches it.
 */
import { apiClient } from "./api";

// -- Types --------------------------------------------------------------

export interface FraudSignalLookup {
  entity_hash: string;
  is_fraud: boolean;
  reported_at: number;
  reporting_bank: string;
}

export interface ReputationLookup {
  entity_hash: string;
  score: number;
  last_updated: number;
}

export interface PublishSignalRequest {
  entity_type: "device" | "merchant" | "account";
  entity_hash: string;
  risk_indicator: string;
}

export interface PublishSignalResult {
  entity_hash: string;
  tx_hash: string;
  block_number: number;
  status: string;
  risk_indicator: string;
}

// -- Helpers --------------------------------------------------------------

function authHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("access_token") ?? "";
  return token ? { Authorization: \\\`Bearer \\\${token}\\\` } : {};
}

// -- API calls --------------------------------------------------------------

/** Publish an anonymized fraud signal to the on-chain FraudRegistry. */
export async function publishFraudSignal(
  payload: PublishSignalRequest
): Promise<PublishSignalResult> {
  const res = await apiClient.post<PublishSignalResult>(
    "/blockchain/fraud-signal/publish",
    payload,
    { headers: authHeader() }
  );
  return res.data;
}

/** Look up whether an entity hash has been reported as fraud on-chain. */
export async function lookupFraudSignal(
  entityHash: string
): Promise<FraudSignalLookup> {
  const res = await apiClient.get<FraudSignalLookup>(
    \\\`/blockchain/fraud-signal/lookup/\\\${entityHash}\\\`,
    { headers: authHeader() }
  );
  return res.data;
}

/** Get the on-chain reputation score for an entity hash. */
export async function getReputation(
  entityHash: string
): Promise<ReputationLookup> {
  const res = await apiClient.get<ReputationLookup>(
    \\\`/blockchain/reputation/\\\${entityHash}\\\`,
    { headers: authHeader() }
  );
  return res.data;
}
`;

fs.writeFileSync("src/lib/blockchain-api.ts", content);
console.log("Written:", content.length, "bytes");
