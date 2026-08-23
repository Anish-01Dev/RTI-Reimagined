from __future__ import annotations

import uuid

from pydantic import BaseModel, Field


class ApplicationResponseCreate(BaseModel):
    response_text: str = Field(min_length=1)
    # NOTE: same pre-authentication placeholder as ApplicationCreate.user_id
    # — see app/schemas/applications.py.
    actor_id: uuid.UUID | None = None
