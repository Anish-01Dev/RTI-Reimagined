"""SQLAlchemy declarative models.

Mirrors the schema documented in docs/architecture/DATA_MODEL.md. Table
definitions are added here as each subsystem is implemented, in the build
order set out in docs/product/ROADMAP.md.

Phase 1 (this module) implements the foundation: User, Authority,
RTIApplication, ApplicationEvent, Document, Deadline, Appeal, AuditLog.
`ApplicationEvent` (append-only) is the authoritative source of an
application's case history — no other table independently tracks status
history. `ApplicationStatus` itself is owned by
app.domain.case_engine.state_machine, not defined here, so the schema and
the transition table can never drift apart.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
)
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.domain.case_engine.state_machine import ApplicationStatus
from app.models.enums import (
    AppealStatus,
    AppealType,
    AuthorityLevel,
    DeadlineStatus,
    DeadlineType,
    DocumentType,
    FilingChannel,
    InformationItemStatus,
    UserRole,
)


class Base(DeclarativeBase):
    pass


def _uuid_pk() -> Mapped[uuid.UUID]:
    return mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


def _created_at() -> Mapped[datetime]:
    return mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("phone IS NOT NULL OR email IS NOT NULL", name="ck_users_phone_or_email"),
    )

    id: Mapped[uuid.UUID] = _uuid_pk()
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, name="user_role", native_enum=False, validate_strings=True),
        nullable=False,
        default=UserRole.CITIZEN,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    email: Mapped[str | None] = mapped_column(String(320), unique=True, nullable=True)
    created_at: Mapped[datetime] = _created_at()
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    applications: Mapped[list[RTIApplication]] = relationship(back_populates="user")


class Authority(Base):
    __tablename__ = "authorities"
    __table_args__ = (Index("ix_authorities_state_district", "state", "district"),)

    id: Mapped[uuid.UUID] = _uuid_pk()
    name: Mapped[str] = mapped_column(String(300), nullable=False, index=True)
    type: Mapped[AuthorityLevel] = mapped_column(
        SAEnum(AuthorityLevel, name="authority_level", native_enum=False, validate_strings=True),
        nullable=False,
    )
    jurisdiction: Mapped[str] = mapped_column(String(300), nullable=False)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    district: Mapped[str | None] = mapped_column(String(100), nullable=True)
    department: Mapped[str | None] = mapped_column(String(300), nullable=True)
    filing_channel: Mapped[FilingChannel] = mapped_column(
        SAEnum(FilingChannel, name="filing_channel", native_enum=False, validate_strings=True),
        nullable=False,
        default=FilingChannel.ONLINE,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = _created_at()
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    applications: Mapped[list[RTIApplication]] = relationship(back_populates="authority")


class RTIApplication(Base):
    """An RTI application (the "case" — one application per state-machine instance)."""

    __tablename__ = "applications"
    __table_args__ = (Index("ix_applications_status", "status"),)

    id: Mapped[uuid.UUID] = _uuid_pk()
    registration_number: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    authority_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("authorities.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    subject: Mapped[str] = mapped_column(String(500), nullable=False)
    original_request: Mapped[str] = mapped_column(Text, nullable=False)
    refined_request: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ApplicationStatus] = mapped_column(
        SAEnum(
            ApplicationStatus, name="application_status", native_enum=False, validate_strings=True
        ),
        nullable=False,
        default=ApplicationStatus.DRAFT,
    )
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    received_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    response_due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    response_received_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = _created_at()
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user: Mapped[User] = relationship(back_populates="applications")
    authority: Mapped[Authority] = relationship(back_populates="applications")
    events: Mapped[list[ApplicationEvent]] = relationship(
        back_populates="application",
        order_by="ApplicationEvent.timestamp",
        cascade="all, delete-orphan",
    )
    documents: Mapped[list[Document]] = relationship(
        back_populates="application", cascade="all, delete-orphan"
    )
    deadlines: Mapped[list[Deadline]] = relationship(
        back_populates="application", cascade="all, delete-orphan"
    )
    appeals: Mapped[list[Appeal]] = relationship(
        back_populates="application", cascade="all, delete-orphan"
    )
    information_items: Mapped[list[InformationItem]] = relationship(
        back_populates="application",
        order_by="InformationItem.sequence",
        cascade="all, delete-orphan",
    )


class ApplicationEvent(Base):
    """Append-only case history. Never updated or deleted once written."""

    __tablename__ = "application_events"
    __table_args__ = (
        Index("ix_application_events_application_timestamp", "application_id", "timestamp"),
    )

    id: Mapped[uuid.UUID] = _uuid_pk()
    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    actor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    # Column is named "metadata" per spec; the Python attribute can't be
    # called that because Base.metadata already exists on every Declarative
    # class.
    event_metadata: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)

    application: Mapped[RTIApplication] = relationship(back_populates="events")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = _uuid_pk()
    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    document_type: Mapped[DocumentType] = mapped_column(
        SAEnum(DocumentType, name="document_type", native_enum=False, validate_strings=True),
        nullable=False,
    )
    storage_reference: Mapped[str] = mapped_column(String(500), nullable=False)
    filename: Mapped[str] = mapped_column(String(300), nullable=False)
    content_type: Mapped[str] = mapped_column(String(150), nullable=False)
    hash: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = _created_at()

    application: Mapped[RTIApplication] = relationship(back_populates="documents")


class Deadline(Base):
    __tablename__ = "deadlines"
    __table_args__ = (
        Index("ix_deadlines_application_status", "application_id", "status"),
        Index("ix_deadlines_due_at", "due_at"),
    )

    id: Mapped[uuid.UUID] = _uuid_pk()
    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    deadline_type: Mapped[DeadlineType] = mapped_column(
        SAEnum(DeadlineType, name="deadline_type", native_enum=False, validate_strings=True),
        nullable=False,
    )
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[DeadlineStatus] = mapped_column(
        SAEnum(DeadlineStatus, name="deadline_status", native_enum=False, validate_strings=True),
        nullable=False,
        default=DeadlineStatus.ACTIVE,
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    application: Mapped[RTIApplication] = relationship(back_populates="deadlines")


class InformationItem(Base):
    __tablename__ = "information_items"
    __table_args__ = (
        Index("ix_information_items_application_sequence", "application_id", "sequence"),
        CheckConstraint(
            "status IN ('PENDING', 'ANSWERED', 'PARTIALLY_ANSWERED', 'NOT_ANSWERED', "
            "'POTENTIALLY_DEFICIENT')",
            name="information_item_status",
        ),
    )

    id: Mapped[uuid.UUID] = _uuid_pk()
    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sequence: Mapped[int] = mapped_column(nullable=False)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[InformationItemStatus] = mapped_column(
        SAEnum(
            InformationItemStatus,
            name="information_item_status",
            native_enum=False,
            validate_strings=True,
        ),
        nullable=False,
        default=InformationItemStatus.PENDING,
    )
    evidence_excerpt: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = _created_at()
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    application: Mapped[RTIApplication] = relationship(back_populates="information_items")


class Appeal(Base):
    __tablename__ = "appeals"

    id: Mapped[uuid.UUID] = _uuid_pk()
    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    appeal_type: Mapped[AppealType] = mapped_column(
        SAEnum(AppealType, name="appeal_type", native_enum=False, validate_strings=True),
        nullable=False,
    )
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[AppealStatus] = mapped_column(
        SAEnum(AppealStatus, name="appeal_status", native_enum=False, validate_strings=True),
        nullable=False,
        default=AppealStatus.DRAFT,
    )
    created_at: Mapped[datetime] = _created_at()
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    application: Mapped[RTIApplication] = relationship(back_populates="appeals")


class AuditLog(Base):
    """General-purpose audit trail across all entity types.

    `entity_type`/`entity_id` is a deliberately polymorphic reference (no
    FK) since a single audit log spans many owning tables; ApplicationEvent
    remains the authoritative *case* history, this table is the broader
    security/compliance trail (who did what, to which entity, when).
    """

    __tablename__ = "audit_logs"
    __table_args__ = (Index("ix_audit_logs_entity", "entity_type", "entity_id"),)

    id: Mapped[uuid.UUID] = _uuid_pk()
    actor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    log_metadata: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)
