"""Camera-related Pydantic schemas.

Covers camera CRUD and per-frame thermal data ingestion.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CameraResponse(BaseModel):
    """Full camera representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    ip_address: str
    serial_number: str | None = None
    status: str
    body_temperature: float | None = None
    resolution_width: int | None = None
    resolution_height: int | None = None
    frame_rate: int | None = None
    emissivity: float | None = None
    palette: str | None = None
    group_id: UUID | None = None
    is_recording: bool
    uptime: float | None = None
    last_seen: datetime | None = None
    color_label: str | None = None
    created_at: datetime
    updated_at: datetime


class CameraCreate(BaseModel):
    """Payload for registering a new camera."""

    name: str = Field(..., min_length=1, max_length=100)
    ip_address: str = Field(..., examples=["192.168.1.101"])
    serial_number: str | None = None
    emissivity: float | None = Field(default=None, ge=0.0, le=1.0)
    frame_rate: int | None = Field(default=None, ge=1, le=120)
    palette: str | None = None


class CameraUpdate(BaseModel):
    """Payload for updating an existing camera.

    All fields are optional; only supplied fields are updated.
    """

    name: str | None = Field(default=None, min_length=1, max_length=100)
    ip_address: str | None = None
    serial_number: str | None = None
    emissivity: float | None = Field(default=None, ge=0.0, le=1.0)
    frame_rate: int | None = Field(default=None, ge=1, le=120)
    palette: str | None = None
    color_label: str | None = None


class ThermalFrameResponse(BaseModel):
    """Thermal frame data returned by the camera frame endpoint."""

    camera_id: UUID
    timestamp: str
    width: int
    height: int
    min_temp: float
    max_temp: float
    avg_temp: float
    matrix: list[list[float]]


class CameraFrameData(BaseModel):
    """Per-frame thermal telemetry pushed from the camera processing pipeline."""

    camera_id: UUID
    timestamp: datetime
    min_temp: float
    max_temp: float
    avg_temp: float
    image_base64: str | None = None
