from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.models.orm import InformationItem


def create(db: Session, item: InformationItem) -> InformationItem:
    db.add(item)
    db.flush()
    return item


def list_for_application(db: Session, application_id: uuid.UUID) -> list[InformationItem]:
    return (
        db.query(InformationItem)
        .filter(InformationItem.application_id == application_id)
        .order_by(InformationItem.sequence)
        .all()
    )
