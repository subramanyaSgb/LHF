# InfraSense Codebase Guidebook

Module map for the InfraSense backend and frontend.

## Backend

### API Routes (app/api/v1/)
- [[auth]] -- Authentication endpoints and JWT/role dependencies
- [[cameras]] -- Camera CRUD and thermal frame retrieval
- [[groups]] -- Camera group CRUD and stitch mapping management
- [[rois]] -- ROI CRUD and temperature data retrieval
- [[alerts]] -- Alert rule CRUD and alert lifecycle (acknowledge/resolve)
- [[recordings]] -- Recording lifecycle, flagging, and annotations
- [[reports]] -- Report generation, listing, and download
- [[system]] -- System health, shift notes, and audit log
- [[settings]] -- Runtime key-value settings (admin only)
- [[analytics]] -- Dashboard analytics: timelines, heat summaries, alert frequency, ladle life, camera uptime
- [[layout]] -- Dashboard layout preset save/load
- [[router]] -- Aggregate router mounting all sub-routers

### Models (app/models/)
- [[user]] -- User accounts with role-based access
- [[camera]] -- Thermal camera hardware records
- [[group]] -- Camera groups and stitch mappings
- [[roi]] -- Regions of interest and temperature data
- [[alert-models]] -- Alert rules, recipients, and alert events
- [[recording-models]] -- Recording sessions and annotations
- [[report-model]] -- Generated reports
- [[operational]] -- Shift notes, audit log, ladles, hot spots
- [[setting-model]] -- Runtime key-value settings
- [[layout-model]] -- Dashboard layout presets

### Schemas (app/schemas/)
- Pydantic Create/Update/Response schemas for each domain

### Services (app/services/)
- [[camera-mock]] -- Simulated thermal frame generation
- [[system-monitor]] -- Server/PLC/network health checks
- [[alert-engine]] -- Threshold detection and SMS dispatch
- [[recording-manager]] -- Recording lifecycle management
- [[sms-service]] -- SMS gateway integration
