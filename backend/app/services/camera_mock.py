"""Mock camera service generating simulated thermal frames.

Replaces real Micro-Epsilon TIM 8 SDK for development and testing.
Toggle via CAMERA_MODE=mock in .env.
"""

import asyncio
import math
import random
import time
from dataclasses import dataclass, field


@dataclass
class ThermalFrame:
    """A single thermal frame from a camera."""

    camera_id: str
    timestamp: float
    width: int
    height: int
    min_temp: float
    max_temp: float
    avg_temp: float
    matrix: list[list[float]] = field(default_factory=list)


class MockCameraService:
    """Generates simulated thermal frames for development."""

    def __init__(self) -> None:
        self._running: dict[str, bool] = {}
        self._frame_rate: dict[str, int] = {}
        self._base_temps: dict[str, float] = {}

    def register_camera(self, camera_id: str, frame_rate: int = 25) -> None:
        """Register a camera for frame generation."""
        self._running[camera_id] = False
        self._frame_rate[camera_id] = frame_rate
        self._base_temps[camera_id] = 1100 + random.uniform(-50, 50)

    def unregister_camera(self, camera_id: str) -> None:
        """Remove a camera from generation."""
        self._running.pop(camera_id, None)
        self._frame_rate.pop(camera_id, None)
        self._base_temps.pop(camera_id, None)

    def start(self, camera_id: str) -> None:
        """Start generating frames for a camera."""
        self._running[camera_id] = True

    def stop(self, camera_id: str) -> None:
        """Stop generating frames for a camera."""
        self._running[camera_id] = False

    def is_running(self, camera_id: str) -> bool:
        """Check if camera is generating frames."""
        return self._running.get(camera_id, False)

    def generate_frame(self, camera_id: str, width: int = 80, height: int = 60) -> ThermalFrame:
        """Generate a single simulated thermal frame.

        Creates a realistic-looking thermal distribution with:
        - Hot center (simulating ladle interior)
        - Cooler edges
        - Random noise
        - Slow drift over time
        """
        t = time.time()
        base_temp = self._base_temps.get(camera_id, 1150)

        # Slow drift in base temperature
        drift = 30 * math.sin(t * 0.05) + 15 * math.sin(t * 0.13)
        base = base_temp + drift

        center_x = width / 2 + 3 * math.sin(t * 0.2)
        center_y = height / 2 + 2 * math.cos(t * 0.15)

        matrix: list[list[float]] = []
        all_temps: list[float] = []

        for y in range(height):
            row: list[float] = []
            for x in range(width):
                dist = math.sqrt((x - center_x) ** 2 + (y - center_y) ** 2)
                max_dist = math.sqrt((width / 2) ** 2 + (height / 2) ** 2)
                normalized = dist / max_dist

                # Gaussian-like falloff from center
                temp = base + (1 - normalized) * 280 * math.exp(-normalized * 1.5)

                # Add noise
                temp += random.gauss(0, 8)

                # Add occasional hot spots
                if random.random() < 0.001:
                    temp += random.uniform(50, 120)

                temp = round(temp, 1)
                row.append(temp)
                all_temps.append(temp)
            matrix.append(row)

        return ThermalFrame(
            camera_id=camera_id,
            timestamp=t,
            width=width,
            height=height,
            min_temp=min(all_temps),
            max_temp=max(all_temps),
            avg_temp=round(sum(all_temps) / len(all_temps), 1),
            matrix=matrix,
        )

    def get_body_temperature(self, camera_id: str) -> float:
        """Simulate camera body temperature (35-55C range)."""
        t = time.time()
        base = 40 + 5 * math.sin(t * 0.01 + hash(camera_id) % 100)
        return round(base + random.gauss(0, 1), 1)


# Singleton instance
mock_camera_service = MockCameraService()
