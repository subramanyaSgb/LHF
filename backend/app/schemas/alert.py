"""Alert rule and alert event Pydantic schemas.

Covers CRUD payloads for alert rules, alert lifecycle responses,
and acknowledgement requests.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ── Alert Rule schemas ─────────────────────────────────────────────────


class AlertRuleCreate(BaseModel):
    """Payload for creating a new alert rule."""

    name: str = Field(..., min_length=1, max_length=200)
    type: str = Field(
        ...,
        pattern=(
            r"^(high_temp|low_temp|rate_of_change|camera_offline"
            r"|recording_failure|ladle_life_limit|hot_spot_detected|custom)$"
        ),
    )
    priority: str = Field(default="medium", pattern=r"^(low|medium|high|critical)$")
    enabled: bool = True
    camera_id: UUID | None = None
    group_id: UUID | None = None
    roi_id: UUID | None = None
    threshold_value: float | None = None
    threshold_unit: str | None = Field(default=None, max_length=20)
    rate_of_change: float | None = None
    duration: int | None = Field(default=None, ge=0)
    sms_enabled: bool = False
    email_enabled: bool = False


class AlertRuleUpdate(BaseModel):
    """Payload for updating an existing alert rule.

    All fields are optional; only supplied fields are updated.
    """

    name: str | None = Field(default=None, min_length=1, max_length=200)
    type: str | None = Field(
        default=None,
        pattern=(
            r"^(high_temp|low_temp|rate_of_change|camera_offline"
            r"|recording_failure|ladle_life_limit|hot_spot_detected|custom)$"
        ),
    )
    priority: str | None = Field(default=None, pattern=r"^(low|medium|high|critical)$")
    enabled: bool | None = None
    camera_id: UUID | None = None
    group_id: UUID | None = None
    roi_id: UUID | None = None
    threshold_value: float | None = None
    threshold_unit: str | None = Field(default=None, max_length=20)
    rate_of_change: float | None = None
    duration: int | None = Field(default=None, ge=0)
    sms_enabled: bool | None = None
    email_enabled: bool | None = None


class AlertRuleResponse(BaseModel):
    """Full alert rule representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    type: str
    priority: str
    enabled: bool
    camera_id: UUID | None = None
    group_id: UUID | None = None
    roi_id: UUID | None = None
    threshold_value: float | None = None
    threshold_unit: str | None = None
    rate_of_change: float | None = None
    duration: int | None = None
    sms_enabled: bool
    email_enabled: bool
    created_at: datetime
    updated_at: datetime


# ── Alert event schemas ────────────────────────────────────────────────


class AlertAcknowledgeRequest(BaseModel):
    """Payload for acknowledging an alert."""

    user_id: str = Field(..., min_length=1, description="UUID of the acknowledging user")


class AlertResponse(BaseModel):
    """Full alert event representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    rule_id: UUID
    type: str
    priority: str
    status: str
    message: str | None = None
    camera_id: UUID | None = None
    group_id: UUID | None = None
    roi_id: UUID | None = None
    value: float | None = None
    threshold: float | None = None
    predicted_breach_time: datetime | None = None
    timestamp: datetime
    acknowledged_at: datetime | None = None
    acknowledged_by: UUID | None = None
    resolved_at: datetime | None = None
    created_at: datetime
