# Module: rois

## Purpose
CRUD for Regions of Interest drawn on camera frames, plus retrieval of historical ROI temperature data. ROIs are the primary unit for focused temperature monitoring and alert threshold evaluation.

## Location
`backend/app/api/v1/rois.py`

## Dependencies
- [[auth]] -- Authentication and authorization
- `app.models.roi.ROI`, `ROIData`, `ROIPoint` -- ORM models
- `app.models.camera.Camera` -- Parent camera validation
- `app.schemas.roi` -- Pydantic schemas

## Key Components

### Camera-scoped endpoints
- `GET /cameras/{camera_id}/rois` -- List ROIs for a camera (any role)
- `POST /cameras/{camera_id}/rois` -- Create ROI with points (operator+)

### ROI-level endpoints
- `PUT /rois/{roi_id}` -- Update ROI; replaces points if provided (operator+)
- `DELETE /rois/{roi_id}` -- Delete ROI (operator+)
- `GET /rois/{roi_id}/data` -- Historical temperature data with date range filters (any role)

## Data Flow
- ROI creation includes creating child `ROIPoint` records for the polygon vertices
- ROI update with new points atomically deletes old points and creates new ones
- Temperature data queries use `ROIData` table with timestamp-based filtering

## Related Modules
- [[cameras]] -- ROIs belong to cameras
- [[alerts]] -- Alert rules can be scoped to specific ROIs
- [[analytics]] -- Temperature timeline pulls data from ROIData
