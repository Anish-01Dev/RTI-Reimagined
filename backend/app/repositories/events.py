"""Data access for ApplicationEvent — the append-only case history."""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.models.orm import ApplicationEvent


def create(db: Session, event: ApplicationEvent) -> ApplicationEvent:
    db.add(event)
    db.flush()
    return event


def list_for_application(db: Session, application_id: uuid.UUID) -> list[ApplicationEvent]:
    return (
        db.query(ApplicationEvent)
        .filter(ApplicationEvent.application_id == application_id)
        .order_by(ApplicationEvent.timestamp)
        .all()
    )
