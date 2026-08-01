"use client";

import { useEffect, useRef, useState } from "react";

interface FeedEvent {
  transaction_id: string;
  amount: string;
  currency: string;
  payment_type: string;
  decision: string;
  final_risk_score: number;
  status: string;
  timestamp: string;
}

const DECISION_COLOR: Record<string, string> = {
  approve: "var(--admin-green)",
  challenge: "var(--admin-amber)",
  block: "var(--admin-red)",
};

export function AdminSocShell(): JSX.Element {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) return;

    const wsBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1").replace(
      /^http/,
      "ws"
    );
   const ws = new WebSocket(`${wsBase}/ws/admin/feed?token=${token}`);
    wsRef.current = ws;
    let cancelled = false;

    ws.onopen = () => {
      if (!cancelled) setConnected(true);
    };
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      try {
        const parsed: FeedEvent = JSON.parse(event.data);
        setEvents((prev) => [parsed, ...prev].slice(0, 20));
      } catch {
        // ignore malformed frames
      }
    };

    return () => {
      cancelled = true;
      ws.close();
    };
  }, []);

  return (
    <section className="rounded-xl border border-admin-border bg-admin-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-mono text-sm uppercase tracking-widest text-admin-cyan">
          Live Transaction Feed
        </h2>
        <span
          className="font-mono text-xs uppercase tracking-widest"
          style={{ color: connected ? "var(--admin-green)" : "var(--admin-dim)" }}
        >
          {connected ? "● live" : "○ disconnected"}
        </span>
      </div>

      {events.length === 0 ? (
        <p className="font-mono text-sm text-admin-dim">Waiting for transaction activity…</p>
      ) : (
        <ul className="space-y-2">
          {events.map((evt, idx) => (
            <li
              key={`${evt.transaction_id}-${evt.status}-${idx}`}
              className="flex items-center justify-between rounded-lg border border-admin-border bg-admin-surface px-3 py-2 font-mono text-sm"
            >
              <span className="text-admin-text">
                {evt.payment_type.toUpperCase()} · {evt.currency} {evt.amount}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-xs uppercase tracking-wider"
                style={{ color: DECISION_COLOR[evt.decision] ?? "var(--admin-text)" }}
              >
                {evt.status} · {evt.final_risk_score.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}