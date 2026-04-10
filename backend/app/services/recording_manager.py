"""Recording manager — handles start/stop/store of heat recordings."""

import logging
import os
import time
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

logger = logging.getLogger(__name__)


class RecordingManager:
    """Manages recording lifecycle for heat monitoring sessions."""

    def __init__(self, storage_path: str = "./recordings") -> None:
        self._storage_path = storage_path
        self._active_recordings: dict[str, dict[str, Any]] = {}  # camera_id -> recording info
        os.makedirs(storage_path, exist_ok=True)

    def start_recording(
        self,
        camera_id: str,
        group_id: str | None = None,
        heat_number: str = "",
        ladle_id: str = "",
        ladle_life: int = 0,
        trigger_source: str = "manual",
    ) -> dict[str, Any]:
        """Start a new recording for a camera.

        Args:
            camera_id: Camera to record.
            group_id: Optional group the camera belongs to.
            heat_number: Heat number from Level 1 system.
            ladle_id: Ladle identifier.
            ladle_life: Current ladle usage count.
            trigger_source: "plc" or "manual".

        Returns:
            Recording info dict.
        """
        if camera_id in self._active_recordings:
            logger.warning(f"Camera {camera_id} already recording — stopping previous")
            self.stop_recording(camera_id)

        recording_id = str(uuid4())
        now = datetime.now(timezone.utc)
        date_str = now.strftime("%Y-%m-%d")
        recording_dir = os.path.join(self._storage_path, date_str, heat_number or recording_id)
        os.makedirs(recording_dir, exist_ok=True)

        recording = {
            "id": recording_id,
            "camera_id": camera_id,
            "group_id": group_id,
            "heat_number": heat_number,
            "ladle_id": ladle_id,
            "ladle_life": ladle_life,
            "status": "recording",
            "start_time": now.isoformat(),
            "end_time": None,
            "duration": 0,
            "peak_temp": 0.0,
            "avg_temp": 0.0,
            "alert_count": 0,
            "is_flagged": False,
            "file_size": 0,
            "file_path": recording_dir,
            "trigger_source": trigger_source,
            "start_timestamp": time.time(),
        }

        self._active_recordings[camera_id] = recording
        logger.info(f"Started recording {recording_id} for camera {camera_id} (heat: {heat_number})")
        return recording

    def stop_recording(self, camera_id: str) -> dict[str, Any] | None:
        """Stop an active recording.

        Args:
            camera_id: Camera to stop recording.

        Returns:
            Completed recording info, or None if not recording.
        """
        recording = self._active_recordings.pop(camera_id, None)
        if not recording:
            logger.warning(f"Camera {camera_id} is not recording")
            return None

        now = datetime.now(timezone.utc)
        duration = int(time.time() - recording["start_timestamp"])

        recording.update({
            "status": "completed",
            "end_time": now.isoformat(),
            "duration": duration,
        })

        del recording["start_timestamp"]

        logger.info(
            f"Stopped recording {recording['id']} for camera {camera_id} "
            f"(duration: {duration}s)"
        )
        return recording

    def update_frame_stats(
        self, camera_id: str, max_temp: float, avg_temp: float
    ) -> None:
        """Update peak/avg temperature stats for an active recording."""
        recording = self._active_recordings.get(camera_id)
        if not recording:
            return

        if max_temp > recording["peak_temp"]:
            recording["peak_temp"] = max_temp
        # Running average approximation
        recording["avg_temp"] = (recording["avg_temp"] + avg_temp) / 2
        recording["duration"] = int(time.time() - recording["start_timestamp"])

    def increment_alert_count(self, camera_id: str) -> None:
        """Increment alert count for an active recording."""
        recording = self._active_recordings.get(camera_id)
        if recording:
            recording["alert_count"] += 1

    def is_recording(self, camera_id: str) -> bool:
        """Check if a camera is currently recording."""
        return camera_id in self._active_recordings

    def get_active_recording(self, camera_id: str) -> dict[str, Any] | None:
        """Get the active recording for a camera."""
        return self._active_recordings.get(camera_id)

    def get_all_active(self) -> list[dict[str, Any]]:
        """Get all active recordings."""
        return list(self._active_recordings.values())


# Singleton
recording_manager = RecordingManager()
