"""RTI Application endpoints — Phase 1 foundation.

Thin HTTP layer only: parses/validates the request via app.schemas, calls
app.domain.case_engine.service, and serializes the result. No business
logic lives here — see docs/architecture/API_CONTRACT.md for the fuller
API surface this will grow into (submit, appeals, evidence, sync) in later
phases.
"""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.domain.case_engine import service
from app.schemas.applications import ApplicationCreate, ApplicationOut
from app.schemas.deadlines import DeadlineOut
from app.schemas.events import ApplicationEventCreate, ApplicationEventOut

router = APIRouter(prefix="/applications", tags=["applications"])

DbSession = Annotated[Session, Depends(get_db)]


@router.post("", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
def create_application(payload: ApplicationCreate, db: DbSession) -> ApplicationOut:
    application = service.create_application(
        db,
        user_id=payload.user_id,
        authority_id=payload.authority_id,
        subject=payload.subject,
        original_request=payload.original_request,
        refined_request=payload.refined_request,
    )
    return ApplicationOut.model_validate(application)


@router.get("/{application_id}", response_model=ApplicationOut)
def get_application(application_id: uuid.UUID, db: DbSession) -> ApplicationOut:
    application = service.get_application(db, application_id)
    return ApplicationOut.model_validate(application)


@router.get("/{application_id}/events", response_model=list[ApplicationEventOut])
def list_events(application_id: uuid.UUID, db: DbSession) -> list[ApplicationEventOut]:
    events = service.list_events(db, application_id)
    return [ApplicationEventOut.model_validate(event) for event in events]


@router.post(
    "/{application_id}/events",
    response_model=ApplicationEventOut,
    status_code=status.HTTP_201_CREATED,
)
def create_event(
    application_id: uuid.UUID,
    payload: ApplicationEventCreate,
    db: DbSession,
) -> ApplicationEventOut:
    event = service.record_event(
        db,
        application_id=application_id,
        event_type=payload.event_type,
        actor_id=payload.actor_id,
        metadata=payload.metadata,
    )
    return ApplicationEventOut.model_validate(event)


@router.get("/{application_id}/deadlines", response_model=list[DeadlineOut])
def list_deadlines(application_id: uuid.UUID, db: DbSession) -> list[DeadlineOut]:
    deadlines = service.list_deadlines(db, application_id)
    return [DeadlineOut.model_validate(deadline) for deadline in deadlines]
