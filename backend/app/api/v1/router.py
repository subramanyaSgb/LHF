"""Aggregate API v1 router.

Collects all sub-routers and mounts them under the ``/api/v1`` prefix.
Import this single router in ``main.py`` to wire up the full API.
"""

from fastapi import APIRouter

from app.api.v1.alerts import router as alerts_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.auth import router as auth_router
from app.api.v1.cameras import router as cameras_router
from app.api.v1.groups import router as groups_router
from app.api.v1.layout import router as layout_router
from app.api.v1.recordings import router as recordings_router
from app.api.v1.reports import router as reports_router
from app.api.v1.rois import router as rois_router
from app.api.v1.settings import router as settings_router
from app.api.v1.system import router as system_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(cameras_router)
api_router.include_router(groups_router)
api_router.include_router(rois_router)
api_router.include_router(alerts_router)
api_router.include_router(recordings_router)
api_router.include_router(reports_router)
api_router.include_router(system_router)
api_router.include_router(settings_router)
api_router.include_router(analytics_router)
api_router.include_router(layout_router)
