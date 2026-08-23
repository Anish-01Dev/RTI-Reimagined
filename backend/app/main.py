"""Application entry point."""

from __future__ import annotations

import logging
import uuid

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.v1.applications import router as applications_router
from app.api.v1.evidence import router as evidence_router
from app.database import engine
from app.domain.case_engine.state_machine import IllegalTransitionError
from app.domain.errors import ConflictError, NotFoundError, ValidationError

logger = logging.getLogger("rti.api")

app = FastAPI(
    title="RTI Reimagined API",
    version="0.1.0",
)


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-Id"] = request_id
    return response


def _error_response(request: Request, status_code: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {"code": code, "message": message},
            "request_id": getattr(request.state, "request_id", None),
        },
    )


@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError) -> JSONResponse:
    return _error_response(request, 404, "NOT_FOUND", str(exc))


@app.exception_handler(ConflictError)
async def conflict_handler(request: Request, exc: ConflictError) -> JSONResponse:
    return _error_response(request, 409, "CONFLICT", str(exc))


@app.exception_handler(IllegalTransitionError)
async def illegal_transition_handler(request: Request, exc: IllegalTransitionError) -> JSONResponse:
    return _error_response(request, 409, "ILLEGAL_TRANSITION", str(exc))


@app.exception_handler(ValidationError)
async def validation_handler(request: Request, exc: ValidationError) -> JSONResponse:
    return _error_response(request, 422, "VALIDATION_ERROR", str(exc))


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # Never surface raw exception/DB-driver detail to the client.
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return _error_response(request, 500, "INTERNAL_ERROR", "An unexpected error occurred")


@app.get("/health")
def health() -> JSONResponse:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception:
        logger.exception("Health check failed to reach the database")
        return JSONResponse(
            status_code=503, content={"status": "degraded", "database": "unreachable"}
        )
    return JSONResponse(status_code=200, content={"status": "ok", "database": "ok"})


app.include_router(applications_router, prefix="/api/v1")
app.include_router(evidence_router, prefix="/api/v1")

# Remaining routers (cases, sync) are registered here as each API surface
# is implemented, in the build order set out in docs/product/ROADMAP.md.
