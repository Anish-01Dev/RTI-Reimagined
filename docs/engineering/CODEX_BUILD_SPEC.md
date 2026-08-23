# Suchna Rakshak — Codex Build Specification (v2)

**Read this entire document before writing or modifying any code.** This is the authoritative engineering spec for the RTI‑Reimagined / Suchna Rakshak hackathon build. Where anything here conflicts with an older file under `docs/architecture/` or `docs/product/` (written for an earlier, superseded concept), **this document wins**. Do not re‑derive product strategy from those files — the reasoning already happened; your job is implementation.

Companion reading, in order of usefulness:
1. This document (the spec).
2. `~/Downloads/Suchna-Rakshak-Strategy.pdf` — the full strategic reasoning, the 10 rejected alternative directions, the demo walkthrough, and the "why" behind every decision below. Skim it once for context; don't implement from it directly, implement from this document.
3. The existing code under `backend/app/` — Phase 1 is already built, tested, and migrated. Read it before adding anything; extend it, do not duplicate it.

---

## 0. What you're building, in one paragraph

RTI portals track the *application*. Suchna Rakshak tracks the *information*. Every RTI is decomposed at filing into a persistent **Information Request Ledger** — a set of atomic, individually‑trackable items (e.g. "work order", "sanctioned estimate", "contractor details"). The system holds this ledger for the life of the case. Two things happen automatically that no existing RTI tool does: (1) the moment a statutory deadline lapses with no response, the system compiles a filed‑ready First Appeal naming the specific ledger items still open; (2) the moment a response arrives, it's mapped back onto the ledger item‑by‑item — not summarized as a block — answering "did the government actually answer what was asked?" AI drafts and classifies; it never decides. A deterministic state machine and rules engine own every fact that matters legally (status, deadlines, eligibility). A human confirms every filing and every appeal before it's submitted.

---

## 1. Non‑negotiable engineering rules

These override any convenience, shortcut, or "the model can just handle it" temptation. Every one of these was already established and enforced in the Phase 1 build — keep enforcing it.

1. **AI is never authoritative.** OpenAI calls produce structured, schema‑validated *suggestions* only: intent extraction / ledger decomposition, response‑vs‑ledger coverage classification, and appeal narrative drafting. Nothing an AI call returns is written to `applications.status`, `deadlines`, `information_items.status`, or any legally meaningful field without passing through deterministic validation first.
2. **The rules engine and state machine decide.** Legal state (`ApplicationStatus`), deadline computation, appeal eligibility, and exemption‑risk flags are pure, deterministic, unit‑testable functions — no model call in the loop. See §5–§6.
3. **Every status transition goes through the transition table.** `POST /applications/{id}/events` is the only path that can change `applications.status`. No other code path writes that column. Same principle extends to `information_items.status` in v2 — see §8.
4. **Writes are server‑controlled.** `id`, `created_at`, `timestamp` on any event/audit/ledger row are always server‑generated. A client can never supply them. `actor_id`/`user_id` are currently accepted from the request body only because there is no auth subsystem yet (§2) — this is a documented, temporary seam, not a security decision to replicate elsewhere.
5. **Never leak internal errors.** Every domain exception (`NotFoundError`, `ConflictError`, `ValidationError`, `IllegalTransitionError`) maps to a structured `{"error": {"code", "message"}, "request_id"}` response. Unhandled exceptions return a generic 500 and are logged server‑side only. This is already wired in `app/main.py` — extend the pattern, don't bypass it.
6. **AI output is always schema‑validated before use.** Every OpenAI response is parsed against a strict Pydantic schema (§9). A response that fails validation is retried once, then surfaces as a domain error the citizen/officer sees as "couldn't process this automatically" — never silently coerced, never partially trusted.
7. **No secrets in source.** All config through `app.config.Settings` / environment variables, following the existing `.env` / `.env.example` pattern.
8. **No AI‑coding‑tool attribution anywhere in this repository.** No mention of the assistant that helped write any given commit, no `Generated with …` trailers, no tool‑branding in comments, docs, or commit messages. Commit authorship stays the repository owner's identity. (Codex itself may be referenced in product/demo materials as the hackathon's build accelerator — that is a different, permitted claim about *how the team built the product*, not an attribution trailer on generated code.)
9. **Don't rebuild what exists.** Phase 1 (§4) is done and tested. If a task below says "extend," extend the existing file; do not create a parallel implementation.

