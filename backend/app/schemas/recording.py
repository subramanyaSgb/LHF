"""Recording and annotation Pydantic schemas.

Covers recording start/stop payloads, annotation CRUD, and response models
for the recordings API.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ── Recording schemas ──────────────────────────────────────────────────


class RecordingStartRequest(BaseModel):
    """Payload for starting a new recording."""

    camera_id: UUID
    group_id: UUID | None = None
    heat_number: str = Field(..., min_length=1, max_length=100)
    ladle_id: str | None = Field(default=None, max_length=100)
    ladle_life: int | None = Field(default=None, ge=0)
    trigger_source: str = Field(default="manual", pattern=r"^(plc|manual)$")


class RecordingResponse(BaseModel):
    """Full recording representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    camera_id: UUID
    group_id: UUID | None = None
    heat_number: str | None = None
    ladle_id: str | None = None
    ladle_life: int | None = None
    status: str
    start_time: datetime
    end_time: datetime | None = None
    duration: int | None = None
    peak_temp: float | None = None
    avg_temp: float | None = None
    alert_count: int
    is_flagged: bool
    file_size: int | None = None
    file_path: str | None = None
    trigger_source: str
    created_at: datetime


# ── Annotation schemas ─────────────────────────────────────────────────


class AnnotationCreate(BaseModel):
    """Payload for adding an annotation to a recording."""

    timestamp_seconds: int = Field(..., ge=0, description="Position in recording (seconds)")
    text: str = Field(..., min_length=1, max_length=2000)


class AnnotationResponse(BaseModel):
    """Full annotation representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    recording_id: UUID
    timestamp_seconds: int
    text: str
    created_by: UUID | None = None
    created_at: datetime
