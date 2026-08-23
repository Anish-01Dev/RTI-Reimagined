from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.domain.case_engine import service as case_service
from app.repositories import deadlines as deadlines_repo


def run_deadline_sweep(db: Session, *, now: datetime | None = None) -> int:
    reference_time = now or datetime.now(UTC)
    applications = deadlines_repo.list_applications_with_due_active_response_deadlines(
        db, now=reference_time
    )
    for application in applications:
        case_service.record_event(
            db,
            application_id=application.id,
            event_type="NO_RESPONSE",
            actor_id=None,
            metadata={"trigger": "deadline_sweep"},
        )
    return len(applications)