---

## 2. Explicit non‑goals for this build

Do not implement these, even if it seems easy or "while I'm in there":

- Authentication/authorization (real login, sessions, JWT verification). `user_id`/`actor_id` stay request‑body fields until a dedicated auth task is scoped.
- A government‑side dashboard beyond one read‑only ledger view.
- Offline sync / operation queue.
- QR/blockchain spectacle beyond the evidence certificate's actual verification function.
- Multilingual/voice intake.
- RTI Health Score / aggregate authority statistics.
- Community/duplicate‑request network features beyond a single "N similar requests" count, if time allows (P2, optional).
- Any feature not listed in §12's P0/P1 scope.

If a task seems to require one of these to "really" work, stop and flag it rather than building it.

---

## 3. Tech stack (already chosen, do not change)

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy 2.0 (declarative, `Mapped`/`mapped_column`), Alembic, Pydantic v2, PostgreSQL (via `psycopg[binary]`).
- **Frontend**: React + TypeScript, Vite.
- **AI**: OpenAI API (model choice left to the implementer; use structured outputs / JSON mode with a strict schema for every call — see §9).
- **Evidence/crypto**: Ed25519 signing (`cryptography` package), already a declared dependency.
- **Testing**: pytest, a real Postgres test database (see `backend/tests/conftest.py` — per‑test SAVEPOINT isolation, not SQLite; the schema uses JSONB and other Postgres‑specific behavior).
- **Architecture shape**: modular monolith. No microservices, no message queue, no Kubernetes. One FastAPI app, layered as `api/` (HTTP only) → `domain/` (business logic, no FastAPI imports) → `repositories/` (SQLAlchemy session access) → `models/` (ORM).

---

## 4. What already exists (Phase 1 — do not rebuild)

Location: `backend/app/`. Fully implemented, migrated, and covered by 247 passing tests as of this spec.

```
app/
├── main.py                      FastAPI app, exception handlers, request-id middleware, /health
├── config.py                    Settings (env-driven)
├── database.py                  engine, SessionLocal, get_db dependency
├── models/
│   ├── orm.py                   User, Authority, RTIApplication, ApplicationEvent, Document,
│   │                            Deadline, Appeal, AuditLog
│   └── enums.py                 UserRole, AuthorityLevel, FilingChannel, DeadlineType,
│                                DeadlineStatus, AppealType, AppealStatus, DocumentType
├── domain/
│   ├── errors.py                DomainError, NotFoundError, ConflictError, ValidationError
│   └── case_engine/
│       ├── state_machine.py     ApplicationStatus enum, TRANSITIONS table, validate_transition()
│       └── service.py           create_application, get_application, list_events, record_event,
│                                create_deadline, list_deadlines (+ private _append_event/_append_audit/_commit)
├── repositories/                applications.py, events.py, deadlines.py, users.py,
│                                authorities.py, audit_logs.py — thin SQLAlchemy access only
├── schemas/                     applications.py, events.py, deadlines.py, common.py (Pydantic I/O)
└── api/v1/
    ├── applications.py          POST /applications, GET /applications/{id},
    │                            GET/POST /applications/{id}/events, GET /applications/{id}/deadlines
    ├── cases.py                 STUB — future phases (submit, timeline, certificate). Do not build against
    │                            this yet; applications.py is the live surface for the citizen journey.
    ├── evidence.py               STUB — POST /evidence/verify, see §11
    └── sync.py                   STUB — out of scope, see §2
```

Also already correct and reusable as‑is: `alembic/env.py`, the initial migration, `backend/tests/conftest.py` (the Postgres test‑DB + SAVEPOINT fixture pattern — reuse this fixture style for every new test file).

**Do not touch** `state_machine.py`'s `TRANSITIONS` table structure or `ApplicationStatus` members — the v2 features layer on top of it without modification (see §6).

---

## 5. Complete data model (current + v2 delta)

All tables use a UUID primary key (`uuid.uuid4()`, Python‑side default), `DateTime(timezone=True)` timestamps, and enum columns declared as `sqlalchemy.Enum(..., native_enum=False, validate_strings=True)` — this stores enums as `VARCHAR` + a `CHECK` constraint, so adding a new enum value later is a code change only, never an `ALTER TYPE` migration. Follow this pattern for every new enum/model.

### 5.1 Existing tables (unchanged)

