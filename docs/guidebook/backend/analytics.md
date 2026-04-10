# Module: analytics

## Purpose
Dashboard analytics endpoints providing aggregated views for charting: temperature timelines, heat summaries, alert frequency histograms, ladle lifecycle tracking, and camera uptime metrics.

## Location
`backend/app/api/v1/analytics.py`

## Dependencies
- [[auth]] -- Authentication
- `app.models.alert.Alert` -- For alert frequency aggregation
- `app.models.camera.Camera` -- For uptime reporting
- `app.models.recording.Recording` -- For heat summaries and ladle life

## Key Components

### `temperature_timeline`
- Returns mock sample data (real ROIData integration pending)
- Filterable by camera_id and group_id with date range

### `heat_summaries`
- Queries recordings with non-null heat_number
- Returns per-recording summaries with duration, peak/avg temp, flag status

### `alert_frequency`
- Fetches alerts in date range, buckets by hour or day in Python
- Returns period/count pairs sorted chronologically

### `ladle_life_stats`
- Groups recordings by ladle_id using SQL aggregation
- Computes total heats, max ladle life, flag presence, first/last seen

### `camera_uptime`
- Simple heuristic: online/recording = 100%, offline/error = 0%
- Production will track heartbeat history for accurate percentages

## Related Modules
- [[cameras]], [[recordings]], [[alerts]] -- Data sources for analytics
- [[rois]] -- Temperature timeline will use ROIData in production
