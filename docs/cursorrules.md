# cursorrules.md — AI Coding Agent Rules

# SafePay — Cursor AI Rules
# App: SafePay (AI-powered secure payment + fraud detection)
# Stack: Next.js 14 + FastAPI + XGBoost + LangGraph + Flower + Solidity
# Always read /docs folder before writing any code.
# Current phase: check /docs/Tracker.md
> These are standing instructions for any AI coding assistant (Copilot, Claude, etc.) working in this repo. Paste relevant sections into Copilot Chat / Copilot instructions file (`.github/copilot-instructions.md`) as needed. Goal: keep "vibe coding" fast but prevent the kind of mistakes that are expensive in a fintech/fraud codebase.

## 1. Source of Truth
- Before writing any code, check `/docs/PRD.md`, `/docs/TechStack.md`, `/docs/Schema.md`, and `/docs/Appflow.md`. Do not invent features, screens, or schema not described there without flagging it first.
- If a request conflicts with `Schema.md` or `TechStack.md`, stop and ask rather than silently deviating.
- Always work from the **current phase** in `Tracker.md`. Do not jump ahead to a later phase's features unless explicitly asked.

## 2. Scope Discipline
- One task at a time. Do not bundle unrelated changes (e.g. don't refactor auth while building the wallet endpoint).
- Do not introduce a new library, framework, or service not listed in `TechStack.md` without asking first.
- No speculative abstraction — build what the current phase needs, not what might be needed in Phase 9.
- Stay scoped to the requested files/directories. Don't roam into unrelated parts of the codebase.

## 3. Security & Fraud-Specific Rules (non-negotiable)
- **Never log or print full PII** (full card numbers, raw passwords, full phone/email in plaintext logs). Mask or hash in logs.
- **Never commit secrets** — no API keys, DB passwords, JWT secrets in code. Always via `.env` / secret manager, and `.env` must be gitignored.
- **No PII on the blockchain layer, ever.** Only hashed identifiers (`keccak256` or equivalent) may be written to `FraudRegistry.sol` / published on-chain. Reject any code path that would write raw device IDs, emails, phone numbers, or names on-chain.
- All money fields are `NUMERIC`/`Decimal`, never `float`, anywhere in the stack (backend, ML feature pipeline, frontend display formatting excluded).
- Every payment-mutating endpoint must be idempotent (respect `Idempotency-Key`).
- Every fraud decision (`approve`/`challenge`/`block`) must persist a corresponding row in `fraud_scores` + `fraud_explanations` — never short-circuit a transaction without writing the audit trail.
- Authentication/authorization checks belong in middleware, not scattered ad hoc in route handlers — don't write a new auth check pattern; reuse the existing one.
- Rate limiting and audit logging are not optional polish — implement them in the same PR as the endpoint they protect, not as a "later" cleanup task.

## 4. Code Quality Bar
- TypeScript: `strict` mode on, no `any` unless explicitly justified in a comment.
- Python: type hints on all function signatures; run `ruff`/`black` before considering a task done.
- Every new API endpoint needs: input validation (Pydantic/zod), explicit error responses (no bare 500s), and a docstring/comment describing what it does.
- No commented-out dead code left in commits. No `console.log`/`print` debugging left behind — use the project logger.
- Prefer explicit, readable code over clever one-liners — this codebase will be read by you (and Copilot) far more than it will be written.

## 5. Testing Expectations
- Every fraud-scoring change must include at least one test with a "should approve" case and one "should block/challenge" case.
- Every payment endpoint needs a happy-path test and at least one failure-path test (insufficient balance, invalid recipient, etc.).
- Do not mark a phase complete in `Tracker.md` until its exit criteria (from `ImplementationPlan.md`) has a passing test or manual verification note.

## 6. AI/Agent-Specific Rules
- LangGraph/LangChain agent nodes must be deterministic in their I/O contract (defined input schema → defined output schema) even if the reasoning inside is LLM-driven — never let an agent return free-form unstructured text where downstream code expects structured JSON.
- The Explainability Agent's output must always be traceable back to actual SHAP values / feature scores — never let it generate a plausible-sounding explanation that isn't grounded in the real `fraud_scores` row.
- The AI Copilot must ground every answer in real data (the user's actual transaction/explanation records) — no hallucinated reasons for blocks, no fabricated account details.

## 7. Git & Workflow Hygiene
- Small, frequent commits with clear messages (`feat:`, `fix:`, `chore:`, `docs:` prefixes).
- One feature/phase-task per branch where practical.
- Update `Tracker.md` (status + notes + daily log) at the end of each working session — this is the project's memory across vibe-coding sessions, treat it as mandatory, not optional.
- If Copilot/Claude generates a large multi-file change, review file-by-file before accepting — don't blind-accept large diffs in a fraud/payments codebase.

## 8. When the AI Is Unsure
- If a requirement is ambiguous, the AI should ask a clarifying question rather than guessing — especially for anything touching money movement, fraud thresholds, or PII handling.
- If asked to implement something that contradicts a security rule above, the AI should flag the conflict instead of silently complying.

## 9. Definition of Done (per task)
A task is **not done** until:
1. Code matches `TechStack.md` conventions and `Schema.md` structures
2. Relevant tests pass
3. No secrets/PII leaked in code or logs
4. `Tracker.md` updated
5. Code reviewed (by you) before merging to main