| Table | Key columns | Notes |
|---|---|---|
| `users` | id, role, name, phone, email, created_at, updated_at | `CHECK(phone IS NOT NULL OR email IS NOT NULL)` |
| `authorities` | id, name, type, jurisdiction, state, district, department, filing_channel, is_active | |
| `applications` | id, registration_number (unique, nullable), user_id→users (RESTRICT), authority_id→authorities (RESTRICT), subject, original_request, refined_request, status, submitted_at, received_at, response_due_at, response_received_at, created_at, updated_at | `status` is `ApplicationStatus` from `state_machine.py` |
| `application_events` | id, application_id→applications (CASCADE), event_type, actor_id→users (SET NULL, nullable), timestamp, metadata (JSONB) | append‑only; Python attribute is `event_metadata`, column name is `metadata` |
| `documents` | id, application_id (CASCADE), document_type, storage_reference, filename, content_type, hash, created_at | |
| `deadlines` | id, application_id (CASCADE), deadline_type, starts_at, due_at, status, completed_at | |
| `appeals` | id, application_id (CASCADE), appeal_type, reason, status, created_at, submitted_at | |
| `audit_logs` | id, actor_id→users (SET NULL, nullable), entity_type, entity_id, action, timestamp, metadata (JSONB) | Python attribute `log_metadata` |

### 5.2 New table — `information_items` (the v2 delta)

This is the only new entity required by v2. Add to `app/models/orm.py`:

```python
class InformationItemStatus(str, Enum):   # app/models/enums.py
    PENDING = "PENDING"                    # default at creation, before any response
    ANSWERED = "ANSWERED"
    PARTIALLY_ANSWERED = "PARTIALLY_ANSWERED"
    NOT_ANSWERED = "NOT_ANSWERED"
    POTENTIALLY_DEFICIENT = "POTENTIALLY_DEFICIENT"


class InformationItem(Base):               # app/models/orm.py
    __tablename__ = "information_items"
    __table_args__ = (
        Index("ix_information_items_application_sequence", "application_id", "sequence"),
    )

    id: Mapped[uuid.UUID]                  # standard uuid pk, see _uuid_pk() helper
    application_id: Mapped[uuid.UUID]      # FK -> applications.id, ondelete="CASCADE", not null, indexed
    sequence: Mapped[int]                  # 1-based order as decomposed, not null
    question_text: Mapped[str]             # the atomic question, e.g. "Work order for the repair"
    category: Mapped[str | None]           # optional free-text grouping, e.g. "procurement"
    status: Mapped[InformationItemStatus]  # default PENDING, not null
    evidence_excerpt: Mapped[str | None]   # quoted response text backing the current status
    created_at: Mapped[datetime]
    updated_at: Mapped[datetime]           # onupdate=func.now()

    application: Mapped["RTIApplication"] = relationship(back_populates="information_items")
```

Add `information_items: Mapped[list["InformationItem"]] = relationship(back_populates="application", order_by="InformationItem.sequence", cascade="all, delete-orphan")` to `RTIApplication`.

Generate the migration with `alembic revision --autogenerate -m "Add information_items ledger"` against a running local Postgres, then **read the generated migration before applying it** — verify the FK, index, and enum CHECK constraint match the table above, the same way the Phase 1 migration was reviewed.

### 5.3 What does *not* change

`state_machine.py`, `Deadline`, `Appeal`, `AuditLog`, `User`, `Authority` — no schema changes. The Appeal Compiler (§7) needs exactly one new query: list `information_items` for an application where `status != ANSWERED`.

---

## 6. State machine (unchanged, restated for completeness)

Source of truth: `app/domain/case_engine/state_machine.py`. Do not duplicate this table anywhere else — import `ApplicationStatus` and `TRANSITIONS`.

```
DRAFT → VALIDATED
VALIDATED → READY_TO_FILE | DRAFT
READY_TO_FILE → SUBMITTED
SUBMITTED → ACKNOWLEDGED
ACKNOWLEDGED → TRANSFERRED | UNDER_PROCESSING
TRANSFERRED → UNDER_PROCESSING
UNDER_PROCESSING → RESPONSE_RECEIVED | NO_RESPONSE
RESPONSE_RECEIVED → RESPONSE_ANALYSIS
RESPONSE_ANALYSIS → COMPLETED | INCOMPLETE_RESPONSE
NO_RESPONSE → FIRST_APPEAL_ELIGIBLE
INCOMPLETE_RESPONSE → FIRST_APPEAL_ELIGIBLE
FIRST_APPEAL_ELIGIBLE → FIRST_APPEAL_FILED
FIRST_APPEAL_FILED → SECOND_APPEAL_ELIGIBLE | COMPLETED
```

