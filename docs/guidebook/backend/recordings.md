# Module: recordings

## Purpose
Recording lifecycle management for per-heat thermal capture sessions. Supports manual start/stop, flagging for review, soft deletion, and operator annotations.

## Location
`backend/app/api/v1/recordings.py`

## Dependencies
- [[auth]] -- Authentication and authorization
- `app.models.recording.Recording`, `RecordingAnnotation`, `RecordingStatus` -- ORM models
- `app.schemas.recording` -- Pydantic schemas

## Key Components

### Recording lifecycle
- `POST /recordings/start` -- Creates recording with IN_PROGRESS status (operator+)
- `POST /recordings/{id}/stop` -- Transitions to COMPLETED, calculates duration (operator+)
- `PUT /recordings/{id}/flag` -- Sets is_flagged and optional reason (operator+)
- `DELETE /recordings/{id}` -- Soft-delete via DELETED status (admin only)

### Listing and filtering
- Supports filters: camera_id, group_id, heat_number, ladle_id, status, is_flagged, date range

### Annotations
- `GET /recordings/{id}/annotations` -- List ordered by timestamp_seconds
- `POST /recordings/{id}/annotations` -- Add annotation with timestamp offset (operator+)

## Edge Cases
- Stopping a non-IN_PROGRESS recording returns 400
- Duration is calculated from start_time to end_time on stop
- Soft delete uses RecordingStatus.DELETED rather than hard delete

## Related Modules
- [[cameras]] -- Recordings belong to a camera
- [[groups]] -- Recordings optionally belong to a group
- [[analytics]] -- Heat summaries aggregate recording data
