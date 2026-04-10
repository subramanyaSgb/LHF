"""Authentication endpoints and security dependencies.

Provides login, current-user retrieval, password change, and the
``get_current_user`` / ``require_role`` dependency factories used by
every protected endpoint in the application.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Callable

from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.database import get_db
from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User, UserRole
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
)

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter(prefix="/auth", tags=["auth"])

_bearer_scheme = HTTPBearer(auto_error=False)

# Role hierarchy: higher index = more privilege
_ROLE_HIERARCHY: dict[str, int] = {
    UserRole.VIEWER.value: 0,
    UserRole.OPERATOR.value: 1,
    UserRole.ADMIN.value: 2,
}


# ── Dependencies ───────────────────────────────────────────────────────


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate the current user from a JWT Bearer token.

    Args:
        credentials: The HTTP Bearer token extracted by FastAPI.
        db: Active database session.

    Returns:
        User: The authenticated user instance.

    Raises:
        UnauthorizedException: If the token is missing, invalid, or the
            user does not exist / is inactive.
    """
    if credentials is None:
        raise UnauthorizedException(detail="Missing authentication token")

    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise UnauthorizedException(detail="Invalid token: missing subject")
    except JWTError:
        raise UnauthorizedException(detail="Invalid or expired token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise UnauthorizedException(detail="User not found")
    if not user.is_active:
        raise UnauthorizedException(detail="User account is inactive")
    return user


def require_role(min_role: str) -> Callable[..., User]:
    """Return a dependency that enforces a minimum role level.

    The role hierarchy is: ``viewer (0) < operator (1) < admin (2)``.

    Args:
        min_role: The minimum role required (e.g. ``"operator"`` or
            ``"admin"``).

    Returns:
        Callable: A FastAPI-compatible dependency function.

    Example::

        @router.post("/settings")
        async def update(admin: User = Depends(require_role("admin"))):
            ...
    """
    min_level = _ROLE_HIERARCHY.get(min_role, 0)

    async def _check_role(
        current_user: User = Depends(get_current_user),
    ) -> User:
        """Validate that the current user meets the minimum role level.

        Args:
            current_user: The authenticated user.

        Returns:
            User: The user, if authorized.

        Raises:
            ForbiddenException: If the user's role is below the minimum.
        """
        user_level = _ROLE_HIERARCHY.get(current_user.role.value, 0)
        if user_level < min_level:
            raise ForbiddenException(
                detail=f"Requires {min_role} role or higher"
            )
        return current_user

    return _check_role


# ── Endpoints ──────────────────────────────────────────────────────────


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate and obtain a JWT",
)
async def login(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Validate credentials and return an access token.

    Args:
        payload: Username and password.
        db: Database session (injected).

    Returns:
        TokenResponse: JWT access token and user details.

    Raises:
        UnauthorizedException: If credentials are invalid or user is inactive.
    """
    result = await db.execute(select(User).where(User.username == payload.username))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(payload.password, user.hashed_password):
        raise UnauthorizedException(detail="Invalid username or password")

    if not user.is_active:
        raise UnauthorizedException(detail="User account is disabled")

    # Update last login timestamp
    user.last_login = datetime.now(timezone.utc)
    await db.commit()

    access_token = create_access_token(data={"sub": user.id})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Return the profile of the currently authenticated user.

    Args:
        current_user: The authenticated user (injected).

    Returns:
        UserResponse: The user's public profile.
    """
    return UserResponse.model_validate(current_user)


@router.put(
    "/me/password",
    response_model=UserResponse,
    summary="Change current user password",
)
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Change the authenticated user's password.

    Args:
        payload: Current and new password.
        current_user: The authenticated user (injected).
        db: Database session (injected).

    Returns:
        UserResponse: The updated user profile.

    Raises:
        UnauthorizedException: If the current password is incorrect.
    """
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise UnauthorizedException(detail="Current password is incorrect")

    current_user.hashed_password = get_password_hash(payload.new_password)
    current_user.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(current_user)

    return UserResponse.model_validate(current_user)
