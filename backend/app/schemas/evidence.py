from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel


class CertificateOut(BaseModel):
    application_id: uuid.UUID
    registration_number: str | None
    authority_id: uuid.UUID
    original_request_hash: str
    issued_at: datetime
    key_id: str
    signature: str


class CertificateVerifyRequest(BaseModel):
    application_id: uuid.UUID
    registration_number: str | None = None
    authority_id: uuid.UUID
    original_request_hash: str
    issued_at: datetime
    key_id: str
    signature: str


class CertificateVerifyResult(BaseModel):
    valid: bool
    reason: str | None = None
