"""Authentication, authorization, rate limiting, and audit logging.

Provides the shared ownership check used by every case-scoped endpoint,
OTP-based authentication with rate limiting, and structured audit log
writes. See docs/security/THREAT_MODEL.md.
"""
