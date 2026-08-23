"""HTTP-level smoke tests for the public, unauthenticated verify endpoint."""

from __future__ import annotations

import uuid


def test_verify_certificate_round_trip_through_the_api(client, make_user, make_authority):
    user = make_user()
    authority = make_authority()
    create_response = client.post(
        "/api/v1/applications",
        json={
            "user_id": str(user.id),
            "authority_id": str(authority.id),
            "subject": "Road repair records",
            "original_request": "Please share records for Main Street repairs.",
        },
    )
    application_id = create_response.json()["id"]
    certificate = client.get(f"/api/v1/applications/{application_id}/certificate").json()

    response = client.post("/api/v1/evidence/verify", json=certificate)

    assert response.status_code == 200
    assert response.json() == {"valid": True, "reason": None}


def test_verify_certificate_detects_tampering_through_the_api(client, make_user, make_authority):
    user = make_user()
    authority = make_authority()
    create_response = client.post(
        "/api/v1/applications",
        json={
            "user_id": str(user.id),
            "authority_id": str(authority.id),
            "subject": "Road repair records",
            "original_request": "Please share records for Main Street repairs.",
        },
    )
    application_id = create_response.json()["id"]
    certificate = client.get(f"/api/v1/applications/{application_id}/certificate").json()
    certificate["original_request_hash"] = "0" * 64

    response = client.post("/api/v1/evidence/verify", json=certificate)

    assert response.status_code == 200
    body = response.json()
    assert body["valid"] is False
    assert body["reason"] == "Signature verification failed"


def test_verify_certificate_for_unknown_application_returns_invalid(client):
    response = client.post(
        "/api/v1/evidence/verify",
        json={
            "application_id": str(uuid.uuid4()),
            "registration_number": None,
            "authority_id": str(uuid.uuid4()),
            "original_request_hash": "0" * 64,
            "issued_at": "2026-01-01T00:00:00Z",
            "key_id": "not-our-key",
            "signature": "00",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["valid"] is False
    assert body["reason"] == "Unknown key identifier"
