"""Data access for User. Read-only here — user creation belongs to the
future authentication phase."""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.models.orm import User


def get_by_id(db: Session, user_id: uuid.UUID) -> User | None:
    return db.get(User, user_id)
