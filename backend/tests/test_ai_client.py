from __future__ import annotations

import pytest
from pydantic import ValidationError as PydanticValidationError

from app.domain.ai.client import OpenAILanguageModelClient
from app.domain.ai.schemas import AppealDraftOutput, ApplicationDoctorOutput
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


def test_appeal_draft_schema_rejects_missing_required_field():
    with pytest.raises(PydanticValidationError):
        AppealDraftOutput.model_validate({"open_items_summary": ["Work order"]})


def test_appeal_draft_schema_rejects_extra_fields():
    with pytest.raises(PydanticValidationError):
        AppealDraftOutput.model_validate(
            {
                "narrative": "No response was received.",
                "open_items_summary": [],
                "statutory_citation": "Section 7(1)",
            }
        )


def test_appeal_draft_retries_invalid_output_once_then_raises_domain_error():
    class InvalidClient(OpenAILanguageModelClient):
        def __init__(self) -> None:
            super().__init__(_Settings())
            self.calls = 0

        def _request_appeal_draft(self, **kwargs):
            self.calls += 1
            return {"open_items_summary": ["Work order"]}

    client = InvalidClient()

    with pytest.raises(ValidationError):
        client.draft_appeal(
            subject="Road repair records",
            original_request="Please provide repair records.",
            registration_number=None,
            grounds_citation="Section 7(1) of the RTI Act, 2005",
            open_items=[{"question_text": "Provide the work order", "category": None}],
        )

    assert client.calls == 2
