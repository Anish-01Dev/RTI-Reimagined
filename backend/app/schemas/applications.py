from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.domain.ai.schemas import DecomposedItem
from app.domain.case_engine.state_machine import ApplicationStatus
from app.models.enums import InformationItemStatus


class ApplicationCreate(BaseModel):
    # NOTE: user_id is a pre-authentication placeholder. There is no auth
    # subsystem yet (out of scope for this phase — see docs/product/ROADMAP.md),
    # so identity has nowhere else to come from. Once auth exists, this
    # field must be dropped in favor of a server-derived identity from the
    # authenticated session; a client must never be able to claim to act as
    # another user. Do not build on top of this field assuming it is safe.
    user_id: uuid.UUID
    authority_id: uuid.UUID
    subject: str = Field(min_length=1, max_length=500)
    original_request: str = Field(min_length=1)
    refined_request: str | None = None
    items: list[DecomposedItem] | None = Field(default=None, min_length=1, max_length=8)


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    registration_number: str | None
    user_id: uuid.UUID
    authority_id: uuid.UUID
    subject: str
    original_request: str
    refined_request: str | None
    status: ApplicationStatus
    submitted_at: datetime | None
    received_at: datetime | None
    response_due_at: datetime | None
    response_received_at: datetime | None
    created_at: datetime
    updated_at: datetime


class InformationItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    application_id: uuid.UUID
    sequence: int
    question_text: str
    category: str | None
    status: InformationItemStatus
    evidence_excerpt: str | None
    created_at: datetime
    updated_at: datetime


class ApplicationDecomposeRequest(BaseModel):
    raw_text: str = Field(min_length=1)
    jurisdiction_hint: str | None = None
