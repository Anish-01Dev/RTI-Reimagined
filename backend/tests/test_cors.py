"""Confirms the frontend can actually call the API from a browser."""

from __future__ import annotations


def test_allowed_frontend_origin_receives_cors_headers(client):
    response = client.get("/health", headers={"Origin": "http://localhost:5173"})

    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_preflight_request_from_allowed_origin_is_approved(client):
    response = client.options(
        "/api/v1/applications",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_disallowed_origin_does_not_receive_cors_headers(client):
    response = client.get("/health", headers={"Origin": "http://evil.example"})

    assert "access-control-allow-origin" not in response.headers
