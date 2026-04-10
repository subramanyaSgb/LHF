"""Camera group and stitch-mapping models.

A CameraGroup logically groups cameras (e.g. all cameras covering one LHF)
and optionally supports stitching their feeds into a single panoramic view.
"""

import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CameraGroup(Base):
    """Logical grouping of thermal cameras.

    Attributes:
        id: UUID primary key.
        name: Human-readable group name.
        description: Optional longer description.
        stitch_enabled: Whether panoramic stitching is active.
        stitch_rows: Number of rows in the stitch grid.
        stitch_cols: Number of columns in the stitch grid.
        created_at: Row creation timestamp.
        updated_at: Last modification timestamp.
        cameras: Related Camera instances (one-to-many).
        stitch_mappings: Camera-to-grid-position assignments.
    """

    __tablename__ = "camera_groups"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)

    stitch_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    stitch_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    stitch_cols: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

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
    cameras: Mapped[list["Camera"]] = relationship(  # noqa: F821
        "Camera",
        back_populates="group",
        lazy="selectin",
    )
    stitch_mappings: Mapped[list["StitchMapping"]] = relationship(
        "StitchMapping",
        back_populates="group",
        lazy="selectin",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<CameraGroup {self.name!r}>"


class StitchMapping(Base):
    """Maps a camera to a position in its group's stitch grid.

    Attributes:
        id: UUID primary key.
        group_id: FK to the parent CameraGroup.
        camera_id: FK to the assigned Camera.
        position: Grid position identifier (e.g. ``"0,1"``).
    """

    __tablename__ = "stitch_mappings"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    group_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("camera_groups.id"),
        nullable=False,
    )
    camera_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("cameras.id"),
        nullable=False,
    )
    position: Mapped[str] = mapped_column(String(50), nullable=False)

    # ── Relationships ───────────────────────────────────────────────────
    group: Mapped["CameraGroup"] = relationship(
        "CameraGroup",
        back_populates="stitch_mappings",
    )
    camera: Mapped["Camera"] = relationship("Camera")  # noqa: F821

    def __repr__(self) -> str:
        return f"<StitchMapping group={self.group_id!r} pos={self.position!r}>"
