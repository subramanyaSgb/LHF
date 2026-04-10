"""WebSocket connection manager for live camera feeds and alerts."""

import asyncio
import json
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for real-time data streaming."""

    def __init__(self) -> None:
        # channel -> set of connected websockets
        self._connections: dict[str, set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, channel: str) -> None:
        """Accept and register a WebSocket connection to a channel."""
        await websocket.accept()
        if channel not in self._connections:
            self._connections[channel] = set()
        self._connections[channel].add(websocket)
        logger.info(f"WebSocket connected to channel: {channel}")

    def disconnect(self, websocket: WebSocket, channel: str) -> None:
        """Remove a WebSocket connection from a channel."""
        if channel in self._connections:
            self._connections[channel].discard(websocket)
            if not self._connections[channel]:
                del self._connections[channel]
        logger.info(f"WebSocket disconnected from channel: {channel}")

    async def send_to_channel(self, channel: str, data: dict[str, Any]) -> None:
        """Broadcast data to all connections on a channel."""
        if channel not in self._connections:
            return

        message = json.dumps(data, default=str)
        dead_connections: list[WebSocket] = []

        for ws in self._connections[channel]:
            try:
                await ws.send_text(message)
            except Exception:
                dead_connections.append(ws)

        # Clean up dead connections
        for ws in dead_connections:
            self._connections[channel].discard(ws)

    async def send_to_all(self, data: dict[str, Any]) -> None:
        """Broadcast data to all connected clients across all channels."""
        message = json.dumps(data, default=str)
        for channel in list(self._connections.keys()):
            dead: list[WebSocket] = []
            for ws in self._connections[channel]:
                try:
                    await ws.send_text(message)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self._connections[channel].discard(ws)

    def get_connection_count(self, channel: str | None = None) -> int:
        """Get number of active connections."""
        if channel:
            return len(self._connections.get(channel, set()))
        return sum(len(conns) for conns in self._connections.values())

    def get_channels(self) -> list[str]:
        """Get list of active channels."""
        return list(self._connections.keys())


# Singleton
ws_manager = ConnectionManager()
