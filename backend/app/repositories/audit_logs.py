"""Data access for AuditLog. Writes only reach this module through
app.domain services — there is no client-facing audit-log write path."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.orm import AuditLog


def create(db: Session, log: AuditLog) -> AuditLog:
    db.add(log)
    db.flush()
    return log
