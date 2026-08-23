"""Data access for Appeal."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.orm import Appeal


def create(db: Session, appeal: Appeal) -> Appeal:
    db.add(appeal)
    db.flush()
    return appeal
