"""RTI Application state machine.

Single source of truth for legal application states and the transitions
allowed between them. Pure and I/O-free by design (same doctrine as the
Rights Clock, see docs/architecture/ARCHITECTURE.md) so it can be unit
tested without a database and reused unchanged by the future Rights Clock
and Appeal Compiler phases.

See docs/architecture/STATE_MACHINE.md for the full transition table and
handler ordering this module implements. Persisting a transition (loading
the application, appending the resulting ApplicationEvent, updating
`applications.status`) is the job of app.domain.applications.service, not
this module — it stays free of any dependency on the ORM or a DB session.
"""

from __future__ import annotations

from enum import Enum


class ApplicationStatus(str, Enum):
    DRAFT = "DRAFT"
    VALIDATED = "VALIDATED"
    READY_TO_FILE = "READY_TO_FILE"
    SUBMITTED = "SUBMITTED"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    TRANSFERRED = "TRANSFERRED"
    UNDER_PROCESSING = "UNDER_PROCESSING"
    RESPONSE_RECEIVED = "RESPONSE_RECEIVED"
    RESPONSE_ANALYSIS = "RESPONSE_ANALYSIS"
    COMPLETED = "COMPLETED"
    NO_RESPONSE = "NO_RESPONSE"
    INCOMPLETE_RESPONSE = "INCOMPLETE_RESPONSE"
    FIRST_APPEAL_ELIGIBLE = "FIRST_APPEAL_ELIGIBLE"
    FIRST_APPEAL_FILED = "FIRST_APPEAL_FILED"
    SECOND_APPEAL_ELIGIBLE = "SECOND_APPEAL_ELIGIBLE"


INITIAL_STATE = ApplicationStatus.DRAFT

TRANSITIONS: dict[ApplicationStatus, set[ApplicationStatus]] = {
    ApplicationStatus.DRAFT: {ApplicationStatus.VALIDATED},
    ApplicationStatus.VALIDATED: {ApplicationStatus.READY_TO_FILE, ApplicationStatus.DRAFT},
    ApplicationStatus.READY_TO_FILE: {ApplicationStatus.SUBMITTED},
    ApplicationStatus.SUBMITTED: {ApplicationStatus.ACKNOWLEDGED},
    ApplicationStatus.ACKNOWLEDGED: {
        ApplicationStatus.TRANSFERRED,
        ApplicationStatus.UNDER_PROCESSING,
    },
    ApplicationStatus.TRANSFERRED: {ApplicationStatus.UNDER_PROCESSING},
    ApplicationStatus.UNDER_PROCESSING: {
        ApplicationStatus.RESPONSE_RECEIVED,
        ApplicationStatus.NO_RESPONSE,
    },
    ApplicationStatus.RESPONSE_RECEIVED: {ApplicationStatus.RESPONSE_ANALYSIS},
    ApplicationStatus.RESPONSE_ANALYSIS: {
        ApplicationStatus.COMPLETED,
        ApplicationStatus.INCOMPLETE_RESPONSE,
    },
    ApplicationStatus.NO_RESPONSE: {ApplicationStatus.FIRST_APPEAL_ELIGIBLE},
    ApplicationStatus.INCOMPLETE_RESPONSE: {ApplicationStatus.FIRST_APPEAL_ELIGIBLE},
    ApplicationStatus.FIRST_APPEAL_ELIGIBLE: {ApplicationStatus.FIRST_APPEAL_FILED},
    ApplicationStatus.FIRST_APPEAL_FILED: {
        ApplicationStatus.SECOND_APPEAL_ELIGIBLE,
        ApplicationStatus.COMPLETED,
    },
}

# Every state that appears anywhere in the table, source or destination —
# used to build the DB-level CHECK constraint on applications.status.
ALL_STATES: frozenset[ApplicationStatus] = frozenset(
    state for src, dests in TRANSITIONS.items() for state in (src, *dests)
)


class IllegalTransitionError(Exception):
    """Raised when a requested transition is not permitted from the current state."""

    def __init__(self, from_state: ApplicationStatus, to_state: ApplicationStatus):
        self.from_state = from_state
        self.to_state = to_state
        super().__init__(f"Cannot transition from {from_state.value} to {to_state.value}")


def is_transition_allowed(from_state: ApplicationStatus, to_state: ApplicationStatus) -> bool:
    return to_state in TRANSITIONS.get(from_state, set())


def validate_transition(from_state: ApplicationStatus, to_state: ApplicationStatus) -> None:
    """Raise IllegalTransitionError if the transition is not permitted.

    Domain-specific guard conditions beyond the transition table itself
    (for example, FIRST_APPEAL_FILED requiring an approved appeal record)
    belong to the Appeal Compiler phase and are layered on top of this by
    the calling service, not here.
    """
    if not is_transition_allowed(from_state, to_state):
        raise IllegalTransitionError(from_state, to_state)
