"""Data access for RTIApplication. Isolates app.domain.case_engine from
SQLAlchemy session/query details."""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.models.orm import RTIApplication


def create(db: Session, application: RTIApplication) -> RTIApplication:
    db.add(application)
    db.flush()
    return application


def get_by_id(db: Session, application_id: uuid.UUID) -> RTIApplication | None:
    return db.get(RTIApplication, application_id)


def get_by_registration_number(db: Session, registration_number: str) -> RTIApplication | None:
    return (
        db.query(RTIApplication)
        .filter(RTIApplication.registration_number == registration_number)
        .first()
    )
