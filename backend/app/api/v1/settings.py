"""Runtime settings endpoints (admin only).

Provides a key-value settings store for runtime configuration that
persists across restarts (stored in the ``system_settings`` table).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.api.v1.auth import require_role
from app.models.setting import SystemSetting
from app.models.user import User
from app.schemas.operational import SettingResponse, SettingUpdate

router = APIRouter(prefix="/settings", tags=["settings"])


# ── Endpoints ──────────────────────────────────────────────────────────


@router.get(
    "",
    response_model=list[SettingResponse],
    summary="List all settings",
)
async def list_settings(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
) -> list[SettingResponse]:
    """Return all runtime settings (admin only).

    Args:
        db: Database session (injected).
        _admin: Authenticated admin user.

    Returns:
        list[SettingResponse]: All settings as key-value pairs.
    """
    stmt = select(SystemSetting).order_by(SystemSetting.key)
    result = await db.execute(stmt)
    return [SettingResponse.model_validate(s) for s in result.scalars().all()]


@router.put(
    "",
    response_model=list[SettingResponse],
    summary="Bulk update settings",
)
async def bulk_update_settings(
    payload: list[SettingUpdate],
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
) -> list[SettingResponse]:
    """Create or update multiple settings at once (admin only).

    For each key in the payload, the setting is created if it does not
    exist or updated if it does.

    Args:
        payload: List of key-value pairs to upsert.
        db: Database session (injected).
        _admin: Authenticated admin user.

    Returns:
        list[SettingResponse]: The upserted settings.
    """
    results: list[SettingResponse] = []

    for item in payload:
        stmt = select(SystemSetting).where(SystemSetting.key == item.key)
        result = await db.execute(stmt)
        setting = result.scalar_one_or_none()

        if setting is None:
            setting = SystemSetting(
                id=str(uuid.uuid4()),
                key=item.key,
                value=item.value,
            )
            db.add(setting)
        else:
            setting.value = item.value
            setting.updated_at = datetime.now(timezone.utc)

        await db.flush()
        await db.refresh(setting)
        results.append(SettingResponse.model_validate(setting))

    return results


@router.get(
    "/{key}",
    response_model=SettingResponse,
    summary="Get a setting by key",
)
async def get_setting(
    key: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
) -> SettingResponse:
    """Fetch a single setting by its key (admin only).

    Args:
        key: The setting key name.
        db: Database session (injected).
        _admin: Authenticated admin user.

    Returns:
        SettingResponse: The requested setting.

    Raises:
        NotFoundException: If the key does not exist.
    """
    result = await db.execute(
        select(SystemSetting).where(SystemSetting.key == key)
    )
    setting = result.scalar_one_or_none()
    if setting is None:
        raise NotFoundException(detail=f"Setting '{key}' not found")
    return SettingResponse.model_validate(setting)


@router.put(
    "/{key}",
    response_model=SettingResponse,
    summary="Update a single setting",
)
async def update_setting(
    key: str,
    payload: SettingUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
) -> SettingResponse:
    """Create or update a single setting by key (admin only).

    Args:
        key: The setting key name (from URL path).
        payload: The new value for the setting.
        db: Database session (injected).
        _admin: Authenticated admin user.

    Returns:
        SettingResponse: The upserted setting.
    """
    result = await db.execute(
        select(SystemSetting).where(SystemSetting.key == key)
    )
    setting = result.scalar_one_or_none()

    if setting is None:
        setting = SystemSetting(
            id=str(uuid.uuid4()),
            key=key,
            value=payload.value,
        )
        db.add(setting)
    else:
        setting.value = payload.value
        setting.updated_at = datetime.now(timezone.utc)

    await db.flush()
    await db.refresh(setting)
    return SettingResponse.model_validate(setting)
