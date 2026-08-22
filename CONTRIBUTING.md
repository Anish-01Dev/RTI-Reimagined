# Contributing

## Branching

- `main` is the protected, always-deployable branch.
- Work happens on short-lived branches named `feature/<short-description>`, `fix/<short-description>`, or `docs/<short-description>`.
- Open a pull request into `main` and request review before merging. Squash-merge to keep history readable.

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(case-engine): add transfer transition guard
fix(rights-clock): correct 48-hour life-and-liberty window
docs(architecture): document evidence certificate payload
```

## Code Style

- **Backend (Python):** formatted with `black`, linted with `ruff`. Type hints are required on public function signatures.
- **Frontend (TypeScript):** formatted with `prettier`, linted with `eslint`. Avoid `any`; prefer explicit types in `src/types`.

## Local Setup

See the *Getting Started* section in [`README.md`](README.md).

## Tests

- Backend: `pytest` from `backend/`.
- Frontend: `npm test` from `frontend/`.

New logic in the rules engine, case engine, or deadline engine requires accompanying tests — these components are deterministic by design and should be fully covered.

## Pull Requests

Keep pull requests scoped to a single subsystem or concern where possible. Reference the relevant section of `docs/product/ROADMAP.md` in the description so reviewers have context on where the change sits in the build sequence.
