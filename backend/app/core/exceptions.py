"""Custom exception classes for structured error handling.

All exceptions inherit from ``AppException`` which carries an HTTP status
code and a human-readable detail message.  FastAPI exception handlers
translate these into JSON error responses.
"""

from fastapi import HTTPException


class AppException(HTTPException):
    """Base application exception with an HTTP status code.

    Args:
        status_code: The HTTP status code to return.
        detail: A human-readable error message.
    """

    def __init__(self, status_code: int = 500, detail: str = "Internal server error") -> None:
        super().__init__(status_code=status_code, detail=detail)


class NotFoundException(AppException):
    """Raised when a requested resource does not exist.

    Args:
        detail: Description of what was not found.
    """

    def __init__(self, detail: str = "Resource not found") -> None:
        super().__init__(status_code=404, detail=detail)


class ForbiddenException(AppException):
    """Raised when the authenticated user lacks permission.

    Args:
        detail: Description of the forbidden action.
    """

    def __init__(self, detail: str = "Forbidden") -> None:
        super().__init__(status_code=403, detail=detail)


class UnauthorizedException(AppException):
    """Raised when authentication credentials are missing or invalid.

    Args:
        detail: Description of the authentication failure.
    """

    def __init__(self, detail: str = "Not authenticated") -> None:
        super().__init__(status_code=401, detail=detail)
