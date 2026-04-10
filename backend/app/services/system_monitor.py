"""System health monitoring service."""

import os
import platform
import time
from typing import Any


class SystemMonitor:
    """Monitors server, PLC, and network health."""

    def __init__(self) -> None:
        self._start_time = time.time()
        self._plc_connected = False
        self._plc_last_signal: float | None = None
        self._plc_latency_ms: float = 0

    def get_server_health(self) -> dict[str, Any]:
        """Get server resource stats."""
        try:
            import shutil

            disk = shutil.disk_usage(".")
            disk_free_gb = round(disk.free / (1024**3), 2)
            disk_total_gb = round(disk.total / (1024**3), 2)
        except Exception:
            disk_free_gb = 0
            disk_total_gb = 0

        return {
            "cpu_temp": 55.0,  # Placeholder — needs psutil or platform-specific
            "cpu_usage": 25.0,  # Placeholder
            "ram_usage": 45.0,  # Placeholder
            "disk_free_gb": disk_free_gb,
            "disk_total_gb": disk_total_gb,
            "uptime": int(time.time() - self._start_time),
            "platform": platform.system(),
            "python_version": platform.python_version(),
        }

    def get_plc_health(self) -> dict[str, Any]:
        """Get PLC connection status."""
        return {
            "connected": self._plc_connected,
            "last_signal": self._plc_last_signal,
            "latency_ms": self._plc_latency_ms,
        }

    def set_plc_status(
        self, connected: bool, latency_ms: float = 0
    ) -> None:
        """Update PLC connection status."""
        self._plc_connected = connected
        self._plc_latency_ms = latency_ms
        if connected:
            self._plc_last_signal = time.time()

    def get_network_health(self) -> dict[str, Any]:
        """Get network statistics."""
        return {
            "bandwidth_usage": 35.0,  # Placeholder
            "packet_loss": 0.01,  # Placeholder
        }

    def get_full_health(self) -> dict[str, Any]:
        """Get complete system health snapshot."""
        return {
            "server": self.get_server_health(),
            "plc": self.get_plc_health(),
            "network": self.get_network_health(),
        }


# Singleton
system_monitor = SystemMonitor()
