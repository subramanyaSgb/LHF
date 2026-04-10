"""Authentication and authorization utilities.

Provides JWT token creation / verification and password hashing helpers
used by the auth endpoints and middleware.
"""

from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext

from app.config import get_settings

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a signed JWT access token.

    Args:
        data: Claims to encode in the token (must include ``sub``).
        expires_delta: Optional custom lifetime.  Falls back to the
            configured ``ACCESS_TOKEN_EXPIRE_MINUTES``.

    Returns:
        str: The encoded JWT string.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta
        if expires_delta is not None
        else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check a plain-text password against a bcrypt hash.

    Args:
        plain_password: The password provided by the user.
        hashed_password: The stored bcrypt hash.

    Returns:
        bool: ``True`` if the password matches.
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a plain-text password with bcrypt.

    Args:
        password: The plain-text password to hash.

    Returns:
        str: The bcrypt hash string.
    """
    return pwd_context.hash(password)
