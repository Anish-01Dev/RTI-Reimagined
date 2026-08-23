from __future__ import annotations

import dataclasses
import uuid
from datetime import UTC, datetime

from app.config import settings
from app.domain.case_engine import service
from app.domain.evidence import Certificate, issue_certificate, keys, verify_certificate
from app.domain.evidence import certificate as certificate_module


def _sign(cert: Certificate) -> Certificate:
    """Sign a hand-built Certificate the same way issue_certificate does,
    for exercising verify_certificate branches issuance never reaches
    (e.g. a certificate for an application that no longer exists)."""
    payload = certificate_module._canonical_payload(
        application_id=cert.application_id,
        registration_number=cert.registration_number,
        authority_id=cert.authority_id,
        original_request_hash=cert.original_request_hash,
        issued_at=cert.issued_at,
        key_id=cert.key_id,
    )
    signature = keys.signing_key().sign(payload).hex()
    return dataclasses.replace(cert, signature=signature)


def _create_application(db_session, user, authority):
    return service.create_application(
        db_session,
        user_id=user.id,
        authority_id=authority.id,
        subject="Road repair records",
        original_request="Please provide repair records for Main Street.",
    )


def test_issue_then_verify_certificate_succeeds(db_session, make_user, make_authority):
    user = make_user()
    authority = make_authority()
    application = _create_application(db_session, user, authority)

    certificate = issue_certificate(db_session, application_id=application.id)
    result = verify_certificate(db_session, certificate=certificate)

    assert result.valid is True
    assert result.reason is None


def test_verify_rejects_tampered_field(db_session, make_user, make_authority):
    user = make_user()
    authority = make_authority()
    application = _create_application(db_session, user, authority)
    certificate = issue_certificate(db_session, application_id=application.id)

    tampered = dataclasses.replace(certificate, registration_number="FORGED-0001")
    result = verify_certificate(db_session, certificate=tampered)

    assert result.valid is False
    assert result.reason == "Signature verification failed"


def test_verify_rejects_unknown_key_id(db_session, make_user, make_authority):
    user = make_user()
    authority = make_authority()
    application = _create_application(db_session, user, authority)
    certificate = issue_certificate(db_session, application_id=application.id)

    forged = dataclasses.replace(certificate, key_id="not-our-key")
    result = verify_certificate(db_session, certificate=forged)

    assert result.valid is False
    assert result.reason == "Unknown key identifier"


def test_verify_rejects_unknown_application(db_session):
    certificate = _sign(
        Certificate(
            application_id=uuid.uuid4(),
            registration_number=None,
            authority_id=uuid.uuid4(),
            original_request_hash="0" * 64,
            issued_at=datetime.now(UTC),
            key_id=settings.evidence_key_id,
            signature="",
        )
    )

    result = verify_certificate(db_session, certificate=certificate)

    assert result.valid is False
    assert result.reason == "Application not found"


def test_verify_detects_stale_hash_after_original_request_changes(
    db_session, make_user, make_authority
):
    user = make_user()
    authority = make_authority()
    application = _create_application(db_session, user, authority)
    certificate = issue_certificate(db_session, application_id=application.id)

    application.original_request = "Please provide repair records for a different street."
    db_session.commit()

    result = verify_certificate(db_session, certificate=certificate)

    assert result.valid is False
    assert result.reason == "Certificate no longer matches the current record"
