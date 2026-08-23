"""HTTP-level smoke tests: verifies the router/schema/service wiring, not
domain logic (already covered in tests/test_applications.py)."""

from __future__ import annotations

import uuid


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_create_and_fetch_application(client, make_user, make_authority):
    user = make_user()
    authority = make_authority()

    create_response = client.post(
        "/api/v1/applications",
        json={
            "user_id": str(user.id),
            "authority_id": str(authority.id),
            "subject": "Water supply complaints",
            "original_request": "Please share the count of water supply complaints in 2025.",
        },
    )
    assert create_response.status_code == 201
    body = create_response.json()
    assert body["status"] == "DRAFT"
    application_id = body["id"]

    get_response = client.get(f"/api/v1/applications/{application_id}")
    assert get_response.status_code == 200
    assert get_response.json()["id"] == application_id

    events_response = client.get(f"/api/v1/applications/{application_id}/events")
    assert events_response.status_code == 200
    assert [e["event_type"] for e in events_response.json()] == ["DRAFT_CREATED"]

    deadlines_response = client.get(f"/api/v1/applications/{application_id}/deadlines")
    assert deadlines_response.status_code == 200
    assert deadlines_response.json() == []


def test_get_unknown_application_returns_404_with_structured_error(client):
    response = client.get(f"/api/v1/applications/{uuid.uuid4()}")
    assert response.status_code == 404
    body = response.json()
    assert body["error"]["code"] == "NOT_FOUND"
    assert "request_id" in body


def test_create_application_with_unknown_authority_returns_404(client, make_user):
    user = make_user()
    response = client.post(
        "/api/v1/applications",
        json={
            "user_id": str(user.id),
            "authority_id": str(uuid.uuid4()),
            "subject": "Subject",
            "original_request": "Original request text.",
        },
    )
    assert response.status_code == 404


def test_create_application_rejects_blank_subject(client, make_user, make_authority):
    user = make_user()
    authority = make_authority()
    response = client.post(
        "/api/v1/applications",
        json={
            "user_id": str(user.id),
            "authority_id": str(authority.id),
            "subject": "",
            "original_request": "Original request text.",
        },
    )
    assert response.status_code == 422


def test_post_event_transitions_status_via_api(client, make_user, make_authority):
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

    event_response = client.post(
        f"/api/v1/applications/{application_id}/events",
        json={"event_type": "VALIDATED", "actor_id": str(user.id)},
    )
    assert event_response.status_code == 201
    assert event_response.json()["event_type"] == "VALIDATED"

    get_response = client.get(f"/api/v1/applications/{application_id}")
    assert get_response.json()["status"] == "VALIDATED"


def test_post_illegal_event_returns_409(client, make_user, make_authority):
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
        json={"event_type": "SUBMITTED", "actor_id": str(user.id)},
    )
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "ILLEGAL_TRANSITION"
