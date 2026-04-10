"""Alert engine — evaluates thermal data against rules and triggers alerts."""

import logging
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

logger = logging.getLogger(__name__)


class AlertEngine:
    """Evaluates camera/ROI data against alert rules and generates alerts."""

    def __init__(self) -> None:
        self._rules: list[dict[str, Any]] = []
        self._alert_callbacks: list[Any] = []
        self._recent_values: dict[str, list[tuple[float, float]]] = {}  # roi_id -> [(timestamp, value)]

    def load_rules(self, rules: list[dict[str, Any]]) -> None:
        """Load alert rules from database."""
        self._rules = [r for r in rules if r.get("enabled", True)]
        logger.info(f"Loaded {len(self._rules)} active alert rules")

    def on_alert(self, callback: Any) -> None:
        """Register a callback for when an alert is triggered."""
        self._alert_callbacks.append(callback)

    def evaluate_temperature(
        self,
        camera_id: str,
        group_id: str | None,
        roi_id: str | None,
        min_temp: float,
        max_temp: float,
        avg_temp: float,
    ) -> list[dict[str, Any]]:
        """Evaluate temperature data against rules.

        Args:
            camera_id: Camera that produced the data.
            group_id: Group the camera belongs to (if any).
            roi_id: ROI the data is for (if any).
            min_temp: Minimum temperature in the region.
            max_temp: Maximum temperature in the region.
            avg_temp: Average temperature in the region.

        Returns:
            List of triggered alert dicts.
        """
        triggered: list[dict[str, Any]] = []
        now = datetime.now(timezone.utc)

        # Track values for rate-of-change detection
        key = roi_id or camera_id
        if key not in self._recent_values:
            self._recent_values[key] = []
        self._recent_values[key].append((now.timestamp(), max_temp))

        # Keep last 60 seconds of data
        cutoff = now.timestamp() - 60
        self._recent_values[key] = [
            (t, v) for t, v in self._recent_values[key] if t > cutoff
        ]

        for rule in self._rules:
            # Check if rule applies to this camera/group/roi
            if rule.get("camera_id") and rule["camera_id"] != camera_id:
                continue
            if rule.get("group_id") and rule["group_id"] != group_id:
                continue
            if rule.get("roi_id") and rule["roi_id"] != roi_id:
                continue

            alert = self._check_rule(rule, camera_id, group_id, roi_id, min_temp, max_temp, avg_temp, now)
            if alert:
                triggered.append(alert)

        return triggered

    def _check_rule(
        self,
        rule: dict[str, Any],
        camera_id: str,
        group_id: str | None,
        roi_id: str | None,
        min_temp: float,
        max_temp: float,
        avg_temp: float,
        now: datetime,
    ) -> dict[str, Any] | None:
        """Check a single rule against the data."""
        rule_type = rule.get("type")
        threshold = rule.get("threshold_value", 0)

        if rule_type == "temperature_breach" and max_temp > threshold:
            return self._create_alert(rule, camera_id, group_id, roi_id, max_temp, threshold, now)

        if rule_type == "cold_zone" and min_temp < threshold:
            return self._create_alert(rule, camera_id, group_id, roi_id, min_temp, threshold, now)

        if rule_type == "rapid_spike":
            rate = self._calculate_rate_of_change(roi_id or camera_id)
            rate_threshold = rule.get("rate_of_change", 50)
            if rate and rate > rate_threshold:
                return self._create_alert(rule, camera_id, group_id, roi_id, rate, rate_threshold, now)

        return None

    def _calculate_rate_of_change(self, key: str) -> float | None:
        """Calculate temperature rate of change in degrees/second."""
        values = self._recent_values.get(key, [])
        if len(values) < 2:
            return None

        # Use first and last values in the window
        t1, v1 = values[0]
        t2, v2 = values[-1]
        dt = t2 - t1
        if dt < 1:
            return None

        return (v2 - v1) / dt

    def _create_alert(
        self,
        rule: dict[str, Any],
        camera_id: str,
        group_id: str | None,
        roi_id: str | None,
        value: float,
        threshold: float,
        now: datetime,
    ) -> dict[str, Any]:
        """Create an alert dict."""
        alert = {
            "id": str(uuid4()),
            "rule_id": rule.get("id"),
            "type": rule.get("type"),
            "priority": rule.get("priority", "warning"),
            "status": "active",
            "message": f"{rule.get('name', 'Alert')}: value {value:.1f} exceeds threshold {threshold:.1f}",
            "camera_id": camera_id,
            "group_id": group_id,
            "roi_id": roi_id,
            "value": round(value, 1),
            "threshold": round(threshold, 1),
            "timestamp": now.isoformat(),
        }

        # Notify callbacks
        for cb in self._alert_callbacks:
            try:
                cb(alert)
            except Exception as e:
                logger.error(f"Alert callback error: {e}")

        return alert

    def check_camera_offline(self, camera_id: str, seconds_offline: float) -> dict[str, Any] | None:
        """Check if camera offline duration exceeds any rule threshold."""
        now = datetime.now(timezone.utc)
        for rule in self._rules:
            if rule.get("type") != "camera_offline":
                continue
            duration_threshold = rule.get("duration", 60)
            if seconds_offline > duration_threshold:
                return self._create_alert(
                    rule, camera_id, None, None, seconds_offline, duration_threshold, now
                )
        return None

    def check_device_temperature(self, camera_id: str, body_temp: float) -> dict[str, Any] | None:
        """Check if camera body temperature exceeds safe range."""
        now = datetime.now(timezone.utc)
        for rule in self._rules:
            if rule.get("type") != "device_overheat":
                continue
            threshold = rule.get("threshold_value", 60)
            if body_temp > threshold:
                return self._create_alert(rule, camera_id, None, None, body_temp, threshold, now)
        return None

    def check_disk_space(self, free_gb: float, total_gb: float) -> dict[str, Any] | None:
        """Check if disk space is below threshold."""
        now = datetime.now(timezone.utc)
        percent_free = (free_gb / total_gb * 100) if total_gb > 0 else 0
        for rule in self._rules:
            if rule.get("type") != "disk_warning":
                continue
            threshold = rule.get("threshold_value", 10)  # percent
            if percent_free < threshold:
                return self._create_alert(rule, "system", None, None, percent_free, threshold, now)
        return None


# Singleton
alert_engine = AlertEngine()
