.PHONY: db-up db-down backend-install backend-dev backend-test frontend-install frontend-dev frontend-test lint

db-up:
	docker compose up -d

db-down:
	docker compose down

backend-install:
	cd backend && pip install -e ".[dev]"

backend-dev:
	cd backend && uvicorn app.main:app --reload

backend-test:
	cd backend && pytest

frontend-install:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

frontend-test:
	cd frontend && npm test

lint:
	cd backend && ruff check . && black --check .
	cd frontend && npm run lint
