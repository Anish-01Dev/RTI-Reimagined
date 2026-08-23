"""Application (case) orchestration.

`state_machine.py` owns the pure transition rules; this module is where
those rules meet persistence — creating an application, appending to its
event history, and applying a validated status transition. HTTP concerns
(status codes, request parsing) stay out of this module entirely: routes
call these functions and translate `app.domain.errors` exceptions into
responses. See app.api.v1.applications.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.domain.ai.schemas import DecomposedItem
from app.domain.case_engine import state_machine
from app.domain.errors import ConflictError, NotFoundError, ValidationError
from app.models.enums import (
    AppealStatus,
    AppealType,
    DeadlineStatus,
    DeadlineType,
    InformationItemStatus,
)
from app.models.orm import (
    Appeal,
    ApplicationEvent,
    AuditLog,
    Deadline,
    InformationItem,
    RTIApplication,
)
from app.repositories import appeals as appeals_repo
from app.repositories import applications as applications_repo
from app.repositories import audit_logs as audit_logs_repo
from app.repositories import authorities as authorities_repo
from app.repositories import deadlines as deadlines_repo
from app.repositories import events as events_repo
from app.repositories import information_items as information_items_repo
from app.repositories import users as users_repo


def create_application(
    db: Session,
    *,
    user_id: uuid.UUID,
    authority_id: uuid.UUID,
    subject: str,
    original_request: str,
    refined_request: str | None = None,
) -> RTIApplication:
    application = _stage_application(
        db,
        user_id=user_id,
        authority_id=authority_id,
        subject=subject,
        original_request=original_request,
        refined_request=refined_request,
    )

    _commit(db)
    db.refresh(application)
    return application


def create_application_with_items(
    db: Session,
    *,
    user_id: uuid.UUID,
    authority_id: uuid.UUID,
    subject: str,
    original_request: str,
    items: list[DecomposedItem],
) -> RTIApplication:
    try:
        application = _stage_application(
            db,
            user_id=user_id,
            authority_id=authority_id,
            subject=subject,
            original_request=original_request,
            refined_request=None,
        )
        for index, item in enumerate(items, start=1):
            information_items_repo.create(
                db,
                InformationItem(
                    application_id=application.id,
                    sequence=index,
                    question_text=item.question_text,
                    category=item.category,
                    status=InformationItemStatus.PENDING,
                ),
            )

        _commit(db)
    except Exception:
        db.rollback()
        raise
    db.refresh(application)
    return application


def _stage_application(
    db: Session,
    *,
    user_id: uuid.UUID,
    authority_id: uuid.UUID,
    subject: str,
    original_request: str,
    refined_request: str | None = None,
) -> RTIApplication:
    if users_repo.get_by_id(db, user_id) is None:
        raise NotFoundError(f"User {user_id} does not exist")

    authority = authorities_repo.get_by_id(db, authority_id)
    if authority is None:
        raise NotFoundError(f"Authority {authority_id} does not exist")
    if not authority.is_active:
        raise ValidationError(f"Authority {authority_id} is not active")

    application = RTIApplication(
        user_id=user_id,
        authority_id=authority_id,
        subject=subject,
        original_request=original_request,
        refined_request=refined_request,
        status=state_machine.INITIAL_STATE,
    )
    applications_repo.create(db, application)

    _append_event(
        db,
        application=application,
        event_type="DRAFT_CREATED",
        actor_id=user_id,
        metadata=None,
    )
    _append_audit(
        db, actor_id=user_id, entity_type="application", entity_id=application.id, action="CREATE"
    )
    return application


def get_application(db: Session, application_id: uuid.UUID) -> RTIApplication:
    application = applications_repo.get_by_id(db, application_id)
    if application is None:
        raise NotFoundError(f"Application {application_id} does not exist")
    return application


def list_events(db: Session, application_id: uuid.UUID) -> list[ApplicationEvent]:
    get_application(db, application_id)
    return events_repo.list_for_application(db, application_id)


def list_deadlines(db: Session, application_id: uuid.UUID) -> list[Deadline]:
    get_application(db, application_id)
    return deadlines_repo.list_for_application(db, application_id)


def list_information_items(db: Session, application_id: uuid.UUID) -> list[InformationItem]:
    get_application(db, application_id)
    return information_items_repo.list_for_application(db, application_id)


def list_open_information_items(db: Session, application_id: uuid.UUID) -> list[InformationItem]:
    get_application(db, application_id)
    return information_items_repo.list_open_for_application(db, application_id)


def record_event(
    db: Session,
    *,
    application_id: uuid.UUID,
    event_type: str,
    actor_id: uuid.UUID | None,
    metadata: dict[str, Any] | None = None,
) -> ApplicationEvent:
    """Append an event to an application's history.

    If `event_type` names a legal ApplicationStatus (e.g. "SUBMITTED"),
    this also performs the corresponding status transition, validated
    against state_machine.TRANSITIONS — this is the application's only
    status-transition path; nothing else may write `applications.status`.
    Any other event_type is recorded as a status-independent, informational
    event (e.g. "DEADLINE_REACHED", "APPEAL_CREATED").
    """
    application = get_application(db, application_id)

    if event_type in state_machine.ApplicationStatus.__members__:
        to_state = state_machine.ApplicationStatus[event_type]
        state_machine.validate_transition(application.status, to_state)
        application.status = to_state

    event = _append_event(
        db, application=application, event_type=event_type, actor_id=actor_id, metadata=metadata
    )
    _append_audit(
        db,
        actor_id=actor_id,
        entity_type="application",
        entity_id=application.id,
        action=f"EVENT:{event_type}",
    )

    _commit(db)
    db.refresh(event)
    return event


def create_deadline(
    db: Session,
    *,
    application_id: uuid.UUID,
    deadline_type: DeadlineType,
    starts_at: datetime,
    due_at: datetime,
) -> Deadline:
    """Record a deadline for an application.

    Deadline *computation* (which deadlines apply, and when they fall) is
    the Rights Clock's job (docs/product/ROADMAP.md Phase 3) and is not
    implemented yet — this only persists a deadline a caller has already
    computed, which is why there is no public POST endpoint for it in this
    phase.
    """
    get_application(db, application_id)
    if due_at <= starts_at:
        raise ValidationError("due_at must be after starts_at")

    deadline = Deadline(
        application_id=application_id,
        deadline_type=deadline_type,
        starts_at=starts_at,
        due_at=due_at,
        status=DeadlineStatus.ACTIVE,
    )
    deadlines_repo.create(db, deadline)
    _commit(db)
    db.refresh(deadline)
    return deadline


def file_first_appeal(
    db: Session,
    *,
    application_id: uuid.UUID,
    actor_id: uuid.UUID | None,
    reason: str,
) -> Appeal:
    """File the first appeal a citizen has reviewed and approved.

    Checked against the transition table up front so an ineligible
    application never gets a persisted Appeal row; record_event performs
    the same check again as the sole authoritative gate on
    applications.status and commits both rows in one transaction.
    """
    application = get_application(db, application_id)
    state_machine.validate_transition(
        application.status, state_machine.ApplicationStatus.FIRST_APPEAL_FILED
    )

    appeal = Appeal(
        application_id=application.id,
        appeal_type=AppealType.FIRST,
        reason=reason,
        status=AppealStatus.FILED,
        submitted_at=datetime.now(UTC),
    )
    appeals_repo.create(db, appeal)

    record_event(
        db,
        application_id=application.id,
        event_type="FIRST_APPEAL_FILED",
        actor_id=actor_id,
        metadata={"appeal_id": str(appeal.id)},
    )
    db.refresh(appeal)
    return appeal


def _append_event(
    db: Session,
    *,
    application: RTIApplication,
    event_type: str,
    actor_id: uuid.UUID | None,
    metadata: dict[str, Any] | None,
) -> ApplicationEvent:
    event = ApplicationEvent(
        application_id=application.id,
        event_type=event_type,
        actor_id=actor_id,
        event_metadata=metadata,
    )
    return events_repo.create(db, event)


def _append_audit(
    db: Session,
    *,
    actor_id: uuid.UUID | None,
    entity_type: str,
    entity_id: uuid.UUID,
    action: str,
) -> AuditLog:
    log = AuditLog(actor_id=actor_id, entity_type=entity_type, entity_id=entity_id, action=action)
    return audit_logs_repo.create(db, log)


def _commit(db: Session) -> None:
    """Commit, translating a constraint violation into a domain error
    instead of letting a raw DB/driver error escape to the API layer."""
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError("The request conflicts with existing data") from exc
