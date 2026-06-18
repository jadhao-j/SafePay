"""Initial SafePay database schema — all 18 tables.

Revision ID: 001
Revises:
Create Date: 2026-06-17
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# PostgreSQL ENUM types
user_role = postgresql.ENUM(
    "user", "merchant", "fraud_analyst", "compliance_officer", "admin",
    name="user_role",
    create_type=False,
)
user_status = postgresql.ENUM("active", "suspended", "frozen", name="user_status", create_type=False)
behavioral_event_type = postgresql.ENUM(
    "keystroke", "mouse", "touch", name="behavioral_event_type", create_type=False
)
wallet_status = postgresql.ENUM("active", "frozen", name="wallet_status", create_type=False)
payment_type = postgresql.ENUM(
    "p2p", "merchant", "qr", "upi", "recurring", name="payment_type", create_type=False
)
transaction_status = postgresql.ENUM(
    "pending",
    "approved",
    "challenged",
    "blocked",
    "completed",
    "failed",
    "reversed",
    name="transaction_status",
    create_type=False,
)
payment_request_status = postgresql.ENUM(
    "pending", "fulfilled", "declined", "expired", name="payment_request_status", create_type=False
)
scheduled_payment_frequency = postgresql.ENUM(
    "once", "daily", "weekly", "monthly", name="scheduled_payment_frequency", create_type=False
)
fraud_decision = postgresql.ENUM("approve", "challenge", "block", name="fraud_decision", create_type=False)
fraud_case_status = postgresql.ENUM(
    "open",
    "investigating",
    "confirmed_fraud",
    "dismissed",
    "closed",
    name="fraud_case_status",
    create_type=False,
)
alert_type = postgresql.ENUM(
    "fraud_block",
    "fraud_challenge",
    "device_new",
    "security_score_drop",
    name="alert_type",
    create_type=False,
)
blockchain_entity_type = postgresql.ENUM(
    "device", "merchant", "account", name="blockchain_entity_type", create_type=False
)
fl_client_status = postgresql.ENUM("active", "inactive", name="fl_client_status", create_type=False)

TIMESTAMP_COLS = [
    sa.Column(
        "created_at",
        sa.DateTime(timezone=True),
        server_default=sa.text("now()"),
        nullable=False,
    ),
    sa.Column(
        "updated_at",
        sa.DateTime(timezone=True),
        server_default=sa.text("now()"),
        nullable=False,
    ),
]

UUID_PK = sa.Column(
    "id",
    postgresql.UUID(as_uuid=True),
    server_default=sa.text("gen_random_uuid()"),
    primary_key=True,
)


def _create_enums() -> None:
    bind = op.get_bind()
    for enum_type in (
        user_role,
        user_status,
        behavioral_event_type,
        wallet_status,
        payment_type,
        transaction_status,
        payment_request_status,
        scheduled_payment_frequency,
        fraud_decision,
        fraud_case_status,
        alert_type,
        blockchain_entity_type,
        fl_client_status,
    ):
        enum_type.create(bind, checkfirst=True)


def _drop_enums() -> None:
    bind = op.get_bind()
    for enum_type in (
        fl_client_status,
        blockchain_entity_type,
        alert_type,
        fraud_case_status,
        fraud_decision,
        scheduled_payment_frequency,
        payment_request_status,
        transaction_status,
        payment_type,
        wallet_status,
        behavioral_event_type,
        user_status,
        user_role,
    ):
        enum_type.drop(bind, checkfirst=True)


def upgrade() -> None:
    _create_enums()

    # Domain 1 — Identity
    op.create_table(
        "users",
        UUID_PK,
        sa.Column("name", sa.Text(), nullable=True),
        sa.Column("email", sa.Text(), nullable=True),
        sa.Column("phone", sa.Text(), nullable=True),
        sa.Column("password_hash", sa.Text(), nullable=True),
        sa.Column("role", user_role, server_default="user", nullable=False),
        sa.Column("pin_hash", sa.Text(), nullable=True),
        sa.Column("mfa_enabled", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("security_score", sa.Integer(), server_default="0", nullable=False),
        sa.Column("status", user_status, nullable=False),
        *TIMESTAMP_COLS,
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("phone"),
    )

    op.create_table(
        "devices",
        UUID_PK,
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("device_fingerprint", sa.Text(), nullable=False),
        sa.Column("device_name", sa.Text(), nullable=True),
        sa.Column("os_signature", sa.Text(), nullable=True),
        sa.Column("ip_address", postgresql.INET(), nullable=True),
        sa.Column("is_trusted", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("trust_score", sa.Numeric(5, 2), server_default="0.00", nullable=False),
        sa.Column("last_active_at", sa.DateTime(timezone=True), nullable=True),
        *TIMESTAMP_COLS,
    )

    op.create_table(
        "behavioral_baselines",
        UUID_PK,
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("keystroke_profile", postgresql.JSONB(), nullable=False),
        sa.Column("mouse_profile", postgresql.JSONB(), nullable=False),
        sa.Column("touch_profile", postgresql.JSONB(), nullable=False),
        sa.Column("baseline_version", sa.Integer(), server_default="1", nullable=False),
        *TIMESTAMP_COLS,
    )

    op.create_table(
        "behavioral_events",
        UUID_PK,
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("event_type", behavioral_event_type, nullable=False),
        sa.Column("payload", postgresql.JSONB(), nullable=False),
        sa.Column("trust_score_at_event", sa.Numeric(5, 2), nullable=False),
        sa.Column("captured_at", sa.DateTime(timezone=True), nullable=False),
        *TIMESTAMP_COLS,
    )

    op.create_table(
        "audit_logs",
        UUID_PK,
        sa.Column(
            "actor_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),
        sa.Column("action", sa.Text(), nullable=False),
        sa.Column("metadata", postgresql.JSONB(), nullable=False),
        sa.Column("ip_address", postgresql.INET(), nullable=True),
        *TIMESTAMP_COLS,
    )

    # Domain 2 — Payments
    op.create_table(
        "wallets",
        UUID_PK,
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("balance", sa.Numeric(14, 2), server_default="0.00", nullable=False),
        sa.Column("currency", sa.Text(), server_default="INR", nullable=False),
        sa.Column("status", wallet_status, server_default="active", nullable=False),
        *TIMESTAMP_COLS,
        sa.UniqueConstraint("user_id"),
    )

    op.create_table(
        "merchants",
        UUID_PK,
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("business_name", sa.Text(), nullable=False),
        sa.Column("upi_id", sa.Text(), nullable=False),
        sa.Column("category", sa.Text(), nullable=True),
        sa.Column("risk_rating", sa.Numeric(5, 2), server_default="0.00", nullable=False),
        *TIMESTAMP_COLS,
        sa.UniqueConstraint("upi_id"),
    )

    op.create_table(
        "transactions",
        UUID_PK,
        sa.Column(
            "sender_wallet_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("wallets.id"),
            nullable=False,
        ),
        sa.Column(
            "receiver_wallet_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("wallets.id"),
            nullable=True,
        ),
        sa.Column(
            "merchant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("merchants.id"),
            nullable=True,
        ),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("currency", sa.Text(), nullable=False),
        sa.Column("payment_type", payment_type, nullable=False),
        sa.Column("status", transaction_status, nullable=False),
        sa.Column("device_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("devices.id"), nullable=False),
        sa.Column("idempotency_key", sa.Text(), nullable=False),
        *TIMESTAMP_COLS,
        sa.UniqueConstraint("idempotency_key"),
    )

    op.create_table(
        "payment_requests",
        UUID_PK,
        sa.Column(
            "requester_wallet_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("wallets.id"),
            nullable=False,
        ),
        sa.Column(
            "payer_wallet_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("wallets.id"),
            nullable=False,
        ),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("status", payment_request_status, nullable=False),
        *TIMESTAMP_COLS,
    )

    op.create_table(
        "scheduled_payments",
        UUID_PK,
        sa.Column("wallet_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("wallets.id"), nullable=False),
        sa.Column("receiver_upi_id", sa.Text(), nullable=False),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("frequency", scheduled_payment_frequency, nullable=False),
        sa.Column("next_run_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        *TIMESTAMP_COLS,
    )

    # Domain 3 — Fraud
    op.create_table(
        "fraud_scores",
        UUID_PK,
        sa.Column(
            "transaction_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("transactions.id"),
            nullable=False,
        ),
        sa.Column("transaction_deviation_score", sa.Numeric(5, 4), server_default="0.0000", nullable=False),
        sa.Column("behavioral_deviation_score", sa.Numeric(5, 4), server_default="0.0000", nullable=False),
        sa.Column("device_risk_score", sa.Numeric(5, 4), server_default="0.0000", nullable=False),
        sa.Column("location_risk_score", sa.Numeric(5, 4), server_default="0.0000", nullable=False),
        sa.Column("merchant_risk_score", sa.Numeric(5, 4), server_default="0.0000", nullable=False),
        sa.Column("synthetic_identity_score", sa.Numeric(5, 4), server_default="0.0000", nullable=False),
        sa.Column("final_risk_score", sa.Numeric(5, 4), server_default="0.0000", nullable=False),
        sa.Column("decision", fraud_decision, nullable=False),
        sa.Column("model_version", sa.Text(), nullable=True),
        *TIMESTAMP_COLS,
        sa.UniqueConstraint("transaction_id"),
    )

    op.create_table(
        "fraud_explanations",
        UUID_PK,
        sa.Column(
            "fraud_score_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("fraud_scores.id"),
            nullable=False,
        ),
        sa.Column("top_factors", postgresql.JSONB(), nullable=False),
        sa.Column("explanation_text", sa.Text(), nullable=False),
        sa.Column("confidence", sa.Numeric(5, 4), server_default="0.0000", nullable=False),
        sa.Column("recommended_action", sa.Text(), nullable=True),
        *TIMESTAMP_COLS,
    )

    op.create_table(
        "fraud_cases",
        UUID_PK,
        sa.Column(
            "transaction_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("transactions.id"),
            nullable=False,
        ),
        sa.Column(
            "assigned_analyst_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),
        sa.Column("status", fraud_case_status, nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        *TIMESTAMP_COLS,
    )

    op.create_table(
        "alerts",
        UUID_PK,
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column(
            "transaction_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("transactions.id"),
            nullable=True,
        ),
        sa.Column("type", alert_type, nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("is_read", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        *TIMESTAMP_COLS,
    )

    # Domain 4 — Blockchain
    op.create_table(
        "blockchain_fraud_signals",
        UUID_PK,
        sa.Column("entity_type", blockchain_entity_type, nullable=False),
        sa.Column("entity_hash", sa.Text(), nullable=False),
        sa.Column("risk_indicator", sa.Text(), nullable=False),
        sa.Column("on_chain_tx_hash", sa.Text(), nullable=True),
        sa.Column("reported_by_institution", sa.Text(), nullable=True),
        *TIMESTAMP_COLS,
    )

    op.create_table(
        "reputation_scores",
        UUID_PK,
        sa.Column("entity_hash", sa.Text(), nullable=False),
        sa.Column("reputation_score", sa.Numeric(5, 2), server_default="0.00", nullable=False),
        sa.Column("signal_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("last_updated_on_chain_at", sa.DateTime(timezone=True), nullable=True),
        *TIMESTAMP_COLS,
        sa.UniqueConstraint("entity_hash"),
    )

    # Domain 5 — Federated Learning
    op.create_table(
        "fl_clients",
        UUID_PK,
        sa.Column("institution_name", sa.Text(), nullable=False),
        sa.Column("status", fl_client_status, nullable=False),
        *TIMESTAMP_COLS,
    )

    op.create_table(
        "fl_training_rounds",
        UUID_PK,
        sa.Column("round_number", sa.Integer(), nullable=False),
        sa.Column("global_model_version", sa.Text(), nullable=False),
        sa.Column("participating_clients", postgresql.JSONB(), nullable=False),
        sa.Column("aggregate_metrics", postgresql.JSONB(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        *TIMESTAMP_COLS,
    )

    # Indexes (Schema.md §7)
    op.create_index("ix_transactions_created_at", "transactions", ["created_at"])
    op.create_index(
        "ix_transactions_sender_wallet_id_created_at",
        "transactions",
        ["sender_wallet_id", "created_at"],
    )
    op.create_index("ix_fraud_scores_final_risk_score", "fraud_scores", ["final_risk_score"])
    op.create_index(
        "ix_behavioral_events_user_id_captured_at",
        "behavioral_events",
        ["user_id", "captured_at"],
    )
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])
    op.create_index("ix_audit_logs_actor_user_id", "audit_logs", ["actor_user_id"])
    op.create_index(
        "ix_alerts_is_read_unread",
        "alerts",
        ["is_read"],
        postgresql_where=sa.text("is_read = false"),
    )


def downgrade() -> None:
    op.drop_index("ix_alerts_is_read_unread", table_name="alerts")
    op.drop_index("ix_audit_logs_actor_user_id", table_name="audit_logs")
    op.drop_index("ix_audit_logs_created_at", table_name="audit_logs")
    op.drop_index("ix_behavioral_events_user_id_captured_at", table_name="behavioral_events")
    op.drop_index("ix_fraud_scores_final_risk_score", table_name="fraud_scores")
    op.drop_index("ix_transactions_sender_wallet_id_created_at", table_name="transactions")
    op.drop_index("ix_transactions_created_at", table_name="transactions")

    op.drop_table("fl_training_rounds")
    op.drop_table("fl_clients")
    op.drop_table("reputation_scores")
    op.drop_table("blockchain_fraud_signals")
    op.drop_table("alerts")
    op.drop_table("fraud_cases")
    op.drop_table("fraud_explanations")
    op.drop_table("fraud_scores")
    op.drop_table("scheduled_payments")
    op.drop_table("payment_requests")
    op.drop_table("transactions")
    op.drop_table("merchants")
    op.drop_table("wallets")
    op.drop_table("audit_logs")
    op.drop_table("behavioral_events")
    op.drop_table("behavioral_baselines")
    op.drop_table("devices")
    op.drop_table("users")

    _drop_enums()
