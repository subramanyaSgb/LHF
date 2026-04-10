# Module: alerts

## Purpose
Alert rule CRUD and alert event lifecycle management. Rules define threshold conditions; alerts are the events generated when rules fire. Operators acknowledge and resolve alerts.

## Location
`backend/app/api/v1/alerts.py`

## Dependencies
- [[auth]] -- Authentication and authorization
- `app.models.alert.AlertRule`, `Alert`, `AlertStatus` -- ORM models and enums
- `app.schemas.alert` -- Pydantic schemas

## Key Components

### Alert Rule endpoints (admin only for mutations)
- List, create, update, delete alert rules
- Rules can be scoped to camera, group, or ROI via nullable FKs
- Support `enabled` filter on listing

### Alert lifecycle endpoints
- `GET /alerts` -- Filterable by status, priority, type, camera_id, group_id
- `POST /alerts/{id}/acknowledge` -- Sets status to ACKNOWLEDGED, records user and timestamp (operator+)
- `POST /alerts/{id}/resolve` -- Sets status to RESOLVED, records timestamp (operator+)

## Data Flow
- Alert rules are created by admins with threshold configurations
- The [[alert-engine]] service evaluates rules against live data and creates Alert rows
- Operators manage alert lifecycle through acknowledge/resolve endpoints

## Related Modules
- [[cameras]], [[groups]], [[rois]] -- Alert rules can be scoped to these entities
- [[analytics]] -- Alert frequency endpoint aggregates alert data
