from __future__ import annotations

from alembic.config import Config
from sqlalchemy import create_engine, inspect, text

from alembic import command
from app.config import settings

MIGRATION_DB_NAME = "rti_reimagined_migration_test"
MIGRATION_DATABASE_URL = settings.database_url.rsplit("/", 1)[0] + f"/{MIGRATION_DB_NAME}"


def _drop_database() -> None:
    admin_url = settings.database_url.rsplit("/", 1)[0] + "/postgres"
    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
    try:
        with admin_engine.connect() as conn:
            conn.execute(
                text(
                    "SELECT pg_terminate_backend(pid) "
                    "FROM pg_stat_activity "
                    "WHERE datname = :name AND pid <> pg_backend_pid()"
                ),
                {"name": MIGRATION_DB_NAME},
            )
            conn.execute(text(f'DROP DATABASE IF EXISTS "{MIGRATION_DB_NAME}"'))
    finally:
        admin_engine.dispose()


def _create_database() -> None:
    admin_url = settings.database_url.rsplit("/", 1)[0] + "/postgres"
    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
    try:
        with admin_engine.connect() as conn:
            conn.execute(text(f'CREATE DATABASE "{MIGRATION_DB_NAME}"'))
    finally:
        admin_engine.dispose()


def test_information_items_migration_roundtrip(monkeypatch) -> None:
    _drop_database()
    _create_database()

    monkeypatch.setattr(settings, "database_url", MIGRATION_DATABASE_URL)
    config = Config("alembic.ini")
    config.set_main_option("sqlalchemy.url", MIGRATION_DATABASE_URL)
    engine = create_engine(MIGRATION_DATABASE_URL)
    try:
        command.upgrade(config, "head")
        assert "information_items" in inspect(engine).get_table_names()

        command.downgrade(config, "-1")
        assert "information_items" not in inspect(engine).get_table_names()

        command.upgrade(config, "head")
        schema = inspect(engine)
        assert "information_items" in schema.get_table_names()
        assert {column["name"] for column in schema.get_columns("information_items")} == {
            "id",
            "application_id",
            "sequence",
            "question_text",
            "category",
            "status",
            "evidence_excerpt",
            "created_at",
            "updated_at",
        }

        foreign_keys = schema.get_foreign_keys("information_items")
        application_foreign_key = next(
            foreign_key
            for foreign_key in foreign_keys
            if foreign_key["constrained_columns"] == ["application_id"]
        )
        assert application_foreign_key["referred_table"] == "applications"
        assert application_foreign_key["options"]["ondelete"] == "CASCADE"

        indexes = schema.get_indexes("information_items")
        assert {
            tuple(index["column_names"])
            for index in indexes
            if index["name"] == "ix_information_items_application_sequence"
        } == {("application_id", "sequence")}

        checks = schema.get_check_constraints("information_items")
        check_sql = " ".join(check["sqltext"] for check in checks)
        for status in (
            "PENDING",
            "ANSWERED",
            "PARTIALLY_ANSWERED",
            "NOT_ANSWERED",
            "POTENTIALLY_DEFICIENT",
        ):
            assert status in check_sql
    finally:
        engine.dispose()
        _drop_database()
