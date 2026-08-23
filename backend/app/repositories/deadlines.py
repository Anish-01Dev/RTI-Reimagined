"""Data access for Deadline."""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.models.orm import Deadline


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
