"""SQLAlchemy declarative models.

Mirrors the schema documented in docs/architecture/DATA_MODEL.md. Table
definitions are added here as each subsystem is implemented, in the build
order set out in docs/product/ROADMAP.md.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Model classes (User, Case, Application, Question, CaseEvent, Deadline,
# Response, ResponseItem, Appeal, EvidenceRecord, Document, Device,
# SyncOperation, AuditLog) are defined here as their owning subsystem
# is built.
