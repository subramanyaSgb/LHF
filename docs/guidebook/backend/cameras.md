# Module: cameras

## Purpose
Provides the CRUD API for thermal camera records and a real-time frame retrieval endpoint. Cameras are the primary hardware entities in InfraSense.

## Location
`backend/app/api/v1/cameras.py`

## Dependencies
- [[auth]] -- `get_current_user`, `require_role` for authentication and authorization
- [[camera-mock]] -- `mock_camera_service` for generating simulated thermal frames
- `app.models.camera.Camera` -- SQLAlchemy ORM model
- `app.schemas.camera` -- Pydantic request/response schemas

## Key Components

### `list_cameras`
- **Purpose:** Paginated listing with optional group_id and status filters
- **Inputs:** Query params: skip, limit, group_id, status
- **Outputs:** `list[CameraResponse]`
- **Auth:** Any authenticated user

### `get_camera`
- **Purpose:** Fetch single camera by UUID
- **Auth:** Any authenticated user

### `create_camera`
- **Purpose:** Register a new camera in the system
- **Auth:** Admin only

### `update_camera`
- **Purpose:** Partial update of camera fields
- **Auth:** Admin only

### `delete_camera`
- **Purpose:** Remove a camera record
- **Auth:** Admin only

### `get_latest_frame`
- **Purpose:** Get the latest thermal frame data (matrix + stats)
- **Side effects:** Registers camera with mock service if not already running
- **Auth:** Any authenticated user

## Data Flow
1. Request arrives with JWT Bearer token
2. `get_current_user` validates token and extracts user
3. For admin endpoints, `require_role("admin")` checks role hierarchy
4. SQLAlchemy async queries execute against the `cameras` table
5. Results are validated through Pydantic schemas before response

## Related Modules
- [[groups]] -- Cameras belong to groups via `group_id` FK
- [[rois]] -- ROIs are children of cameras
- [[recordings]] -- Recordings reference cameras
