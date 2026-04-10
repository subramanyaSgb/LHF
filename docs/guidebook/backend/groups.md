# Module: groups

## Purpose
Manages camera groups and their stitch mapping configurations. Groups logically cluster cameras covering the same LHF and support optional panoramic stitching.

## Location
`backend/app/api/v1/groups.py`

## Dependencies
- [[auth]] -- Authentication and authorization
- `app.models.group.CameraGroup`, `StitchMapping` -- ORM models
- `app.models.camera.Camera` -- For camera assignment
- `app.schemas.group` -- Pydantic schemas

## Key Components

### `list_groups` / `get_group`
- Returns groups with embedded `camera_ids` and `stitch_mappings`
- Uses `selectinload` for eager loading of relationships

### `create_group` / `update_group` / `delete_group`
- Admin-only CRUD
- Delete un-assigns all cameras (sets `group_id = NULL`) before removing

### `assign_camera_to_group` / `remove_camera_from_group`
- Admin-only camera-to-group assignment via body (`AssignCameraRequest`) or URL params

### `update_stitch_mappings`
- Replaces all stitch mappings for a group atomically
- Updates grid dimensions (rows, cols, enabled) simultaneously

## Related Modules
- [[cameras]] -- Cameras belong to groups
- [[recordings]] -- Recordings can reference a group
