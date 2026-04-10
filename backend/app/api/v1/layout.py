"""Dashboard layout preset endpoints.

Allows users to save and restore custom dashboard layouts.  Presets are
stored as JSON values in the ``system_settings`` table using a
``layout_preset:`` key prefix.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.api.v1.auth import get_current_user
from app.models.setting import SystemSetting
from app.models.user import User

router = APIRouter(prefix="/layout", tags=["layout"])

_KEY_PREFIX = "layout_preset:"


# ── Schemas ────────────────────────────────────────────────────────────


class LayoutPresetCreate(BaseModel):
    """Payload for saving a new layout preset."""

    name: str = Field(..., min_length=1, max_length=200)
    layout: dict = Field(..., description="JSON layout configuration")


class LayoutPresetResponse(BaseModel):
    """Layout preset returned by the API."""

    id: str
    name: str
    layout: dict
    created_by: str | None = None
    updated_at: datetime | None = None


# ── Helpers ────────────────────────────────────────────────────────────


def _setting_to_preset(setting: SystemSetting) -> LayoutPresetResponse:
    """Convert a SystemSetting row into a LayoutPresetResponse.

    Args:
        setting: The SystemSetting ORM instance.

    Returns:
        LayoutPresetResponse: Parsed layout preset.
    """
    data = json.loads(setting.value)
    return LayoutPresetResponse(
        id=setting.id,
        name=data.get("name", setting.key.removeprefix(_KEY_PREFIX)),
        layout=data.get("layout", {}),
        created_by=data.get("created_by"),
        updated_at=setting.updated_at,
    )


# ── Endpoints ──────────────────────────────────────────────────────────


@router.get(
    "/presets",
    response_model=list[LayoutPresetResponse],
    summary="List saved layout presets",
)
async def list_presets(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[LayoutPresetResponse]:
    """Return all saved layout presets.

    Presets are stored in ``system_settings`` with keys prefixed
    by ``layout_preset:``.

    Args:
        db: Database session (injected).
        _current_user: Authenticated user (any role).

    Returns:
        list[LayoutPresetResponse]: All layout presets.
    """
    stmt = (
        select(SystemSetting)
        .where(SystemSetting.key.startswith(_KEY_PREFIX))
        .order_by(SystemSetting.key)
    )
    result = await db.execute(stmt)
    return [_setting_to_preset(s) for s in result.scalars().all()]


@router.post(
    "/presets",
    response_model=LayoutPresetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save a layout preset",
)
async def create_preset(
    payload: LayoutPresetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LayoutPresetResponse:
    """Save a new dashboard layout preset.

    The preset is stored as a JSON blob in the ``system_settings`` table
    under a ``layout_preset:{uuid}`` key.

    Args:
        payload: Preset name and layout configuration.
        db: Database session (injected).
        current_user: Authenticated user (any role).

    Returns:
        LayoutPresetResponse: The newly created preset.
    """
    preset_id = str(uuid.uuid4())
    key = f"{_KEY_PREFIX}{preset_id}"

    value = json.dumps({
        "name": payload.name,
        "layout": payload.layout,
        "created_by": current_user.id,
    })

    setting = SystemSetting(
        id=preset_id,
        key=key,
        value=value,
    )
    db.add(setting)
    await db.flush()
    await db.refresh(setting)
    return _setting_to_preset(setting)


@router.delete(
    "/presets/{preset_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    summary="Delete a layout preset",
)
async def delete_preset(
    preset_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> None:
    """Delete a layout preset.

    Args:
        preset_id: UUID of the preset to delete.
        db: Database session (injected).
        _current_user: Authenticated user (any role).

    Raises:
        NotFoundException: If the preset does not exist.
    """
    result = await db.execute(
        select(SystemSetting).where(SystemSetting.id == preset_id)
    )
    setting = result.scalar_one_or_none()
    if setting is None or not setting.key.startswith(_KEY_PREFIX):
        raise NotFoundException(detail=f"Layout preset {preset_id} not found")
    await db.delete(setting)
    await db.flush()
