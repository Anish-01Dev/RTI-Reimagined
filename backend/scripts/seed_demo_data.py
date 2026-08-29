"""Seed a fixed set of demo rows for the frontend demo/walkthrough.

Idempotent (safe to re-run): every row uses a deterministic UUID derived
from a fixed namespace, so re-running this script upserts rather than
duplicates. This exists solely to unblock the frontend demo — there is no
user-creation or authority-onboarding API yet (both are explicitly future
phases, see app/repositories/users.py and app/repositories/authorities.py),
so these rows are the only way the demo has a real user_id/authority_id to
call the real POST /applications endpoint with.

The demo citizen's UUID below is also hardcoded in
frontend/src/lib/demoIdentity.ts — the two must stay in sync since nothing
looks either up dynamically yet.
"""

from __future__ import annotations

import uuid

from app.database import SessionLocal
from app.models.enums import AuthorityLevel, FilingChannel
from app.models.orm import Authority, User

_NAMESPACE = uuid.UUID("6f1d2c6a-6b7a-4e3a-9c1a-2b7e3a9f0d11")


def _id(name: str) -> uuid.UUID:
    return uuid.uuid5(_NAMESPACE, name)


DEMO_USER_ID = _id("demo-citizen:priya-sharma")

AUTHORITIES: list[dict] = [
    {
        "id": _id("authority:pwd"),
        "name": "Public Works Department (PWD)",
        "type": AuthorityLevel.STATE,
        "jurisdiction": "State of Maharashtra",
        "state": "Maharashtra",
        "district": "Mumbai",
        "department": "Public Works",
    },
    {
        "id": _id("authority:moefcc"),
        "name": "Ministry of Environment, Forest and Climate Change",
        "type": AuthorityLevel.CENTRAL,
        "jurisdiction": "Central Government, New Delhi",
        "state": "Delhi",
        "district": "New Delhi",
        "department": "Environment, Forest and Climate Change",
    },
    {
        "id": _id("authority:mohua"),
        "name": "Ministry of Housing and Urban Affairs",
        "type": AuthorityLevel.CENTRAL,
        "jurisdiction": "Central Government, New Delhi",
        "state": "Delhi",
        "district": "New Delhi",
        "department": "Housing and Urban Affairs",
    },
    {
        "id": _id("authority:mha"),
        "name": "Ministry of Home Affairs",
        "type": AuthorityLevel.CENTRAL,
        "jurisdiction": "Central Government, New Delhi",
        "state": "Delhi",
        "district": "New Delhi",
        "department": "Home Affairs",
    },
    {
        "id": _id("authority:municipal-ward-42"),
        "name": "Municipal Corporation, Ward 42",
        "type": AuthorityLevel.STATE,
        "jurisdiction": "Municipal Corporation of Greater Mumbai",
        "state": "Maharashtra",
        "district": "Mumbai",
        "department": "Ward Office 42",
    },
    {
        "id": _id("authority:mou-delhi"),
        "name": "Ministry of Urban Development, Delhi",
        "type": AuthorityLevel.CENTRAL,
        "jurisdiction": "Government of NCT of Delhi",
        "state": "Delhi",
        "district": "New Delhi",
        "department": "Urban Development",
    },
]


def main() -> None:
    db = SessionLocal()
    try:
        user = db.get(User, DEMO_USER_ID)
        if user is None:
            db.add(
                User(
                    id=DEMO_USER_ID,
                    name="Priya Sharma",
                    phone="+919876543210",
                    email="priya.sharma@example.com",
                )
            )
            print(f"Created demo user {DEMO_USER_ID}")
        else:
            print(f"Demo user {DEMO_USER_ID} already exists")

        for row in AUTHORITIES:
            authority = db.get(Authority, row["id"])
            if authority is None:
                db.add(
                    Authority(
                        id=row["id"],
                        name=row["name"],
                        type=row["type"],
                        jurisdiction=row["jurisdiction"],
                        state=row["state"],
                        district=row["district"],
                        department=row["department"],
                        filing_channel=FilingChannel.ONLINE,
                        is_active=True,
                    )
                )
                print(f"Created authority {row['name']} ({row['id']})")
            else:
                print(f"Authority {row['name']} already exists")

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    main()
