"""Every error response uses the same {"error": {code, message},
"request_id"} envelope — including FastAPI's own request-parsing failures,
which bypass every app-level exception handler unless one is registered
for RequestValidationError specifically."""

from __future__ import annotations


def test_missing_required_field_uses_the_structured_error_envelope(client):
    response = client.post("/api/v1/applications", json={"subject": "Subject only"})

    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert "user_id" in body["error"]["message"]
    assert "request_id" in body


def test_invalid_uuid_path_parameter_uses_the_structured_error_envelope(client):
    response = client.get("/api/v1/applications/not-a-uuid")

    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert "request_id" in body
