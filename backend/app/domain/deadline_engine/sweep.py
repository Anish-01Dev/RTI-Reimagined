"""Deadline sweep: finds applications whose RESPONSE deadline has lapsed
with no response and transitions each to NO_RESPONSE.

Each application's transition is independent and isolated — one failing
(most plausibly an overlapping sweep run that already transitioned it)
must not abort the rest of the batch, since the whole point of a sweep
that runs repeatedly is that a single stale row shouldn't stall every
other application behind it until the next tick.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.domain.case_engine import service as case_service
from app.domain.case_engine.state_machine import IllegalTransitionError
from app.repositories import deadlines as deadlines_repo

logger = logging.getLogger("rti.deadline_sweep")


def run_deadline_sweep(db: Session, *, now: datetime | None = None) -> int:
    reference_time = now or datetime.now(UTC)
    applications = deadlines_repo.list_applications_with_due_active_response_deadlines(
        db, now=reference_time
    )

    transitioned = 0
    for application in applications:
        try:
            case_service.record_event(
                db,
                application_id=application.id,
                event_type="NO_RESPONSE",
                actor_id=None,
                metadata={"trigger": "deadline_sweep"},
            )
            transitioned += 1
        except IllegalTransitionError:
            logger.warning(
                "Deadline sweep skipped application %s: no longer eligible for NO_RESPONSE",
                application.id,
            )
    return transitioned