`POST /applications/{id}/events` already treats an `event_type` matching an `ApplicationStatus` member name as a transition request (validated via `validate_transition`) and anything else as a non‑status informational event. This mechanism is unchanged by v2 — the only addition is that specific event types (see §7) now also trigger ledger‑aware side effects in the service layer, not in the state machine itself.

---

## 7. The Rights Clock — deadline rules

Implement as pure, I/O‑free functions in `app/domain/deadline_engine/` (currently an empty stub package — this is where it belongs). No model calls, no DB session — takes timestamps and case facts in, returns due dates and eligibility booleans out. Unit test against fixed reference timestamps, matching the coverage plan already sketched in `backend/tests/test_deadline_engine.py`.

| Rule | Period | Statutory basis | Deterministic trigger |
|---|---|---|---|
| Standard response | 30 days from receipt | RTI Act 2005, s.7(1) | `Deadline(deadline_type=RESPONSE)` created at `ACKNOWLEDGED`/`UNDER_PROCESSING` |
| Life‑and‑liberty response | 48 hours from receipt | s.7(1), proviso | flagged during intake if the rules engine detects a life/liberty‑relevant request; do not have the AI layer decide this alone — see §9.1 |
| Transfer | 5 days from receipt, to the correct PIO | s.6(3) | `Deadline(deadline_type=TRANSFER)` |
| First appeal window | 30 days from response‑deadline expiry or receipt of a deficient decision | s.19(1) | computed when `FIRST_APPEAL_ELIGIBLE` is reached |
| Second appeal window | 90 days from when the first‑appeal decision was due or received | s.19(3) | computed when `FIRST_APPEAL_FILED` resolves without satisfaction |

**Flag for verification, don't guess on stage:** whether a Section 6(3) transfer resets the 30‑day response clock or the clock still runs from the original request date is genuinely disputed in practice. Implement the citizen‑protective interpretation (clock computed from the *original* request date, unaffected by transfer) as the deterministic default, but treat this as the single highest legal‑precision risk in the whole build — verify against current CIC guidance before the demo, and make the interpretation a named constant (`TRANSFER_RESETS_CLOCK: bool = False`) so it's a one‑line change if the team decides otherwise, not a scattered fix.

**Deadline sweep → `NO_RESPONSE` transition:** a scheduled check (a simple polling function is sufficient for a hackathon — no need for a task queue) finds `applications` in `UNDER_PROCESSING` whose `RESPONSE` deadline has passed, and calls `record_event(event_type="NO_RESPONSE", actor_id=None, metadata={"trigger": "deadline_sweep"})`. This is the entry point to Money Shot One.

---

## 8. The Information Request Ledger — service logic

