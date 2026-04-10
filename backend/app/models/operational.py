"""Operational models: shift notes, audit log, ladle tracking, hot spots.

These models support day-to-day plant operations — shift handover notes,
an immutable audit trail, ladle lifecycle management, and hot-spot
detection history.
"""

import enum
import uuid

from sqlalchemy import Boolean, Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ShiftType(str, enum.Enum):
    """Plant shift designations."""

    DAY = "day"
    NIGHT = "night"


class ShiftNote(Base):
    """Free-text note attached to a specific shift for handover.

    Attributes:
        id: UUID primary key.
        shift_date: Calendar date the shift falls on.
        shift_type: Day or night shift.
        content: The note body.
        created_by: FK to the authoring User.
        created_at: Row creation timestamp.
    """

    __tablename__ = "shift_notes"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    shift_date: Mapped[str] = mapped_column(Date, nullable=False, index=True)
    shift_type: Mapped[ShiftType] = mapped_column(
        Enum(ShiftType, name="shift_type"),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_by: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("users.id"),
        nullable=True,
    )

    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    def __repr__(self) -> str:
        return f"<ShiftNote {self.shift_date} {self.shift_type.value}>"


class AuditEntry(Base):
    """Immutable audit-trail record for security-sensitive actions.

    Attributes:
        id: UUID primary key.
        user_id: FK to the acting User (nullable for system actions).
        username: Denormalised username for fast display.
        action: Short verb (e.g. ``"login"``, ``"acknowledge_alert"``).
        target: What was acted upon (e.g. ``"alert:abc-123"``).
        details: Extended description or JSON payload.
        timestamp: When the action occurred.
        created_at: Row creation timestamp.
    """

    __tablename__ = "audit_entries"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    user_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("users.id"),
        nullable=True,
    )
    username: Mapped[str | None] = mapped_column(String(100), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    target: Mapped[str | None] = mapped_column(String(300), nullable=True)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)

    timestamp: Mapped[str] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    def __repr__(self) -> str:
        return f"<AuditEntry {self.action!r} by={self.username!r}>"


class Ladle(Base):
    """Ladle asset record tracking refractory life and maintenance.

    Attributes:
        id: UUID primary key.
        ladle_number: Unique identifier painted / stamped on the ladle.
        life_count: Current number of heats since last reline.
        max_life: Maximum allowed heats before mandatory reline.
        last_used: Timestamp of the most recent heat.
        maintenance_due: Flag indicating the ladle needs maintenance.
        created_at: Row creation timestamp.
        updated_at: Last modification timestamp.
    """

    __tablename__ = "ladles"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    ladle_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )
    life_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    max_life: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    last_used: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    maintenance_due: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[str] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    def __repr__(self) -> str:
        return f"<Ladle {self.ladle_number!r} life={self.life_count}/{self.max_life}>"


class HotSpotEntry(Base):
    """Detected hot spot on a ladle surface.

    Records the spatial position and peak temperature of a recurring
    or anomalous hot region identified by the thermal processor.

    Attributes:
        id: UUID primary key.
        ladle_id: FK to the Ladle.
        heat_number: Heat during which the hot spot was observed.
        camera_id: FK to the Camera that captured it.
        position_x: Normalised X coordinate on the thermal frame.
        position_y: Normalised Y coordinate on the thermal frame.
        peak_temp: Maximum temperature at the hot-spot centre.
        timestamp: When the hot spot was detected.
    """

    __tablename__ = "hot_spot_entries"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    ladle_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("ladles.id"),
        nullable=False,
    )
    heat_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    camera_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("cameras.id"),
        nullable=True,
    )
    position_x: Mapped[float] = mapped_column(Float, nullable=False)
    position_y: Mapped[float] = mapped_column(Float, nullable=False)
    peak_temp: Mapped[float] = mapped_column(Float, nullable=False)

    timestamp: Mapped[str] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    def __repr__(self) -> str:
        return f"<HotSpotEntry ladle={self.ladle_id!r} temp={self.peak_temp}°C>"
