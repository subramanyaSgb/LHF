"""SQLAlchemy ORM models for the InfraSense database.

Importing this package ensures every model is registered with
``Base.metadata`` so that ``Base.metadata.create_all()`` and Alembic
auto-generation can discover all tables.
"""

from app.models.user import User, UserRole  # noqa: F401
from app.models.group import CameraGroup, StitchMapping  # noqa: F401
from app.models.camera import Camera, CameraStatus  # noqa: F401
from app.models.roi import ROI, ROIPoint, ROIData, ROIShape  # noqa: F401
from app.models.alert import (  # noqa: F401
    Alert,
    AlertPriority,
    AlertRecipient,
    AlertRule,
    AlertRuleType,
    AlertStatus,
)
from app.models.recording import (  # noqa: F401
    Recording,
    RecordingAnnotation,
    RecordingStatus,
    RecordingTrigger,
)
from app.models.report import Report, ReportStatus, ReportType  # noqa: F401
from app.models.operational import (  # noqa: F401
    AuditEntry,
    HotSpotEntry,
    Ladle,
    ShiftNote,
    ShiftType,
)
from app.models.setting import SystemSetting  # noqa: F401
from app.models.layout import LayoutPreset  # noqa: F401
