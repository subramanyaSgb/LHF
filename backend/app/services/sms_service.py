"""SMS notification service — mock implementation.

Logs SMS messages to console/database. Replace with real gateway later.
"""

import logging
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)


class SMSService:
    """Mock SMS service that logs messages instead of sending."""

    def __init__(self) -> None:
        self._sent_log: list[dict[str, Any]] = []

    async def send_sms(self, recipients: list[str], message: str) -> dict[str, Any]:
        """Send SMS to recipients (mock — logs to console).

        Args:
            recipients: List of phone numbers.
            message: SMS message text.

        Returns:
            Result dict with status and details.
        """
        result = {
            "status": "mock_sent",
            "recipients": recipients,
            "message": message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "count": len(recipients),
        }

        self._sent_log.append(result)

        logger.info(
            f"[SMS MOCK] Sending to {len(recipients)} recipients: {message[:80]}..."
        )
        for r in recipients:
            logger.info(f"  -> {r}")

        return result

    async def send_alert_sms(
        self, recipients: list[str], alert: dict[str, Any]
    ) -> dict[str, Any]:
        """Send an alert notification via SMS.

        Args:
            recipients: Phone numbers to notify.
            alert: Alert data dict.

        Returns:
            Result dict.
        """
        priority = alert.get("priority", "warning").upper()
        message = (
            f"[INFRASENSE {priority}] "
            f"{alert.get('message', 'Alert triggered')} "
            f"| Value: {alert.get('value', 'N/A')} "
            f"| {alert.get('timestamp', '')}"
        )
        return await self.send_sms(recipients, message)

    def get_sent_log(self, limit: int = 50) -> list[dict[str, Any]]:
        """Get recent sent SMS log."""
        return self._sent_log[-limit:]

    def clear_log(self) -> None:
        """Clear the sent SMS log."""
        self._sent_log.clear()


# Singleton
sms_service = SMSService()
