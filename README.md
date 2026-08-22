# RTI Reimagined

A reliability and accountability layer for India's Right to Information ecosystem.

## Overview

India's RTI Act gives citizens a real, powerful right to information. The friction isn't the law — it's execution. A citizen who wants to exercise that right still has to identify the correct public authority, phrase a legally sound request, track statutory deadlines across transfers and appeals, and determine whether a government "disposal" actually answered what was asked.

RTI Reimagined is not a form generator. It is case-management, rules, deadline, and evidence infrastructure that sits around the existing government RTI process — reducing friction for the citizen filing a request and for the officer processing it.

## Core Approach

**Ask → Track → Prove**

- **Ask** — Turn a plain-language request into a correctly routed, well-formed RTI application, with jurisdiction detection, question decomposition, and exemption-risk flags surfaced before filing.
- **Track** — Follow the case through its full procedural lifecycle (acknowledgement, transfer, response, appeal) against the statutory clock, so deadlines and appeal eligibility are never missed.
- **Prove** — Verify whether a government response actually answered what was asked, and preserve a cryptographically verifiable record of the entire case.

See [`docs/product/PROJECT_SCOPE.md`](docs/product/PROJECT_SCOPE.md) for the full product scope and [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md) for the system design.

## Repository Structure

```
RTI-Reimagined/
├── backend/          FastAPI application — case engine, rules engine, adapters
├── frontend/          React + TypeScript client application
├── rules/             Versioned, data-driven rule sets (authorities, deadlines, exemptions, appeals)
├── crypto/            Signing and verification utilities for case evidence
├── docs/              Product scope, architecture, legal, and security documentation
├── infra/             Deployment and infrastructure configuration
└── .github/           Issue and pull request templates
```

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Python, FastAPI (modular monolith) |
| Database | PostgreSQL |
| Client-side storage | IndexedDB (offline-first case drafts) |
| Evidence signing | Ed25519 |
| Local dev orchestration | Docker Compose |

## Documentation

- [Project Scope & Roadmap](docs/product/PROJECT_SCOPE.md)
- [Build Roadmap](docs/product/ROADMAP.md)
- [System Architecture](docs/architecture/ARCHITECTURE.md)
- [Data Model](docs/architecture/DATA_MODEL.md)
- [Case State Machine](docs/architecture/STATE_MACHINE.md)
- [API Contract](docs/architecture/API_CONTRACT.md)
- [Threat Model](docs/security/THREAT_MODEL.md)
- [RTI Legal Glossary](docs/legal/GLOSSARY.md)
- [Compliance Notes](docs/legal/COMPLIANCE_NOTES.md)

## Getting Started

Local development requires Docker (for PostgreSQL), Python 3.11+, and Node.js 20+.

```bash
# start local Postgres
docker compose up -d

# backend
cd backend
pip install -e .
uvicorn app.main:app --reload

# frontend
cd frontend
npm install
npm run dev
```

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for branching conventions and code style.

## Project Status

Architecture, data model, and repository scaffolding are complete. Implementation is in active development — see [`docs/product/ROADMAP.md`](docs/product/ROADMAP.md) for build sequencing.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

Proprietary. All rights reserved.
