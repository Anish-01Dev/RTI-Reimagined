# Threat Model

## Areas of Concern and Controls

| Area | Control |
|---|---|
| Insecure direct object reference | Every case-scoped endpoint verifies `case.user_id == current_user.id` before returning or mutating data, enforced through a single shared authorization check rather than per-endpoint logic. |
| Authentication | OTP-based login (email or phone), short-lived sessions, rate-limited verification attempts. |
| File upload | MIME-type verification (not extension alone), format allowlist, size limits, randomized storage keys, short-lived signed download URLs. |
| Replay | Sequenced, per-device operation log with a uniqueness constraint on `(device_id, sequence)`; signed operations carry an issuance timestamp and expiry. |
| Logging | Structured logs keyed by `case_id`, `request_id`, `user_id`, `action`, and `result`; no credentials, verification codes, or document contents are ever logged. |
| Prompt injection | Text extracted from uploaded documents is passed to the language-understanding layer as clearly delimited untrusted data, never concatenated into system instructions. |
| State machine integrity | Illegal transitions are rejected at the domain layer regardless of what the client requests, and logged. |
| Evidence tampering | Case certificates are signed (Ed25519); verification recomputes the canonical payload and signature independently of client-supplied claims. |

## Test Coverage Targets

- Authorization: a second account must not be able to read or modify another account's case (expired token, invalid token, cross-account access).
- State machine: direct requests for illegal transitions are rejected; guard conditions are enforced (for example, appeal filing is unreachable without prior eligibility).
- Replay: a previously applied sync operation is rejected on resubmission.
- Evidence: a valid certificate verifies; a modified payload or signature fails verification.
- Uploads: oversized files, mismatched MIME/extension pairs, and unauthorized download attempts are all rejected.
- Language-understanding layer: injected instructions embedded in document text do not alter extraction behavior.

## Data Handling

- No Aadhaar, PAN, or payment credential data is collected or stored.
- Signed case certificates carry only a case identifier, application hash, authority reference, issuance timestamp, and key identifier — never personal or document content.
- Authentication uses synthetic identity flows suitable for a non-production environment; no real government identity verification is integrated.
