"""Every client-facing request schema rejects unrecognized fields instead
of silently ignoring them — catches malformed client requests as a clear
422 instead of quietly dropping data the client thought it was sending."""

from __future__ import annotations

import uuid


def test_create_application_rejects_unknown_field(client, make_user, make_authority):
    user = make_user()
    authority = make_authority()

    response = client.post(
        "/api/v1/applications",
        json={
            "user_id": str(user.id),
            "authority_id": str(authority.id),
            "subject": "Subject",
            "original_request": "Original request text.",
            "status": "COMPLETED",
        },
    )

    assert response.status_code == 422


def test_post_event_rejects_unknown_field(client, make_user, make_authority):
    user = make_user()
    authority = make_authority()
    create_response = client.post(
        "/api/v1/applications",
        json={
            "user_id": str(user.id),
            "authority_id": str(authority.id),
            "subject": "Subject",
            "original_request": "Original request text.",
        },
    )
    application_id = create_response.json()["id"]

    response = client.post(
        f"/api/v1/applications/{application_id}/events",
        json={"event_type": "VALIDATED", "actor_id": str(user.id), "id": str(uuid.uuid4())},
    )

    assert response.status_code == 422


def test_verify_certificate_rejects_unknown_field(client):
    response = client.post(
        "/api/v1/evidence/verify",
        json={
            "application_id": str(uuid.uuid4()),
            "authority_id": str(uuid.uuid4()),
            "original_request_hash": "0" * 64,
            "issued_at": "2026-01-01T00:00:00Z",
            "key_id": "key-01",
            "signature": "00",
            "valid": True,
        },
    )

    assert response.status_code == 422
