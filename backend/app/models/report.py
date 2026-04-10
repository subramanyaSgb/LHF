"""Report model for generated PDF / HTML reports.

Reports are auto-generated (daily at 06:00 IST) or manually triggered.
Each report covers a date range and is stored as a file on disk.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ReportType(str, enum.Enum):
    """Frequency / scope of the report."""

    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    CUSTOM = "custom"


class ReportStatus(str, enum.Enum):
    """Generation lifecycle of a report."""

    PENDING = "pending"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


class Report(Base):
    """Generated analysis report.

    Attributes:
        id: UUID primary key.
        type: Report frequency / scope.
        title: Descriptive title (e.g. ``"Daily Report — 2026-04-09"``).
        status: Current generation state.
        date_from: Start of the reporting period.
        date_to: End of the reporting period.
        generated_at: When the report file was produced.
        file_path: Filesystem path to the generated file.
        file_size: Size in bytes.
        emailed_to: JSON-serialised list of email addresses it was sent to.
        created_at: Row creation timestamp.
    """

    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    type: Mapped[ReportType] = mapped_column(
        Enum(ReportType, name="report_type"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus, name="report_status"),
        nullable=False,
        default=ReportStatus.PENDING,
    )

    date_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    date_to: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)

    emailed_to: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array string

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    def __repr__(self) -> str:
        return f"<Report {self.title!r} status={self.status.value}>"
