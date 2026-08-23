from __future__ import annotations

import uuid

import pytest
from sqlalchemy import func, select

from app.domain.ai.schemas import DecomposedItem
from app.domain.case_engine import service
from app.domain.errors import NotFoundError
from app.models.enums import InformationItemStatus
from app.models.orm import ApplicationEvent, InformationItem, RTIApplication
from app.repositories import information_items as information_items_repo


def test_create_application_with_items_persists_ledger_and_draft_event(
    db_session, make_user, make_authority
):
    user = make_user()
    authority = make_authority()

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

    items = service.list_information_items(db_session, application.id)
    assert [item.sequence for item in items] == [1, 2]
    assert [item.question_text for item in items] == [
        "Provide the sanctioned estimate",
        "Provide the work order",
    ]
    assert {item.status for item in items} == {InformationItemStatus.PENDING}

    events = service.list_events(db_session, application.id)
    assert [event.event_type for event in events] == ["DRAFT_CREATED"]


def test_create_application_with_items_rolls_back_when_item_creation_fails(
    db_session, make_user, make_authority, monkeypatch
):
    user = make_user()
    authority = make_authority()
    original_create = information_items_repo.create
    calls = 0

    def flaky_create(db, item):
        nonlocal calls
        calls += 1
        if calls == 2:
            raise RuntimeError("simulated ledger write failure")
        return original_create(db, item)

    monkeypatch.setattr(information_items_repo, "create", flaky_create)

    with pytest.raises(RuntimeError):
        service.create_application_with_items(
            db_session,
            user_id=user.id,
            authority_id=authority.id,
            subject="Road repair records",
            original_request="Please provide repair records for Main Street.",
            items=[
                DecomposedItem(question_text="Provide the sanctioned estimate"),
                DecomposedItem(question_text="Provide the work order"),
            ],
        )

    application_count = db_session.execute(select(func.count()).select_from(RTIApplication))
    item_count = db_session.execute(select(func.count()).select_from(InformationItem))
    event_count = db_session.execute(select(func.count()).select_from(ApplicationEvent))
    assert application_count.scalar_one() == 0
    assert item_count.scalar_one() == 0
    assert event_count.scalar_one() == 0


def test_create_application_with_items_unknown_authority_leaves_no_partial_rows(
    db_session, make_user
):
    user = make_user()

    with pytest.raises(NotFoundError):
        service.create_application_with_items(
            db_session,
            user_id=user.id,
            authority_id=uuid.uuid4(),
            subject="Road repair records",
            original_request="Please provide repair records for Main Street.",
            items=[DecomposedItem(question_text="Provide the work order")],
        )

    application_count = db_session.execute(select(func.count()).select_from(RTIApplication))
    item_count = db_session.execute(select(func.count()).select_from(InformationItem))
    assert application_count.scalar_one() == 0
    assert item_count.scalar_one() == 0


def test_list_information_items_requires_existing_application(db_session):
    with pytest.raises(NotFoundError):
        service.list_information_items(db_session, uuid.uuid4())
