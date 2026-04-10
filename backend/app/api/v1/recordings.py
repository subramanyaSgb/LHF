"""Recording lifecycle and annotation endpoints.

Handles per-heat recording lifecycle (start/stop), listing, flagging,
deletion, and annotations.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import AppException, NotFoundException
from app.api.v1.auth import get_current_user, require_role
from app.models.recording import Recording, RecordingAnnotation, RecordingStatus
from app.models.user import User
from app.schemas.recording import (
    AnnotationCreate,
    AnnotationResponse,
    RecordingResponse,
    RecordingStartRequest,
)

router = APIRouter(prefix="/recordings", tags=["recordings"])


# ── Helpers ─────────────────────────────────────────────────────────────


async def _get_recording_or_404(recording_id: str, db: AsyncSession) -> Recording:
    """Fetch a recording by ID or raise 404.

    Args:
        recording_id: The UUID of the recording.
        db: Active database session.

    Returns:
        Recording: The recording ORM instance.

    Raises:
        NotFoundException: If no recording exists with the given ID.
    """
    result = await db.execute(select(Recording).where(Recording.id == recording_id))
    recording = result.scalar_one_or_none()
    if recording is None:
        raise NotFoundException(detail=f"Recording {recording_id} not found")
    return recording


# ── Endpoints ──────────────────────────────────────────────────────────


@router.get(
    "",
    response_model=list[RecordingResponse],
    summary="List recordings",
)
async def list_recordings(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    camera_id: str | None = Query(None, description="Filter by camera ID"),
    group_id: str | None = Query(None, description="Filter by group ID"),
    heat_number: str | None = Query(None, description="Filter by heat number"),
    ladle_id: str | None = Query(None, description="Filter by ladle ID"),
    status_filter: str | None = Query(None, alias="status", description="Filter by status"),
    is_flagged: bool | None = Query(None, description="Filter by flagged status"),
    date_from: datetime | None = Query(None, description="Start of date range (ISO 8601)"),
    date_to: datetime | None = Query(None, description="End of date range (ISO 8601)"),
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[RecordingResponse]:
    """Return a filtered, paginated list of recordings.

    Args:
        skip: Pagination offset.
        limit: Maximum number of results.
        camera_id: Optional camera UUID filter.
        group_id: Optional group UUID filter.
        heat_number: Optional heat number filter.
        ladle_id: Optional ladle ID filter.
        status_filter: Optional status filter.
        is_flagged: Optional flagged status filter.
        date_from: Optional start of date range.
        date_to: Optional end of date range.
        db: Database session (injected).
        _current_user: Authenticated user (any role).

    Returns:
        list[RecordingResponse]: Matching recording records.
    """
    stmt = select(Recording)
    if camera_id is not None:
        stmt = stmt.where(Recording.camera_id == camera_id)
    if group_id is not None:
        stmt = stmt.where(Recording.group_id == group_id)
    if heat_number is not None:
        stmt = stmt.where(Recording.heat_number == heat_number)
    if ladle_id is not None:
        stmt = stmt.where(Recording.ladle_id == ladle_id)
    if status_filter is not None:
        stmt = stmt.where(Recording.status == status_filter)
    if is_flagged is not None:
        stmt = stmt.where(Recording.is_flagged == is_flagged)
    if date_from is not None:
        stmt = stmt.where(Recording.start_time >= date_from)
    if date_to is not None:
        stmt = stmt.where(Recording.start_time <= date_to)
    stmt = stmt.order_by(Recording.start_time.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return [RecordingResponse.model_validate(r) for r in result.scalars().all()]


@router.get(
    "/{recording_id}",
    response_model=RecordingResponse,
    summary="Get recording by ID",
)
async def get_recording(
    recording_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> RecordingResponse:
    """Fetch a single recording by its UUID.

    Args:
        recording_id: UUID of the recording.
        db: Database session (injected).
        _current_user: Authenticated user (any role).

    Returns:
        RecordingResponse: The recording record.
    """
    recording = await _get_recording_or_404(recording_id, db)
    return RecordingResponse.model_validate(recording)


@router.post(
    "/start",
    response_model=RecordingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new recording",
)
async def start_recording(
    payload: RecordingStartRequest,
    db: AsyncSession = Depends(get_db),
    _operator: User = Depends(require_role("operator")),
) -> RecordingResponse:
    """Start a new recording for a heat cycle (operator+).

    Creates a recording entry with status ``in_progress``.  The actual
    frame capture is managed by the recording-manager service.

    Args:
        payload: Camera/group/heat details for the new recording.
        db: Database session (injected).
        _operator: Authenticated operator or admin.

    Returns:
        RecordingResponse: The newly created recording.
    """
    recording = Recording(
        id=str(uuid.uuid4()),
        camera_id=str(payload.camera_id),
        group_id=str(payload.group_id) if payload.group_id else None,
        heat_number=payload.heat_number,
        ladle_id=payload.ladle_id,
        ladle_life=payload.ladle_life,
        trigger_source=payload.trigger_source,
        status=RecordingStatus.IN_PROGRESS,
        start_time=datetime.now(timezone.utc),
    )
    db.add(recording)
    await db.flush()
    await db.refresh(recording)
    return RecordingResponse.model_validate(recording)


@router.post(
    "/{recording_id}/stop",
    response_model=RecordingResponse,
    summary="Stop an active recording",
)
async def stop_recording(
    recording_id: str,
    db: AsyncSession = Depends(get_db),
    _operator: User = Depends(require_role("operator")),
) -> RecordingResponse:
    """Stop an in-progress recording (operator+).

    Calculates and stores the duration based on start and end times.

    Args:
        recording_id: UUID of the recording to stop.
        db: Database session (injected).
        _operator: Authenticated operator or admin.

    Returns:
        RecordingResponse: The updated recording.

    Raises:
        AppException: If the recording is not in progress.
    """
    recording = await _get_recording_or_404(recording_id, db)

    if recording.status != RecordingStatus.IN_PROGRESS:
        raise AppException(
            status_code=400,
            detail=f"Recording is not in progress (current status: {recording.status.value})",
        )

    now = datetime.now(timezone.utc)
    recording.status = RecordingStatus.COMPLETED
    recording.end_time = now

    # Calculate duration in seconds
    if recording.start_time:
        start = recording.start_time
        if isinstance(start, str):
            start = datetime.fromisoformat(start)
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        recording.duration = int((now - start).total_seconds())

    await db.flush()
    await db.refresh(recording)
    return RecordingResponse.model_validate(recording)


@router.put(
    "/{recording_id}/flag",
    response_model=RecordingResponse,
    summary="Toggle recording flag",
)
async def toggle_recording_flag(
    recording_id: str,
    db: AsyncSession = Depends(get_db),
    _operator: User = Depends(require_role("operator")),
) -> RecordingResponse:
    """Toggle the flagged status of a recording (operator+).

    Flagged recordings are retained longer per the retention policy.

    Args:
        recording_id: UUID of the recording.
        db: Database session (injected).
        _operator: Authenticated operator or admin.

    Returns:
        RecordingResponse: The updated recording.
    """
    recording = await _get_recording_or_404(recording_id, db)
    recording.is_flagged = not recording.is_flagged
    await db.flush()
    await db.refresh(recording)
    return RecordingResponse.model_validate(recording)


@router.delete(
    "/{recording_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    summary="Delete a recording",
)
async def delete_recording(
    recording_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
) -> None:
    """Delete a recording record (admin only).

    Args:
        recording_id: UUID of the recording to delete.
        db: Database session (injected).
        _admin: Authenticated admin user.
    """
    recording = await _get_recording_or_404(recording_id, db)
    await db.delete(recording)
    await db.flush()


# ── Annotation Endpoints ───────────────────────────────────────────────


@router.get(
    "/{recording_id}/annotations",
    response_model=list[AnnotationResponse],
    summary="List annotations for a recording",
)
async def list_annotations(
    recording_id: str,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[AnnotationResponse]:
    """Return all annotations for a given recording.

    Args:
        recording_id: UUID of the recording.
        skip: Pagination offset.
        limit: Maximum number of results.
        db: Database session (injected).
        _current_user: Authenticated user (any role).

    Returns:
        list[AnnotationResponse]: Annotations ordered by timestamp.
    """
    await _get_recording_or_404(recording_id, db)

    stmt = (
        select(RecordingAnnotation)
        .where(RecordingAnnotation.recording_id == recording_id)
        .order_by(RecordingAnnotation.timestamp_seconds)
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return [AnnotationResponse.model_validate(a) for a in result.scalars().all()]


@router.post(
    "/{recording_id}/annotations",
    response_model=AnnotationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add an annotation to a recording",
)
async def create_annotation(
    recording_id: str,
    payload: AnnotationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("operator")),
) -> AnnotationResponse:
    """Create a new annotation on a recording (operator+).

    Args:
        recording_id: UUID of the recording.
        payload: Annotation content and timestamp.
        db: Database session (injected).
        current_user: Authenticated operator or admin.

    Returns:
        AnnotationResponse: The newly created annotation.
    """
    await _get_recording_or_404(recording_id, db)

    annotation = RecordingAnnotation(
        id=str(uuid.uuid4()),
        recording_id=recording_id,
        timestamp_seconds=payload.timestamp_seconds,
        text=payload.text,
        created_by=current_user.id,
    )
    db.add(annotation)
    await db.flush()
    await db.refresh(annotation)
    return AnnotationResponse.model_validate(annotation)
