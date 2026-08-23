"""Shared Python enums backing the domain model's constrained fields.

`ApplicationStatus` is intentionally NOT defined here — it is owned by
app.domain.case_engine.state_machine, which is the single source of truth
for legal states and the transitions between them. Defining it a second
time here would let the two drift out of sync.
"""

from __future__ import annotations

from enum import Enum


class UserRole(str, Enum):
    CITIZEN = "CITIZEN"
    GOVERNMENT_OFFICER = "GOVERNMENT_OFFICER"
    ADMIN = "ADMIN"


class AuthorityLevel(str, Enum):
    """Value for Authority.type."""

    CENTRAL = "CENTRAL"
    STATE = "STATE"


class FilingChannel(str, Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    HYBRID = "HYBRID"


class DeadlineType(str, Enum):
    RESPONSE = "RESPONSE"
    TRANSFER = "TRANSFER"
    LIFE_AND_LIBERTY = "LIFE_AND_LIBERTY"
    FIRST_APPEAL = "FIRST_APPEAL"
    SECOND_APPEAL = "SECOND_APPEAL"


class DeadlineStatus(str, Enum):
    ACTIVE = "ACTIVE"
    MET = "MET"
    MISSED = "MISSED"
    CANCELLED = "CANCELLED"


class InformationItemStatus(str, Enum):
    PENDING = "PENDING"
    ANSWERED = "ANSWERED"
    PARTIALLY_ANSWERED = "PARTIALLY_ANSWERED"
    NOT_ANSWERED = "NOT_ANSWERED"
    POTENTIALLY_DEFICIENT = "POTENTIALLY_DEFICIENT"


class AppealType(str, Enum):
    FIRST = "FIRST"
    SECOND = "SECOND"


class AppealStatus(str, Enum):
    DRAFT = "DRAFT"
    FILED = "FILED"
    WITHDRAWN = "WITHDRAWN"


class DocumentType(str, Enum):
    APPLICATION = "APPLICATION"
    RESPONSE = "RESPONSE"
    APPEAL = "APPEAL"
    PAYMENT_PROOF = "PAYMENT_PROOF"
    IDENTITY_PROOF = "IDENTITY_PROOF"
    OTHER = "OTHER"
