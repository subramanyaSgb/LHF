# Changelog

All notable changes to the InfraSense project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- Camera CRUD endpoints (`GET/POST/PUT/DELETE /api/v1/cameras`, `GET /cameras/{id}/frame`)
- Camera group CRUD with stitch mapping endpoints (`/api/v1/groups`)
- ROI CRUD and temperature data endpoints (`/api/v1/cameras/{id}/rois`, `/api/v1/rois/{id}`)
- Alert rule CRUD and alert lifecycle endpoints (`/api/v1/alerts/rules`, `/api/v1/alerts`)
- Recording lifecycle endpoints with annotations (`/api/v1/recordings`)
- Report generation and download endpoints (`/api/v1/reports`)
- System health, shift notes, and audit log endpoints (`/api/v1/system`)
- Runtime settings key-value store endpoints (`/api/v1/settings`)
- Analytics dashboard endpoints: temperature timeline, heat summaries, alert frequency, ladle life, camera uptime (`/api/v1/analytics`)
- Layout preset save/load/delete endpoints (`/api/v1/layout/presets`)
- Auth dependencies: `get_current_user` (JWT Bearer) and `require_role()` (role hierarchy)
- Aggregate API v1 router mounting all sub-routers under `/api/v1`
- LayoutPreset model for persisting user dashboard configurations
- Analytics and layout Pydantic schemas
