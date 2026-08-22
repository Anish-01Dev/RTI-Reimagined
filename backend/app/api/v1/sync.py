"""Offline operation queue sync endpoint."""

from fastapi import APIRouter

router = APIRouter(prefix="/sync", tags=["sync"])


@router.post("")
def apply_sync_batch():
    """Apply a queued, sequenced batch of offline operations idempotently."""
    raise NotImplementedError
