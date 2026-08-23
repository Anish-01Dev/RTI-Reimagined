"""First Appeal compilation.

Combines deterministic case facts (registration number, dates, statutory
citation — selected by the triggering event, never by the model) with an
AI-drafted narrative into the object the citizen reviews before filing.
Nothing here writes to `applications` — see
app.domain.case_engine.service.file_first_appeal for the citizen-approved
filing step.
"""

from __future__ import annotations

import dataclasses
import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from app.domain.ai.client import LanguageModelClient
from app.domain.case_engine import service
from app.domain.case_engine.state_machine import ApplicationStatus
from app.domain.errors import ConflictError
from app.models.enums import DeadlineType
from app.models.orm import InformationItem
from app.repositories import deadlines as deadlines_repo

APPEAL_WINDOW_CITATION = "Section 19(1) of the RTI Act, 2005"

# The event that made a case appeal-eligible determines the substantive
# ground cited — both currently resolve to the s.7(1) disposal obligation
# (a lapsed deadline and an incomplete disposal are both a failure to
# furnish the information within the statutory period).
GROUNDS_CITATION: dict[str, str] = {
    "NO_RESPONSE": "Section 7(1) of the RTI Act, 2005",
    "INCOMPLETE_RESPONSE": "Section 7(1) of the RTI Act, 2005",
}

_ELIGIBLE_STATUSES = frozenset(
    {
        ApplicationStatus.FIRST_APPEAL_ELIGIBLE,
        ApplicationStatus.FIRST_APPEAL_FILED,
        ApplicationStatus.SECOND_APPEAL_ELIGIBLE,
        ApplicationStatus.COMPLETED,
    }
)


@dataclasses.dataclass
class AppealDraft:
    application_id: uuid.UUID
    registration_number: str | None
    subject: str
    original_request: str
    filed_at: datetime | None
    response_due_at: datetime | None
    grounds_citation: str
    appeal_window_citation: str
    open_items: list[InformationItem]
    narrative: str
    open_items_summary: list[str]


def compile_first_appeal_draft(
    db: Session, *, application_id: uuid.UUID, ai_client: LanguageModelClient
) -> AppealDraft:
    application = service.get_application(db, application_id)
    if application.status not in _ELIGIBLE_STATUSES:
        raise ConflictError(f"Application {application_id} is not yet eligible for a first appeal")

    grounds_citation = GROUNDS_CITATION[_grounds_trigger(db, application_id)]
    open_items = service.list_open_information_items(db, application_id)
    response_deadline = deadlines_repo.get_latest_by_type(db, application_id, DeadlineType.RESPONSE)

    ai_output = ai_client.draft_appeal(
        subject=application.subject,
        original_request=application.original_request,
        registration_number=application.registration_number,
        grounds_citation=grounds_citation,
        open_items=[
            {"question_text": item.question_text, "category": item.category} for item in open_items
        ],
    )

    return AppealDraft(
        application_id=application.id,
        registration_number=application.registration_number,
        subject=application.subject,
        original_request=application.original_request,
        filed_at=application.submitted_at,
        response_due_at=response_deadline.due_at if response_deadline else None,
        grounds_citation=grounds_citation,
        appeal_window_citation=APPEAL_WINDOW_CITATION,
        open_items=open_items,
        narrative=ai_output.narrative,
        open_items_summary=ai_output.open_items_summary,
    )


def _grounds_trigger(db: Session, application_id: uuid.UUID) -> str:
    """The event that made this case appeal-eligible — status has usually
    moved on by the time the appeal is compiled, so this is read from
    history rather than the application's current status."""
    events = service.list_events(db, application_id)
    for event in reversed(events):
        if event.event_type in GROUNDS_CITATION:
            return event.event_type
    raise ConflictError(f"Application {application_id} has no recorded appeal trigger")
