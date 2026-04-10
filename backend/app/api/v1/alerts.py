"""Alert rule management and alert lifecycle endpoints.

Supports CRUD on alert rules (thresholds, recipients) and alert
acknowledgement / resolution workflows.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.api.v1.auth import get_current_user, require_role
from app.models.alert import Alert, AlertRule, AlertStatus
from app.models.user import User
from app.schemas.alert import (
    AlertResponse,
    AlertRuleCreate,
    AlertRuleResponse,
    AlertRuleUpdate,
)

router = APIRouter(prefix="/alerts", tags=["alerts"])


# ── Helpers ─────────────────────────────────────────────────────────────


async def _get_rule_or_404(rule_id: str, db: AsyncSession) -> AlertRule:
    """Fetch an alert rule by ID or raise 404.

    Args:
        rule_id: The UUID of the alert rule.
        db: Active database session.

    Returns:
        AlertRule: The alert rule ORM instance.

    Raises:
        NotFoundException: If no rule exists with the given ID.
    """
    result = await db.execute(select(AlertRule).where(AlertRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if rule is None:
        raise NotFoundException(detail=f"Alert rule {rule_id} not found")
    return rule


async def _get_alert_or_404(alert_id: str, db: AsyncSession) -> Alert:
    """Fetch an alert by ID or raise 404.

    Args:
        alert_id: The UUID of the alert.
        db: Active database session.

    Returns:
        Alert: The alert ORM instance.

    Raises:
        NotFoundException: If no alert exists with the given ID.
    """
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if alert is None:
        raise NotFoundException(detail=f"Alert {alert_id} not found")
    return alert


# ── Alert Rule Endpoints ────────────────────────────────────────────────


@router.get(
    "/rules",
    response_model=list[AlertRuleResponse],
    summary="List all alert rules",
)
async def list_alert_rules(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    enabled: bool | None = Query(None, description="Filter by enabled status"),
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[AlertRuleResponse]:
    """Return a paginated list of alert rules.

    Args:
        skip: Pagination offset.
        limit: Maximum number of results.
        enabled: Optional enabled-status filter.
        db: Database session (injected).
        _current_user: Authenticated user (any role).

    Returns:
        list[AlertRuleResponse]: Matching alert rules.
    """
    stmt = select(AlertRule)
    if enabled is not None:
        stmt = stmt.where(AlertRule.enabled == enabled)
    stmt = stmt.order_by(AlertRule.name).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return [AlertRuleResponse.model_validate(r) for r in result.scalars().all()]


@router.post(
    "/rules",
    response_model=AlertRuleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an alert rule",
)
async def create_alert_rule(
    payload: AlertRuleCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
) -> AlertRuleResponse:
    """Create a new alert rule (admin only).

    Args:
        payload: Alert rule definition.
        db: Database session (injected).
        _admin: Authenticated admin user.

    Returns:
        AlertRuleResponse: The newly created rule.
    """
    data = payload.model_dump()
    # Convert UUID fields to strings for the ORM
    for fk_field in ("camera_id", "group_id", "roi_id"):
        if data.get(fk_field) is not None:
            data[fk_field] = str(data[fk_field])

    rule = AlertRule(id=str(uuid.uuid4()), **data)
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return AlertRuleResponse.model_validate(rule)


@router.put(
    "/rules/{rule_id}",
    response_model=AlertRuleResponse,
    summary="Update an alert rule",
)
async def update_alert_rule(
    rule_id: str,
    payload: AlertRuleUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
) -> AlertRuleResponse:
    """Update an existing alert rule (admin only).

    Args:
        rule_id: UUID of the rule to update.
        payload: Fields to update (partial).
        db: Database session (injected).
        _admin: Authenticated admin user.

    Returns:
        AlertRuleResponse: The updated rule.
    """
    rule = await _get_rule_or_404(rule_id, db)
    update_data = payload.model_dump(exclude_unset=True)
    for fk_field in ("camera_id", "group_id", "roi_id"):
        if fk_field in update_data and update_data[fk_field] is not None:
            update_data[fk_field] = str(update_data[fk_field])
    for field, value in update_data.items():
        setattr(rule, field, value)
    rule.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(rule)
    return AlertRuleResponse.model_validate(rule)


@router.delete(
    "/rules/{rule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    summary="Delete an alert rule",
)
async def delete_alert_rule(
    rule_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
) -> None:
    """Delete an alert rule (admin only).

    Args:
        rule_id: UUID of the rule to delete.
        db: Database session (injected).
        _admin: Authenticated admin user.
    """
    rule = await _get_rule_or_404(rule_id, db)
    await db.delete(rule)
    await db.commit()


# ── Alert Endpoints ─────────────────────────────────────────────────────


@router.get(
    "",
    response_model=list[AlertResponse],
    summary="List alerts",
)
async def list_alerts(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    status_filter: str | None = Query(
        None, alias="status", description="Filter by status (active/acknowledged/resolved)"
    ),
    priority: str | None = Query(None, description="Filter by priority"),
    alert_type: str | None = Query(None, alias="type", description="Filter by alert type"),
    camera_id: str | None = Query(None, description="Filter by camera ID"),
    group_id: str | None = Query(None, description="Filter by group ID"),
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[AlertResponse]:
    """Return a filtered, paginated list of alerts.

    Args:
        skip: Pagination offset.
        limit: Maximum number of results.
        status_filter: Optional alert status filter.
        priority: Optional priority filter.
        alert_type: Optional alert type filter.
        camera_id: Optional camera UUID filter.
        group_id: Optional group UUID filter.
        db: Database session (injected).
        _current_user: Authenticated user (any role).

    Returns:
        list[AlertResponse]: Matching alert records.
    """
    stmt = select(Alert)
    if status_filter is not None:
        stmt = stmt.where(Alert.status == status_filter)
    if priority is not None:
        stmt = stmt.where(Alert.priority == priority)
    if alert_type is not None:
        stmt = stmt.where(Alert.type == alert_type)
    if camera_id is not None:
        stmt = stmt.where(Alert.camera_id == camera_id)
    if group_id is not None:
        stmt = stmt.where(Alert.group_id == group_id)
    stmt = stmt.order_by(Alert.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return [AlertResponse.model_validate(a) for a in result.scalars().all()]


@router.post(
    "/{alert_id}/acknowledge",
    response_model=AlertResponse,
    summary="Acknowledge an alert",
)
async def acknowledge_alert(
    alert_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("operator")),
) -> AlertResponse:
    """Mark an alert as acknowledged (operator+).

    Args:
        alert_id: UUID of the alert.
        db: Database session (injected).
        current_user: Authenticated operator or admin.

    Returns:
        AlertResponse: The updated alert.
    """
    alert = await _get_alert_or_404(alert_id, db)
    alert.status = AlertStatus.ACKNOWLEDGED
    alert.acknowledged_by = current_user.id
    alert.acknowledged_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(alert)
    return AlertResponse.model_validate(alert)


@router.post(
    "/{alert_id}/resolve",
    response_model=AlertResponse,
    summary="Resolve an alert",
)
async def resolve_alert(
    alert_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("operator")),
) -> AlertResponse:
    """Mark an alert as resolved (operator+).

    Args:
        alert_id: UUID of the alert.
        db: Database session (injected).
        current_user: Authenticated operator or admin.

    Returns:
        AlertResponse: The updated alert.
    """
    alert = await _get_alert_or_404(alert_id, db)
    alert.status = AlertStatus.RESOLVED
    alert.resolved_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(alert)
    return AlertResponse.model_validate(alert)
