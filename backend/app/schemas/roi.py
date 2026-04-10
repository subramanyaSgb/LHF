"""Region-of-Interest (ROI) schemas.

ROIs are user-drawn polygons/rectangles on a camera frame used to track
localised temperature statistics and trigger alert rules.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ROIPointSchema(BaseModel):
    """A single (x, y) vertex of an ROI polygon."""

    model_config = ConfigDict(from_attributes=True)

    x: float
    y: float


class ROIResponse(BaseModel):
    """Full ROI representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    camera_id: UUID
    name: str
    shape: str
    color: str | None = None
    font_size: int | None = None
    show_min: bool
    show_max: bool
    show_avg: bool
    alert_rule_id: UUID | None = None
    points: list[ROIPointSchema] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class ROICreate(BaseModel):
    """Payload for creating a new ROI on a camera."""

    camera_id: UUID
    name: str = Field(..., min_length=1, max_length=100)
    shape: str = Field(..., pattern=r"^(polygon|rectangle|ellipse)$")
    color: str | None = None
    font_size: int | None = Field(default=None, ge=6, le=72)
    show_min: bool = True
    show_max: bool = True
    show_avg: bool = True
    alert_rule_id: UUID | None = None
    points: list[ROIPointSchema] = Field(..., min_length=2)


class ROIUpdate(BaseModel):
    """Payload for updating an existing ROI.

    All fields are optional; only supplied fields are updated.
    """

    name: str | None = Field(default=None, min_length=1, max_length=100)
    shape: str | None = Field(default=None, pattern=r"^(polygon|rectangle|ellipse)$")
    color: str | None = None
    font_size: int | None = Field(default=None, ge=6, le=72)
    show_min: bool | None = None
    show_max: bool | None = None
    show_avg: bool | None = None
    alert_rule_id: UUID | None = None
    points: list[ROIPointSchema] | None = None


class ROIDataResponse(BaseModel):
    """Thermal statistics captured for a single ROI at a point in time."""

    model_config = ConfigDict(from_attributes=True)

    roi_id: UUID
    timestamp: datetime
    min_temp: float
    max_temp: float
    avg_temp: float
