from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import AppealStatus, AppealType
from app.schemas.applications import InformationItemOut


class AppealDraftOut(BaseModel):
    application_id: uuid.UUID
    registration_number: str | None
    subject: str
    original_request: str
    filed_at: datetime | None
    response_due_at: datetime | None
    grounds_citation: str
    appeal_window_citation: str
    open_items: list[InformationItemOut]
    narrative: str
    open_items_summary: list[str]


class AppealFileRequest(BaseModel):
    # NOTE: same pre-authentication placeholder as ApplicationCreate.user_id
    # — see app/schemas/applications.py.
    actor_id: uuid.UUID | None = None
    reason: str = Field(min_length=1)


class AppealOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    application_id: uuid.UUID
    appeal_type: AppealType
    reason: str
    status: AppealStatus
    created_at: datetime
    submitted_at: datetime | None
