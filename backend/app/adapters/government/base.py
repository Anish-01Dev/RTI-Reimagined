"""Government provider adapter interface.

Decouples the rest of the system from any specific government RTI
integration. See docs/architecture/ARCHITECTURE.md.
"""

from typing import Protocol


class SubmissionResult:
    """Result of submitting an application to a government provider."""


class RTIStatus:
    """Current status of a case as reported by a government provider."""


class GovernmentResponse:
    """A response to an RTI application as reported by a government provider."""


class RTIApplication:
    """The outbound representation of an application ready for submission."""


class RTIProvider(Protocol):
    async def submit(self, application: RTIApplication) -> SubmissionResult: ...

    async def get_status(self, registration_number: str) -> RTIStatus: ...

    async def get_response(self, registration_number: str) -> GovernmentResponse: ...
