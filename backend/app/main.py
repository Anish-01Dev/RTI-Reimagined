"""Application entry point."""

from fastapi import FastAPI

app = FastAPI(
    title="RTI Reimagined API",
    version="0.1.0",
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


# Routers are registered here as each API surface (cases, evidence, sync)
# is implemented under app.api.v1.
