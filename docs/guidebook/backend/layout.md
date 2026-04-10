# Module: layout

## Purpose
Dashboard layout preset management. Users can save, list, and delete custom dashboard configurations (camera tile arrangements, panel visibility, etc.).

## Location
`backend/app/api/v1/layout.py`

## Dependencies
- [[auth]] -- Authentication (any role can manage their own presets)
- `app.models.layout.LayoutPreset` -- ORM model
- `app.schemas.layout` -- Pydantic schemas

## Key Components

### `list_presets`
- Returns only presets owned by the current user
- Ordered by name

### `create_preset`
- Stores a named preset with a JSON-encoded layout configuration
- Automatically associates with the current user

### `delete_preset`
- Only allows deletion of presets owned by the current user
- Returns 404 if preset not found or not owned

## Data Flow
- Layout JSON is stored as an opaque text field; the frontend defines the schema
- Each user has their own isolated set of presets

## Related Modules
- [[auth]] -- User scoping for preset ownership
