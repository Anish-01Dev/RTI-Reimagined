# Rules

Versioned, data-driven rule sets consumed by the backend rules engine (`backend/app/domain/rules_engine`). Keeping these as data rather than inline code allows jurisdiction, deadline, exemption, and appeal rules to be reviewed and updated independently of application logic.

- `authorities/` — known public authorities and jurisdiction-resolution data.
- `deadlines/` — statutory deadline definitions by request type.
- `exemptions/` — Section 8 exemption-risk detection patterns.
- `appeal/` — appeal eligibility and drafting templates.
