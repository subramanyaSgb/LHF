# Module: settings

## Purpose
Admin-only runtime key-value settings stored in the database. Allows configuration changes without application restarts.

## Location
`backend/app/api/v1/settings.py`

## Dependencies
- [[auth]] -- `require_role("admin")` for all endpoints
- `app.models.setting.SystemSetting` -- ORM model
- `app.schemas.operational.SettingResponse`, `SettingUpdate` -- Pydantic schemas

## Key Components

### `list_settings`
- Returns all settings ordered by key

### `bulk_update_settings`
- Accepts a list of `SettingUpdate` items, upserts each one

### `get_setting` / `update_setting`
- Single key access by URL path parameter
- Update creates the setting if it does not exist

## Related Modules
- [[system]] -- System health and operational management
