from __future__ import annotations

import json
from typing import Any, Protocol, TypeVar
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from pydantic import BaseModel
from pydantic import ValidationError as PydanticValidationError

from app.config import Settings, settings
from app.domain.ai.schemas import (
    AnswerIntegrityOutput,
    AppealDraftOutput,
    ApplicationDoctorOutput,
)
from app.domain.errors import ValidationError

T = TypeVar("T", bound=BaseModel)

# Keywords Pydantic emits that OpenAI's structured-output strict mode
# doesn't support. Dropping them here only affects what's sent to the
# model — every response is still validated against the full, unmodified
# Pydantic schema afterward, so no actual constraint is weakened.
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


def _to_strict_schema(schema: Any) -> Any:
    """Rewrite a Pydantic-generated JSON schema to satisfy OpenAI strict
    mode's two hard requirements: every property is listed in `required`
    (optionality is expressed through the type union, not omission), and
    only a limited keyword subset is accepted."""
    if isinstance(schema, dict):
        rewritten = {
            key: _to_strict_schema(value)
            for key, value in schema.items()
            if key not in _UNSUPPORTED_STRICT_SCHEMA_KEYWORDS
        }
        if rewritten.get("type") == "object" and "properties" in rewritten:
            rewritten["required"] = list(rewritten["properties"].keys())
        return rewritten
    if isinstance(schema, list):
        return [_to_strict_schema(item) for item in schema]
    return schema


class LanguageModelClient(Protocol):
    def decompose_application(
        self, *, raw_text: str, jurisdiction_hint: str | None = None
    ) -> ApplicationDoctorOutput: ...

    def draft_appeal(
        self,
        *,
        subject: str,
        original_request: str,
        registration_number: str | None,
        grounds_citation: str,
        open_items: list[dict[str, str | None]],
    ) -> AppealDraftOutput: ...

    def classify_response(
        self, *, response_text: str, items: list[dict[str, str]]
    ) -> AnswerIntegrityOutput: ...


class OpenAILanguageModelClient:
    def __init__(self, settings_: Settings = settings, model: str = "gpt-4.1-mini") -> None:
        self._api_key = settings_.language_model_api_key
        self._model = model

    def decompose_application(
        self, *, raw_text: str, jurisdiction_hint: str | None = None
    ) -> ApplicationDoctorOutput:
        return self._complete_structured(
            feature_name="Application Doctor",
            response_schema=ApplicationDoctorOutput,
            schema_name="application_doctor_output",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Decompose an RTI application into atomic information ledger items. "
                        "Return only schema-valid JSON. The life or liberty flag and exemption "
                        "risk notes are citizen-review suggestions only."
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        {"raw_text": raw_text, "jurisdiction_hint": jurisdiction_hint}
                    ),
                },
            ],
        )

    def draft_appeal(
        self,
        *,
        subject: str,
        original_request: str,
        registration_number: str | None,
        grounds_citation: str,
        open_items: list[dict[str, str | None]],
    ) -> AppealDraftOutput:
        return self._complete_structured(
            feature_name="Appeal Compiler",
            response_schema=AppealDraftOutput,
            schema_name="appeal_draft_output",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Draft the narrative grounds for a First Appeal under the RTI Act, 2005, "
                        "using only the facts provided. The statutory citation is given to you as "
                        "a fact, not a choice — include it in the narrative exactly as given, and "
                        "never cite a different section. Reference only the open items listed; "
                        "never invent a fact, date, or item not present in the input. Return only "
                        "schema-valid JSON."
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        {
                            "subject": subject,
                            "original_request": original_request,
                            "registration_number": registration_number,
                            "grounds_citation": grounds_citation,
                            "open_items": open_items,
                        }
                    ),
                },
            ],
        )

    def classify_response(
        self, *, response_text: str, items: list[dict[str, str]]
    ) -> AnswerIntegrityOutput:
        return self._complete_structured(
            feature_name="Answer Integrity",
            response_schema=AnswerIntegrityOutput,
            schema_name="answer_integrity_output",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Classify how completely an official RTI response covers each open "
                        "ledger item. Return exactly one classification per item_id given, using "
                        "only the item_ids provided — never invent one. evidence_excerpt must be "
                        "a verbatim substring of response_text, and must be omitted entirely when "
                        "an item was not answered at all. Return only schema-valid JSON."
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps({"response_text": response_text, "items": items}),
                },
            ],
        )

    def _complete_structured(
        self,
        *,
        feature_name: str,
        response_schema: type[T],
        schema_name: str,
        messages: list[dict[str, str]],
    ) -> T:
        if not self._api_key:
            raise ValidationError(f"{feature_name} is not configured")

        last_error: Exception | None = None
        for _ in range(2):
            try:
                data = self._request_structured(
                    response_schema=response_schema, schema_name=schema_name, messages=messages
                )
                return response_schema.model_validate(data)
            except (
                PydanticValidationError,
                json.JSONDecodeError,
                KeyError,
                IndexError,
                TypeError,
            ) as exc:
                last_error = exc
            except (HTTPError, URLError, TimeoutError) as exc:
                last_error = exc
                break

        raise ValidationError(f"{feature_name} returned invalid output") from last_error

    def _request_structured(
        self, *, response_schema: type[BaseModel], schema_name: str, messages: list[dict[str, str]]
    ) -> dict[str, Any]:
        body = {
            "model": self._model,
            "messages": messages,
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": schema_name,
                    "strict": True,
                    "schema": _to_strict_schema(response_schema.model_json_schema()),
                },
            },
        }
        request = Request(
            "https://api.openai.com/v1/chat/completions",
            data=json.dumps(body).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self._api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urlopen(request, timeout=30) as response:
            payload = json.loads(response.read().decode("utf-8"))

        content = payload["choices"][0]["message"]["content"]
        return json.loads(content)


language_model_client: LanguageModelClient = OpenAILanguageModelClient()
