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

    class Config:
        env_file = ".env"


settings = Settings()
