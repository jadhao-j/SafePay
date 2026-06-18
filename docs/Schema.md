# Schema.md — Database Schema

Database: PostgreSQL. All `id` columns are UUID (`gen_random_uuid()`) unless noted. All tables have `created_at`/`updated_at` timestamps (omitted below for brevity except where notable).

## 1. Core Identity & Auth

### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | TEXT | |
| email | TEXT UNIQUE | |
| phone | TEXT UNIQUE | |
| password_hash | TEXT | nullable for passwordless-only accounts |
| role | ENUM(user, merchant, fraud_analyst, compliance_officer, admin) | default `user` |
| pin_hash | TEXT | transaction PIN |
| mfa_enabled | BOOLEAN | |
| security_score | INT | 0–100, derived/cached |
| status | ENUM(active, suspended, frozen) | |

### `devices`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users.id | |
| device_fingerprint | TEXT | hashed |
| device_name | TEXT | e.g. "iPhone 14" |
| os_signature | TEXT | |
| ip_address | INET | last known |
| is_trusted | BOOLEAN | |
| trust_score | NUMERIC(5,2) | 0–100 |
| last_active_at | TIMESTAMPTZ | |

### `behavioral_baselines`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users.id | |
| keystroke_profile | JSONB | dwell/flight time stats |
| mouse_profile | JSONB | velocity/acceleration stats |
| touch_profile | JSONB | pressure/swipe stats |
| baseline_version | INT | re-enrollment increments this |

### `behavioral_events` (high-volume, time-series candidate)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users.id | |
| session_id | UUID | |
| event_type | ENUM(keystroke, mouse, touch) | |
| payload | JSONB | raw telemetry sample |
| trust_score_at_event | NUMERIC(5,2) | |
| captured_at | TIMESTAMPTZ | |

### `audit_logs`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| actor_user_id | UUID FK → users.id, nullable | |
| action | TEXT | e.g. `login`, `payment.block`, `device.revoke` |
| metadata | JSONB | |
| ip_address | INET | |
| created_at | TIMESTAMPTZ | append-only, indexed |

## 2. Wallet & Payments

### `wallets`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users.id UNIQUE | one wallet per user (MVP) |
| balance | NUMERIC(14,2) | |
| currency | TEXT | default `INR` |
| status | ENUM(active, frozen) | |

### `merchants`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users.id | merchant owner account |
| business_name | TEXT | |
| upi_id | TEXT UNIQUE | |
| category | TEXT | |
| risk_rating | NUMERIC(5,2) | 0–100, aggregated from transaction risk |

### `transactions`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| sender_wallet_id | UUID FK → wallets.id | |
| receiver_wallet_id | UUID FK → wallets.id, nullable | nullable if merchant/external |
| merchant_id | UUID FK → merchants.id, nullable | |
| amount | NUMERIC(14,2) | |
| currency | TEXT | |
| payment_type | ENUM(p2p, merchant, qr, upi, recurring) | |
| status | ENUM(pending, approved, challenged, blocked, completed, failed, reversed) | |
| device_id | UUID FK → devices.id | originating device |
| idempotency_key | TEXT UNIQUE | |
| created_at | TIMESTAMPTZ | indexed |

### `payment_requests`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| requester_wallet_id | UUID FK → wallets.id | |
| payer_wallet_id | UUID FK → wallets.id | |
| amount | NUMERIC(14,2) | |
| status | ENUM(pending, fulfilled, declined, expired) | |

### `scheduled_payments`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| wallet_id | UUID FK → wallets.id | |
| receiver_upi_id | TEXT | |
| amount | NUMERIC(14,2) | |
| frequency | ENUM(once, daily, weekly, monthly) | |
| next_run_at | TIMESTAMPTZ | |
| active | BOOLEAN | |

## 3. Fraud Detection

### `fraud_scores`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| transaction_id | UUID FK → transactions.id UNIQUE | |
| transaction_deviation_score | NUMERIC(5,4) | |
| behavioral_deviation_score | NUMERIC(5,4) | |
| device_risk_score | NUMERIC(5,4) | |
| location_risk_score | NUMERIC(5,4) | |
| merchant_risk_score | NUMERIC(5,4) | |
| synthetic_identity_score | NUMERIC(5,4) | |
| final_risk_score | NUMERIC(5,4) | 0.0–1.0, weighted composite |
| decision | ENUM(approve, challenge, block) | |
| model_version | TEXT | |

### `fraud_explanations`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| fraud_score_id | UUID FK → fraud_scores.id | |
| top_factors | JSONB | array of {factor, contribution, shap_value} |
| explanation_text | TEXT | human-readable |
| confidence | NUMERIC(5,4) | |
| recommended_action | TEXT | |

### `fraud_cases`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| transaction_id | UUID FK → transactions.id | |
| assigned_analyst_id | UUID FK → users.id, nullable | |
| status | ENUM(open, investigating, confirmed_fraud, dismissed, closed) | |
| notes | TEXT | |
| resolved_at | TIMESTAMPTZ, nullable | |

### `alerts`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users.id | |
| transaction_id | UUID FK → transactions.id, nullable | |
| type | ENUM(fraud_block, fraud_challenge, device_new, security_score_drop) | |
| message | TEXT | |
| is_read | BOOLEAN | |

## 4. Blockchain Fraud Intelligence

### `blockchain_fraud_signals`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| entity_type | ENUM(device, merchant, account) | |
| entity_hash | TEXT | keccak256 hash, no raw PII |
| risk_indicator | TEXT | e.g. `confirmed_fraud`, `suspicious_pattern` |
| on_chain_tx_hash | TEXT | reference to blockchain transaction |
| reported_by_institution | TEXT | |
| created_at | TIMESTAMPTZ | |

### `reputation_scores`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| entity_hash | TEXT UNIQUE | |
| reputation_score | NUMERIC(5,2) | 0–100, lower = worse |
| signal_count | INT | |
| last_updated_on_chain_at | TIMESTAMPTZ | |

## 5. Federated Learning

### `fl_clients`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| institution_name | TEXT | |
| status | ENUM(active, inactive) | |

### `fl_training_rounds`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| round_number | INT | |
| global_model_version | TEXT | |
| participating_clients | JSONB | array of fl_clients.id |
| aggregate_metrics | JSONB | accuracy/loss summary, no raw data |
| completed_at | TIMESTAMPTZ | |

## 6. Relationships Summary

```
users 1───1 wallets
users 1───* devices
users 1───1 behavioral_baselines
users 1───* behavioral_events
users 1───* alerts
users 1───* merchants (as owner)

wallets 1───* transactions (as sender)
wallets 1───* transactions (as receiver, nullable)
merchants 1───* transactions

transactions 1───1 fraud_scores
fraud_scores 1───1 fraud_explanations
transactions 1───* fraud_cases
fraud_cases *───1 users (assigned_analyst_id)

blockchain_fraud_signals *───1 reputation_scores (by entity_hash)

fl_training_rounds *───* fl_clients (via participating_clients JSONB array)
```

## 7. Indexing Notes

- `transactions(created_at)`, `transactions(sender_wallet_id, created_at)` — for history queries.
- `fraud_scores(final_risk_score)` — for admin filtering/sorting by risk.
- `behavioral_events(user_id, captured_at)` — time-series access pattern.
- `audit_logs(created_at)`, `audit_logs(actor_user_id)`.
- Partial index on `alerts(is_read)` where `is_read = false`.