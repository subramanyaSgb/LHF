"""Recording and annotation models.

A Recording captures a continuous thermal video segment for one camera,
typically spanning a single heat cycle (~45 min).  Annotations let operators
mark notable moments inside a recording.
"""

import enum
import uuid

from sqlalchemy import BigInteger, Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class RecordingStatus(str, enum.Enum):
    """Lifecycle states of a recording."""

    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    ARCHIVED = "archived"
    DELETED = "deleted"


class RecordingTrigger(str, enum.Enum):
    """What initiated the recording."""

    PLC = "plc"
    MANUAL = "manual"


class Recording(Base):
    """Thermal video recording tied to a heat cycle.

    Attributes:
        id: UUID primary key.
        camera_id: FK to the recording camera.
        group_id: Optional FK if the recording covers a camera group.
        heat_number: The Level-1 heat identifier.
        ladle_id: The ladle being used for this heat.
        ladle_life: Current refractory life count for the ladle.
        status: Current lifecycle state.
        start_time: When recording began.
        end_time: When recording stopped (null while in progress).
        duration: Total seconds of footage.
        peak_temp: Highest temperature observed during the recording.
        avg_temp: Average temperature over the recording period.
        alert_count: Number of alerts that fired during this recording.
        is_flagged: Operator or system flag for review.
        file_size: Size of the recording file in bytes.
        file_path: Filesystem path to the recording file.
        trigger_source: Whether the PLC or an operator started the recording.
        created_at: Row creation timestamp.
        annotations: Operator annotations within the recording.
    """

    __tablename__ = "recordings"

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
    group_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("camera_groups.id"),
        nullable=True,
    )

    heat_number: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    ladle_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    ladle_life: Mapped[int | None] = mapped_column(Integer, nullable=True)

    status: Mapped[RecordingStatus] = mapped_column(
        Enum(RecordingStatus, name="recording_status"),
        nullable=False,
        default=RecordingStatus.IN_PROGRESS,
    )

    start_time: Mapped[str] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    end_time: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration: Mapped[int | None] = mapped_column(Integer, nullable=True)

    peak_temp: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_temp: Mapped[float | None] = mapped_column(Float, nullable=True)
    alert_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_flagged: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    file_size: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)

    trigger_source: Mapped[RecordingTrigger] = mapped_column(
        Enum(RecordingTrigger, name="recording_trigger"),
        nullable=False,
        default=RecordingTrigger.MANUAL,
    )

    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # ── Relationships ───────────────────────────────────────────────────
    annotations: Mapped[list["RecordingAnnotation"]] = relationship(
        "RecordingAnnotation",
        back_populates="recording",
        lazy="selectin",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Recording heat={self.heat_number!r} status={self.status.value}>"


class RecordingAnnotation(Base):
    """Operator-created annotation at a specific point in a recording.

    Attributes:
        id: UUID primary key.
        recording_id: FK to the parent Recording.
        timestamp_seconds: Position in the recording (seconds from start).
        text: Annotation content.
        created_by: FK to the User who wrote the annotation.
        created_at: Row creation timestamp.
    """

    __tablename__ = "recording_annotations"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    recording_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("recordings.id"),
        nullable=False,
    )
    timestamp_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(String(2000), nullable=False)
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

    # ── Relationships ───────────────────────────────────────────────────
    recording: Mapped["Recording"] = relationship("Recording", back_populates="annotations")

    def __repr__(self) -> str:
        return f"<RecordingAnnotation recording={self.recording_id!r} t={self.timestamp_seconds}s>"
