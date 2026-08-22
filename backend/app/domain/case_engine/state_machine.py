"""Case state machine.

See docs/architecture/STATE_MACHINE.md for the full transition table and
handler ordering this module implements.
"""

from __future__ import annotations

TRANSITIONS: dict[str, set[str]] = {
    "DRAFT": {"VALIDATED"},
    "VALIDATED": {"READY_TO_FILE", "DRAFT"},
    "READY_TO_FILE": {"SUBMITTED"},
    "SUBMITTED": {"ACKNOWLEDGED"},
    "ACKNOWLEDGED": {"TRANSFERRED", "UNDER_PROCESSING"},
    "TRANSFERRED": {"UNDER_PROCESSING"},
    "UNDER_PROCESSING": {"RESPONSE_RECEIVED", "NO_RESPONSE"},
    "RESPONSE_RECEIVED": {"RESPONSE_ANALYSIS"},
    "RESPONSE_ANALYSIS": {"COMPLETED", "INCOMPLETE_RESPONSE"},
    "NO_RESPONSE": {"FIRST_APPEAL_ELIGIBLE"},
    "INCOMPLETE_RESPONSE": {"FIRST_APPEAL_ELIGIBLE"},
    "FIRST_APPEAL_ELIGIBLE": {"FIRST_APPEAL_FILED"},
    "FIRST_APPEAL_FILED": {"SECOND_APPEAL_ELIGIBLE", "COMPLETED"},
}


class IllegalTransitionError(Exception):
    """Raised when a requested transition is not permitted from the current state."""


def is_transition_allowed(from_state: str, to_state: str) -> bool:
    return to_state in TRANSITIONS.get(from_state, set())


def transition(case, to_state: str, actor: str, reason: str | None = None):
    """Validate and apply a case state transition, appending a case_events row.

    Guard conditions specific to individual transitions (e.g. FIRST_APPEAL_FILED
    requiring an approved appeal draft) are applied here before the event is
    committed.
    """
    raise NotImplementedError
