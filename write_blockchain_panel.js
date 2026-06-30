const fs = require("fs");

const content = `"use client";
/**
 * BlockchainPanel.tsx — Phase 6 admin panel showing on-chain fraud signal status
 * for a case's linked device and account, plus a manual publish action.
 */
import { useState } from "react";
import {
  lookupFraudSignal,
  getReputation,
  type FraudSignalLookup,
  type ReputationLookup,
} from "@/lib/blockchain-api";
import type { FraudCase, BlockchainPublishResult } from "@/lib/fraud-api";

interface BlockchainPanelProps {
  caseData: FraudCase;
}

interface EntityState {
  signal: FraudSignalLookup | null;
  reputation: ReputationLookup | null;
  loading: boolean;
  error: string | null;
}

const EMPTY_STATE: EntityState = {
  signal: null,
  reputation: null,
  loading: false,
  error: null,
};

function EntityCard({
  label,
  publishResult,
  state,
  onCheck,
}: {
  label: string;
  publishResult?: BlockchainPublishResult;
  state: EntityState;
  onCheck: () => void;
}): JSX.Element {
  return (
    <div
      style={{
        background: "#04080F",
        border: "1px solid #162840",
        borderRadius: "10px",
        padding: "16px",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "1px",
          textTransform: "uppercase",
          color: "#8B5CF6",
          marginBottom: "10px",
        }}
      >
        {label}
      </div>

      {publishResult ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <Row label="Hash" value={shorten(publishResult.entity_hash)} />
          <Row label="Tx Hash" value={shorten(publishResult.tx_hash)} />
          <Row label="Block" value={String(publishResult.block_number)} />
          <Row label="Status" value={publishResult.status} accent="#10B981" />
        </div>
      ) : (
        <div style={{ fontSize: "12px", color: "#3D6080", marginBottom: "10px" }}>
          Not yet published for this case.
        </div>
      )}

      <button
        onClick={onCheck}
        disabled={state.loading || !publishResult}
        style={{
          marginTop: "12px",
          width: "100%",
          padding: "8px",
          borderRadius: "8px",
          border: "1px solid #162840",
          background: "transparent",
          color: publishResult ? "#00D4FF" : "#3D6080",
          fontSize: "12px",
          fontWeight: 600,
          cursor: state.loading || !publishResult ? "not-allowed" : "pointer",
          opacity: state.loading || !publishResult ? 0.5 : 1,
        }}
      >
        {state.loading ? "Checking…" : "Check On-Chain Status"}
      </button>

      {state.error && (
        <div style={{ marginTop: "8px", fontSize: "11px", color: "#EF4444" }}>
          {state.error}
        </div>
      )}

      {state.signal && (
        <div
          style={{
            marginTop: "12px",
            paddingTop: "12px",
            borderTop: "1px solid #162840",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <Row
            label="Is Fraud"
            value={state.signal.is_fraud ? "TRUE" : "FALSE"}
            accent={state.signal.is_fraud ? "#EF4444" : "#10B981"}
          />
          <Row label="Reporting Bank" value={shorten(state.signal.reporting_bank)} />
          {state.reputation && (
            <Row label="Reputation Score" value={String(state.reputation.score) + " / 100"} />
          )}
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}): JSX.Element {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
      <span style={{ color: "#3D6080" }}>{label}</span>
      <span
        style={{
          fontFamily: "var(--font-ibm-plex-mono)",
          color: accent ?? "#C5D8EF",
          fontWeight: accent ? 700 : 400,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function shorten(hash: string): string {
  if (hash.length <= 14) return hash;
  return hash.slice(0, 8) + "…" + hash.slice(-6);
}

export default function BlockchainPanel({ caseData }: BlockchainPanelProps): JSX.Element {
  const [deviceState, setDeviceState] = useState<EntityState>(EMPTY_STATE);
  const [accountState, setAccountState] = useState<EntityState>(EMPTY_STATE);

  async function checkEntity(
    entityHash: string,
    setState: React.Dispatch<React.SetStateAction<EntityState>>
  ): Promise<void> {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const signal = await lookupFraudSignal(entityHash);
      let reputation: ReputationLookup | null = null;
      try {
        reputation = await getReputation(entityHash);
      } catch {
        reputation = null;
      }
      setState({ signal, reputation, loading: false, error: null });
    } catch {
      setState((s) => ({
        ...s,
        loading: false,
        error: "Could not reach blockchain layer.",
      }));
    }
  }

  const device = caseData.blockchain?.device;
  const account = caseData.blockchain?.account;

  return (
    <div
      style={{
        background: "#0A1628",
        border: "1px solid #162840",
        borderRadius: "12px",
        padding: "20px",
        marginTop: "20px",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "2px",
          textTransform: "uppercase",
          color: "#00D4FF",
          fontFamily: "var(--font-ibm-plex-mono)",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        ⛓ Blockchain Fraud Intelligence
      </div>

      {!device && !account && (
        <div
          style={{
            fontSize: "12px",
            color: "#3D6080",
            padding: "16px",
            textAlign: "center",
            border: "1px dashed #162840",
            borderRadius: "8px",
          }}
        >
          No on-chain signals published yet. Set this case to{" "}
          <strong style={{ color: "#EF4444" }}>Confirmed Fraud</strong> and save to
          auto-publish anonymized device and account signals to the FraudRegistry
          contract.
        </div>
      )}

      {(device || account) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <EntityCard
            label="Device Signal"
            publishResult={device}
            state={deviceState}
            onCheck={() => device && checkEntity(device.entity_hash, setDeviceState)}
          />
          <EntityCard
            label="Account Signal"
            publishResult={account}
            state={accountState}
            onCheck={() => account && checkEntity(account.entity_hash, setAccountState)}
          />
        </div>
      )}
    </div>
  );
}
`;

fs.mkdirSync("src/components/admin", { recursive: true });
fs.writeFileSync("src/components/admin/BlockchainPanel.tsx", content);
console.log("Written:", content.length, "bytes");