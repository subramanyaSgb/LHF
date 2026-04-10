"""Camera model representing a thermal imaging device.

Each row maps to a physical Micro-Epsilon TIM thermal camera connected to the
InfraSense network.  Status, configuration, and health fields are updated in
real time by the camera management service.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CameraStatus(str, enum.Enum):
    """Operational status of a camera."""

    ONLINE = "online"
    OFFLINE = "offline"
    RECORDING = "recording"
    ERROR = "error"


class Camera(Base):
    """Physical thermal camera device.

    Attributes:
        id: UUID primary key.
        name: Human-readable name (e.g. ``"LHF-1 North"``).
        ip_address: Network address for the camera's control interface.
        serial_number: Manufacturer serial number.
        status: Current operational status.
        body_temperature: Internal sensor body temperature in Celsius.
        resolution_width: Horizontal pixel count.
        resolution_height: Vertical pixel count.
        frame_rate: Frames-per-second setting.
        emissivity: Emissivity coefficient used for temperature calculation.
        palette: Active colour palette name.
        group_id: Optional FK linking the camera to a CameraGroup.
        is_recording: Whether the camera is currently capturing footage.
        uptime: Cumulative uptime in hours since last restart.
        last_seen: Timestamp of the most recent heartbeat.
        color_label: UI colour tag for visual grouping.
        created_at: Row creation timestamp.
        updated_at: Last modification timestamp.
    """

    __tablename__ = "cameras"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False)
    serial_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[CameraStatus] = mapped_column(
        Enum(CameraStatus, name="camera_status"),
        nullable=False,
        default=CameraStatus.OFFLINE,
        index=True,
    )

    body_temperature: Mapped[float | None] = mapped_column(Float, nullable=True)
    resolution_width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    resolution_height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    frame_rate: Mapped[int | None] = mapped_column(Integer, nullable=True)
    emissivity: Mapped[float | None] = mapped_column(Float, nullable=True, default=0.95)
    palette: Mapped[str | None] = mapped_column(String(50), nullable=True, default="iron")

    group_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("camera_groups.id"),
        nullable=True,
    )
    is_recording: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    uptime: Mapped[float | None] = mapped_column(Float, nullable=True, default=0.0)
    last_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    color_label: Mapped[str | None] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # ── Relationships ───────────────────────────────────────────────────
    group: Mapped["CameraGroup"] = relationship(  # noqa: F821
        "CameraGroup",
        back_populates="cameras",
    )
    rois: Mapped[list["ROI"]] = relationship(  # noqa: F821
        "ROI",
        back_populates="camera",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Camera {self.name!r} status={self.status.value}>"
