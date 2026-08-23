from __future__ import annotations

import uuid

import pytest

from app.domain.ai.schemas import AnswerIntegrityOutput, DecomposedItem, ItemClassification
from app.domain.case_engine import service
from app.domain.case_engine.state_machine import ApplicationStatus, IllegalTransitionError
from app.domain.response_analysis import record_response
from app.models.enums import InformationItemStatus

RESPONSE_TEXT = (
    "The sanctioned estimate for the Main Street repair was Rs. 4,50,000, approved on "
    "12 March 2025. The work order has not yet been issued."
)


class FakeAnswerIntegrityClient:
    def __init__(self, classifications):
        self._classifications = classifications

    def classify_response(self, *, response_text, items):
        return AnswerIntegrityOutput(classifications=self._classifications)


def _create_under_processing_application_with_items(db_session, user, authority):
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
    return service.get_application(db_session, application.id)


def test_record_response_applies_classifications_and_transitions_to_response_received(
    db_session, make_user, make_authority
):
    user = make_user()
    authority = make_authority()
    application = _create_under_processing_application_with_items(db_session, user, authority)
    items = service.list_information_items(db_session, application.id)
    estimate_item, work_order_item = items

    ai_client = FakeAnswerIntegrityClient(
        [
            ItemClassification(
                item_id=estimate_item.id,
                status=InformationItemStatus.ANSWERED,
                evidence_excerpt="Rs. 4,50,000, approved on 12 March 2025",
                confidence=0.95,
            ),
            ItemClassification(
                item_id=work_order_item.id,
                status=InformationItemStatus.NOT_ANSWERED,
                evidence_excerpt=None,
                confidence=0.9,
            ),
        ]
    )

    updated = record_response(
        db_session,
        application_id=application.id,
        response_text=RESPONSE_TEXT,
        actor_id=user.id,
        ai_client=ai_client,
    )

    by_id = {item.id: item for item in updated}
    assert by_id[estimate_item.id].status == InformationItemStatus.ANSWERED
    assert by_id[estimate_item.id].evidence_excerpt == "Rs. 4,50,000, approved on 12 March 2025"
    assert by_id[work_order_item.id].status == InformationItemStatus.NOT_ANSWERED
    assert by_id[work_order_item.id].evidence_excerpt is None

    application = service.get_application(db_session, application.id)
    assert application.status == ApplicationStatus.RESPONSE_RECEIVED

    events = service.list_events(db_session, application.id)
    response_events = [e for e in events if e.event_type == "RESPONSE_RECEIVED"]
    assert len(response_events) == 1
    assert response_events[0].event_metadata == {"item_count": 2}


def test_record_response_downgrades_hallucinated_evidence_excerpt(
    db_session, make_user, make_authority
):
    user = make_user()
    authority = make_authority()
    application = _create_under_processing_application_with_items(db_session, user, authority)
    items = service.list_information_items(db_session, application.id)
    estimate_item, work_order_item = items

    ai_client = FakeAnswerIntegrityClient(
        [
            ItemClassification(
                item_id=estimate_item.id,
                status=InformationItemStatus.ANSWERED,
                evidence_excerpt="a figure the response never actually states",
                confidence=0.95,
            ),
            ItemClassification(
                item_id=work_order_item.id,
                status=InformationItemStatus.NOT_ANSWERED,
                evidence_excerpt=None,
                confidence=0.9,
            ),
        ]
    )

    updated = record_response(
        db_session,
        application_id=application.id,
        response_text=RESPONSE_TEXT,
        actor_id=user.id,
        ai_client=ai_client,
    )

    by_id = {item.id: item for item in updated}
    assert by_id[estimate_item.id].status == InformationItemStatus.POTENTIALLY_DEFICIENT
    assert by_id[estimate_item.id].evidence_excerpt is None
    # The other item's valid classification is unaffected by the first
    # item's hallucinated excerpt — the check is per-item, not batch-wide.
    assert by_id[work_order_item.id].status == InformationItemStatus.NOT_ANSWERED


def test_record_response_downgrades_empty_evidence_excerpt(db_session, make_user, make_authority):
    """An empty string is trivially "in" any text — a plain substring
    check alone would let this pass as verified evidence for nothing."""
    user = make_user()
    authority = make_authority()
    application = _create_under_processing_application_with_items(db_session, user, authority)
    estimate_item, _work_order_item = service.list_information_items(db_session, application.id)

    ai_client = FakeAnswerIntegrityClient(
        [
            ItemClassification(
                item_id=estimate_item.id,
                status=InformationItemStatus.ANSWERED,
                evidence_excerpt="   ",
                confidence=0.95,
            ),
        ]
    )

    updated = record_response(
        db_session,
        application_id=application.id,
        response_text=RESPONSE_TEXT,
        actor_id=user.id,
        ai_client=ai_client,
    )

    by_id = {item.id: item for item in updated}
    assert by_id[estimate_item.id].status == InformationItemStatus.POTENTIALLY_DEFICIENT
    assert by_id[estimate_item.id].evidence_excerpt is None


def test_record_response_ignores_classification_for_unknown_item_id(
    db_session, make_user, make_authority
):
    user = make_user()
    authority = make_authority()
    application = _create_under_processing_application_with_items(db_session, user, authority)
    items = service.list_information_items(db_session, application.id)

    ai_client = FakeAnswerIntegrityClient(
        [
            ItemClassification(
                item_id=uuid.uuid4(),
                status=InformationItemStatus.ANSWERED,
                evidence_excerpt=None,
                confidence=0.95,
            ),
        ]
    )

    updated = record_response(
        db_session,
        application_id=application.id,
        response_text=RESPONSE_TEXT,
        actor_id=user.id,
        ai_client=ai_client,
    )

    assert {item.status for item in updated} == {InformationItemStatus.PENDING}
    assert {item.id for item in updated} == {item.id for item in items}


def test_record_response_before_under_processing_is_rejected(db_session, make_user, make_authority):
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
        record_response(
            db_session,
            application_id=application.id,
            response_text=RESPONSE_TEXT,
            actor_id=user.id,
            ai_client=FakeAnswerIntegrityClient([]),
        )
