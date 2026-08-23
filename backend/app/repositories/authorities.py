"""Data access for Authority. Read-only here — authority onboarding is an
admin/data-loading concern outside this phase's scope."""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.models.orm import Authority


def get_by_id(db: Session, authority_id: uuid.UUID) -> Authority | None:
    return db.get(Authority, authority_id)
