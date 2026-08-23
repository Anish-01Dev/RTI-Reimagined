"""Shared test fixtures.

Tests run against a real, separate Postgres database (`rti_reimagined_test`
on the same server as local dev, created on demand) rather than SQLite,
since the schema uses Postgres-specific JSONB columns and dialect
behaviour we want covered. Each test runs inside a SAVEPOINT that is
rolled back afterwards, so tests never see each other's data and don't pay
for a schema rebuild per test.
"""

from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings
from app.database import get_db
from app.main import app
from app.models.enums import AuthorityLevel, FilingChannel
from app.models.orm import Authority, Base, User

TEST_DB_NAME = "rti_reimagined_test"
TEST_DATABASE_URL = settings.database_url.rsplit("/", 1)[0] + f"/{TEST_DB_NAME}"


def _ensure_test_database() -> None:
    admin_url = settings.database_url.rsplit("/", 1)[0] + "/postgres"
    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
    try:
        with admin_engine.connect() as conn:
            exists = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": TEST_DB_NAME}
            ).first()
            if not exists:
                conn.execute(text(f'CREATE DATABASE "{TEST_DB_NAME}"'))
    finally:
        admin_engine.dispose()


@pytest.fixture(scope="session")
def test_engine():
    _ensure_test_database()
    engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield engine
    engine.dispose()


@pytest.fixture()
def db_session(test_engine) -> Session:
    connection = test_engine.connect()
    outer_tx = connection.begin()
    TestSessionLocal = sessionmaker(bind=connection, autoflush=False, autocommit=False)
    session = TestSessionLocal()

    nested = connection.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def _restart_savepoint(sess, trans):
        nonlocal nested
        if not nested.is_active:
            nested = connection.begin_nested()

    try:
        yield session
    finally:
        session.close()
        outer_tx.rollback()
        connection.close()


@pytest.fixture()
def client(db_session: Session) -> TestClient:
    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


@pytest.fixture()
def make_user(db_session: Session):
    def _make(**overrides) -> User:
        defaults = {"name": "Test Citizen", "email": f"{uuid.uuid4()}@example.com"}
        defaults.update(overrides)
        user = User(**defaults)
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    return _make


@pytest.fixture()
def make_authority(db_session: Session):
    def _make(**overrides) -> Authority:
        defaults = {
            "name": "Ministry of Testing",
            "type": AuthorityLevel.CENTRAL,
            "jurisdiction": "India",
            "filing_channel": FilingChannel.ONLINE,
            "is_active": True,
        }
        defaults.update(overrides)
        authority = Authority(**defaults)
        db_session.add(authority)
        db_session.commit()
        db_session.refresh(authority)
        return authority

    return _make
