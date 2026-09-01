"""Application configuration settings."""
import os
from pathlib import Path
from typing import Optional, List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent
DEFAULT_SQLITE_PATH = BASE_DIR / "sql"


class Settings(BaseSettings):
    """Application-wide configuration loaded from environment or `.env`."""

    # Application
    APP_NAME: str = "صالة الحافظ للقطع الكهربائية"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = f"sqlite:///{DEFAULT_SQLITE_PATH.as_posix()}"

    # Security
    SECRET_KEY: str = "your-super-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Admin defaults
    DEFAULT_ADMIN_USER: str = "eyad"
    DEFAULT_ADMIN_PASSWORD: str = "1234"

    # AI Services
    OPENROUTER_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    GOOGLE_EMBEDDING_MODEL: str = "models/text-embedding-004"
    OPENAI_API_KEY: Optional[str] = None
    CHROMA_ANONYMIZED_TELEMETRY: bool = False

    # Auth
    CALLBACK_URL: str = "http://127.0.0.1:3000/auth/google/callback"

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://127.0.0.1:8001",
    ]

    model_config = SettingsConfigDict(
        env_file=os.path.join(BASE_DIR, ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug_value(cls, value):
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"1", "true", "yes", "on", "debug", "development"}:
                return True
            if normalized in {"0", "false", "no", "off", "release", "prod", "production"}:
                return False
        return value

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get application settings."""
    return settings
