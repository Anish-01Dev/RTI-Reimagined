from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ApplicationEventCreate(BaseModel):
    event_type: str = Field(min_length=1, max_length=64)
    # NOTE: same pre-authentication placeholder as ApplicationCreate.user_id
    # — see app/schemas/applications.py.
    actor_id: uuid.UUID | None = None
    metadata: dict[str, Any] | None = None


class ApplicationEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    application_id: uuid.UUID
    event_type: str
    actor_id: uuid.UUID | None
    timestamp: datetime
    metadata: dict[str, Any] | None = Field(validation_alias="event_metadata", default=None)
