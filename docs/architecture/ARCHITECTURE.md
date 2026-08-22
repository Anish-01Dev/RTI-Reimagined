# System Architecture

## Design Doctrine

Automated language understanding interprets. It does not decide.

| Component | Responsibility |
|---|---|
| Language understanding layer | Interprets citizen intent, translates, explains, drafts |
| Rules engine | Decides — jurisdiction, question validity, exemption risk, deadlines, appeal eligibility |
| Case engine | Owns state transitions and the event history |
| Evidence layer | Proves — signs and verifies case artifacts |
| Government adapter | Remains authoritative for official filing status |
| Human (citizen) | Confirms every filing and appeal before it is submitted |

No component downstream of the language understanding layer accepts its output as authoritative. Every suggestion is schema-validated and passed through the rules engine before it can influence case state, and no filing or appeal is submitted without explicit citizen confirmation.

## High-Level Data Flow

```
                         ┌─────────────────────┐
                         │       Citizen        │
                         └──────────┬───────────┘
                                    │  natural language
                                    ▼
                         ┌─────────────────────┐
                         │ Language Understanding│
                         │ intent · translation  │
                         │ explanation · drafting│
                         └──────────┬───────────┘
                                    │  structured, schema-validated intent
                                    ▼
                    ┌──────────────────────────────┐
                    │          Rules Engine          │
                    │  jurisdiction · question       │
                    │  validity · exemption risk ·   │
                    │  deadlines · appeal eligibility │
                    └──────────────┬───────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │          Case Engine           │
                    │   state machine · event log ·  │
                    │   documents · timeline          │
                    └───────┬──────────┬────────────┘
                            │          │
                  ┌─────────┘          └──────────┐
                  ▼                               ▼
        ┌───────────────────┐           ┌──────────────────┐
        │    Rights Clock     │           │  Evidence Layer   │
        │  deadlines ·         │           │  hashing ·         │
        │  transfers ·          │           │  signing · QR ·     │
        │  appeal windows       │           │  verification       │
        └─────────┬─────────┘           └────────┬─────────┘
                  │                              │
                  └────────────┬─────────────────┘
                               ▼
                    ┌───────────────────────┐
                    │  Government Provider    │
                    │       Adapter             │
                    └──────────┬────────────┘
                               │
                               ▼
                       Government System
                               │
                               ▼
                           Response
                               │
                               ▼
                  ┌────────────────────────┐
                  │  Answer Integrity Engine │
                  │  asked vs. answered ·     │
                  │  coverage matrix ·         │
                  │  appeal evidence           │
                  └────────────┬───────────┘
                               │
                               ▼
                         Citizen Outcome
```

## Subsystems

### Case Engine

The system of record. Every RTI request becomes a case with an explicit, enforced state machine — see [`STATE_MACHINE.md`](STATE_MACHINE.md). All state changes are committed through a single transition endpoint that validates the requested transition against the current state, applies any domain-specific guard conditions, and appends an immutable event. The event log is simultaneously the audit trail and the source for the case timeline — there is no separate mutable "status" field maintained independently of it.

### Rights Clock

A deterministic engine that computes response, transfer, and appeal deadlines from case state and event history, and evaluates appeal eligibility. It performs no I/O and depends on no external service, which keeps it fully unit-testable against fixed reference timestamps.

### Application Doctor

The intake layer. Plain-language input is passed to a language-understanding step that returns structured, schema-validated output — subject, likely authority, decomposed questions, missing fields, and risk flags (personal-information exposure, opinion-seeking rather than record-seeking phrasing, requests spanning multiple unrelated subject areas). The rules engine then validates that output against known jurisdiction and authority data before it is ever shown to the citizen for approval. Text extracted from uploaded documents is always treated as untrusted data during this step, never as instruction.

### Evidence Layer

Every filing produces a signed case certificate: a canonical, minimal payload (case identifier, application hash, authority, issuance timestamp, key identifier) signed with Ed25519 and represented as a QR-encoded artifact. Verification is a public, unauthenticated operation — recompute the canonical payload, verify the signature, and confirm the referenced application hash still matches the live record. The certificate deliberately excludes personal or sensitive data; it is a proof artifact, not a data export.

### Answer Integrity Engine

Once a government response is received, each original question is classified against the response text as answered, partially answered, or missing, with a quoted excerpt as supporting evidence. Classification is a suggestion the citizen confirms or overrides — it never mutates case state directly. The resulting coverage matrix is the primary input to appeal generation.

### Government Provider Adapter

An interface (`submit`, `get_status`, `get_response`) that decouples the rest of the system from any specific government integration. A reference implementation emits deterministic, scriptable events so the rest of the system can be developed and tested independently of a live integration.

## Offline Behavior

Case drafting, document scanning, translation, and previously synchronized case data remain available without connectivity. Client-side edits are queued as a sequenced, per-device operation log; on reconnect, the server applies queued operations in order and rejects any operation whose sequence number has already been applied, making replay safe. Operations that require authoritative government interaction remain pending until connectivity is restored.
