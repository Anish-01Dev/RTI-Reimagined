"""Pydantic request/response schemas — the external input validation
boundary for app.api.v1. Domain and repository modules never see raw
request bodies; they only ever receive values already validated here."""
