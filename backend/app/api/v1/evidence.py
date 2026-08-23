"""Evidence certificate verification endpoint.

Certificate issuance lives on the application resource itself — see
GET /applications/{application_id}/certificate. This router only covers
verification, which is intentionally public and resource-independent: no
authentication is required or possible, by design.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.domain.evidence import Certificate, verify_certificate
from app.schemas.evidence import CertificateVerifyRequest, CertificateVerifyResult

router = APIRouter(prefix="/evidence", tags=["evidence"])

DbSession = Annotated[Session, Depends(get_db)]


@router.post("/verify", response_model=CertificateVerifyResult)
def verify(payload: CertificateVerifyRequest, db: DbSession) -> CertificateVerifyResult:
    result = verify_certificate(
        db,
        certificate=Certificate(
            application_id=payload.application_id,
            registration_number=payload.registration_number,
            authority_id=payload.authority_id,
            original_request_hash=payload.original_request_hash,
            issued_at=payload.issued_at,
            key_id=payload.key_id,
            signature=payload.signature,
        ),
    )
    return CertificateVerifyResult(valid=result.valid, reason=result.reason)
