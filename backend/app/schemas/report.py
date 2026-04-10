"""Report Pydantic schemas.

Covers report generation requests and response models for the reports API.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ReportGenerateRequest(BaseModel):
    """Payload for triggering report generation."""

    type: str = Field(..., pattern=r"^(daily|weekly|monthly|custom)$")
    date_from: datetime
    date_to: datetime
    group_id: UUID | None = None
    sections: list[str] | None = Field(
        default=None,
        description="Optional list of report sections to include",
    )


class ReportResponse(BaseModel):
    """Full report representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    type: str
    title: str
    status: str
    date_from: datetime
    date_to: datetime
    generated_at: datetime | None = None
    file_path: str | None = None
    file_size: int | None = None
    emailed_to: str | None = None
    created_at: datetime
