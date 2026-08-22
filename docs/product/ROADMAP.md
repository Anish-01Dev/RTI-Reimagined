# Build Roadmap

Subsystems are built in dependency order. Nothing downstream of the Case Engine is built before it exists, since every other subsystem reads from or writes to case state.

```
Case Engine
    │
    ├──► Government Provider Adapter (reference implementation) ──► Rights Clock ──► Appeal Compiler
    │
    ├──► Evidence Layer
    │
    └──► Application Doctor ──► Answer Integrity Engine

Offline Sync (built last; depends on Case Engine + Evidence Layer)
```

## Phase 1 — Case Engine

Postgres schema, explicit state machine, `POST /cases/{id}/events` transition endpoint, case timeline derived from the append-only event log.

**Exit criteria:** a case can be created and moved through its full happy-path lifecycle via the API alone; illegal transitions are rejected; the timeline renders correctly from stored events.

## Phase 2 — Government Provider Adapter

`RTIProvider` interface (submit / get_status / get_response) with a reference implementation that emits scriptable, deterministic events, so downstream systems have something to react to independent of any live integration.

## Phase 3 — Rights Clock

Deterministic deadline calculation (response period, transfer period, appeal windows) and appeal-eligibility evaluation as pure functions over case state and event history.

**Exit criteria:** deadline calculations are covered by unit tests against fixed reference timestamps.

## Phase 4 — Application Doctor

Plain-language intake → structured intent extraction → deterministic rules validation (jurisdiction, question scope, exemption-risk flags) → citizen review and approval before a case is filed.

**Exit criteria:** structured output is schema-validated end to end; no unvalidated model output can reach case state.

## Phase 5 — Evidence Layer

Signing and verification of case certificates; a verify endpoint that detects tampering independent of authentication.

**Exit criteria:** a valid certificate verifies; a modified certificate fails verification.

## Phase 6 — Answer Integrity Engine

Per-question coverage classification of a government response, presented to the citizen for confirmation or override — never applied automatically to case state.

## Phase 7 — Appeal Compiler

Drafts an appeal from eligibility and coverage-gap data. Filing always requires explicit citizen action.

## Phase 8 — Offline Sync

Client-side operation queue with idempotent replay on reconnect. Scoped to a single device per case for the initial build; multi-device conflict resolution is future work.

## Phase 9 — Government Structured Intake View

A read-only view rendering case and application data from the perspective of the receiving authority, to demonstrate reduced processing friction on that side of the transaction.
