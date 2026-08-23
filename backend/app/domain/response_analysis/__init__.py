"""Answer Integrity Engine.

Classifies each open ledger item against a received government response as
answered, partially answered, missing, or potentially deficient, with a
supporting excerpt. record_response is the only code path allowed to write
information_items.status — see app.domain.case_engine.service for the
equivalent rule on applications.status.
"""

from app.domain.response_analysis.classifier import record_response

__all__ = ["record_response"]
