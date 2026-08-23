"""Coverage for the Phase 1 foundation: application creation, the
authority/user relationship, event creation, deadline creation, invalid
foreign keys, duplicate registration numbers, and basic status
transitions. Exercises app.domain.case_engine.service directly against a
real Postgres test database (see conftest.py)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy.exc import IntegrityError

from app.domain.case_engine import service
from app.domain.case_engine.state_machine import ApplicationStatus, IllegalTransitionError
from app.domain.errors import NotFoundError, ValidationError
from app.models.enums import DeadlineType
from app.models.orm import RTIApplication


def _create(db_session, user, authority, **overrides):
    kwargs = {
        "user_id": user.id,
        "authority_id": authority.id,
        "subject": "Road repair records",
        "original_request": "Please provide records of road repairs on Main Street in 2025.",
    }
    kwargs.update(overrides)
    return service.create_application(db_session, **kwargs)


def test_application_creation(db_session, make_user, make_authority):
    user = make_user()
    authority = make_authority()

    application = _create(db_session, user, authority)

    assert application.id is not None
    assert application.status == ApplicationStatus.DRAFT
    assert application.registration_number is None
    assert application.created_at is not None
    assert application.updated_at is not None


def test_authority_relationship(db_session, make_user, make_authority):
    user = make_user()
    authority = make_authority(name="State PWD", type="STATE", jurisdiction="Karnataka")

    application = _create(db_session, user, authority)

    fetched = service.get_application(db_session, application.id)
    assert fetched.authority_id == authority.id
    assert fetched.authority.name == "State PWD"
    assert fetched.user_id == user.id
    assert fetched.user.id == user.id


def test_invalid_user_id_is_rejected(db_session, make_authority):
    authority = make_authority()
    with pytest.raises(NotFoundError):
        _create(db_session, type("U", (), {"id": uuid.uuid4()})(), authority)


def test_invalid_authority_id_is_rejected(db_session, make_user):
    user = make_user()
    with pytest.raises(NotFoundError):
        _create(db_session, user, type("A", (), {"id": uuid.uuid4()})())


def test_inactive_authority_is_rejected(db_session, make_user, make_authority):
    user = make_user()
    authority = make_authority(is_active=False)
    with pytest.raises(ValidationError):
        _create(db_session, user, authority)


def test_event_creation(db_session, make_user, make_authority):
    user = make_user()
    authority = make_authority()
    application = _create(db_session, user, authority)

    # Creating an application already appends a DRAFT_CREATED event.
    events = service.list_events(db_session, application.id)
    assert len(events) == 1
    assert events[0].event_type == "DRAFT_CREATED"
    assert events[0].actor_id == user.id

    note = service.record_event(
        db_session,
        application_id=application.id,
        event_type="DEADLINE_REACHED",
        actor_id=user.id,
        metadata={"deadline_type": "RESPONSE"},
    )
    assert note.event_metadata == {"deadline_type": "RESPONSE"}

    events = service.list_events(db_session, application.id)
    assert [e.event_type for e in events] == ["DRAFT_CREATED", "DEADLINE_REACHED"]
    # A non-status event must not change application status.
    assert service.get_application(db_session, application.id).status == ApplicationStatus.DRAFT


def test_event_creation_requires_existing_application(db_session, make_user):
    user = make_user()
    with pytest.raises(NotFoundError):
        service.record_event(
            db_session,
            application_id=uuid.uuid4(),
            event_type="DEADLINE_REACHED",
            actor_id=user.id,
        )


def test_deadline_creation(db_session, make_user, make_authority):
    user = make_user()
    authority = make_authority()
    application = _create(db_session, user, authority)

    starts = datetime.now(UTC)
    due = starts + timedelta(days=30)
    deadline = service.create_deadline(
        db_session,
        application_id=application.id,
        deadline_type=DeadlineType.RESPONSE,
        starts_at=starts,
        due_at=due,
    )

    assert deadline.id is not None
    assert deadline.status.value == "ACTIVE"

    deadlines = service.list_deadlines(db_session, application.id)
    assert len(deadlines) == 1
    assert deadlines[0].id == deadline.id


def test_deadline_due_before_start_is_rejected(db_session, make_user, make_authority):
    user = make_user()
    authority = make_authority()
    application = _create(db_session, user, authority)

    starts = datetime.now(UTC)
    with pytest.raises(ValidationError):
        service.create_deadline(
            db_session,
            application_id=application.id,
            deadline_type=DeadlineType.RESPONSE,
            starts_at=starts,
            due_at=starts - timedelta(days=1),
        )


def test_deadline_creation_requires_existing_application(db_session):
    with pytest.raises(NotFoundError):
        service.create_deadline(
            db_session,
            application_id=uuid.uuid4(),
            deadline_type=DeadlineType.RESPONSE,
            starts_at=datetime.now(UTC),
            due_at=datetime.now(UTC) + timedelta(days=1),
        )


def test_duplicate_registration_number_is_rejected(db_session, make_user, make_authority):
    user = make_user()
    authority = make_authority()

    application_a = RTIApplication(
        user_id=user.id,
        authority_id=authority.id,
        subject="First request",
        original_request="...",
        status=ApplicationStatus.SUBMITTED,
        registration_number="REG-0001",
    )
    db_session.add(application_a)
    db_session.commit()

    application_b = RTIApplication(
        user_id=user.id,
        authority_id=authority.id,
        subject="Second request",
        original_request="...",
        status=ApplicationStatus.SUBMITTED,
        registration_number="REG-0001",
    )
    db_session.add(application_b)
    with pytest.raises(IntegrityError):
        db_session.commit()


def test_basic_status_transitions(db_session, make_user, make_authority):
    user = make_user()
    authority = make_authority()
    application = _create(db_session, user, authority)
    assert application.status == ApplicationStatus.DRAFT

    event = service.record_event(
        db_session,
        application_id=application.id,
        event_type="VALIDATED",
        actor_id=user.id,
    )
    assert event.event_type == "VALIDATED"

    refreshed = service.get_application(db_session, application.id)
    assert refreshed.status == ApplicationStatus.VALIDATED

    service.record_event(
        db_session,
        application_id=application.id,
        event_type="READY_TO_FILE",
        actor_id=user.id,
    )
    refreshed = service.get_application(db_session, application.id)
    assert refreshed.status == ApplicationStatus.READY_TO_FILE


def test_illegal_status_transition_is_rejected(db_session, make_user, make_authority):
    user = make_user()
    authority = make_authority()
    application = _create(db_session, user, authority)

    # DRAFT -> SUBMITTED is not a legal direct transition (must pass
    # through VALIDATED -> READY_TO_FILE first).
    with pytest.raises(IllegalTransitionError):
        service.record_event(
            db_session,
            application_id=application.id,
            event_type="SUBMITTED",
            actor_id=user.id,
        )

    refreshed = service.get_application(db_session, application.id)
    assert refreshed.status == ApplicationStatus.DRAFT
