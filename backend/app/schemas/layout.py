"""Layout preset Pydantic schemas.

Covers CRUD payloads for saved dashboard layout presets.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class LayoutPresetCreate(BaseModel):
    """Payload for saving a new layout preset."""

    name: str = Field(..., min_length=1, max_length=200)
    layout_json: str = Field(..., min_length=2, description="JSON-encoded layout configuration")


class LayoutPresetResponse(BaseModel):
    """Full layout preset representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    name: str
    layout_json: str
    created_at: datetime
    updated_at: datetime
