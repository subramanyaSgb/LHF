"""Analytics Pydantic schemas.

Response models for the analytics dashboard endpoints: temperature
timelines, heat summaries, alert frequency, ladle life, and camera uptime.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class TemperatureTimelinePoint(BaseModel):
    """Single temperature data point for timeline charting."""

    timestamp: datetime
    roi_id: UUID
    min_temp: float
    max_temp: float
    avg_temp: float


class HeatSummaryItem(BaseModel):
    """Summary of a single heat recording."""

    recording_id: UUID
    heat_number: str | None = None
    ladle_id: str | None = None
    ladle_life: int | None = None
    group_id: UUID | None = None
    camera_id: UUID
    start_time: datetime
    end_time: datetime | None = None
    duration: int | None = None
    peak_temp: float | None = None
    avg_temp: float | None = None
    alert_count: int = 0
    is_flagged: bool = False
    status: str


class AlertFrequencyItem(BaseModel):
    """Alert count for a single time bucket."""

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
    """Uptime metrics for a single camera."""

    camera_id: UUID
    camera_name: str
    status: str
    uptime_pct: float
    uptime_hours: float | None = None
    last_seen: datetime | None = None
