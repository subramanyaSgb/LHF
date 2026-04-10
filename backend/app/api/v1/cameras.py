"""Camera CRUD endpoints.

Provides listing, detail, creation, update, and deletion of thermal camera
records as well as a real-time frame retrieval endpoint.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.api.v1.auth import get_current_user, require_role
from app.models.camera import Camera
from app.models.user import User
from app.config import get_settings
from app.schemas.camera import (
    CameraCreate,
    CameraResponse,
    CameraUpdate,
    ThermalFrameResponse,
)
from app.services.camera_interface import get_camera_service

router = APIRouter(prefix="/cameras", tags=["cameras"])


# ── Helpers ─────────────────────────────────────────────────────────────


async def _get_camera_or_404(camera_id: str, db: AsyncSession) -> Camera:
    """Fetch a camera by ID or raise 404.

    Args:
        camera_id: The UUID of the camera.
        db: Active database session.

    Returns:
        Camera: The camera ORM instance.

    Raises:
        NotFoundException: If no camera exists with the given ID.
    """
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()
    if camera is None:
        raise NotFoundException(detail=f"Camera {camera_id} not found")
    return camera


# ── Endpoints ───────────────────────────────────────────────────────────


@router.get(
    "",
    response_model=list[CameraResponse],
    summary="List all cameras",
)
async def list_cameras(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    group_id: str | None = Query(None, description="Filter by camera group"),
    status_filter: str | None = Query(
        None, alias="status", description="Filter by status (online/offline/recording/error)"
    ),
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[CameraResponse]:
    """Return a paginated list of cameras with optional filters.

    Args:
        skip: Pagination offset.
        limit: Maximum number of results.
        group_id: Optional group UUID filter.
        status_filter: Optional status string filter.
        db: Database session (injected).
        _current_user: Authenticated user (any role).

    Returns:
        list[CameraResponse]: Matching camera records.
    """
    stmt = select(Camera)
    if group_id is not None:
        stmt = stmt.where(Camera.group_id == group_id)
    if status_filter is not None:
        stmt = stmt.where(Camera.status == status_filter)
    stmt = stmt.order_by(Camera.name).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return [CameraResponse.model_validate(c) for c in result.scalars().all()]


@router.get(
    "/{camera_id}",
    response_model=CameraResponse,
    summary="Get camera by ID",
)
async def get_camera(
    camera_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> CameraResponse:
    """Fetch a single camera by its UUID.

    Args:
        camera_id: The camera UUID.
        db: Database session (injected).
        _current_user: Authenticated user (any role).

    Returns:
        CameraResponse: The camera record.
    """
    camera = await _get_camera_or_404(camera_id, db)
    return CameraResponse.model_validate(camera)


@router.post(
    "",
    response_model=CameraResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new camera",
)
async def create_camera(
    payload: CameraCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
) -> CameraResponse:
    """Create a new camera record (admin only).

    Args:
        payload: Camera creation data.
        db: Database session (injected).
        _admin: Authenticated admin user.

    Returns:
        CameraResponse: The newly created camera.
    """
    camera = Camera(
        id=str(uuid.uuid4()),
        **payload.model_dump(),
    )
    db.add(camera)
    await db.commit()
    await db.refresh(camera)
    return CameraResponse.model_validate(camera)


@router.put(
    "/{camera_id}",
    response_model=CameraResponse,
    summary="Update a camera",
)
async def update_camera(
    camera_id: str,
    payload: CameraUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
) -> CameraResponse:
    """Update an existing camera record (admin only).

    Args:
        camera_id: UUID of the camera to update.
        payload: Fields to update (partial).
        db: Database session (injected).
        _admin: Authenticated admin user.

    Returns:
        CameraResponse: The updated camera.
    """
    camera = await _get_camera_or_404(camera_id, db)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(camera, field, value)
    camera.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(camera)
    return CameraResponse.model_validate(camera)


@router.delete(
    "/{camera_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    summary="Remove a camera",
)
async def delete_camera(
    camera_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
) -> None:
    """Delete a camera record (admin only).

    Args:
        camera_id: UUID of the camera to delete.
        db: Database session (injected).
        _admin: Authenticated admin user.
    """
    camera = await _get_camera_or_404(camera_id, db)
    await db.delete(camera)
    await db.commit()


@router.get(
    "/{camera_id}/frame",
    response_model=ThermalFrameResponse,
    summary="Get latest thermal frame",
)
async def get_latest_frame(
    camera_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> ThermalFrameResponse:
    """Retrieve the latest thermal frame data for a camera.

    In mock mode the frame is generated by the mock camera service.  In
    production this will pull the latest frame from the camera SDK buffer.

    Args:
        camera_id: UUID of the camera.
        db: Database session (injected).
        _current_user: Authenticated user (any role).

    Returns:
        ThermalFrameResponse: Thermal matrix and summary statistics.
    """
    await _get_camera_or_404(camera_id, db)

    camera_service = get_camera_service(get_settings().CAMERA_MODE)
    # Ensure the camera service knows about this camera
    if not camera_service.is_running(camera_id):
        camera_service.register_camera(camera_id)
        camera_service.start(camera_id)

    frame = camera_service.generate_frame(camera_id)
    return ThermalFrameResponse(
        camera_id=frame.camera_id,
        timestamp=str(frame.timestamp),
        width=frame.width,
        height=frame.height,
        min_temp=frame.min_temp,
        max_temp=frame.max_temp,
        avg_temp=frame.avg_temp,
        matrix=frame.matrix,
    )
