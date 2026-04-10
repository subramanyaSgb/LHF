"""Camera-group and stitch-mapping schemas.

Groups aggregate cameras for combined views and optional image stitching.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class StitchMappingSchema(BaseModel):
    """Position of a single camera inside a stitched grid."""

    model_config = ConfigDict(from_attributes=True)

    camera_id: UUID
    position: int = Field(..., ge=0, description="Zero-based grid position")


class GroupResponse(BaseModel):
    """Full camera-group representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None = None
    stitch_enabled: bool
    stitch_rows: int | None = None
    stitch_cols: int | None = None
    camera_ids: list[UUID] = Field(default_factory=list)
    stitch_mappings: list[StitchMappingSchema] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class GroupCreate(BaseModel):
    """Payload for creating a new camera group."""

    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None


class GroupUpdate(BaseModel):
    """Payload for updating an existing camera group.

    All fields are optional; only supplied fields are updated.
    """

    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    stitch_enabled: bool | None = None
    stitch_rows: int | None = Field(default=None, ge=1)
    stitch_cols: int | None = Field(default=None, ge=1)


class AssignCameraRequest(BaseModel):
    """Payload for assigning a camera to a group."""

    camera_id: UUID
