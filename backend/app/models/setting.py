"""System setting model for runtime-configurable key/value pairs.

Provides a simple key-value store for settings that operators can change
at runtime without restarting the application (e.g. alert thresholds,
feature flags, dashboard preferences).
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SystemSetting(Base):
    """Runtime key-value configuration entry.

    Attributes:
        id: UUID primary key.
        key: Unique setting name (e.g. ``"default_emissivity"``).
        value: Setting value stored as text (callers parse as needed).
        updated_at: Last modification timestamp.
    """

    __tablename__ = "system_settings"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    key: Mapped[str] = mapped_column(String(200), unique=True, nullable=False, index=True)
    value: Mapped[str] = mapped_column(Text, nullable=False)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    def __repr__(self) -> str:
        return f"<SystemSetting {self.key!r}>"
