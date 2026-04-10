"""Region of Interest (ROI) models.

An ROI defines a polygonal or rectangular area on a camera's thermal frame.
Temperature statistics (min, max, avg) are continuously computed for each ROI
and stored as ROIData time-series records.
"""

import enum
import uuid

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ROIShape(str, enum.Enum):
    """Supported ROI geometry types."""

    RECTANGLE = "rectangle"
    POLYGON = "polygon"
    CIRCLE = "circle"
    ELLIPSE = "ellipse"
    LINE = "line"


class ROI(Base):
    """Region of Interest drawn on a camera frame.

    Attributes:
        id: UUID primary key.
        camera_id: FK to the parent Camera.
        name: Human-readable label.
        shape: Geometry type of the region.
        color: Hex colour string for UI rendering.
        font_size: Font size for the temperature overlay.
        show_min: Whether to display the minimum temperature.
        show_max: Whether to display the maximum temperature.
        show_avg: Whether to display the average temperature.
        alert_rule_id: Optional FK linking to an AlertRule.
        created_at: Row creation timestamp.
        updated_at: Last modification timestamp.
        points: Ordered list of ROIPoint vertices.
        data_points: Time-series temperature readings.
    """

    __tablename__ = "rois"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    camera_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("cameras.id"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    shape: Mapped[ROIShape] = mapped_column(
        Enum(ROIShape, name="roi_shape"),
        nullable=False,
        default=ROIShape.RECTANGLE,
    )
    color: Mapped[str | None] = mapped_column(String(20), nullable=True, default="#FF0000")
    font_size: Mapped[int | None] = mapped_column(Integer, nullable=True, default=12)

    show_min: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    show_max: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    show_avg: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    alert_rule_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("alert_rules.id"),
        nullable=True,
    )

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

    # ── Relationships ───────────────────────────────────────────────────
    camera: Mapped["Camera"] = relationship(  # noqa: F821
        "Camera",
        back_populates="rois",
    )
    points: Mapped[list["ROIPoint"]] = relationship(
        "ROIPoint",
        back_populates="roi",
        lazy="selectin",
        cascade="all, delete-orphan",
        order_by="ROIPoint.order",
    )
    data_points: Mapped[list["ROIData"]] = relationship(
        "ROIData",
        back_populates="roi",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<ROI {self.name!r} camera={self.camera_id!r}>"


class ROIPoint(Base):
    """Single vertex of an ROI polygon or rectangle.

    Attributes:
        id: UUID primary key.
        roi_id: FK to the parent ROI.
        x: Normalised X coordinate (0.0 – 1.0).
        y: Normalised Y coordinate (0.0 – 1.0).
        order: Vertex ordering index (0-based).
    """

    __tablename__ = "roi_points"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    roi_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("rois.id"),
        nullable=False,
    )
    x: Mapped[float] = mapped_column(Float, nullable=False)
    y: Mapped[float] = mapped_column(Float, nullable=False)
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # ── Relationships ───────────────────────────────────────────────────
    roi: Mapped["ROI"] = relationship("ROI", back_populates="points")

    def __repr__(self) -> str:
        return f"<ROIPoint roi={self.roi_id!r} ({self.x}, {self.y}) #{self.order}>"


class ROIData(Base):
    """Time-series temperature reading for a single ROI.

    Attributes:
        id: UUID primary key.
        roi_id: FK to the parent ROI.
        timestamp: When the measurement was taken.
        min_temp: Minimum temperature in the region (Celsius).
        max_temp: Maximum temperature in the region (Celsius).
        avg_temp: Average temperature in the region (Celsius).
    """

    __tablename__ = "roi_data"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    roi_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("rois.id"),
        nullable=False,
        index=True,
    )
    timestamp: Mapped[str] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )
    min_temp: Mapped[float] = mapped_column(Float, nullable=False)
    max_temp: Mapped[float] = mapped_column(Float, nullable=False)
    avg_temp: Mapped[float] = mapped_column(Float, nullable=False)

    # ── Relationships ───────────────────────────────────────────────────
    roi: Mapped["ROI"] = relationship("ROI", back_populates="data_points")

    def __repr__(self) -> str:
        return f"<ROIData roi={self.roi_id!r} max={self.max_temp}°C>"
