"""Confirms the Rights Clock is actually wired into the transitions that
are supposed to start and stop it — record_event is the only place
applications.status changes, so it's also the only place these side
effects can live. Without this wiring, create_deadline is never called by
anything a real request reaches, and the deadline sweep never finds
anything to act on outside a test that injects a deadline by hand."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from app.domain.case_engine import service
from app.domain.deadline_engine import run_deadline_sweep
from app.domain.deadline_engine.rules import standard_response_due
from app.models.enums import DeadlineStatus, DeadlineType


def _create_application(db_session, user, authority):
    return service.create_application(
        db_session,
        user_id=user.id,
        authority_id=authority.id,
        subject="Road repair records",
        original_request="Please provide repair records for Main Street.",
    )


def test_submitted_and_acknowledged_stamp_their_timestamps(db_session, make_user, make_authority):
    user = make_user()
    authority = make_authority()
    application = _create_application(db_session, user, authority)

    service.record_event(
        db_session, application_id=application.id, event_type="VALIDATED", actor_id=user.id
    )
    service.record_event(
        db_session, application_id=application.id, event_type="READY_TO_FILE", actor_id=user.id
    )
    before_submit = datetime.now(UTC)
    service.record_event(
        db_session, application_id=application.id, event_type="SUBMITTED", actor_id=user.id
    )
    application = service.get_application(db_session, application.id)
    assert application.submitted_at is not None
    assert application.submitted_at >= before_submit
    assert application.received_at is None

    before_acknowledge = datetime.now(UTC)
    service.record_event(
        db_session, application_id=application.id, event_type="ACKNOWLEDGED", actor_id=user.id
    )
    application = service.get_application(db_session, application.id)
    assert application.received_at is not None
    assert application.received_at >= before_acknowledge


def test_under_processing_creates_the_response_deadline_automatically(
    db_session, make_user, make_authority
):
    user = make_user()
    authority = make_authority()
    application = _create_application(db_session, user, authority)
    for event_type in ("VALIDATED", "READY_TO_FILE", "SUBMITTED", "ACKNOWLEDGED"):
        service.record_event(
            db_session, application_id=application.id, event_type=event_type, actor_id=user.id
        )
    application = service.get_application(db_session, application.id)
    received_at = application.received_at

    service.record_event(
        db_session, application_id=application.id, event_type="UNDER_PROCESSING", actor_id=user.id
    )

    deadlines = service.list_deadlines(db_session, application.id)
    response_deadlines = [d for d in deadlines if d.deadline_type == DeadlineType.RESPONSE]
    assert len(response_deadlines) == 1
    deadline = response_deadlines[0]
    assert deadline.status == DeadlineStatus.ACTIVE
    assert deadline.starts_at == received_at
    assert deadline.due_at == standard_response_due(received_at)

    application = service.get_application(db_session, application.id)
    assert application.response_due_at == deadline.due_at


def test_response_received_stamps_its_timestamp(db_session, make_user, make_authority):
    user = make_user()
    authority = make_authority()
    application = _create_application(db_session, user, authority)
    for event_type in ("VALIDATED", "READY_TO_FILE", "SUBMITTED", "ACKNOWLEDGED"):
        service.record_event(
            db_session, application_id=application.id, event_type=event_type, actor_id=user.id
        )

    before = datetime.now(UTC)
    service.record_event(
        db_session, application_id=application.id, event_type="UNDER_PROCESSING", actor_id=user.id
    )
    service.record_event(
        db_session,
        application_id=application.id,
        event_type="RESPONSE_RECEIVED",
        actor_id=user.id,
    )

    application = service.get_application(db_session, application.id)
    assert application.response_received_at is not None
    assert application.response_received_at >= before


def test_deadline_sweep_marks_the_lapsed_deadline_missed(db_session, make_user, make_authority):
    user = make_user()
    authority = make_authority()
    application = _create_application(db_session, user, authority)
    for event_type in (
        "VALIDATED",
        "READY_TO_FILE",
        "SUBMITTED",
        "ACKNOWLEDGED",
        "UNDER_PROCESSING",
    ):
        service.record_event(
            db_session, application_id=application.id, event_type=event_type, actor_id=user.id
        )
    deadline = service.list_deadlines(db_session, application.id)[0]
    now = datetime.now(UTC)
    deadline.due_at = now - timedelta(days=1)
    db_session.commit()

    run_deadline_sweep(db_session, now=now)

    deadline = service.list_deadlines(db_session, application.id)[0]
    assert deadline.status == DeadlineStatus.MISSED
    assert deadline.completed_at is not None
