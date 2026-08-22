# API Contract

Base path: `/api/v1`. All endpoints require authentication except `POST /evidence/verify`, which is intentionally public — verification must not require an account.

## Cases

| Method | Path | Description |
|---|---|---|
| `POST` | `/cases` | Create a new draft case from citizen input |
| `GET` | `/cases/{id}` | Retrieve case detail |
| `GET` | `/cases/{id}/timeline` | Retrieve the event history for a case |
| `POST` | `/cases/{id}/questions` | Add or update a case's questions |
| `POST` | `/cases/{id}/events` | Request a state transition (see `STATE_MACHINE.md`) |
| `POST` | `/cases/{id}/submit` | Submit a validated, citizen-approved application |

## Response Analysis

| Method | Path | Description |
|---|---|---|
| `POST` | `/cases/{id}/response` | Record a received government response |
| `GET` | `/cases/{id}/response/coverage` | Retrieve the question-by-question coverage matrix |
| `POST` | `/cases/{id}/response/items/{item_id}/override` | Confirm or override a coverage classification |

## Appeals

| Method | Path | Description |
|---|---|---|
| `POST` | `/cases/{id}/appeal/draft` | Generate a draft appeal from eligibility and coverage-gap data |
| `POST` | `/cases/{id}/appeal/file` | File a citizen-approved appeal |

## Evidence

| Method | Path | Description |
|---|---|---|
| `GET` | `/cases/{id}/certificate` | Retrieve the signed case certificate |
| `POST` | `/evidence/verify` | Verify a certificate payload (public, unauthenticated) |

## Sync

| Method | Path | Description |
|---|---|---|
| `POST` | `/sync` | Apply a queued, sequenced batch of offline operations |

## Conventions

- Every response includes a `request_id`.
- Every write endpoint is idempotent where the client can retry safely (see `sync_operations` uniqueness constraint for the sync endpoint).
- Validation errors return `422` with a structured field-level error list; authorization failures return `404` rather than `403` for resources outside the requesting user's access, to avoid confirming a resource's existence to an unauthorized caller.
