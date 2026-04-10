"""Layout preset model for user dashboard configurations.

Each user can save multiple named presets that store the arrangement
of camera tiles, panel visibility, and other dashboard preferences
as a JSON string.
"""

import uuid

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class LayoutPreset(Base):
    """Saved dashboard layout configuration.

    Attributes:
        id: UUID primary key.
        user_id: FK to the owning User.
        name: Human-readable preset name.
        layout_json: JSON string encoding the layout configuration.
        created_at: Row creation timestamp.
        updated_at: Last modification timestamp.
    """

    __tablename__ = "layout_presets"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    layout_json: Mapped[str] = mapped_column(Text, nullable=False)

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
        return f"<LayoutPreset {self.name!r} user={self.user_id!r}>"
