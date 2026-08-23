"""Coverage plan for app.domain.case_engine.state_machine.

- Every legal transition in the STATE_MACHINE.md table succeeds.
- Every transition not listed for a given state is rejected.
- Guard conditions (e.g. FIRST_APPEAL_FILED requires prior eligibility and
  an approved appeal) are enforced independent of client-supplied state —
  NOT covered here yet: they depend on the Appeal Compiler (Phase 7),
  which is not built.
"""

from __future__ import annotations

import pytest

from app.domain.case_engine.state_machine import (
    TRANSITIONS,
    ApplicationStatus,
    IllegalTransitionError,
    is_transition_allowed,
    validate_transition,
)


@pytest.mark.parametrize(
    "from_state,to_state",
    [(src, dst) for src, dests in TRANSITIONS.items() for dst in dests],
)
def test_every_documented_transition_is_allowed(from_state, to_state):
    assert is_transition_allowed(from_state, to_state) is True
    validate_transition(from_state, to_state)  # must not raise


@pytest.mark.parametrize(
    "from_state,to_state",
    [
        (src, dst)
        for src in ApplicationStatus
        for dst in ApplicationStatus
        if dst not in TRANSITIONS.get(src, set())
    ],
)
def test_every_undocumented_transition_is_rejected(from_state, to_state):
    assert is_transition_allowed(from_state, to_state) is False
    with pytest.raises(IllegalTransitionError):
        validate_transition(from_state, to_state)


def test_illegal_transition_error_carries_states():
    with pytest.raises(IllegalTransitionError) as exc_info:
        validate_transition(ApplicationStatus.DRAFT, ApplicationStatus.COMPLETED)
    assert exc_info.value.from_state == ApplicationStatus.DRAFT
    assert exc_info.value.to_state == ApplicationStatus.COMPLETED


def test_terminal_and_dead_end_states_have_no_outgoing_transitions():
    # COMPLETED and SECOND_APPEAL_ELIGIBLE are terminal in the current
    # table (SECOND_APPEAL_ELIGIBLE's onward path is future Appeal
    # Compiler work).
    assert TRANSITIONS.get(ApplicationStatus.COMPLETED, set()) == set()
    assert TRANSITIONS.get(ApplicationStatus.SECOND_APPEAL_ELIGIBLE, set()) == set()
