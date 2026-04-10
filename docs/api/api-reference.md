# API Reference

All endpoints are prefixed with `/api/v1`. Authentication is via JWT Bearer tokens unless noted.

## Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | None | Authenticate and obtain JWT |
| GET | `/auth/me` | Any | Get current user profile |
| PUT | `/auth/me/password` | Any | Change current user password |

## Cameras

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/cameras` | Any | List all cameras (query: `skip`, `limit`, `group_id`, `status`) |
| GET | `/cameras/{id}` | Any | Get camera by ID |
| POST | `/cameras` | Admin | Create a new camera |
| PUT | `/cameras/{id}` | Admin | Update camera |
| DELETE | `/cameras/{id}` | Admin | Delete camera |
| GET | `/cameras/{id}/frame` | Any | Get latest thermal frame data |

## Groups

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/groups` | Any | List all groups with camera_ids |
| GET | `/groups/{id}` | Any | Get group detail with stitch mappings |
| POST | `/groups` | Admin | Create a group |
| PUT | `/groups/{id}` | Admin | Update a group |
| DELETE | `/groups/{id}` | Admin | Delete group (unassigns cameras) |
| POST | `/groups/{id}/cameras` | Admin | Assign camera to group |
| DELETE | `/groups/{id}/cameras/{camera_id}` | Admin | Remove camera from group |
| PUT | `/groups/{id}/stitch` | Admin | Update stitch mappings |

## ROIs

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/cameras/{camera_id}/rois` | Any | List ROIs for a camera |
| POST | `/cameras/{camera_id}/rois` | Operator+ | Create ROI on camera |
| PUT | `/rois/{id}` | Operator+ | Update ROI |
| DELETE | `/rois/{id}` | Operator+ | Delete ROI |
| GET | `/rois/{id}/data` | Any | Get ROI temperature data (query: `date_from`, `date_to`) |

## Alerts

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/alerts/rules` | Any | List alert rules (query: `enabled`) |
| POST | `/alerts/rules` | Admin | Create alert rule |
| PUT | `/alerts/rules/{id}` | Admin | Update alert rule |
| DELETE | `/alerts/rules/{id}` | Admin | Delete alert rule |
| GET | `/alerts` | Any | List alerts (query: `status`, `priority`, `type`, `camera_id`, `group_id`) |
| POST | `/alerts/{id}/acknowledge` | Operator+ | Acknowledge alert |
| POST | `/alerts/{id}/resolve` | Operator+ | Resolve alert |

## Recordings

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/recordings` | Any | List recordings (query: `camera_id`, `group_id`, `heat_number`, `ladle_id`, `status`, `is_flagged`, `date_from`, `date_to`) |
| GET | `/recordings/{id}` | Any | Get recording detail |
| POST | `/recordings/start` | Operator+ | Start recording manually |
| POST | `/recordings/{id}/stop` | Operator+ | Stop active recording |
| PUT | `/recordings/{id}/flag` | Operator+ | Toggle flag |
| DELETE | `/recordings/{id}` | Admin | Soft-delete recording |
| GET | `/recordings/{id}/annotations` | Any | List annotations |
| POST | `/recordings/{id}/annotations` | Operator+ | Add annotation |

## Reports

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/reports` | Any | List reports (query: `type`, `status`) |
| POST | `/reports/generate` | Operator+ | Trigger report generation |
| GET | `/reports/{id}/download` | Any | Download report file |
| DELETE | `/reports/{id}` | Admin | Delete report |

## System

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/system/health` | Any | System health snapshot |
| GET | `/system/shift-notes` | Any | List shift notes (query: `shift_date`, `shift_type`) |
| POST | `/system/shift-notes` | Operator+ | Create shift note |
| GET | `/system/audit-log` | Admin | Query audit trail (query: `action`, `user_id`) |

## Settings

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/settings` | Admin | List all settings |
| PUT | `/settings` | Admin | Bulk update settings |
| GET | `/settings/{key}` | Admin | Get single setting |
| PUT | `/settings/{key}` | Admin | Update single setting |

## Analytics

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/analytics/temperature-timeline` | Any | Temperature over time (query: `date_from`, `date_to`, `camera_id`, `group_id`) |
| GET | `/analytics/heat-summaries` | Any | Heat summary data (query: `date_from`, `date_to`, `group_id`) |
| GET | `/analytics/alert-frequency` | Any | Alert count by hour/day (query: `date_from`, `date_to`, `interval`) |
| GET | `/analytics/ladle-life` | Any | Ladle usage statistics |
| GET | `/analytics/camera-uptime` | Any | Camera uptime percentages |

## Layout

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/layout/presets` | Any | List user's saved presets |
| POST | `/layout/presets` | Any | Save a new preset |
| DELETE | `/layout/presets/{id}` | Any | Delete a preset |

## Common Patterns

- **Pagination**: All list endpoints accept `skip` (default 0) and `limit` (default 50, max 200).
- **HTTP Status Codes**: 200 OK, 201 Created, 204 No Content (deletes), 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found.
- **Auth Roles**: viewer < operator < admin. `Operator+` means operator or admin.
