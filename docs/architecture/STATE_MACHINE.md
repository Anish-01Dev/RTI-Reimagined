# Case State Machine

Every case transition is committed through `POST /cases/{id}/events`. The handler validates the requested transition against the table below, applies any domain-specific guard condition, appends an immutable `case_events` row, and updates `cases.status`. The frontend never sets status directly.

## States and Allowed Transitions

| From | Allowed To |
|---|---|
| `DRAFT` | `VALIDATED` |
| `VALIDATED` | `READY_TO_FILE`, `DRAFT` |
| `READY_TO_FILE` | `SUBMITTED` |
| `SUBMITTED` | `ACKNOWLEDGED` |
| `ACKNOWLEDGED` | `TRANSFERRED`, `UNDER_PROCESSING` |
| `TRANSFERRED` | `UNDER_PROCESSING` |
| `UNDER_PROCESSING` | `RESPONSE_RECEIVED`, `NO_RESPONSE` |
| `RESPONSE_RECEIVED` | `RESPONSE_ANALYSIS` |
| `RESPONSE_ANALYSIS` | `COMPLETED`, `INCOMPLETE_RESPONSE` |
| `NO_RESPONSE` | `FIRST_APPEAL_ELIGIBLE` |
| `INCOMPLETE_RESPONSE` | `FIRST_APPEAL_ELIGIBLE` |
| `FIRST_APPEAL_ELIGIBLE` | `FIRST_APPEAL_FILED` |
| `FIRST_APPEAL_FILED` | `SECOND_APPEAL_ELIGIBLE`, `COMPLETED` |

## Transition Handling Order

1. Load the case and its current status.
2. Verify the requesting actor is authorized on this case.
3. Verify the requested transition is permitted from the current status.
4. Evaluate any domain-specific guard (for example, `FIRST_APPEAL_FILED` requires a prior `FIRST_APPEAL_ELIGIBLE` state and an appeal record the citizen has explicitly approved).
5. Append the `case_events` row.
6. Update `cases.status`.
7. Recompute any dependent deadline.
8. Return the new state and the recorded event.

An illegal transition is rejected with a `409 Conflict` and recorded in `audit_logs`; it never fails silently or falls back to an implicit state change.

## Deadline-Triggered Transitions

`UNDER_PROCESSING → NO_RESPONSE` and `RESPONSE_ANALYSIS → INCOMPLETE_RESPONSE` are the two transitions that make an appeal path reachable. The first is driven by the Rights Clock's deadline sweep; the second is driven by citizen confirmation in the Answer Integrity Engine. Neither transition files an appeal — they only make the case eligible for one.
