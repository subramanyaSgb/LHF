"""User management endpoints (admin only).

Provides CRUD operations for user accounts.  All endpoints require
admin-level authentication.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import AppException, NotFoundException
from app.core.security import get_password_hash
from app.api.v1.auth import require_role
from app.models.user import User
from app.schemas.auth import UserCreate, UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


# ── Helpers ─────────────────────────────────────────────────────────────


async def _get_user_or_404(user_id: str, db: AsyncSession) -> User:
    """Fetch a user by ID or raise 404.

    Args:
        user_id: The UUID of the user.
        db: Active database session.

    Returns:
        User: The user ORM instance.

    Raises:
        NotFoundException: If no user exists with the given ID.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise NotFoundException(detail=f"User {user_id} not found")
    return user


# ── Endpoints ──────────────────────────────────────────────────────────


@router.get(
    "",
    response_model=list[UserResponse],
    summary="List all users",
)
async def list_users(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
) -> list[UserResponse]:
    """Return a paginated list of all user accounts (admin only).

    Args:
        skip: Pagination offset.
        limit: Maximum number of results.
        db: Database session (injected).
        _admin: Authenticated admin user.

    Returns:
        list[UserResponse]: Matching user records.
    """
    stmt = select(User).order_by(User.username).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return [UserResponse.model_validate(u) for u in result.scalars().all()]


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user",
)
async def create_user(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
) -> UserResponse:
    """Create a new user account (admin only).

    Args:
        payload: User creation data.
        db: Database session (injected).
        _admin: Authenticated admin user.

    Returns:
        UserResponse: The newly created user.

    Raises:
        AppException: If a user with the same username already exists.
    """
    # Check for duplicate username
    existing = await db.execute(select(User).where(User.username == payload.username))
    if existing.scalar_one_or_none() is not None:
        raise AppException(status_code=409, detail=f"Username '{payload.username}' already exists")

    user = User(
        id=str(uuid.uuid4()),
        username=payload.username,
        display_name=payload.display_name,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    summary="Update a user",
)
async def update_user(
    user_id: str,
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
) -> UserResponse:
    """Update an existing user account (admin only).

    Args:
        user_id: UUID of the user to update.
        payload: Fields to update (partial).
        db: Database session (injected).
        _admin: Authenticated admin user.

    Returns:
        UserResponse: The updated user.
    """
    user = await _get_user_or_404(user_id, db)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    user.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a user",
    response_model=None,
)
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
) -> None:
    """Delete a user account (admin only).

    Args:
        user_id: UUID of the user to delete.
        db: Database session (injected).
        _admin: Authenticated admin user.
    """
    user = await _get_user_or_404(user_id, db)
    user.is_active = False
    await db.commit()
