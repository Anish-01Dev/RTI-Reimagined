from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest

from app.domain.case_engine import service
from app.domain.case_engine.state_machine import ApplicationStatus, IllegalTransitionError
from app.domain.deadline_engine import (
    TRANSFER_RESETS_CLOCK,
    first_appeal_due_from_deficient_decision,
    first_appeal_due_from_response_deadline,
    is_past_due,
    life_and_liberty_response_due,
    run_deadline_sweep,
    second_appeal_due,
    standard_response_due,
    transfer_due,
)
from app.models.enums import DeadlineType
from app.repositories import deadlines as deadlines_repo

REFERENCE_TIME = datetime(2026, 1, 15, 10, 30, tzinfo=UTC)


@pytest.mark.parametrize(
    ("calculator", "expected"),
    [
        (standard_response_due, REFERENCE_TIME + timedelta(days=30)),
        (life_and_liberty_response_due, REFERENCE_TIME + timedelta(hours=48)),
        (transfer_due, REFERENCE_TIME + timedelta(days=5)),
    ],
)
def test_deadline_periods(calculator, expected):
    assert calculator(REFERENCE_TIME) == expected


def test_life_and_liberty_deadline_is_48_hours_not_calendar_day_boundary():
    due_at = life_and_liberty_response_due(REFERENCE_TIME)

    assert due_at == datetime(2026, 1, 17, 10, 30, tzinfo=UTC)
    assert due_at.hour == REFERENCE_TIME.hour
    assert due_at.minute == REFERENCE_TIME.minute


def test_transfer_does_not_reset_standard_response_clock_by_default():
    transfer_received_at = REFERENCE_TIME + timedelta(days=5)

    assert TRANSFER_RESETS_CLOCK is False
    assert standard_response_due(
        REFERENCE_TIME, transfer_received_at
    ) == REFERENCE_TIME + timedelta(days=30)


@pytest.mark.parametrize(
    ("calculator", "triggered_at"),
    [
        (first_appeal_due_from_response_deadline, REFERENCE_TIME),
        (first_appeal_due_from_deficient_decision, REFERENCE_TIME + timedelta(days=2)),
    ],
)
def test_first_appeal_window(calculator, triggered_at):
    assert calculator(triggered_at) == triggered_at + timedelta(days=30)


def test_second_appeal_window_from_first_appeal_decision_due_date():
    assert second_appeal_due(first_appeal_decision_due_at=REFERENCE_TIME) == (
        REFERENCE_TIME + timedelta(days=90)
    )


def test_second_appeal_window_prefers_received_decision_date():
    received_at = REFERENCE_TIME + timedelta(days=10)

    assert second_appeal_due(
        first_appeal_decision_due_at=REFERENCE_TIME,
        first_appeal_decision_received_at=received_at,
    ) == received_at + timedelta(days=90)


@pytest.mark.parametrize(
    ("due_at", "now", "expected"),
    [
        (REFERENCE_TIME, REFERENCE_TIME + timedelta(seconds=1), True),
        (REFERENCE_TIME, REFERENCE_TIME, False),
        (REFERENCE_TIME, REFERENCE_TIME - timedelta(seconds=1), False),
    ],
)
def test_is_past_due(due_at, now, expected):
    assert is_past_due(due_at=due_at, now=now) is expected


def _create_under_processing_application(db_session, user, authority):
    application = service.create_application(
        db_session,
        user_id=user.id,
        authority_id=authority.id,
        subject="Road repair records",
        original_request="Please provide records of road repairs on Main Street.",
    )
    for event_type in (
        "VALIDATED",
        "READY_TO_FILE",
        "SUBMITTED",
        "ACKNOWLEDGED",
        "UNDER_PROCESSING",
    ):
        service.record_event(
            db_session,
            application_id=application.id,
            event_type=event_type,
            actor_id=user.id,
        )
    return service.get_application(db_session, application.id)


def _backdate_response_deadline(db_session, application_id, *, starts_at, due_at) -> None:
    """Reaching UNDER_PROCESSING already creates the RESPONSE deadline
    automatically (see service._apply_transition_side_effects) — this is
    the "time-skip" demo/test tooling that moves it into the past instead
    of adding a second, unrealistic deadline row alongside it."""
    deadline = deadlines_repo.get_latest_by_type(db_session, application_id, DeadlineType.RESPONSE)
    deadline.starts_at = starts_at
    deadline.due_at = due_at
    db_session.commit()


def test_deadline_sweep_moves_only_past_due_under_processing_cases(
    db_session, make_user, make_authority
):
    user = make_user()
    authority = make_authority()
    past_due_application = _create_under_processing_application(db_session, user, authority)
    future_due_application = _create_under_processing_application(db_session, user, authority)

    _backdate_response_deadline(
        db_session,
        past_due_application.id,
        starts_at=REFERENCE_TIME - timedelta(days=31),
        due_at=REFERENCE_TIME - timedelta(seconds=1),
    )
    _backdate_response_deadline(
        db_session,
        future_due_application.id,
        starts_at=REFERENCE_TIME - timedelta(days=1),
        due_at=REFERENCE_TIME + timedelta(days=29),
    )

    transitioned = run_deadline_sweep(db_session, now=REFERENCE_TIME)

    assert transitioned == 1
    assert service.get_application(db_session, past_due_application.id).status == (
        ApplicationStatus.NO_RESPONSE
    )
    assert service.get_application(db_session, future_due_application.id).status == (
        ApplicationStatus.UNDER_PROCESSING
    )

    events = service.list_events(db_session, past_due_application.id)
    no_response_events = [event for event in events if event.event_type == "NO_RESPONSE"]
    assert len(no_response_events) == 1
    assert no_response_events[0].actor_id is None
    assert no_response_events[0].event_metadata == {"trigger": "deadline_sweep"}


def test_deadline_sweep_continues_past_a_single_application_failing(
    db_session, make_user, make_authority, monkeypatch
):
    """One application no longer being eligible for NO_RESPONSE by the
    time the sweep reaches it (the realistic case: an overlapping sweep
    run already transitioned it) must not abort the rest of the batch."""
    user = make_user()
    authority = make_authority()
    unsweepable_application = _create_under_processing_application(db_session, user, authority)
    sweepable_application = _create_under_processing_application(db_session, user, authority)
    for application in (unsweepable_application, sweepable_application):
        _backdate_response_deadline(
            db_session,
            application.id,
            starts_at=REFERENCE_TIME - timedelta(days=31),
            due_at=REFERENCE_TIME - timedelta(seconds=1),
        )

    original_record_event = service.record_event
    call_count = 0

    def flaky_record_event(db, *, application_id, **kwargs):
        nonlocal call_count
        call_count += 1
        if application_id == unsweepable_application.id:
            raise IllegalTransitionError(
                ApplicationStatus.NO_RESPONSE, ApplicationStatus.NO_RESPONSE
            )
        return original_record_event(db, application_id=application_id, **kwargs)

    monkeypatch.setattr(
        "app.domain.deadline_engine.sweep.case_service.record_event", flaky_record_event
    )

    transitioned = run_deadline_sweep(db_session, now=REFERENCE_TIME)

    assert call_count == 2
    assert transitioned == 1
    assert service.get_application(db_session, unsweepable_application.id).status == (
        ApplicationStatus.UNDER_PROCESSING
    )
    assert service.get_application(db_session, sweepable_application.id).status == (
        ApplicationStatus.NO_RESPONSE
    )
