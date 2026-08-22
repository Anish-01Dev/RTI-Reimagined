"""Coverage plan for cross-account authorization.

- A user cannot read a case belonging to another user (expect 404).
- A user cannot transition or submit a case belonging to another user.
- An expired or invalid session token is rejected on every case-scoped route.
"""
