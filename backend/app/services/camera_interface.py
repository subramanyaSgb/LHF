"""Camera service interface — abstracts mock vs real SDK.

Toggle via CAMERA_MODE env variable:
- mock: Uses MockCameraService (simulated frames)
- real: Uses RealCameraService (Micro-Epsilon TIM 8 SDK)
"""

from __future__ import annotations

import logging
from typing import Protocol

from app.services.camera_mock import ThermalFrame, mock_camera_service

logger = logging.getLogger(__name__)


class CameraServiceProtocol(Protocol):
    """Protocol for camera services."""

    def register_camera(self, camera_id: str, frame_rate: int = 25) -> None: ...
    def unregister_camera(self, camera_id: str) -> None: ...
    def start(self, camera_id: str) -> None: ...
    def stop(self, camera_id: str) -> None: ...
    def is_running(self, camera_id: str) -> bool: ...
    def generate_frame(self, camera_id: str, width: int = 80, height: int = 60) -> ThermalFrame: ...
    def get_body_temperature(self, camera_id: str) -> float: ...


class RealCameraService:
    """Placeholder for Micro-Epsilon TIM 8 SDK integration.

    TODO: Implement with actual TIM Connect SDK when available.
    """

    def register_camera(self, camera_id: str, frame_rate: int = 25) -> None:
        logger.warning("RealCameraService.register_camera not implemented — using mock fallback")
        mock_camera_service.register_camera(camera_id, frame_rate)

    def unregister_camera(self, camera_id: str) -> None:
        mock_camera_service.unregister_camera(camera_id)

    def start(self, camera_id: str) -> None:
        mock_camera_service.start(camera_id)

    def stop(self, camera_id: str) -> None:
        mock_camera_service.stop(camera_id)

    def is_running(self, camera_id: str) -> bool:
        return mock_camera_service.is_running(camera_id)

    def generate_frame(self, camera_id: str, width: int = 80, height: int = 60) -> ThermalFrame:
        return mock_camera_service.generate_frame(camera_id, width, height)

    def get_body_temperature(self, camera_id: str) -> float:
        return mock_camera_service.get_body_temperature(camera_id)


def get_camera_service(mode: str = "mock") -> CameraServiceProtocol:
    """Factory to get camera service based on mode.

    Args:
        mode: "mock" for simulated frames, "real" for TIM 8 SDK.

    Returns:
        Camera service instance.
    """
    if mode == "real":
        logger.info("Using REAL camera service (TIM 8 SDK)")
        return RealCameraService()

    logger.info("Using MOCK camera service (simulated frames)")
    return mock_camera_service
