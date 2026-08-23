from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy.exc import IntegrityError

from app.domain.ai.schemas import AppealDraftOutput, DecomposedItem
from app.domain.appeal_engine import GROUNDS_CITATION, compile_first_appeal_draft
from app.domain.case_engine import service
from app.domain.case_engine.state_machine import ApplicationStatus, IllegalTransitionError
from app.domain.deadline_engine import run_deadline_sweep
from app.domain.errors import ConflictError
from app.models.enums import AppealStatus, AppealType, DeadlineType, InformationItemStatus
from app.models.orm import Appeal

NOW = datetime(2026, 2, 1, 12, 0, tzinfo=UTC)


class FakeAppealClient:
    def draft_appeal(self, **kwargs):
        return AppealDraftOutput(
            narrative="The applicant received no response within the statutory period.",
            open_items_summary=["Sanctioned estimate", "Work order"],
        )


def _make_first_appeal_eligible_application(db_session, user, authority):
    application = service.create_application_with_items(
        db_session,
        user_id=user.id,
        authority_id=authority.id,
        subject="Road repair records",
        original_request="Please provide repair records for Main Street.",
        items=[
            DecomposedItem(question_text="Provide the sanctioned estimate", category="finance"),
            DecomposedItem(question_text="Provide the work order", category="procurement"),
        ],
    )
    for event_type in (
        "VALIDATED",
        "READY_TO_FILE",
        "SUBMITTED",
        "ACKNOWLEDGED",
        "UNDER_PROCESSING",
    ):
        service.record_event(
            db_session, application_id=application.id, event_type=event_type, actor_id=user.id
        )
    service.create_deadline(
        db_session,
        application_id=application.id,
        deadline_type=DeadlineType.RESPONSE,
        starts_at=NOW - timedelta(days=31),
        due_at=NOW - timedelta(days=1),
    )
    run_deadline_sweep(db_session, now=NOW)
    service.record_event(
        db_session, application_id=application.id, event_type="FIRST_APPEAL_ELIGIBLE", actor_id=None
    )
    return service.get_application(db_session, application.id)


def test_compile_first_appeal_draft_names_open_items_and_deterministic_citations(
    db_session, make_user, make_authority
):
    user = make_user()
    authority = make_authority()
    application = _make_first_appeal_eligible_application(db_session, user, authority)

    draft = compile_first_appeal_draft(
        db_session, application_id=application.id, ai_client=FakeAppealClient()
    )

    assert draft.grounds_citation == GROUNDS_CITATION["NO_RESPONSE"]
    assert draft.appeal_window_citation == "Section 19(1) of the RTI Act, 2005"
    assert draft.original_request == "Please provide repair records for Main Street."
    assert [item.question_text for item in draft.open_items] == [
        "Provide the sanctioned estimate",
        "Provide the work order",
    ]
    assert draft.narrative == "The applicant received no response within the statutory period."
    assert draft.open_items_summary == ["Sanctioned estimate", "Work order"]
    assert draft.response_due_at == NOW - timedelta(days=1)


def test_compile_first_appeal_draft_excludes_answered_items(db_session, make_user, make_authority):
    user = make_user()
    authority = make_authority()
    application = _make_first_appeal_eligible_application(db_session, user, authority)
    items = service.list_information_items(db_session, application.id)
    items[0].status = InformationItemStatus.ANSWERED
    db_session.commit()

    draft = compile_first_appeal_draft(
        db_session, application_id=application.id, ai_client=FakeAppealClient()
    )

    assert [item.question_text for item in draft.open_items] == ["Provide the work order"]


def test_compile_first_appeal_draft_before_eligibility_raises_conflict(
    db_session, make_user, make_authority
):
    user = make_user()
    authority = make_authority()
    application = service.create_application(
        db_session,
        user_id=user.id,
        authority_id=authority.id,
        subject="Road repair records",
        original_request="Please provide repair records for Main Street.",
    )

    with pytest.raises(ConflictError):
        compile_first_appeal_draft(
            db_session, application_id=application.id, ai_client=FakeAppealClient()
        )


def test_file_first_appeal_transitions_and_creates_appeal_row(
    db_session, make_user, make_authority
):
    user = make_user()
    authority = make_authority()
    application = _make_first_appeal_eligible_application(db_session, user, authority)

    appeal = service.file_first_appeal(
        db_session,
        application_id=application.id,
        actor_id=user.id,
        reason="No response was received within the statutory period.",
    )

    assert appeal.appeal_type == AppealType.FIRST
    assert appeal.status == AppealStatus.FILED
    assert appeal.submitted_at is not None
    assert service.get_application(db_session, application.id).status == (
        ApplicationStatus.FIRST_APPEAL_FILED
    )

    events = service.list_events(db_session, application.id)
    filed_events = [event for event in events if event.event_type == "FIRST_APPEAL_FILED"]
    assert len(filed_events) == 1
    assert filed_events[0].event_metadata == {"appeal_id": str(appeal.id)}


def test_appeals_table_rejects_a_second_first_appeal_for_the_same_application(
    db_session, make_user, make_authority
):
    """Guards the race where two concurrent POST /appeal/file requests both
    pass file_first_appeal's application-level check before either commits
    — the unique constraint is what actually prevents a second Appeal row
    from persisting, independent of request timing."""
    user = make_user()
    authority = make_authority()
    application = _make_first_appeal_eligible_application(db_session, user, authority)
    service.file_first_appeal(
        db_session, application_id=application.id, actor_id=user.id, reason="First filing."
    )

    racing_appeal = Appeal(
        application_id=application.id,
        appeal_type=AppealType.FIRST,
        reason="A second, racing filing for the same application.",
        status=AppealStatus.FILED,
    )
    db_session.add(racing_appeal)
    with pytest.raises(IntegrityError):
        db_session.commit()


def test_file_first_appeal_before_eligibility_is_rejected(db_session, make_user, make_authority):
    user = make_user()
    authority = make_authority()
    application = service.create_application(
        db_session,
        user_id=user.id,
        authority_id=authority.id,
        subject="Road repair records",
        original_request="Please provide repair records for Main Street.",
    )

    with pytest.raises(IllegalTransitionError):
        service.file_first_appeal(
            db_session, application_id=application.id, actor_id=user.id, reason="Too early."
        )


def test_compile_first_appeal_draft_has_no_precedent_matches_without_evidence(
    db_session, make_user, make_authority
):
    user = make_user()
    authority = make_authority()
    application = _make_first_appeal_eligible_application(db_session, user, authority)

    draft = compile_first_appeal_draft(
        db_session, application_id=application.id, ai_client=FakeAppealClient()
    )

    assert draft.precedent_matches == []


def test_compile_first_appeal_draft_matches_precedent_from_evidence_excerpt(
    db_session, make_user, make_authority
):
    user = make_user()
    authority = make_authority()
    application = _make_first_appeal_eligible_application(db_session, user, authority)
    items = service.list_information_items(db_session, application.id)
    items[0].status = InformationItemStatus.POTENTIALLY_DEFICIENT
    items[0].evidence_excerpt = "Withheld as personal information under 8(1)(j)."
    db_session.commit()

    draft = compile_first_appeal_draft(
        db_session, application_id=application.id, ai_client=FakeAppealClient()
    )

    assert len(draft.precedent_matches) == 1
    match = draft.precedent_matches[0]
    assert match.item_id == items[0].id
    assert match.section == "Section 8(1)(j)"
