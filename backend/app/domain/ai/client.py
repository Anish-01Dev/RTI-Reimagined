from __future__ import annotations

import json
from typing import Any, Protocol
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from pydantic import ValidationError as PydanticValidationError

from app.config import Settings, settings
from app.domain.ai.schemas import AppealDraftOutput, ApplicationDoctorOutput
from app.domain.errors import ValidationError


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


class OpenAILanguageModelClient:
    def __init__(self, settings_: Settings = settings, model: str = "gpt-4.1-mini") -> None:
        self._api_key = settings_.language_model_api_key
        self._model = model

    def decompose_application(
        self, *, raw_text: str, jurisdiction_hint: str | None = None
    ) -> ApplicationDoctorOutput:
        if not self._api_key:
            raise ValidationError("Application Doctor is not configured")

        last_error: Exception | None = None
        for _ in range(2):
            try:
                data = self._request_application_doctor(raw_text, jurisdiction_hint)
                return ApplicationDoctorOutput.model_validate(data)
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

        raise ValidationError("Application Doctor returned invalid output") from last_error

    def _request_application_doctor(
        self, raw_text: str, jurisdiction_hint: str | None
    ) -> dict[str, Any]:
        schema = ApplicationDoctorOutput.model_json_schema()
        body = {
            "model": self._model,
            "messages": [
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
                        {
                            "raw_text": raw_text,
                            "jurisdiction_hint": jurisdiction_hint,
                        }
                    ),
                },
            ],
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": "application_doctor_output",
                    "strict": True,
                    "schema": schema,
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

    def draft_appeal(
        self,
        *,
        subject: str,
        original_request: str,
        registration_number: str | None,
        grounds_citation: str,
        open_items: list[dict[str, str | None]],
    ) -> AppealDraftOutput:
        if not self._api_key:
            raise ValidationError("Appeal Compiler is not configured")

        last_error: Exception | None = None
        for _ in range(2):
            try:
                data = self._request_appeal_draft(
                    subject=subject,
                    original_request=original_request,
                    registration_number=registration_number,
                    grounds_citation=grounds_citation,
                    open_items=open_items,
                )
                return AppealDraftOutput.model_validate(data)
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

        raise ValidationError("Appeal Compiler returned invalid output") from last_error

    def _request_appeal_draft(
        self,
        *,
        subject: str,
        original_request: str,
        registration_number: str | None,
        grounds_citation: str,
        open_items: list[dict[str, str | None]],
    ) -> dict[str, Any]:
        schema = AppealDraftOutput.model_json_schema()
        body = {
            "model": self._model,
            "messages": [
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
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": "appeal_draft_output",
                    "strict": True,
                    "schema": schema,
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
