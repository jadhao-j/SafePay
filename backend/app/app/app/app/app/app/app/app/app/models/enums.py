"""PostgreSQL-backed enum definitions for SafePay ORM models."""

import enum


class UserRole(str, enum.Enum):
    USER = "user"
    MERCHANT = "merchant"
    FRAUD_ANALYST = "fraud_analyst"
    COMPLIANCE_OFFICER = "compliance_officer"
    ADMIN = "admin"

class UserStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    FROZEN = "frozen"


class BehavioralEventType(str, enum.Enum):
    KEYSTROKE = "keystroke"
    MOUSE = "mouse"
    TOUCH = "touch"


class WalletStatus(str, enum.Enum):
    ACTIVE = "active"
    FROZEN = "frozen"


class PaymentType(str, enum.Enum):
    P2P = "p2p"
    MERCHANT = "merchant"
    QR = "qr"
    UPI = "upi"
    RECURRING = "recurring"
    TOPUP = "topup"
    WITHDRAWAL = "withdrawal"


class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    CHALLENGED = "challenged"
    BLOCKED = "blocked"
    COMPLETED = "completed"
    FAILED = "failed"
    REVERSED = "reversed"


class PaymentRequestStatus(str, enum.Enum):
    PENDING = "pending"
    FULFILLED = "fulfilled"
    DECLINED = "declined"
    EXPIRED = "expired"


class ScheduledPaymentFrequency(str, enum.Enum):
    ONCE = "once"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class FraudDecision(str, enum.Enum):
    APPROVE = "approve"
    CHALLENGE = "challenge"
    BLOCK = "block"


class FraudCaseStatus(str, enum.Enum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    CONFIRMED_FRAUD = "confirmed_fraud"
    DISMISSED = "dismissed"
    CLOSED = "closed"


class AlertType(str, enum.Enum):
    FRAUD_BLOCK = "fraud_block"
    FRAUD_CHALLENGE = "fraud_challenge"
    DEVICE_NEW = "device_new"
    SECURITY_SCORE_DROP = "security_score_drop"


class BlockchainEntityType(str, enum.Enum):
    DEVICE = "device"
    MERCHANT = "merchant"
    ACCOUNT = "account"


class FLClientStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
