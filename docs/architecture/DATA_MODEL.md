# Data Model

PostgreSQL schema. `case_events` is append-only and serves as both the audit trail and the source for the case timeline — no other table independently tracks case status history.

```sql
users (
  id, email_or_phone, auth_method, created_at
)

authorities (
  id, name, level ENUM('central', 'state'), department,
  jurisdiction_hint, portal_type
)

cases (
  id, user_id, status TEXT NOT NULL,   -- current state machine value
  authority_id, subject TEXT,
  created_at, updated_at
)

applications (
  id, case_id, raw_text, language, version
)

questions (
  id, case_id, application_id, text, sequence,
  status ENUM('draft', 'submitted')
)

case_events (
  id, case_id, actor ENUM('user', 'system', 'assistant', 'government'),
  from_state, to_state, reason, payload JSONB, created_at
)   -- insert-only

deadlines (
  id, case_id, kind ENUM('response', 'first_appeal', 'second_appeal'),
  due_at, computed_from_event_id, status ENUM('active', 'met', 'missed')
)

responses (
  id, case_id, raw_text, received_at, source_document_id
)

response_items (
  id, response_id, question_id,
  coverage ENUM('answered', 'partial', 'missing'),
  confidence FLOAT, extracted_excerpt TEXT,
  user_override ENUM('confirmed', 'overridden') NULL
)

appeals (
  id, case_id, kind ENUM('first', 'second'), grounds JSONB,
  status, filed_at
)

evidence_records (
  id, case_id, artifact_type, payload_hash, signature,
  key_id, issued_at
)

documents (
  id, case_id, storage_key, mime_type, size_bytes, sha256, uploaded_at
)

devices (
  id, user_id, public_key, registered_at
)

sync_operations (
  id, device_id, case_id, sequence, op_type,
  payload_hash, applied_at
)   -- unique on (device_id, sequence) for idempotent replay

audit_logs (
  id, actor, action, case_id, request_id, result, created_at
)
```

## Notes

- `case_events` is the single source of truth for case history. The case timeline UI is derived from it directly rather than maintained as a separate table.
- `response_items.coverage` and `extracted_excerpt` are produced by the Answer Integrity Engine as a suggestion; `user_override` is where citizen confirmation is recorded and is the only field that can move a case toward an appeal path.
- `sync_operations` provides idempotency for the offline operation queue via a uniqueness constraint on `(device_id, sequence)`.
- No table stores Aadhaar, PAN, or payment credential data.
