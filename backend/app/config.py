"""Application configuration loaded from environment variables.

Uses Pydantic Settings to validate and parse .env files into a typed
configuration object.  A cached ``get_settings()`` helper ensures a single
instance is shared across the application lifetime.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for the InfraSense backend.

    All values can be overridden via environment variables or a ``.env`` file
    located in the project root (``backend/.env``).
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── Database ────────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite+aiosqlite:///./infrasense.db"

    # ── Auth / JWT ──────────────────────────────────────────────────────
    SECRET_KEY: str = "change-me-to-a-random-secret-key-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    ALGORITHM: str = "HS256"

    # ── Camera ──────────────────────────────────────────────────────────
    CAMERA_MODE: str = "mock"  # "mock" | "real"

    # ── Server ──────────────────────────────────────────────────────────
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        """Return CORS_ORIGINS as a list of strings."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    # ── SMS ─────────────────────────────────────────────────────────────
    SMS_GATEWAY_URL: str = ""
    SMS_API_KEY: str = ""

    # ── Email / SMTP ────────────────────────────────────────────────────
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@infrasense.local"

    # ── PLC ──────────────────────────────────────────────────────────────
    PLC_HOST: str = "192.168.1.50"
    PLC_PORT: int = 502
    PLC_POLL_INTERVAL_MS: int = 1000
    PLC_CONNECTION_TIMEOUT_MS: int = 5000

    # ── Recording ───────────────────────────────────────────────────────
    RECORDING_STORAGE_PATH: str = "./recordings"
    RECORDING_MAX_FILE_SIZE_MB: int = 5000
    RECORDING_FRAME_RATE: int = 25

    # ── Retention ───────────────────────────────────────────────────────
    RETENTION_CLEAN_DAYS: int = 7
    RETENTION_FLAGGED_DAYS: int = 90
    RETENTION_AUTO_DELETE: bool = True

    # ── Reports ─────────────────────────────────────────────────────────
    REPORT_STORAGE_PATH: str = "./reports"
    REPORT_DAILY_TIME: str = "06:00"
    REPORT_TIMEZONE: str = "Asia/Kolkata"


@lru_cache
def get_settings() -> Settings:
    """Return a cached singleton of the application settings.

    Returns:
        Settings: The validated application configuration.
    """
    return Settings()
