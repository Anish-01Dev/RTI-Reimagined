"""Environment-driven application settings."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    environment: str = "development"

    database_url: str

    jwt_secret: str
    otp_rate_limit_per_15_min: int = 5

    evidence_signing_key_path: str
    evidence_key_id: str = "key-01"

    language_model_api_key: str | None = None

    # Comma-separated origins allowed to call the API from a browser (the
    # Vite dev server's default port, plus its IPv4 alias). A frontend
    # served from anywhere else needs its origin added here.
    cors_allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    class Config:
        env_file = ".env"

    @property
    def cors_allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_allowed_origins.split(",") if origin.strip()]


settings = Settings()
