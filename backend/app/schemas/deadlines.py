from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import DeadlineStatus, DeadlineType


class DeadlineOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    application_id: uuid.UUID
    deadline_type: DeadlineType
    starts_at: datetime
    due_at: datetime
    status: DeadlineStatus
    completed_at: datetime | None
