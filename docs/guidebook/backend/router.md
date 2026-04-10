# Module: router

## Purpose
Aggregate API v1 router that collects all sub-routers and mounts them under the `/api/v1` prefix. This is the single entry point imported by `main.py`.

## Location
`backend/app/api/v1/router.py`

## Dependencies
All route modules:
- [[auth]], [[cameras]], [[groups]], [[rois]], [[alerts]], [[recordings]], [[reports]], [[system]], [[settings]], [[analytics]], [[layout]]

## Key Components

### `api_router`
- `APIRouter(prefix="/api/v1")`
- Includes all 11 sub-routers via `include_router()`
- Order: auth, cameras, groups, rois, alerts, recordings, reports, system, settings, analytics, layout

## Usage
```python
from app.api.v1.router import api_router
app.include_router(api_router)
```
