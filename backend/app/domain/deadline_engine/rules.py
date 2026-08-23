from __future__ import annotations

from datetime import datetime, timedelta

from app.domain.errors import ValidationError

# Section 6(3) transfer clock treatment is disputed; this citizen-protective
# default keeps the response clock tied to original receipt pending CIC guidance.
TRANSFER_RESETS_CLOCK: bool = False


def standard_response_due(
    received_at: datetime, transfer_received_at: datetime | None = None
) -> datetime:
    starts_at = (
        transfer_received_at if TRANSFER_RESETS_CLOCK and transfer_received_at else received_at
    )
    return starts_at + timedelta(days=30)


def life_and_liberty_response_due(received_at: datetime) -> datetime:
    return received_at + timedelta(hours=48)


def transfer_due(received_at: datetime) -> datetime:
    return received_at + timedelta(days=5)


def first_appeal_due_from_response_deadline(response_due_at: datetime) -> datetime:
    return response_due_at + timedelta(days=30)


def first_appeal_due_from_deficient_decision(decision_received_at: datetime) -> datetime:
    return decision_received_at + timedelta(days=30)


def second_appeal_due(
    *,
    first_appeal_decision_due_at: datetime | None = None,
    first_appeal_decision_received_at: datetime | None = None,
) -> datetime:
    starts_at = first_appeal_decision_received_at or first_appeal_decision_due_at
    if starts_at is None:
        raise ValidationError("first appeal decision due or received timestamp is required")
    return starts_at + timedelta(days=90)


def is_past_due(*, due_at: datetime, now: datetime) -> bool:
    return due_at < now
