"""Authentication and user-management schemas.

Covers login/token exchange, user CRUD payloads, and password changes.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ── Auth request / response ─────────────────────────────────────────────


class LoginRequest(BaseModel):
    """Credentials submitted to POST /auth/login."""

    username: str = Field(..., min_length=3, max_length=50, examples=["admin"])
    password: str = Field(..., min_length=6, examples=["changeme"])


class UserResponse(BaseModel):
    """Public representation of a user returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str
    display_name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    last_login: datetime | None = None


class TokenResponse(BaseModel):
    """JWT token payload returned after successful authentication."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ── User CRUD ────────────────────────────────────────────────────────────


class UserCreate(BaseModel):
    """Payload for creating a new user (admin only)."""

    username: str = Field(..., min_length=3, max_length=50)
    display_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = Field(default="viewer", pattern=r"^(admin|operator|viewer)$")


class UserUpdate(BaseModel):
    """Payload for updating an existing user (admin only).

    All fields are optional; only supplied fields are updated.
    """

    display_name: str | None = Field(default=None, min_length=1, max_length=100)
    email: EmailStr | None = None
    role: str | None = Field(default=None, pattern=r"^(admin|operator|viewer)$")
    is_active: bool | None = None


class ChangePasswordRequest(BaseModel):
    """Payload for changing the current user's password."""

    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)
