# Crypto

Signing and verification utilities for case evidence certificates, consumed by `backend/app/domain/evidence`.

- `signing/` — Ed25519 signing of canonical certificate payloads.
- `verification/` — independent verification of signed payloads, used by the public `/evidence/verify` endpoint.

See [`../docs/architecture/ARCHITECTURE.md`](../docs/architecture/ARCHITECTURE.md) for the certificate payload structure.
