from __future__ import annotations

import uuid

import pytest
from pydantic import ValidationError as PydanticValidationError

from app.domain.ai.client import OpenAILanguageModelClient, _to_strict_schema
from app.domain.ai.schemas import AnswerIntegrityOutput, AppealDraftOutput, ApplicationDoctorOutput
from app.domain.errors import ValidationError

_UNSUPPORTED_STRICT_SCHEMA_KEYWORDS = (
    "minLength",
    "maxLength",
    "minItems",
    "maxItems",
    "minimum",
    "maximum",
    "exclusiveMinimum",
    "exclusiveMaximum",
    "format",
)


class _Settings:
    language_model_api_key = "test-key"


def _assert_strict_schema_compliant(node) -> None:
    """Every object node must list all of its properties as required, and
    none of OpenAI strict mode's unsupported keywords may appear anywhere
    in the tree — the two hard requirements _to_strict_schema exists to
    satisfy (see app.domain.ai.client)."""
    if isinstance(node, dict):
        for keyword in _UNSUPPORTED_STRICT_SCHEMA_KEYWORDS:
            assert keyword not in node
        if node.get("type") == "object" and "properties" in node:
            assert set(node["properties"]) == set(node.get("required", []))
        for value in node.values():
            _assert_strict_schema_compliant(value)
    elif isinstance(node, list):
        for item in node:
            _assert_strict_schema_compliant(item)


@pytest.mark.parametrize(
    "response_schema", [ApplicationDoctorOutput, AppealDraftOutput, AnswerIntegrityOutput]
)
def test_to_strict_schema_is_openai_strict_mode_compliant(response_schema):
    _assert_strict_schema_compliant(_to_strict_schema(response_schema.model_json_schema()))


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

        def _request_structured(self, **kwargs):
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

        def _request_structured(self, **kwargs):
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


def test_answer_integrity_schema_rejects_pending_status():
    with pytest.raises(PydanticValidationError):
        AnswerIntegrityOutput.model_validate(
            {
                "classifications": [
                    {
                        "item_id": str(uuid.uuid4()),
                        "status": "PENDING",
                        "evidence_excerpt": None,
                        "confidence": 0.9,
                    }
                ]
            }
        )


def test_answer_integrity_schema_rejects_excerpt_on_not_answered():
    with pytest.raises(PydanticValidationError):
        AnswerIntegrityOutput.model_validate(
            {
                "classifications": [
                    {
                        "item_id": str(uuid.uuid4()),
                        "status": "NOT_ANSWERED",
                        "evidence_excerpt": "The work order is attached.",
                        "confidence": 0.9,
                    }
                ]
            }
        )


def test_answer_integrity_schema_rejects_unknown_confidence_range():
    with pytest.raises(PydanticValidationError):
        AnswerIntegrityOutput.model_validate(
            {
                "classifications": [
                    {
                        "item_id": str(uuid.uuid4()),
                        "status": "ANSWERED",
                        "evidence_excerpt": "The work order is attached.",
                        "confidence": 1.5,
                    }
                ]
            }
        )


def test_answer_integrity_retries_invalid_output_once_then_raises_domain_error():
    class InvalidClient(OpenAILanguageModelClient):
        def __init__(self) -> None:
            super().__init__(_Settings())
            self.calls = 0

        def _request_structured(self, **kwargs):
            self.calls += 1
            return {"classifications": [{"item_id": "not-a-uuid", "status": "ANSWERED"}]}

    client = InvalidClient()

    with pytest.raises(ValidationError):
        client.classify_response(
            response_text="The work order is attached.",
            items=[{"item_id": str(uuid.uuid4()), "question_text": "Provide the work order"}],
        )

    assert client.calls == 2
