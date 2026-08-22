"""Evidence certificate verification endpoint.

Certificate retrieval lives on the case resource itself — see
GET /cases/{case_id}/certificate in cases.py. This router only covers
verification, which is intentionally public and resource-independent.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/evidence", tags=["evidence"])


@router.post("/verify")
def verify_certificate():
    """Verify a certificate payload. Intentionally unauthenticated."""
    raise NotImplementedError
