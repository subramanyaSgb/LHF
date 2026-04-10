"""Camera group CRUD and stitch-mapping endpoints.

Groups logically cluster cameras (e.g. all cameras covering one LHF) and
support optional panoramic stitching configurations.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.api.v1.auth import get_current_user, require_role
from app.models.camera import Camera
from app.models.group import CameraGroup, StitchMapping
from app.models.user import User
from app.schemas.group import (
    AssignCameraRequest,
    GroupCreate,
    GroupResponse,
    GroupUpdate,
    StitchMappingSchema,
)

router = APIRouter(prefix="/groups", tags=["groups"])


# ── Helpers ─────────────────────────────────────────────────────────────


async def _get_group_or_404(group_id: str, db: AsyncSession) -> CameraGroup:
    """Fetch a camera group by ID with eager-loaded relations, or raise 404.

    Args:
        group_id: The UUID of the group.
        db: Active database session.

    Returns:
        CameraGroup: The group ORM instance with cameras and stitch_mappings.

    Raises:
        NotFoundException: If no group exists with the given ID.
    """
    result = await db.execute(
        select(CameraGroup)
        .options(selectinload(CameraGroup.cameras), selectinload(CameraGroup.stitch_mappings))
        .where(CameraGroup.id == group_id)
    )
    group = result.scalar_one_or_none()
    if group is None:
        raise NotFoundException(detail=f"Group {group_id} not found")
    return group


def _build_group_response(group: CameraGroup) -> GroupResponse:
    """Build a GroupResponse from an ORM instance.

    Args:
        group: The CameraGroup ORM instance (with relations loaded).

    Returns:
        GroupResponse: Serialised group data.
    """
    return GroupResponse(
        id=group.id,
        name=group.name,
        description=group.description,
        stitch_enabled=group.stitch_enabled,
        stitch_rows=group.stitch_rows,
        stitch_cols=group.stitch_cols,
        camera_ids=[c.id for c in group.cameras],
        stitch_mappings=[
            StitchMappingSchema(camera_id=sm.camera_id, position=int(sm.position))
            for sm in group.stitch_mappings
        ],
        created_at=group.created_at,
        updated_at=group.updated_at,
    )


# ── Endpoints ───────────────────────────────────────────────────────────


@router.get(
    "",
    response_model=list[GroupResponse],
    summary="List all camera groups",
)
async def list_groups(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[GroupResponse]:
    """Return a paginated list of camera groups with camera IDs.

    Args:
        skip: Pagination offset.
        limit: Maximum number of results.
        db: Database session (injected).
        _current_user: Authenticated user (any role).

    Returns:
        list[GroupResponse]: Camera groups with nested camera_ids.
    """
    stmt = (
        select(CameraGroup)
        .options(selectinload(CameraGroup.cameras), selectinload(CameraGroup.stitch_mappings))
        .order_by(CameraGroup.name)
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return [_build_group_response(g) for g in result.scalars().all()]


@router.get(
    "/{group_id}",
    response_model=GroupResponse,
    summary="Get group detail with stitch mappings",
)
async def get_group(
    group_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> GroupResponse:
    """Fetch a single group with its cameras and stitch mappings.

    Args:
        group_id: UUID of the group.
        db: Database session (injected).
        _current_user: Authenticated user (any role).

    Returns:
        GroupResponse: Group detail including stitch_mappings.
    """
    group = await _get_group_or_404(group_id, db)
    return _build_group_response(group)


@router.post(
    "",
    response_model=GroupResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a camera group",
)
async def create_group(
    payload: GroupCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
) -> GroupResponse:
    """Create a new camera group (admin only).

    Args:
        payload: Group creation data.
        db: Database session (injected).
        _admin: Authenticated admin user.

    Returns:
        GroupResponse: The newly created group.
    """
    group = CameraGroup(
        id=str(uuid.uuid4()),
        **payload.model_dump(),
    )
    db.add(group)
    await db.flush()
    await db.refresh(group)
    return GroupResponse(
        id=group.id,
        name=group.name,
        description=group.description,
        stitch_enabled=group.stitch_enabled,
        stitch_rows=group.stitch_rows,
        stitch_cols=group.stitch_cols,
        camera_ids=[],
        stitch_mappings=[],
        created_at=group.created_at,
        updated_at=group.updated_at,
    )


@router.put(
    "/{group_id}",
    response_model=GroupResponse,
    summary="Update a camera group",
)
async def update_group(
    group_id: str,
    payload: GroupUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
) -> GroupResponse:
    """Update an existing camera group (admin only).

    Args:
        group_id: UUID of the group to update.
        payload: Fields to update (partial).
        db: Database session (injected).
        _admin: Authenticated admin user.

    Returns:
        GroupResponse: The updated group.
    """
    group = await _get_group_or_404(group_id, db)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(group, field, value)
    group.updated_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(group)
    return _build_group_response(group)


@router.delete(
    "/{group_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    summary="Delete a camera group",
)
async def delete_group(
    group_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
) -> None:
    """Delete a group, un-assigning all cameras from it (admin only).

    Args:
        group_id: UUID of the group to delete.
        db: Database session (injected).
        _admin: Authenticated admin user.
    """
    group = await _get_group_or_404(group_id, db)
    # Un-assign cameras so they are not orphaned by the FK constraint
    for camera in group.cameras:
        camera.group_id = None
    await db.flush()
    await db.delete(group)
    await db.flush()


@router.post(
    "/{group_id}/cameras",
    response_model=GroupResponse,
    summary="Assign camera to group",
)
async def assign_camera_to_group(
    group_id: str,
    payload: AssignCameraRequest,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
) -> GroupResponse:
    """Assign an existing camera to a group (admin only).

    Args:
        group_id: UUID of the target group.
        payload: Request body containing camera_id.
        db: Database session (injected).
        _admin: Authenticated admin user.

    Returns:
        GroupResponse: The updated group with new camera list.
    """
    group = await _get_group_or_404(group_id, db)

    camera_id = str(payload.camera_id)
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()
    if camera is None:
        raise NotFoundException(detail=f"Camera {camera_id} not found")

    camera.group_id = group_id
    await db.flush()
    # Re-fetch to get updated relations
    group = await _get_group_or_404(group_id, db)
    return _build_group_response(group)


@router.delete(
    "/{group_id}/cameras/{camera_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    summary="Remove camera from group",
)
async def remove_camera_from_group(
    group_id: str,
    camera_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
) -> None:
    """Remove a camera from a group by setting its group_id to NULL (admin only).

    Args:
        group_id: UUID of the group.
        camera_id: UUID of the camera to remove.
        db: Database session (injected).
        _admin: Authenticated admin user.
    """
    result = await db.execute(
        select(Camera).where(Camera.id == camera_id, Camera.group_id == group_id)
    )
    camera = result.scalar_one_or_none()
    if camera is None:
        raise NotFoundException(
            detail=f"Camera {camera_id} not found in group {group_id}"
        )
    camera.group_id = None
    await db.flush()


@router.put(
    "/{group_id}/stitch",
    response_model=GroupResponse,
    summary="Update stitch mappings",
)
async def update_stitch_mappings(
    group_id: str,
    payload: GroupUpdate,
    mappings: list[StitchMappingSchema] = [],
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
) -> GroupResponse:
    """Replace stitch mappings for a group (admin only).

    Existing mappings are deleted and replaced with the new set.
    Stitch configuration (rows, cols, enabled) can also be updated
    through the payload.

    Args:
        group_id: UUID of the group.
        payload: Stitch grid configuration updates.
        mappings: New stitch mapping positions.
        db: Database session (injected).
        _admin: Authenticated admin user.

    Returns:
        GroupResponse: Updated group with new stitch mappings.
    """
    group = await _get_group_or_404(group_id, db)

    # Update stitch grid configuration from payload
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(group, field, value)

    # Delete existing mappings
    for sm in list(group.stitch_mappings):
        await db.delete(sm)

    # Create new mappings
    for item in mappings:
        sm = StitchMapping(
            id=str(uuid.uuid4()),
            group_id=group_id,
            camera_id=str(item.camera_id),
            position=str(item.position),
        )
        db.add(sm)

    group.updated_at = datetime.now(timezone.utc)
    await db.flush()

    # Re-fetch with updated relations
    group = await _get_group_or_404(group_id, db)
    return _build_group_response(group)
