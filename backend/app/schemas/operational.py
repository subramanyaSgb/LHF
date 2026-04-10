"""Operational Pydantic schemas.

Covers shift notes, audit log entries, system health responses, and
runtime settings used by the system / operational API endpoints.
"""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ── Shift Note schemas ─────────────────────────────────────────────────


class ShiftNoteCreate(BaseModel):
    """Payload for creating a shift handover note."""

    shift_type: str = Field(..., pattern=r"^(day|night)$")
    content: str = Field(..., min_length=1, max_length=5000)


class ShiftNoteResponse(BaseModel):
    """Full shift note representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    shift_date: date
    shift_type: str
    content: str
    created_by: UUID | None = None
    created_at: datetime


# ── Audit Entry schema ─────────────────────────────────────────────────


class AuditEntryResponse(BaseModel):
    """Full audit log entry representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID | None = None
    username: str | None = None
    action: str
    target: str | None = None
    details: str | None = None
    timestamp: datetime
    created_at: datetime


# ── System Health schemas ──────────────────────────────────────────────


class ServerHealthSchema(BaseModel):
    """Server resource metrics."""

    cpu_temp: float
    cpu_usage: float
    ram_usage: float
    disk_free_gb: float
    disk_total_gb: float
    uptime: int
    platform: str
    python_version: str


class PLCHealthSchema(BaseModel):
    """PLC connection health metrics."""

    connected: bool
    last_signal: float | None = None
    latency_ms: float


class NetworkHealthSchema(BaseModel):
    """Network health metrics."""

    bandwidth_usage: float
    packet_loss: float


class SystemHealthResponse(BaseModel):
    """Aggregated system health snapshot."""

    server: ServerHealthSchema
    plc: PLCHealthSchema
    network: NetworkHealthSchema


# ── Setting schemas ────────────────────────────────────────────────────


class SettingResponse(BaseModel):
    """Single runtime setting key-value pair."""

    model_config = ConfigDict(from_attributes=True)

    key: str
    value: str


class SettingUpdate(BaseModel):
    """Payload for updating a runtime setting."""

    key: str = Field(..., min_length=1, max_length=200)
    value: str = Field(..., min_length=0)
