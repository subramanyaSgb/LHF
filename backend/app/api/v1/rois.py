"""Region of Interest (ROI) CRUD and data endpoints.

ROIs define sub-regions within a camera's field of view for focused
temperature monitoring and threshold evaluation.
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
from app.models.roi import ROI, ROIData, ROIPoint
from app.models.user import User
from app.schemas.roi import (
    ROICreate,
    ROIDataResponse,
    ROIPointSchema,
    ROIResponse,
    ROIUpdate,
)

router = APIRouter(tags=["rois"])


# ── Helpers ─────────────────────────────────────────────────────────────


async def _get_camera_or_404(camera_id: str, db: AsyncSession) -> Camera:
    """Fetch a camera by ID or raise 404.

    Args:
        camera_id: The camera UUID.
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


async def _get_roi_or_404(roi_id: str, db: AsyncSession) -> ROI:
    """Fetch an ROI by ID or raise 404.

    Args:
        roi_id: The ROI UUID.
        db: Active database session.

    Returns:
        ROI: The ROI ORM instance.

    Raises:
        NotFoundException: If no ROI exists with the given ID.
    """
    result = await db.execute(select(ROI).where(ROI.id == roi_id))
    roi = result.scalar_one_or_none()
    if roi is None:
        raise NotFoundException(detail=f"ROI {roi_id} not found")
    return roi


# ── Camera-scoped ROI endpoints ─────────────────────────────────────────


@router.get(
    "/cameras/{camera_id}/rois",
    response_model=list[ROIResponse],
    summary="List ROIs for a camera",
)
async def list_camera_rois(
    camera_id: str,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[ROIResponse]:
    """Return all ROIs defined on the given camera.

    Args:
        camera_id: UUID of the parent camera.
        skip: Pagination offset.
        limit: Maximum number of results.
        db: Database session (injected).
        _current_user: Authenticated user (any role).

    Returns:
        list[ROIResponse]: Matching ROI records.
    """
    await _get_camera_or_404(camera_id, db)
    stmt = (
        select(ROI)
        .where(ROI.camera_id == camera_id)
        .order_by(ROI.name)
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return [ROIResponse.model_validate(r) for r in result.scalars().all()]


@router.post(
    "/cameras/{camera_id}/rois",
    response_model=ROIResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an ROI on a camera",
)
async def create_roi(
    camera_id: str,
    payload: ROICreate,
    db: AsyncSession = Depends(get_db),
    _operator: User = Depends(require_role("operator")),
) -> ROIResponse:
    """Define a new ROI on the given camera (operator+).

    The ``camera_id`` from the URL takes precedence over the body field.

    Args:
        camera_id: UUID of the parent camera.
        payload: ROI creation data (name, shape, points, display options).
        db: Database session (injected).
        _operator: Authenticated operator or admin.

    Returns:
        ROIResponse: The newly created ROI.
    """
    await _get_camera_or_404(camera_id, db)

    roi_id = str(uuid.uuid4())
    roi = ROI(
        id=roi_id,
        camera_id=camera_id,
        name=payload.name,
        shape=payload.shape,
        color=payload.color,
        font_size=payload.font_size,
        show_min=payload.show_min,
        show_max=payload.show_max,
        show_avg=payload.show_avg,
        alert_rule_id=str(payload.alert_rule_id) if payload.alert_rule_id else None,
    )
    db.add(roi)

    # Create ROIPoint children
    for idx, pt in enumerate(payload.points):
        point = ROIPoint(
            id=str(uuid.uuid4()),
            roi_id=roi_id,
            x=pt.x,
            y=pt.y,
            order=idx,
        )
        db.add(point)

    await db.commit()
    await db.refresh(roi)
    return ROIResponse.model_validate(roi)


# ── ROI-level endpoints (no camera prefix) ──────────────────────────────


@router.put(
    "/rois/{roi_id}",
    response_model=ROIResponse,
    summary="Update an ROI",
)
async def update_roi(
    roi_id: str,
    payload: ROIUpdate,
    db: AsyncSession = Depends(get_db),
    _operator: User = Depends(require_role("operator")),
) -> ROIResponse:
    """Update an existing ROI (operator+).

    If ``points`` is provided the existing points are replaced entirely.

    Args:
        roi_id: UUID of the ROI.
        payload: Fields to update (partial).
        db: Database session (injected).
        _operator: Authenticated operator or admin.

    Returns:
        ROIResponse: The updated ROI.
    """
    roi = await _get_roi_or_404(roi_id, db)
    update_data = payload.model_dump(exclude_unset=True)

    # Handle points separately — replace all
    new_points = update_data.pop("points", None)
    for field, value in update_data.items():
        if field == "alert_rule_id" and value is not None:
            value = str(value)
        setattr(roi, field, value)

    if new_points is not None:
        # Delete old points
        for pt in list(roi.points):
            await db.delete(pt)
        # Create new points
        for idx, pt_data in enumerate(new_points):
            point = ROIPoint(
                id=str(uuid.uuid4()),
                roi_id=roi_id,
                x=pt_data["x"],
                y=pt_data["y"],
                order=idx,
            )
            db.add(point)

    roi.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(roi)
    return ROIResponse.model_validate(roi)


@router.delete(
    "/rois/{roi_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    summary="Delete an ROI",
)
async def delete_roi(
    roi_id: str,
    db: AsyncSession = Depends(get_db),
    _operator: User = Depends(require_role("operator")),
) -> None:
    """Delete an ROI (operator+).

    Args:
        roi_id: UUID of the ROI.
        db: Database session (injected).
        _operator: Authenticated operator or admin.
    """
    roi = await _get_roi_or_404(roi_id, db)
    await db.delete(roi)
    await db.commit()


@router.get(
    "/rois/{roi_id}/data",
    response_model=list[ROIDataResponse],
    summary="Get ROI temperature data",
)
async def get_roi_data(
    roi_id: str,
    date_from: datetime | None = Query(None, description="Start of time range (ISO 8601)"),
    date_to: datetime | None = Query(None, description="End of time range (ISO 8601)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=1000, description="Max records to return"),
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[ROIDataResponse]:
    """Retrieve historical temperature readings for an ROI.

    Args:
        roi_id: UUID of the ROI.
        date_from: Optional start of the query window.
        date_to: Optional end of the query window.
        skip: Pagination offset.
        limit: Maximum number of results.
        db: Database session (injected).
        _current_user: Authenticated user (any role).

    Returns:
        list[ROIDataResponse]: Temperature data points.
    """
    await _get_roi_or_404(roi_id, db)
    stmt = select(ROIData).where(ROIData.roi_id == roi_id)
    if date_from is not None:
        stmt = stmt.where(ROIData.timestamp >= date_from)
    if date_to is not None:
        stmt = stmt.where(ROIData.timestamp <= date_to)
    stmt = stmt.order_by(ROIData.timestamp.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return [ROIDataResponse.model_validate(d) for d in result.scalars().all()]
