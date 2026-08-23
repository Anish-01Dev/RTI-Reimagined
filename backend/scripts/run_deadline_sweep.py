from __future__ import annotations

from app.database import SessionLocal
from app.domain.deadline_engine import run_deadline_sweep


def main() -> None:
    db = SessionLocal()
    try:
        transitioned = run_deadline_sweep(db)
    finally:
        db.close()
    print(f"Transitioned {transitioned} application(s) to NO_RESPONSE")


if __name__ == "__main__":
    main()
