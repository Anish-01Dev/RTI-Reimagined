"""Evidence certificates: Ed25519-signed, minimal, and publicly verifiable.

The payload deliberately excludes personal or document data — it proves
that a specific application existed, with a specific original request and
authority, at a specific point in time, without exposing anything about
the citizen who filed it.
"""

from __future__ import annotations

import dataclasses
import hashlib
import json
import uuid
from datetime import UTC, datetime

from cryptography.exceptions import InvalidSignature
from sqlalchemy.orm import Session

from app.config import settings
from app.domain.case_engine import service
from app.domain.errors import NotFoundError
from app.domain.evidence import keys


@dataclasses.dataclass
class Certificate:
    application_id: uuid.UUID
    registration_number: str | None
    authority_id: uuid.UUID
    original_request_hash: str
    issued_at: datetime
    key_id: str
    signature: str


@dataclasses.dataclass
class VerificationResult:
    valid: bool
    reason: str | None = None


def issue_certificate(db: Session, *, application_id: uuid.UUID) -> Certificate:
    application = service.get_application(db, application_id)
    issued_at = datetime.now(UTC)
    key_id = settings.evidence_key_id
    original_request_hash = _hash_request(application.original_request)

    payload = _canonical_payload(
        application_id=application.id,
        registration_number=application.registration_number,
        authority_id=application.authority_id,
        original_request_hash=original_request_hash,
        issued_at=issued_at,
        key_id=key_id,
    )
    signature = keys.signing_key().sign(payload).hex()

    return Certificate(
        application_id=application.id,
        registration_number=application.registration_number,
        authority_id=application.authority_id,
        original_request_hash=original_request_hash,
        issued_at=issued_at,
        key_id=key_id,
        signature=signature,
    )


def verify_certificate(db: Session, *, certificate: Certificate) -> VerificationResult:
    if certificate.key_id != settings.evidence_key_id:
        return VerificationResult(valid=False, reason="Unknown key identifier")

    payload = _canonical_payload(
        application_id=certificate.application_id,
        registration_number=certificate.registration_number,
        authority_id=certificate.authority_id,
        original_request_hash=certificate.original_request_hash,
        issued_at=certificate.issued_at,
        key_id=certificate.key_id,
    )
    try:
        signature = bytes.fromhex(certificate.signature)
        keys.public_key().verify(signature, payload)
    except (InvalidSignature, ValueError):
        return VerificationResult(valid=False, reason="Signature verification failed")

    try:
        application = service.get_application(db, certificate.application_id)
    except NotFoundError:
        return VerificationResult(valid=False, reason="Application not found")

    if _hash_request(application.original_request) != certificate.original_request_hash:
        return VerificationResult(
            valid=False, reason="Certificate no longer matches the current record"
        )

    return VerificationResult(valid=True)


def _hash_request(original_request: str) -> str:
    return hashlib.sha256(original_request.encode("utf-8")).hexdigest()


def _canonical_payload(
    *,
    application_id: uuid.UUID,
    registration_number: str | None,
    authority_id: uuid.UUID,
    original_request_hash: str,
    issued_at: datetime,
    key_id: str,
) -> bytes:
    fields = {
        "application_id": str(application_id),
        "registration_number": registration_number,
        "authority_id": str(authority_id),
        "original_request_hash": original_request_hash,
        "issued_at": issued_at.isoformat(),
        "key_id": key_id,
    }
    return json.dumps(fields, sort_keys=True, separators=(",", ":")).encode("utf-8")
