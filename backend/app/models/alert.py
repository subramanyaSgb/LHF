"""Alert rule, recipient, and alert-event models.

AlertRule defines the conditions under which an alert fires.  When a rule
triggers, an Alert record is created to track its lifecycle from *active*
through *acknowledged* to *resolved*.  Recipients store the phone numbers
or email addresses that should be notified.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


# ── Enums ───────────────────────────────────────────────────────────────


class AlertRuleType(str, enum.Enum):
    """Types of conditions that can trigger an alert."""

    HIGH_TEMP = "high_temp"
    LOW_TEMP = "low_temp"
    RATE_OF_CHANGE = "rate_of_change"
    CAMERA_OFFLINE = "camera_offline"
    RECORDING_FAILURE = "recording_failure"
    LADLE_LIFE_LIMIT = "ladle_life_limit"
    HOT_SPOT_DETECTED = "hot_spot_detected"
    CUSTOM = "custom"


class AlertPriority(str, enum.Enum):
    """Urgency levels for alert rules and events."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertStatus(str, enum.Enum):
    """Lifecycle states of an alert event."""

    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


# ── Models ──────────────────────────────────────────────────────────────


class AlertRule(Base):
    """Definition of a condition that triggers alerts.

    Attributes:
        id: UUID primary key.
        name: Human-readable rule name.
        type: Category of the triggering condition.
        priority: Default priority assigned to generated alerts.
        enabled: Whether the rule is actively evaluated.
        camera_id: Optional FK scoping the rule to a single camera.
        group_id: Optional FK scoping the rule to a camera group.
        roi_id: Optional FK scoping the rule to a specific ROI.
        threshold_value: The numeric trigger threshold.
        threshold_unit: Unit of the threshold (e.g. ``"°C"``, ``"°C/min"``).
        rate_of_change: Rate threshold for rate-of-change rules.
        duration: Seconds the condition must persist before firing.
        sms_enabled: Whether to dispatch SMS on trigger.
        email_enabled: Whether to dispatch email on trigger.
        created_at: Row creation timestamp.
        updated_at: Last modification timestamp.
    """

    __tablename__ = "alert_rules"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    type: Mapped[AlertRuleType] = mapped_column(
        Enum(AlertRuleType, name="alert_rule_type"),
        nullable=False,
    )
    priority: Mapped[AlertPriority] = mapped_column(
        Enum(AlertPriority, name="alert_priority"),
        nullable=False,
        default=AlertPriority.MEDIUM,
    )
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    camera_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("cameras.id"),
        nullable=True,
    )
    group_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("camera_groups.id"),
        nullable=True,
    )
    roi_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("rois.id"),
        nullable=True,
    )

    threshold_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    threshold_unit: Mapped[str | None] = mapped_column(String(20), nullable=True)
    rate_of_change: Mapped[float | None] = mapped_column(Float, nullable=True)
    duration: Mapped[int | None] = mapped_column(Integer, nullable=True)

    sms_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    email_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

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
    recipients: Mapped[list["AlertRecipient"]] = relationship(
        "AlertRecipient",
        back_populates="rule",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    alerts: Mapped[list["Alert"]] = relationship(
        "Alert",
        back_populates="rule",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<AlertRule {self.name!r} type={self.type.value}>"


class AlertRecipient(Base):
    """Phone number or email address subscribed to an alert rule.

    Attributes:
        id: UUID primary key.
        rule_id: FK to the parent AlertRule.
        contact: Phone number or email address string.
    """

    __tablename__ = "alert_recipients"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    rule_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("alert_rules.id"),
        nullable=False,
    )
    contact: Mapped[str] = mapped_column(String(255), nullable=False)

    # ── Relationships ───────────────────────────────────────────────────
    rule: Mapped["AlertRule"] = relationship("AlertRule", back_populates="recipients")

    def __repr__(self) -> str:
        return f"<AlertRecipient {self.contact!r}>"


class Alert(Base):
    """Concrete alert event generated when an AlertRule fires.

    Tracks the full lifecycle: active -> acknowledged -> resolved.

    Attributes:
        id: UUID primary key.
        rule_id: FK to the AlertRule that triggered this alert.
        type: Denormalised copy of the rule type for fast queries.
        priority: Denormalised copy of the rule priority.
        status: Current lifecycle state.
        message: Human-readable description of the event.
        camera_id: Optional FK to the camera that triggered the alert.
        group_id: Optional FK to the camera group context.
        roi_id: Optional FK to the ROI context.
        value: The observed value that breached the threshold.
        threshold: The threshold value that was breached.
        predicted_breach_time: Predicted time of an upcoming breach (trend alerts).
        timestamp: When the condition was first detected.
        acknowledged_at: When an operator acknowledged the alert.
        acknowledged_by: User ID of the acknowledging operator.
        resolved_at: When the alert was marked resolved.
        created_at: Row creation timestamp.
    """

    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    rule_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("alert_rules.id"),
        nullable=False,
    )
    type: Mapped[AlertRuleType] = mapped_column(
        Enum(AlertRuleType, name="alert_rule_type", create_type=False),
        nullable=False,
    )
    priority: Mapped[AlertPriority] = mapped_column(
        Enum(AlertPriority, name="alert_priority", create_type=False),
        nullable=False,
        index=True,
    )
    status: Mapped[AlertStatus] = mapped_column(
        Enum(AlertStatus, name="alert_status"),
        nullable=False,
        default=AlertStatus.ACTIVE,
        index=True,
    )
    message: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    camera_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("cameras.id"),
        nullable=True,
        index=True,
    )
    group_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("camera_groups.id"),
        nullable=True,
    )
    roi_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("rois.id"),
        nullable=True,
    )

    value: Mapped[float | None] = mapped_column(Float, nullable=True)
    threshold: Mapped[float | None] = mapped_column(Float, nullable=True)
    predicted_breach_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    acknowledged_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    acknowledged_by: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("users.id"),
        nullable=True,
    )
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    # ── Relationships ───────────────────────────────────────────────────
    rule: Mapped["AlertRule"] = relationship("AlertRule", back_populates="alerts")

    def __repr__(self) -> str:
        return f"<Alert {self.type.value} status={self.status.value}>"
