"""Case lifecycle endpoints.

See docs/architecture/API_CONTRACT.md and docs/architecture/STATE_MACHINE.md.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/cases", tags=["cases"])


@router.post("")
def create_case():
    """Create a new draft case from citizen input."""
    raise NotImplementedError


@router.get("/{case_id}")
def get_case(case_id: str):
    """Retrieve case detail. Must enforce ownership before returning data."""
    raise NotImplementedError


@router.get("/{case_id}/timeline")
def get_case_timeline(case_id: str):
    """Retrieve the event history for a case, derived from case_events."""
    raise NotImplementedError


@router.post("/{case_id}/events")
def request_case_transition(case_id: str):
    """Request a state transition. See STATE_MACHINE.md for the transition table."""
    raise NotImplementedError


@router.post("/{case_id}/submit")
def submit_case(case_id: str):
    """Submit a validated, citizen-approved application."""
    raise NotImplementedError


@router.get("/{case_id}/certificate")
def get_case_certificate(case_id: str):
    """Retrieve the signed case certificate for a case."""
    raise NotImplementedError
