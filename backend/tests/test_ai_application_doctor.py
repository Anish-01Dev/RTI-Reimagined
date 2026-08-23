from __future__ import annotations

import pytest
from pydantic import ValidationError as PydanticValidationError

from app.domain.ai.client import OpenAILanguageModelClient
from app.domain.ai.schemas import ApplicationDoctorOutput
from app.domain.errors import ValidationError


class _Settings:
    language_model_api_key = "test-key"


def test_application_doctor_schema_rejects_missing_required_field():
    with pytest.raises(PydanticValidationError):
        ApplicationDoctorOutput.model_validate(
            {
                "subject": "Road repair records",
                "items": [{"question_text": "Provide work orders", "category": "procurement"}],
            }
        )


def test_application_doctor_schema_rejects_empty_items():
    with pytest.raises(PydanticValidationError):
        ApplicationDoctorOutput.model_validate(
            {
                "subject": "Road repair records",
                "suggested_authority_query": "Public Works Department",
                "items": [],
            }
        )


def test_application_doctor_schema_rejects_extra_fields():
    with pytest.raises(PydanticValidationError):
        ApplicationDoctorOutput.model_validate(
            {
                "subject": "Road repair records",
                "suggested_authority_query": "Public Works Department",
                "items": [
                    {
                        "question_text": "Provide work orders",
                        "category": "procurement",
                        "authority_id": "not allowed",
                    }
                ],
            }
        )


def test_application_doctor_retries_invalid_output_once_then_raises_domain_error():
    class InvalidClient(OpenAILanguageModelClient):
        def __init__(self) -> None:
            super().__init__(_Settings())
            self.calls = 0

        def _request_application_doctor(self, raw_text, jurisdiction_hint):
            self.calls += 1
            return {
                "subject": "Road repair records",
                "suggested_authority_query": "Public Works Department",
                "items": [],
            }

    client = InvalidClient()

    with pytest.raises(ValidationError):
        client.decompose_application(raw_text="Need road repair records")

    assert client.calls == 2
