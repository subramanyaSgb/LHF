"""Report generation and retrieval endpoints.

Supports listing generated reports, triggering on-demand generation,
downloading report files, and administrative deletion.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.database import get_db
from app.core.exceptions import AppException, NotFoundException
from app.api.v1.auth import get_current_user, require_role
from app.models.report import Report, ReportStatus, ReportType
from app.models.user import User
from app.schemas.report import ReportGenerateRequest, ReportResponse

router = APIRouter(prefix="/reports", tags=["reports"])
settings = get_settings()


# ── Helpers ─────────────────────────────────────────────────────────────


async def _get_report_or_404(report_id: str, db: AsyncSession) -> Report:
    """Fetch a report by ID or raise 404.

    Args:
        report_id: The UUID of the report.
        db: Active database session.

    Returns:
        Report: The report ORM instance.

    Raises:
        NotFoundException: If no report exists with the given ID.
    """
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if report is None:
        raise NotFoundException(detail=f"Report {report_id} not found")
    return report


# ── Endpoints ──────────────────────────────────────────────────────────


@router.get(
    "",
    response_model=list[ReportResponse],
    summary="List reports",
)
async def list_reports(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    report_type: str | None = Query(None, alias="type", description="Filter by report type"),
    status_filter: str | None = Query(None, alias="status", description="Filter by status"),
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[ReportResponse]:
    """Return a filtered, paginated list of generated reports.

    Args:
        skip: Pagination offset.
        limit: Maximum number of results.
        report_type: Optional report type filter (daily/weekly/monthly/custom).
        status_filter: Optional status filter.
        db: Database session (injected).
        _current_user: Authenticated user (any role).

    Returns:
        list[ReportResponse]: Matching report records.
    """
    stmt = select(Report)
    if report_type is not None:
        stmt = stmt.where(Report.type == report_type)
    if status_filter is not None:
        stmt = stmt.where(Report.status == status_filter)
    stmt = stmt.order_by(Report.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return [ReportResponse.model_validate(r) for r in result.scalars().all()]


@router.post(
    "/generate",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a report",
)
async def generate_report(
    payload: ReportGenerateRequest,
    db: AsyncSession = Depends(get_db),
    _operator: User = Depends(require_role("operator")),
) -> ReportResponse:
    """Trigger on-demand report generation (operator+).

    Creates a report record with status ``pending``.  The report-generator
    service picks up pending rows and produces the actual file
    asynchronously.

    Args:
        payload: Report parameters (type, date range, optional sections).
        db: Database session (injected).
        _operator: Authenticated operator or admin.

    Returns:
        ReportResponse: The newly created report record.
    """
    date_from_str = payload.date_from.strftime("%Y-%m-%d")
    date_to_str = payload.date_to.strftime("%Y-%m-%d")
    title = f"{payload.type.capitalize()} Report — {date_from_str} to {date_to_str}"

    report = Report(
        id=str(uuid.uuid4()),
        type=payload.type,
        title=title,
        status=ReportStatus.PENDING,
        date_from=payload.date_from,
        date_to=payload.date_to,
    )
    db.add(report)
    await db.flush()
    await db.refresh(report)
    return ReportResponse.model_validate(report)


@router.get(
    "/{report_id}/download",
    summary="Download report file",
)
async def download_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> FileResponse:
    """Download the generated report file.

    Args:
        report_id: UUID of the report.
        db: Database session (injected).
        _current_user: Authenticated user (any role).

    Returns:
        FileResponse: The report file streamed to the client.

    Raises:
        AppException: If the report has not been generated yet.
        NotFoundException: If the report file is missing from disk.
    """
    report = await _get_report_or_404(report_id, db)

    if report.status != ReportStatus.COMPLETED or not report.file_path:
        raise AppException(
            status_code=400,
            detail="Report has not been generated yet",
        )

    file = Path(report.file_path)
    if not file.exists():
        raise NotFoundException(detail="Report file not found on disk")

    return FileResponse(
        path=str(file),
        filename=file.name,
        media_type="application/pdf",
    )


@router.delete(
    "/{report_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    summary="Delete a report",
)
async def delete_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
) -> None:
    """Delete a report record (admin only).

    The physical file, if any, is also removed from disk.

    Args:
        report_id: UUID of the report.
        db: Database session (injected).
        _admin: Authenticated admin user.
    """
    report = await _get_report_or_404(report_id, db)

    # Remove physical file if it exists
    if report.file_path:
        file = Path(report.file_path)
        if file.exists():
            file.unlink()

    await db.delete(report)
    await db.flush()
