"""Analytics endpoints for dashboard charts and summaries.

Provides aggregated views of temperature timelines, heat summaries,
alert frequencies, ladle lifecycle, and camera uptime.  Returns mock
sample data where real historical data is not yet available.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select, func as sa_func, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.alert import Alert
from app.models.camera import Camera
from app.models.recording import Recording
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["analytics"])


# ── Response schemas (inline — lightweight analytics-only models) ──────


class TemperatureTimelinePoint(BaseModel):
    """Single point in a temperature timeline chart."""

    timestamp: datetime
    camera_id: str | None = None
    min_temp: float
    max_temp: float
    avg_temp: float


class HeatSummaryItem(BaseModel):
    """Summary of a single heat cycle."""

    recording_id: str
    heat_number: str | None = None
    ladle_id: str | None = None
    ladle_life: int | None = None
    camera_id: str | None = None
    group_id: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    duration: int | None = None
    peak_temp: float | None = None
    avg_temp: float | None = None
    alert_count: int = 0
    is_flagged: bool = False
    status: str = ""


class AlertFrequencyItem(BaseModel):
    """Alert count for a time bucket."""

    period: str
    count: int


class LadleLifeItem(BaseModel):
    """Aggregated ladle usage statistics."""

    ladle_id: str
    total_heats: int
    max_ladle_life: int | None = None
    has_flags: bool = False
    first_seen: datetime | None = None
    last_seen: datetime | None = None


class CameraUptimeItem(BaseModel):
    """Camera uptime summary."""

    camera_id: str
    camera_name: str
    status: str
    uptime_pct: float
    last_seen: datetime | None = None


# ── Temperature Timeline ────────────────────────────────────────────────


@router.get(
    "/temperature-timeline",
    response_model=list[TemperatureTimelinePoint],
    summary="Temperature data over time",
)
async def temperature_timeline(
    date_from: datetime | None = Query(None, description="Start of time range (ISO 8601)"),
    date_to: datetime | None = Query(None, description="End of time range (ISO 8601)"),
    camera_id: str | None = Query(None, description="Filter by camera ID"),
    group_id: str | None = Query(None, description="Filter by group ID"),
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[TemperatureTimelinePoint]:
    """Return temperature readings over a time range for charting.

    Returns mock sample data as real historical temperature data is
    not yet stored.  In production this will query per-frame or per-ROI
    temperature history.

    Args:
        date_from: Optional start of the query window.
        date_to: Optional end of the query window.
        camera_id: Optional camera UUID filter.
        group_id: Optional group UUID filter.
        db: Database session (injected).
        _current_user: Authenticated user (any role).

    Returns:
        list[TemperatureTimelinePoint]: Chronological temperature readings.
    """
    # Generate mock data for now
    now = datetime.now(timezone.utc)
    start = date_from or (now - timedelta(hours=4))
    points: list[TemperatureTimelinePoint] = []
    import random

    random.seed(42)  # Deterministic mock data
    current = start
    base_temp = 1200.0
    while current < (date_to or now) and len(points) < 200:
        drift = random.uniform(-15.0, 15.0)
        avg = base_temp + drift
        points.append(
            TemperatureTimelinePoint(
                timestamp=current,
                camera_id=camera_id,
                min_temp=round(avg - random.uniform(20, 50), 1),
                max_temp=round(avg + random.uniform(20, 80), 1),
                avg_temp=round(avg, 1),
            )
        )
        current += timedelta(minutes=1)
        base_temp += random.uniform(-2.0, 2.0)

    return points


# ── Heat Summaries ─────────────────────────────────────────────────────


@router.get(
    "/heat-summaries",
    response_model=list[HeatSummaryItem],
    summary="Heat summary data",
)
async def heat_summaries(
    date_from: datetime | None = Query(None, description="Start of date range (ISO 8601)"),
    date_to: datetime | None = Query(None, description="End of date range (ISO 8601)"),
    group_id: str | None = Query(None, description="Filter by group ID"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[HeatSummaryItem]:
    """Return per-heat summary data aggregated from recordings.

    Args:
        date_from: Optional date range start.
        date_to: Optional date range end.
        group_id: Optional group UUID filter.
        skip: Pagination offset.
        limit: Maximum number of results.
        db: Database session (injected).
        _current_user: Authenticated user (any role).

    Returns:
        list[HeatSummaryItem]: One summary per heat recording.
    """
    stmt = select(Recording).where(Recording.heat_number.isnot(None))
    if group_id is not None:
        stmt = stmt.where(Recording.group_id == group_id)
    if date_from is not None:
        stmt = stmt.where(Recording.start_time >= date_from)
    if date_to is not None:
        stmt = stmt.where(Recording.start_time <= date_to)
    stmt = stmt.order_by(Recording.start_time.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    recordings = result.scalars().all()

    return [
        HeatSummaryItem(
            recording_id=rec.id,
            heat_number=rec.heat_number,
            ladle_id=rec.ladle_id,
            ladle_life=rec.ladle_life,
            camera_id=rec.camera_id,
            group_id=rec.group_id,
            start_time=rec.start_time,
            end_time=rec.end_time,
            duration=rec.duration,
            peak_temp=rec.peak_temp,
            avg_temp=rec.avg_temp,
            alert_count=rec.alert_count,
            is_flagged=rec.is_flagged,
            status=rec.status.value if hasattr(rec.status, "value") else str(rec.status),
        )
        for rec in recordings
    ]


# ── Alert Frequency ────────────────────────────────────────────────────


@router.get(
    "/alert-frequency",
    response_model=list[AlertFrequencyItem],
    summary="Alert count by hour/day",
)
async def alert_frequency(
    date_from: datetime | None = Query(None, description="Start of time range (ISO 8601)"),
    date_to: datetime | None = Query(None, description="End of time range (ISO 8601)"),
    interval: str = Query("day", description="Aggregation interval: 'hour' or 'day'"),
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[AlertFrequencyItem]:
    """Return alert counts aggregated by hour or day.

    Args:
        date_from: Optional start of the query window.
        date_to: Optional end of the query window.
        interval: Aggregation bucket -- ``hour`` or ``day``.
        db: Database session (injected).
        _current_user: Authenticated user (any role).

    Returns:
        list[AlertFrequencyItem]: Alert count per time bucket.
    """
    now = datetime.now(timezone.utc)
    start = date_from or (now - timedelta(days=7))
    end = date_to or now

    stmt = (
        select(Alert)
        .where(Alert.created_at >= start, Alert.created_at <= end)
        .order_by(Alert.created_at)
    )
    result = await db.execute(stmt)
    alerts = result.scalars().all()

    buckets: dict[str, int] = {}
    for alert in alerts:
        ts: datetime = alert.created_at
        if isinstance(ts, str):
            ts = datetime.fromisoformat(ts)
        if interval == "hour":
            key = ts.strftime("%Y-%m-%dT%H:00:00")
        else:
            key = ts.strftime("%Y-%m-%d")
        buckets[key] = buckets.get(key, 0) + 1

    return [
        AlertFrequencyItem(period=k, count=v) for k, v in sorted(buckets.items())
    ]


# ── Ladle Life ─────────────────────────────────────────────────────────


@router.get(
    "/ladle-life",
    response_model=list[LadleLifeItem],
    summary="Ladle usage statistics",
)
async def ladle_life_stats(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[LadleLifeItem]:
    """Return aggregated ladle usage statistics from recordings.

    Groups recordings by ``ladle_id`` and computes total heats, max
    ladle life value, and whether any recording was flagged.

    Args:
        skip: Pagination offset.
        limit: Maximum number of results.
        db: Database session (injected).
        _current_user: Authenticated user (any role).

    Returns:
        list[LadleLifeItem]: One row per ladle_id.
    """
    stmt = (
        select(
            Recording.ladle_id,
            sa_func.count(Recording.id).label("total_heats"),
            sa_func.max(Recording.ladle_life).label("max_ladle_life"),
            sa_func.max(
                case((Recording.is_flagged == True, 1), else_=0)  # noqa: E712
            ).label("has_flags"),
            sa_func.min(Recording.start_time).label("first_seen"),
            sa_func.max(Recording.start_time).label("last_seen"),
        )
        .where(Recording.ladle_id.isnot(None))
        .group_by(Recording.ladle_id)
        .order_by(sa_func.max(Recording.start_time).desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    rows = result.all()

    return [
        LadleLifeItem(
            ladle_id=row.ladle_id,
            total_heats=row.total_heats,
            max_ladle_life=row.max_ladle_life,
            has_flags=bool(row.has_flags),
            first_seen=row.first_seen,
            last_seen=row.last_seen,
        )
        for row in rows
    ]


# ── Camera Uptime ─────────────────────────────────────────────────────


@router.get(
    "/camera-uptime",
    response_model=list[CameraUptimeItem],
    summary="Camera uptime percentages",
)
async def camera_uptime(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[CameraUptimeItem]:
    """Return uptime information for each camera.

    Uptime is derived from the camera's ``status`` and ``last_seen``
    fields.  A production implementation would track heartbeat history
    for accurate percentages.

    Args:
        db: Database session (injected).
        _current_user: Authenticated user (any role).

    Returns:
        list[CameraUptimeItem]: One entry per camera with uptime metrics.
    """
    stmt = select(Camera).order_by(Camera.name)
    result = await db.execute(stmt)
    cameras = result.scalars().all()

    items: list[CameraUptimeItem] = []
    for cam in cameras:
        status_val = cam.status.value if hasattr(cam.status, "value") else str(cam.status)
        is_online = status_val in ("online", "recording")
        uptime_pct = 100.0 if is_online else 0.0
        items.append(
            CameraUptimeItem(
                camera_id=cam.id,
                camera_name=cam.name,
                status=status_val,
                uptime_pct=uptime_pct,
                last_seen=cam.last_seen,
            )
        )
    return items
