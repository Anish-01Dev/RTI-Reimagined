"""Domain-level errors.

Raised by service/domain modules, which have no knowledge of HTTP. The API
layer (see app.api.v1) is responsible for translating these into the
appropriate response — see app.main's exception handlers. This keeps
"domain logic separate from HTTP route handlers" enforceable: a domain
function never needs to import fastapi to signal a specific outcome.
"""

from __future__ import annotations


class DomainError(Exception):
    """Base class for errors raised by domain/service modules."""


class NotFoundError(DomainError):
    """The referenced entity does not exist."""


class ConflictError(DomainError):
    """The requested operation conflicts with the current state of the data."""


class ValidationError(DomainError):
    """Input failed a domain-level validation rule."""
