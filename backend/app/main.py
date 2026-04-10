"""FastAPI application entry point for InfraSense.

Creates the application instance, configures CORS middleware, registers
all API routers, and provides a lifespan handler that initialises the
database and seeds a default admin account on first startup.
"""

from __future__ import annotations

import logging
import secrets
import uuid
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.config import get_settings
from app.core.database import AsyncSessionLocal, init_db
from app.core.security import get_password_hash
from app.models import User, UserRole  # noqa: F401 — ensures all models are registered

logger = logging.getLogger(__name__)
settings = get_settings()


# ── Lifespan ───────────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan handler.

    On startup:
    - Creates all database tables (dev / first-run bootstrapping).
    - Seeds a default admin user if no users exist in the database.

    Yields:
        None: Control returns to the application for its lifetime.
    """
    logger.info("InfraSense API starting up...")

    # Create tables
    await init_db()
    logger.info("Database tables initialised")

    # Seed default admin if no users exist
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User))
        if result.scalar_one_or_none() is None:
            default_password = secrets.token_urlsafe(16)
            admin = User(
                id=str(uuid.uuid4()),
                username="admin",
                display_name="System Administrator",
                email="admin@infrasense.local",
                hashed_password=get_password_hash(default_password),
                role=UserRole.ADMIN,
                is_active=True,
            )
            session.add(admin)
            await session.commit()
            print(f"Default admin user created — username: admin, password: {default_password}")
            logger.info("Default admin user created (username=admin)")
        else:
            logger.info("Users already exist — skipping default admin creation")

    yield

    logger.info("InfraSense API shutting down...")


# ── App ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="InfraSense API",
    version="1.0.0",
    description=(
        "LHF Thermal Monitoring System API for JSW Vijayanagar SMS. "
        "Provides endpoints for camera management, alert rules, recordings, "
        "reports, analytics, and system administration."
    ),
    lifespan=lifespan,
)

# ── CORS Middleware ────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────

from app.api.v1.auth import router as auth_router  # noqa: E402
from app.api.v1.users import router as users_router  # noqa: E402
from app.api.v1.cameras import router as cameras_router  # noqa: E402
from app.api.v1.groups import router as groups_router  # noqa: E402
from app.api.v1.rois import router as rois_router  # noqa: E402
from app.api.v1.alerts import router as alerts_router  # noqa: E402
from app.api.v1.recordings import router as recordings_router  # noqa: E402
from app.api.v1.reports import router as reports_router  # noqa: E402
from app.api.v1.system import router as system_router  # noqa: E402
from app.api.v1.settings import router as settings_router  # noqa: E402
from app.api.v1.analytics import router as analytics_router  # noqa: E402
from app.api.v1.layout import router as layout_router  # noqa: E402
from app.api.v1.ws import router as ws_router  # noqa: E402

_API_V1_PREFIX = "/api/v1"

app.include_router(auth_router, prefix=_API_V1_PREFIX)
app.include_router(users_router, prefix=_API_V1_PREFIX)
app.include_router(cameras_router, prefix=_API_V1_PREFIX)
app.include_router(groups_router, prefix=_API_V1_PREFIX)
app.include_router(rois_router, prefix=_API_V1_PREFIX)
app.include_router(alerts_router, prefix=_API_V1_PREFIX)
app.include_router(recordings_router, prefix=_API_V1_PREFIX)
app.include_router(reports_router, prefix=_API_V1_PREFIX)
app.include_router(system_router, prefix=_API_V1_PREFIX)
app.include_router(settings_router, prefix=_API_V1_PREFIX)
app.include_router(analytics_router, prefix=_API_V1_PREFIX)
app.include_router(layout_router, prefix=_API_V1_PREFIX)

# WebSocket routes live at /ws/* — no API version prefix
app.include_router(ws_router)


# ── Root Health Endpoint ───────────────────────────────────────────────


@app.get("/health", tags=["health"], summary="Basic liveness check")
async def health_check() -> dict[str, str]:
    """Return a simple liveness response.

    This endpoint is unauthenticated and intended for load-balancer /
    orchestration health probes.

    Returns:
        dict: ``{"status": "ok"}``
    """
    return {"status": "ok"}
