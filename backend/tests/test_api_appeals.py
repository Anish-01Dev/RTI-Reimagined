"""HTTP-level smoke tests: verifies the appeal router/schema/service wiring,
not domain logic (already covered in tests/test_appeal_engine.py)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from app.api.v1.applications import get_language_model_client
from app.domain.ai.schemas import AppealDraftOutput
from app.domain.case_engine import service
from app.domain.deadline_engine import run_deadline_sweep
from app.main import app
from app.models.enums import DeadlineType

NOW = datetime(2026, 2, 1, 12, 0, tzinfo=UTC)


def _create_first_appeal_eligible_application(client, db_session, user, authority) -> str:
    create_response = client.post(
        "/api/v1/applications",
        json={
            "user_id": str(user.id),
            "authority_id": str(authority.id),
            "subject": "Road repair records",
            "original_request": "Please share records for Main Street repairs.",
            "items": [
                {"question_text": "Provide the sanctioned estimate", "category": "finance"},
                {"question_text": "Provide the work order", "category": "procurement"},
            ],
        },
    )
    application_id = create_response.json()["id"]

    for event_type in (
        "VALIDATED",
        "READY_TO_FILE",
        "SUBMITTED",
        "ACKNOWLEDGED",
        "UNDER_PROCESSING",
    ):
        response = client.post(
            f"/api/v1/applications/{application_id}/events",
            json={"event_type": event_type, "actor_id": str(user.id)},
        )
        assert response.status_code == 201

    service.create_deadline(
        db_session,
        application_id=uuid.UUID(application_id),
        deadline_type=DeadlineType.RESPONSE,
        starts_at=NOW - timedelta(days=31),
        due_at=NOW - timedelta(days=1),
    )
    run_deadline_sweep(db_session, now=NOW)

    response = client.post(
        f"/api/v1/applications/{application_id}/events",
        json={"event_type": "FIRST_APPEAL_ELIGIBLE"},
    )
    assert response.status_code == 201

    return application_id


def test_get_and_file_first_appeal(client, db_session, make_user, make_authority):
    user = make_user()
    authority = make_authority()
    application_id = _create_first_appeal_eligible_application(client, db_session, user, authority)

    class FakeClient:
        def draft_appeal(self, **kwargs):
            return AppealDraftOutput(
                narrative="The applicant received no response within the statutory period.",
                open_items_summary=["Sanctioned estimate", "Work order"],
            )

    app.dependency_overrides[get_language_model_client] = lambda: FakeClient()

    draft_response = client.get(f"/api/v1/applications/{application_id}/appeal")
    assert draft_response.status_code == 200
    draft_body = draft_response.json()
    assert draft_body["grounds_citation"] == "Section 7(1) of the RTI Act, 2005"
    assert draft_body["appeal_window_citation"] == "Section 19(1) of the RTI Act, 2005"
    assert draft_body["original_request"] == "Please share records for Main Street repairs."
    assert len(draft_body["open_items"]) == 2
    assert draft_body["narrative"] == (
        "The applicant received no response within the statutory period."
    )
    assert draft_body["precedent_matches"] == []

    file_response = client.post(
        f"/api/v1/applications/{application_id}/appeal/file",
        json={"actor_id": str(user.id), "reason": draft_body["narrative"]},
    )
    assert file_response.status_code == 201
    file_body = file_response.json()
    assert file_body["appeal_type"] == "FIRST"
    assert file_body["status"] == "FILED"

    application_response = client.get(f"/api/v1/applications/{application_id}")
    assert application_response.json()["status"] == "FIRST_APPEAL_FILED"


def test_get_first_appeal_draft_before_eligibility_returns_409(client, make_user, make_authority):
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

    response = client.get(f"/api/v1/applications/{application_id}/appeal")

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "CONFLICT"


def test_file_first_appeal_before_eligibility_returns_409(client, make_user, make_authority):
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

    response = client.post(
        f"/api/v1/applications/{application_id}/appeal/file",
        json={"actor_id": str(user.id), "reason": "Too early."},
    )

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "ILLEGAL_TRANSITION"


def test_get_first_appeal_draft_unknown_application_returns_404(client):
    response = client.get(f"/api/v1/applications/{uuid.uuid4()}/appeal")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"