This is the v2 feature. Implement in `app/domain/case_engine/service.py` (extend, don't fork) or a new `app/domain/answer_integrity/` package if you prefer to keep ledger‑specific logic separate from case orchestration — either is fine; keep it out of the API layer either way.

### 8.1 Ledger creation at intake

```python
def create_application_with_items(
    db: Session,
    *,
    user_id: uuid.UUID,
    authority_id: uuid.UUID,
    subject: str,
    original_request: str,
    items: list[DecomposedItem],   # already schema-validated AI output, see §9.1
) -> RTIApplication:
    """Same as create_application, plus: persists one InformationItem per
    decomposed item, sequence = list index + 1, status = PENDING.
    Everything happens in the same transaction as the application row and
    its DRAFT_CREATED event — a citizen never ends up with an application
    but no ledger, or a ledger with no application."""
```

Expose this via `POST /applications` — extend the existing `ApplicationCreate` schema with an `items: list[str]` field (or `list[{question_text, category}]`) rather than adding a second endpoint. The Application Doctor (§9.1) runs *before* this call, client‑side or in a separate `POST /applications/decompose` preview endpoint that the citizen reviews before the actual `POST /applications` — the review‑before‑file step matters for the "AI drafts, citizen decides" principle and for the demo (§'s "Judge sees … he reviews and approves").

### 8.2 Ledger status updates on response

```python
def record_response(
    db: Session,
    *,
    application_id: uuid.UUID,
    response_text: str,
    actor_id: uuid.UUID | None,
) -> list[InformationItem]:
    """1. Loads the application and its information_items.
       2. Calls the Answer Integrity classifier (§9.2) with the response
          text and the list of open questions — schema-validated output only.
       3. For each item, writes .status and .evidence_excerpt from the
          validated classification. This is the ONLY code path allowed to
          write information_items.status — never a direct client PATCH.
       4. Appends a RESPONSE_RECEIVED application event.
       5. Returns the updated ledger for the API layer to serialize.
    """
```

Expose as `POST /applications/{id}/response` (new endpoint, §10). This is the entry point to Money Shot Two.

### 8.3 Reading the ledger

`GET /applications/{id}/items` — simple list, ordered by `sequence`. No write capability on this route.

---

## 9. AI integration contracts

Three calls. Each has a strict input, a strict output schema, and an explicit boundary on what it may and may not decide. Every schema below should be a real Pydantic model in `app/domain/ai/` (currently an empty stub package) that the OpenAI client's structured‑output / JSON‑mode response is validated against before any other code touches it. On validation failure: retry once with the same input, then raise a domain `ValidationError` — never fall back to using unvalidated output.

### 9.1 Application Doctor — request decomposition

**Input**: raw citizen text (`str`), optionally a jurisdiction hint.

**Output schema**:
```python
class DecomposedItem(BaseModel):
    question_text: str = Field(min_length=1, max_length=500)
    category: str | None = None

class ApplicationDoctorOutput(BaseModel):
    subject: str
    suggested_authority_query: str        # free text the rules engine uses to look up/suggest an Authority row — the model never picks the authority_id directly
    items: list[DecomposedItem] = Field(min_length=1, max_length=8)
    life_or_liberty_flag: bool = False     # a SUGGESTION only — see below
    exemption_risk_notes: list[str] = []   # e.g. "may touch personal information under s.8(1)(j)"
```

**Boundary**: the model suggests `life_or_liberty_flag` and `exemption_risk_notes`; it never sets `Deadline.deadline_type` or blocks filing. The rules engine reads the flag, and if set, still requires the citizen to confirm before the 48‑hour deadline type is applied — a false positive must never silently create a legal misclassification, and a false negative must never be the *only* thing standing between a citizen and the correct deadline (surface the flag prominently in the review UI; don't hide it).

### 9.2 Answer Integrity classifier

**Input**: response text (`str`), the ledger's current `[{item_id, question_text}]`.

**Output schema**:
```python
class ItemClassification(BaseModel):
    item_id: uuid.UUID
    status: InformationItemStatus          # must be one of ANSWERED/PARTIALLY_ANSWERED/NOT_ANSWERED/POTENTIALLY_DEFICIENT — PENDING is not a valid model output
    evidence_excerpt: str | None           # verbatim quote from response_text; None only if status is NOT_ANSWERED
    confidence: float = Field(ge=0, le=1)

class AnswerIntegrityOutput(BaseModel):
    classifications: list[ItemClassification]
```

**Boundary**: `item_id` values not present in the request are rejected (the model cannot invent ledger items). `evidence_excerpt`, when present, must be validated as an actual substring of `response_text` — if it isn't, treat that item as a validation failure for that row specifically (don't fail the whole batch), and fall back to `POTENTIALLY_DEFICIENT` with no excerpt, flagged for human review. This anti‑hallucination check is cheap to implement (a substring check) and directly protects the credibility of Money Shot Two.

### 9.3 Appeal drafter

**Input**: the application's stored facts (subject, original_request, registration_number, filing date, response_due_at), the list of non‑ANSWERED `information_items`, and — critically — the **statutory citation is not model output**. The rules engine deterministically selects the citation (e.g. "s.7(1)" for a `NO_RESPONSE` trigger, "s.19(1)" for the appeal window itself) based on the triggering event type, and passes it *into* the prompt as a fact to include, not something the model chooses.

**Output schema**:
```python
class AppealDraftOutput(BaseModel):
    narrative: str          # the drafted prose paragraph(s) — grounds for appeal, referencing only facts passed in
    open_items_summary: list[str]   # human-readable restatement of the unanswered items, for display
```

**Boundary**: the narrative is inserted into a deterministic document template that separately renders the registration number, dates, and statutory citation from application data — never from the model's own text. This is the concrete implementation of the strategy doc's risk mitigation ("a wrong citation on stage is costly").

---

## 10. API surface — complete, current + new

Base path `/api/v1`. Response/error envelope, request‑id middleware, and exception‑handler pattern already exist in `app/main.py` — every new route uses them, no exceptions.

| Method | Path | Status | Notes |
|---|---|---|---|
| `POST` | `/applications` | **existing** | extend body to accept `items` (post‑decomposition, citizen‑approved) |
| `POST` | `/applications/decompose` | **new** | preview‑only: raw text in, `ApplicationDoctorOutput` out, nothing persisted. Citizen reviews this before calling `POST /applications`. |
| `GET` | `/applications/{id}` | **existing** | |
| `GET` | `/applications/{id}/events` | **existing** | |
| `POST` | `/applications/{id}/events` | **existing** | unchanged mechanism; `NO_RESPONSE` triggered here (by the deadline sweep) now also compiles the appeal draft as a side effect — see §7/§8 |
| `GET` | `/applications/{id}/deadlines` | **existing** | |
| `GET` | `/applications/{id}/items` | **new** | the ledger, read‑only |
| `POST` | `/applications/{id}/response` | **new** | records a government response, runs Answer Integrity, updates the ledger — see §8.2 |
| `GET` | `/applications/{id}/appeal` | **new** | returns the compiled appeal draft once `FIRST_APPEAL_ELIGIBLE` (or later) — the object Money Shot One renders |
| `POST` | `/applications/{id}/appeal/file` | **new** | citizen‑approved filing; transitions `FIRST_APPEAL_ELIGIBLE → FIRST_APPEAL_FILED` via the existing events mechanism, creates the `Appeal` row |
| `GET` | `/health` | **existing** | |

Do not build the `cases.py`/`evidence.py`/`sync.py` stub surfaces beyond what §11 requires — they represent later phases outside this spec's scope.

---

## 11. Evidence layer — minimum for the demo

Full scope: `docs/architecture/ARCHITECTURE.md`'s Evidence Layer section is still accurate for *what* to build (Ed25519‑signed certificate, minimal payload, public unauthenticated verification). For this spec's purposes, the required surface is:

- `GET /applications/{id}/certificate` — returns a signed payload: `{application_id, registration_number, authority_id, original_request_hash, issued_at, key_id, signature}`. No personal data in the payload.
- `POST /evidence/verify` — public, unauthenticated. Recomputes the canonical payload from current DB state, verifies the signature, confirms the hash still matches. Returns `{valid: bool, reason?: str}`.

This is P1, not P0 — see §12. Build it after the two money shots work end‑to‑end.

---

## 12. Build plan — P0 / P1 / P2, with acceptance criteria

Build and verify each item before moving to the next. Do not parallelize past what the acceptance criteria can confirm independently.

### P0 — must exist for the demo

| # | Task | Acceptance criteria |
|---|---|---|
| 1 | `InformationItem` model + migration (§5.2) | Migration applies cleanly to a fresh DB; `alembic check` reports no drift; roundtrip (upgrade→downgrade→upgrade) succeeds |
| 2 | `POST /applications/decompose` + Application Doctor contract (§9.1) | Given a fixed sample input, returns schema‑valid `ApplicationDoctorOutput` with 3–6 items; malformed model output is retried once then raises a domain error, never crashes the request |
| 3 | `POST /applications` accepts `items`, persists ledger (§8.1) | Creating an application with items produces one `InformationItem` row per item, `sequence` 1..n, all `PENDING`; `DRAFT_CREATED` event still fires exactly once |
| 4 | `GET /applications/{id}/items` | Returns items ordered by `sequence` |
| 5 | Rights Clock (§7) as pure functions | Unit tests against fixed reference timestamps cover: 30‑day standard, 48‑hour life/liberty, 5‑day transfer, first‑ and second‑appeal windows |
| 6 | Deadline sweep → `NO_RESPONSE` | A test application with a past‑due `RESPONSE` deadline and no response is correctly moved to `NO_RESPONSE` by the sweep, and only by the sweep (not by a client call) |
| 7 | Appeal drafter (§9.3) fires on `NO_RESPONSE`/`FIRST_APPEAL_ELIGIBLE` | `GET /applications/{id}/appeal` returns a draft naming the specific open items, the correct deterministic statutory citation, and the original request verbatim |
| 8 | `POST /applications/{id}/appeal/file` | Transitions to `FIRST_APPEAL_FILED`, creates an `Appeal` row, rejects if called before `FIRST_APPEAL_ELIGIBLE` (409, not 500) |
| 9 | One polished citizen‑journey frontend flow, no auth | Describe → review ledger → file → (time‑skip in demo tooling, not real waiting) → appeal ready → file appeal. No dead screens, no navigation the walkthrough doesn't use. |

### P1 — makes it S‑tier

| # | Task | Acceptance criteria |
|---|---|---|
| 10 | `POST /applications/{id}/response` + Answer Integrity classifier (§8.2, §9.2) | A fixed sample response classified against a fixed ledger produces the expected per‑item statuses; a hallucinated `evidence_excerpt` (not a substring of the response) is caught and downgraded, not trusted |
| 11 | Response‑to‑ledger mapping UI (Money Shot Two) | Statuses animate in per‑row, not as a single aggregate score; tapping a ✕/⚠ item shows its `evidence_excerpt` |
| 12 | Precedent‑aware appeal citations | A small (10–20 entry), hand‑verified table of Section 8/9 exemption precedents; matched denials cite a specific entry, not generated case law |
| 13 | Authority‑side ledger view (one screen) | Read‑only; shows the same ledger a citizen sees, plus a same‑authority duplicate‑request count if time allows |
| 14 | Evidence certificate + verify endpoint (§11) | A tampered payload fails verification; an untampered one passes; verify works with no authentication |

### P2 — supporting infrastructure (only if P0/P1 are solid and stable)

- Real authentication (replaces the request‑body `user_id`/`actor_id` seam — see §1.4).
- Duplicate‑request detection beyond a simple count.
- Document upload + hashing.
- Transfer‑chain visualization beyond what the event log already shows.

Do not start P2 until every P0 acceptance criterion is green and P1's two money‑shot flows work live, end to end, without manual DB edits.

---

## 13. Testing requirements

Match the rigor already established in Phase 1 (`backend/tests/`, 247 passing tests, real Postgres via `conftest.py`'s SAVEPOINT‑per‑test fixture). For every new module:

- Pure functions (state machine, deadline engine) → parametrized unit tests against fixed inputs/timestamps, no DB.
- Service‑layer functions (ledger creation, response recording, appeal compilation) → integration tests against the real test‑DB fixture, covering the happy path *and* the failure paths (missing application, malformed AI output, out‑of‑order calls like filing an appeal before eligibility).
- API routes → `TestClient` smoke tests confirming status codes and error envelope shape, mirroring `tests/test_api_applications.py`.
- AI contract validation → tests that feed deliberately malformed/adversarial model output (extra fields, an `item_id` that doesn't exist, a non‑substring `evidence_excerpt`) through the Pydantic schemas and confirm they're rejected, not coerced.

Run `pytest`, `ruff check .`, and `black --check .` clean before considering any phase complete — this was the standard for Phase 1 and does not relax for v2.

---

## 14. Glossary (keep naming consistent across code, comments, and UI copy)

| Term | Meaning | Do not call it |
|---|---|---|
| **Information Request Ledger** / **ledger** | The full set of `InformationItem` rows for an application | "the questions," "the form" |
| **Item** | One `InformationItem` row | "field," "question" (in code identifiers — fine in prose) |
| **Case Passport** | The full assembled record (application + events + deadlines + ledger + evidence) | "the export," "the PDF" |
| **Rights Clock** | The deadline engine | "the timer" |
| **Application Doctor** | The intake decomposition AI call | "the chatbot" |
| **Answer Integrity** | The response‑to‑ledger classification | "the summarizer" |
| **Appeal Compiler** | The deterministic‑template + AI‑narrative appeal drafting flow | "the letter generator" |

---

## 15. Definition of done for this spec

The build is demo‑ready when, without manual database edits:

1. A citizen can describe a need in plain language and see it become a reviewable ledger.
2. A deadline can lapse (via test tooling, not real‑time waiting) and produce a filed‑ready appeal naming the specific open items.
3. A response can be submitted and mapped live onto the ledger, item by item, with evidence.
4. All of the above pass automated tests, `ruff`, and `black` cleanly.
5. Nothing from §2's non‑goals has been built.

If you (Codex) reach a point where an instruction here is ambiguous or conflicts with what you find in the existing code, prefer the existing code's pattern and flag the ambiguity rather than guessing silently.
