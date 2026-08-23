"""Data access for Deadline."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from app.domain.case_engine.state_machine import ApplicationStatus
from app.models.enums import DeadlineStatus, DeadlineType
from app.models.orm import Deadline, RTIApplication


def create(db: Session, deadline: Deadline) -> Deadline:
    db.add(deadline)
    db.flush()
    return deadline


def list_for_application(db: Session, application_id: uuid.UUID) -> list[Deadline]:
    return (
        db.query(Deadline)
        .filter(Deadline.application_id == application_id)
        .order_by(Deadline.due_at)
        .all()
    )


def get_latest_by_type(
    db: Session, application_id: uuid.UUID, deadline_type: DeadlineType
) -> Deadline | None:
    return (
        db.query(Deadline)
        .filter(
            Deadline.application_id == application_id,
            Deadline.deadline_type == deadline_type,
        )
        .order_by(Deadline.due_at.desc())
        .first()
    )


def list_applications_with_due_active_response_deadlines(
    db: Session, *, now: datetime
) -> list[RTIApplication]:
    return (
        db.query(RTIApplication)
        .join(Deadline, Deadline.application_id == RTIApplication.id)
        .filter(
            RTIApplication.status == ApplicationStatus.UNDER_PROCESSING,
            Deadline.deadline_type == DeadlineType.RESPONSE,
            Deadline.status == DeadlineStatus.ACTIVE,
            Deadline.due_at < now,
        )
        .distinct()
        .all()
    )
