# Module: system

## Purpose
System health monitoring, shift handover notes, and immutable audit trail. Provides operational visibility for the plant environment.

## Location
`backend/app/api/v1/system.py`

## Dependencies
- [[auth]] -- Authentication and authorization
- `app.models.operational.ShiftNote`, `AuditEntry` -- ORM models
- `app.schemas.operational` -- Pydantic schemas
- `app.services.system_monitor` -- Health check service

## Key Components

### `get_system_health`
- Delegates to `system_monitor.get_full_health()` for server/PLC/network metrics
- Returns `SystemHealthResponse` with nested server, PLC, and network schemas

### Shift Notes
- `list_shift_notes` -- Filterable by shift_date and shift_type
- `create_shift_note` -- Auto-sets shift_date to today (operator+)

### Audit Log
- `list_audit_log` -- Admin-only, filterable by action and user_id
- Returns immutable `AuditEntry` records ordered newest first

## Related Modules
- [[settings]] -- Runtime configuration
- [[cameras]] -- Health check includes camera status summary
