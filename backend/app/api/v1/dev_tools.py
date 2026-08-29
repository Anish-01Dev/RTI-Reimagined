"""Demo/dev-only utility endpoints — never mounted in production.

The RTI Act's 30-day response clock is real wall-clock time (see
app.domain.deadline_engine.rules.standard_response_due); nothing else in
this codebase can fast-forward it, and the deadline sweep
(app.domain.deadline_engine.sweep.run_deadline_sweep) only acts on
deadlines that have already lapsed. For a live walkthrough of the
NO_RESPONSE -> First Appeal path, something has to backdate a deadline so
the sweep has something real to act on — this endpoint is that something,
and nothing more: it does not fabricate a transition, it makes the
existing sweep logic apply to a deadline that would otherwise take 30
real days to lapse.

Guarded by settings.environment so it can never be reachable from a
production deployment (see app.main, which only mounts this router when
that guard passes).
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.domain.case_engine import service
from app.domain.deadline_engine import run_deadline_sweep
from app.domain.errors import ConflictError
from app.models.enums import DeadlineStatus, DeadlineType
from app.repositories import deadlines as deadlines_repo

router = APIRouter(prefix="/dev", tags=["dev-tools"])

DbSession = Annotated[Session, Depends(get_db)]


@router.post("/applications/{application_id}/simulate-deadline-miss")
def simulate_deadline_miss(application_id: uuid.UUID, db: DbSession) -> dict:
    application = service.get_application(db, application_id)
    deadline = deadlines_repo.get_latest_by_type(db, application_id, DeadlineType.RESPONSE)
    if deadline is None or deadline.status != DeadlineStatus.ACTIVE:
        raise ConflictError(f"Application {application_id} has no active response deadline to miss")

    deadline.due_at = datetime.now(UTC) - timedelta(minutes=1)
    db.commit()

    transitioned = run_deadline_sweep(db)
    db.refresh(application)
    return {"transitioned": transitioned, "status": application.status}
