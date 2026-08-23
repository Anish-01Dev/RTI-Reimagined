"""Evidence Layer.

Signs and verifies case certificates using Ed25519. Certificate payloads
are minimal by design (case identifier, application hash, authority,
issuance timestamp, key identifier) and never contain personal or
document data. See docs/architecture/ARCHITECTURE.md.
"""

from app.domain.evidence.certificate import (
    Certificate,
    VerificationResult,
    issue_certificate,
    verify_certificate,
)

__all__ = ["Certificate", "VerificationResult", "issue_certificate", "verify_certificate"]
