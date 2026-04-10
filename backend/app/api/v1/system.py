"""System health, shift notes, and audit log endpoints.

Provides operational endpoints for monitoring system health, managing
shift handover notes, and querying the immutable audit trail.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.v1.auth import get_current_user, require_role
from app.models.operational import AuditEntry, ShiftNote
from app.models.user import User
from app.schemas.operational import (
    AuditEntryResponse,
    ShiftNoteCreate,
    ShiftNoteResponse,
    SystemHealthResponse,
)
from app.services.system_monitor import system_monitor

router = APIRouter(prefix="/system", tags=["system"])


# ── Health ──────────────────────────────────────────────────────────────


@router.get(
    "/health",
    response_model=SystemHealthResponse,
    summary="Get system health status",
)
async def get_system_health(
    _current_user: User = Depends(get_current_user),
) -> SystemHealthResponse:
    """Return an aggregated snapshot of server, PLC, and network health.

    Args:
        _current_user: Authenticated user (any role).

    Returns:
        SystemHealthResponse: Health metrics for all subsystems.
    """
    health = system_monitor.get_full_health()
    return SystemHealthResponse(**health)


# ── Shift Notes ─────────────────────────────────────────────────────────


@router.get(
    "/shift-notes",
    response_model=list[ShiftNoteResponse],
    summary="List shift notes",
)
async def list_shift_notes(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    shift_date: date | None = Query(None, description="Filter by shift date"),
    shift_type: str | None = Query(None, description="Filter by shift type (day/night)"),
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[ShiftNoteResponse]:
    """Return a filtered, paginated list of shift handover notes.

    Args:
        skip: Pagination offset.
        limit: Maximum number of results.
        shift_date: Optional date filter.
        shift_type: Optional shift type filter.
        db: Database session (injected).
        _current_user: Authenticated user (any role).

    Returns:
        list[ShiftNoteResponse]: Matching shift notes.
    """
    stmt = select(ShiftNote)
    if shift_date is not None:
        stmt = stmt.where(ShiftNote.shift_date == shift_date)
    if shift_type is not None:
        stmt = stmt.where(ShiftNote.shift_type == shift_type)
    stmt = stmt.order_by(ShiftNote.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return [ShiftNoteResponse.model_validate(n) for n in result.scalars().all()]


@router.post(
    "/shift-notes",
    response_model=ShiftNoteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a shift note",
)
async def create_shift_note(
    payload: ShiftNoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("operator")),
) -> ShiftNoteResponse:
    """Create a new shift handover note (operator+).

    The shift date is automatically set to today's date.

    Args:
        payload: Shift type and note content.
        db: Database session (injected).
        current_user: Authenticated operator or admin.

    Returns:
        ShiftNoteResponse: The newly created shift note.
    """
    note = ShiftNote(
        id=str(uuid.uuid4()),
        shift_date=date.today(),
        shift_type=payload.shift_type,
        content=payload.content,
        created_by=current_user.id,
    )
    db.add(note)
    await db.flush()
    await db.refresh(note)
    return ShiftNoteResponse.model_validate(note)


# ── Audit Log ──────────────────────────────────────────────────────────


@router.get(
    "/audit-log",
    response_model=list[AuditEntryResponse],
    summary="Query audit log",
)
async def list_audit_log(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    action: str | None = Query(None, description="Filter by action type"),
    user_id: str | None = Query(None, description="Filter by user ID"),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
) -> list[AuditEntryResponse]:
    """Return a paginated audit trail (admin only).

    Args:
        skip: Pagination offset.
        limit: Maximum number of results.
        action: Optional action type filter.
        user_id: Optional user UUID filter.
        db: Database session (injected).
        _admin: Authenticated admin user.

    Returns:
        list[AuditEntryResponse]: Audit log entries ordered newest first.
    """
    stmt = select(AuditEntry)
    if action is not None:
        stmt = stmt.where(AuditEntry.action == action)
    if user_id is not None:
        stmt = stmt.where(AuditEntry.user_id == user_id)
    stmt = stmt.order_by(AuditEntry.timestamp.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return [AuditEntryResponse.model_validate(e) for e in result.scalars().all()]
