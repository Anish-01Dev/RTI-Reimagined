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
from app.domain.ai.client import LanguageModelClient, language_model_client
from app.domain.ai.schemas import ApplicationDoctorOutput
from app.domain.appeal_engine import compile_first_appeal_draft
from app.domain.case_engine import service
from app.domain.errors import ValidationError
from app.domain.evidence import issue_certificate
from app.domain.response_analysis import record_response
from app.schemas.appeals import AppealDraftOut, AppealFileRequest, AppealOut, PrecedentMatchOut
from app.schemas.applications import (
    ApplicationCreate,
    ApplicationDecomposeRequest,
    ApplicationOut,
    InformationItemOut,
)
from app.schemas.deadlines import DeadlineOut
from app.schemas.events import ApplicationEventCreate, ApplicationEventOut
from app.schemas.evidence import CertificateOut
from app.schemas.responses import ApplicationResponseCreate

router = APIRouter(prefix="/applications", tags=["applications"])

DbSession = Annotated[Session, Depends(get_db)]


def get_language_model_client() -> LanguageModelClient:
    return language_model_client


AiClient = Annotated[LanguageModelClient, Depends(get_language_model_client)]


@router.post("", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
def create_application(payload: ApplicationCreate, db: DbSession) -> ApplicationOut:
    if payload.items:
        application = service.create_application_with_items(
            db,
            user_id=payload.user_id,
            authority_id=payload.authority_id,
            subject=payload.subject,
            original_request=payload.original_request,
            items=payload.items,
        )
    else:
        application = service.create_application(
            db,
            user_id=payload.user_id,
            authority_id=payload.authority_id,
            subject=payload.subject,
            original_request=payload.original_request,
            refined_request=payload.refined_request,
        )
    return ApplicationOut.model_validate(application)


@router.post("/decompose", response_model=ApplicationDoctorOutput)
def decompose_application(
    payload: ApplicationDecomposeRequest, ai_client: AiClient
) -> ApplicationDoctorOutput:
    return ai_client.decompose_application(
        raw_text=payload.raw_text,
        jurisdiction_hint=payload.jurisdiction_hint,
    )


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
    if payload.event_type == "NO_RESPONSE":
        raise ValidationError("NO_RESPONSE is created by the deadline sweep")
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


@router.get("/{application_id}/items", response_model=list[InformationItemOut])
def list_information_items(application_id: uuid.UUID, db: DbSession) -> list[InformationItemOut]:
    items = service.list_information_items(db, application_id)
    return [InformationItemOut.model_validate(item) for item in items]


@router.get("/{application_id}/certificate", response_model=CertificateOut)
def get_certificate(application_id: uuid.UUID, db: DbSession) -> CertificateOut:
    certificate = issue_certificate(db, application_id=application_id)
    return CertificateOut(
        application_id=certificate.application_id,
        registration_number=certificate.registration_number,
        authority_id=certificate.authority_id,
        original_request_hash=certificate.original_request_hash,
        issued_at=certificate.issued_at,
        key_id=certificate.key_id,
        signature=certificate.signature,
    )


@router.post("/{application_id}/response", response_model=list[InformationItemOut])
def submit_response(
    application_id: uuid.UUID,
    payload: ApplicationResponseCreate,
    db: DbSession,
    ai_client: AiClient,
) -> list[InformationItemOut]:
    items = record_response(
        db,
        application_id=application_id,
        response_text=payload.response_text,
        actor_id=payload.actor_id,
        ai_client=ai_client,
    )
    return [InformationItemOut.model_validate(item) for item in items]


@router.get("/{application_id}/appeal", response_model=AppealDraftOut)
def get_first_appeal_draft(
    application_id: uuid.UUID, db: DbSession, ai_client: AiClient
) -> AppealDraftOut:
    draft = compile_first_appeal_draft(db, application_id=application_id, ai_client=ai_client)
    return AppealDraftOut(
        application_id=draft.application_id,
        registration_number=draft.registration_number,
        subject=draft.subject,
        original_request=draft.original_request,
        filed_at=draft.filed_at,
        response_due_at=draft.response_due_at,
        grounds_citation=draft.grounds_citation,
        appeal_window_citation=draft.appeal_window_citation,
        open_items=[InformationItemOut.model_validate(item) for item in draft.open_items],
        narrative=draft.narrative,
        open_items_summary=draft.open_items_summary,
        precedent_matches=[
            PrecedentMatchOut(
                item_id=match.item_id,
                question_text=match.question_text,
                section=match.section,
                principle=match.principle,
                citation=match.citation,
            )
            for match in draft.precedent_matches
        ],
    )


@router.post(
    "/{application_id}/appeal/file", response_model=AppealOut, status_code=status.HTTP_201_CREATED
)
def file_first_appeal(
    application_id: uuid.UUID, payload: AppealFileRequest, db: DbSession
) -> AppealOut:
    appeal = service.file_first_appeal(
        db,
        application_id=application_id,
        actor_id=payload.actor_id,
        reason=payload.reason,
    )
    return AppealOut.model_validate(appeal)
