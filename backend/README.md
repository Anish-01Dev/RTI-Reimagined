# Backend

FastAPI application implementing the case engine, rules engine, and supporting domain modules described in [`../docs/architecture/ARCHITECTURE.md`](../docs/architecture/ARCHITECTURE.md).

## Layout

```
app/
├── main.py                 Application entry point
├── config.py                Environment-driven settings
├── api/v1/                  HTTP routers
├── domain/
│   ├── case_engine/         State machine and transition handling
│   ├── rules_engine/        Jurisdiction, question validity, exemption-risk rules
│   ├── deadline_engine/     Rights Clock — deterministic deadline calculation
│   ├── appeal_engine/       Appeal draft generation
│   ├── evidence/             Certificate signing and verification
│   ├── response_analysis/   Answer Integrity Engine
│   ├── ai/                   Language understanding integration
│   ├── sync/                 Offline operation queue handling
│   └── security/             AuthN/authZ, rate limiting, audit logging
├── models/                   Database models
├── repositories/             Data access layer
└── adapters/government/      RTIProvider interface and implementations
```

## Local Development

```bash
pip install -e .
uvicorn app.main:app --reload
```

Requires PostgreSQL running (see `docker-compose.yml` in the repository root) and environment variables from `.env.example`.

## Tests

```bash
pytest
```
