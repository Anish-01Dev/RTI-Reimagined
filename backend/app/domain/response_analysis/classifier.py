"""Response-to-ledger classification (Answer Integrity).

record_response is the sole authorized path for writing
information_items.status: it loads the ledger, calls the AI classifier,
applies an anti-hallucination check to the result, and persists both the
per-item updates and the RESPONSE_RECEIVED transition in one transaction.
"""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.domain.ai.client import LanguageModelClient
from app.domain.case_engine import service, state_machine
from app.models.enums import InformationItemStatus
from app.models.orm import InformationItem


def record_response(
    db: Session,
    *,
    application_id: uuid.UUID,
    response_text: str,
    actor_id: uuid.UUID | None,
    ai_client: LanguageModelClient,
) -> list[InformationItem]:
    application = service.get_application(db, application_id)
    state_machine.validate_transition(
        application.status, state_machine.ApplicationStatus.RESPONSE_RECEIVED
    )

    items = service.list_information_items(db, application_id)
    item_by_id = {item.id: item for item in items}

    ai_output = ai_client.classify_response(
        response_text=response_text,
        items=[{"item_id": str(item.id), "question_text": item.question_text} for item in items],
    )

    for classification in ai_output.classifications:
        item = item_by_id.get(classification.item_id)
        if item is None:
            # The model referenced an item_id outside this ledger — it
            # cannot invent ledger items, so the classification is dropped
            # rather than applied.
            continue

        status = classification.status
        evidence_excerpt = classification.evidence_excerpt
        if evidence_excerpt is not None and evidence_excerpt not in response_text:
            # A quoted excerpt that isn't actually in the response text is a
            # hallucination — downgrade this item alone for human review
            # rather than trusting it or failing the whole batch.
            status = InformationItemStatus.POTENTIALLY_DEFICIENT
            evidence_excerpt = None

        item.status = status
        item.evidence_excerpt = evidence_excerpt

    service.record_event(
        db,
        application_id=application_id,
        event_type="RESPONSE_RECEIVED",
        actor_id=actor_id,
        metadata={"item_count": len(items)},
    )

    return service.list_information_items(db, application_id)
