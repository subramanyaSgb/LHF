# CLAUDE.md — InfraSense Development Standards

> **InfraSense** — LHF Thermal Monitoring System for JSW Vijayanagar SMS
> Stack: Python (FastAPI) + React + PostgreSQL
> This file is **mandatory** for Claude Code. Every code interaction MUST follow these rules.

---

## 1. Golden Rules

1. **Never write code without updating docs.** Every code change triggers corresponding documentation updates.
2. **Never make an architectural decision without creating an ADR.**
3. **Never add a dependency without justifying it in `DEPENDENCIES.md`.**
4. **Never modify the database schema without updating the ERD and schema changelog.**
5. **Never create/modify an API endpoint without updating the API reference.**
6. **Never skip writing tests.** Every feature and bug fix must have test coverage.
7. **Always update the codebase guidebook** when creating or modifying a module.
8. **Always log changes** in `CHANGELOG.md` following the Keep a Changelog format.

---

## 2. Project Documentation Structure

Maintain the following `docs/` folder at the project root. Create any missing files/folders on first encounter.

```
docs/
├── README.md                          # Project overview, quick start, tech stack
├── CHANGELOG.md                       # Version history (auto-updated by Claude)
├── DEPENDENCIES.md                    # Every dependency + why it was chosen
│
├── architecture/
│   ├── system-architecture.md         # High-level system diagram (hardware + software + network)
│   ├── data-flow.md                   # PLC → Cameras → Processing → Dashboard → Alerts → Reports
│   ├── erd.md                         # Entity Relationship Diagram (database schema)
│   ├── schema-changelog.md            # Database migration history with reasoning
│   └── adr/                           # Architecture Decision Records
│       └── 000-template.md            # ADR template
│
├── guides/
│   ├── environment-setup.md           # How to set up dev environment
│   ├── deployment.md                  # On-site deployment checklist
│   ├── troubleshooting.md             # Known issues and field fixes
│   └── monitoring.md                  # System health checks, camera connectivity, disk usage
│
├── api/
│   ├── api-reference.md               # All endpoints: params, responses, auth
│   └── auth-flow.md                   # Authentication & authorization flow
│
├── integration/
│   ├── plc-signal-mapping.md          # PLC start/stop signals, Level 1 data fields, protocol
│   ├── sms-alert-rules.md             # Threshold definitions, recipient management, escalation
│   ├── report-templates.md            # Daily report format, customizable fields
│   └── ocr-spec.md                    # Ladle number OCR approach, fallback to manual entry
│
├── operations/
│   ├── storage-calculations.md        # 4 cameras × 45 min × frame rate × retention = disk math
│   ├── retention-policy.md            # When recordings are kept vs deleted
│   ├── backup-recovery.md             # Recording backup strategy
│   └── maintenance-procedures.md      # Thermal camera calibration, health checks
│
├── hardware/
│   ├── bom.md                         # Bill of Materials: cameras, PCs, network gear
│   ├── camera-config.md               # Camera models, IPs, mounting, FOV coverage
│   └── site-deployment-map.md         # Physical layout, which camera covers which LHF
│
├── handover/
│   └── client-handover.md             # Operator guide for JSW team
│
├── conventions/
│   ├── coding-conventions.md          # Naming, file structure, patterns
│   ├── testing-strategy.md            # What to test, how, coverage targets
│   └── performance-notes.md           # Bottlenecks, optimizations done
│
└── guidebook/                         # Obsidian-compatible codebase guidebook
    ├── _index.md                      # Module map / table of contents
    ├── backend/                       # One .md per backend module
    ├── frontend/                      # One .md per frontend component/page
    ├── services/                      # One .md per service
    └── database/                      # One .md per model/table explanation
```

---

## 3. Auto-Update Rules (Claude Code MUST follow)

### On Every Code Change
| What Changed | Update These Docs |
|---|---|
| New file/module created | `guidebook/` — add module explanation |
| Database model changed | `architecture/erd.md` + `architecture/schema-changelog.md` |
| API endpoint added/modified | `api/api-reference.md` |
| New dependency added | `DEPENDENCIES.md` with justification |
| Bug fixed | `CHANGELOG.md` + `guides/troubleshooting.md` if relevant |
| Feature added | `CHANGELOG.md` + relevant `guidebook/` page |
| Architectural choice made | `architecture/adr/NNN-title.md` |
| Auth logic changed | `api/auth-flow.md` |
| Alert rules changed | `integration/sms-alert-rules.md` |
| Report format changed | `integration/report-templates.md` |
| Performance optimization | `conventions/performance-notes.md` |
| New coding pattern introduced | `conventions/coding-conventions.md` |
| Tests added/changed | `conventions/testing-strategy.md` if strategy changes |

### CHANGELOG Format
Follow [Keep a Changelog](https://keepachangelog.com/):
```markdown
## [Unreleased]

### Added
- Brief description of what was added

### Changed
- Brief description of what changed

### Fixed
- Brief description of what was fixed

### Removed
- Brief description of what was removed
```

### ADR Format
File name: `NNN-short-title.md` (e.g., `001-chose-fastapi-over-django.md`)
```markdown
# ADR-NNN: Title

## Status
Accepted | Superseded | Deprecated

## Context
What is the issue we are facing?

## Decision
What did we decide and why?

## Consequences
What are the trade-offs? What becomes easier/harder?
```

---

## 4. Guidebook Rules (Obsidian Vault)

The `docs/guidebook/` is a **living development guidebook** — an Obsidian-compatible vault that explains the entire codebase in detail.

### Rules for Claude Code:
1. **Every module gets a page.** When you create `services/thermal_processor.py`, create `docs/guidebook/services/thermal-processor.md`.
2. **Explain the WHY, not just the WHAT.** Don't just list functions — explain why they exist, what problem they solve, and how they connect to other modules.
3. **Include code references.** Point to specific functions, classes, and their line-level purpose.
4. **Use Obsidian wiki-links.** Link between pages with `[[module-name]]` syntax so the vault is navigable.
5. **Update `_index.md`** whenever a new page is added.
6. **Keep it in sync.** If you refactor a module, update its guidebook page in the same operation.

### Guidebook Page Template:
```markdown
# Module: {module_name}

## Purpose
What this module does and why it exists.

## Location
`path/to/file.py`

## Dependencies
- [[other-module]] — why it depends on this
- External: `library_name` — what it's used for here

## Key Components

### `ClassName` / `function_name`
- **Purpose:** What it does
- **Inputs:** What it takes
- **Outputs:** What it returns
- **Side effects:** Database writes, API calls, file I/O, alerts triggered

## Data Flow
How data moves through this module. Where it comes from, where it goes.

## Configuration
Environment variables, config keys, thresholds used.

## Edge Cases & Error Handling
What can go wrong and how it's handled.

## Related Modules
- [[related-module-1]] — relationship description
- [[related-module-2]] — relationship description
```

---

## 5. Human-Filled Docs (Claude Code Creates Structure Only)

For the following docs, Claude Code **creates the file with headers, structure, and placeholder prompts** but does NOT fill in values. Mark placeholders clearly:

```markdown
<!-- HUMAN INPUT REQUIRED: [description of what to fill] -->
```

Human-filled docs:
- `hardware/bom.md`
- `hardware/camera-config.md`
- `hardware/site-deployment-map.md`
- `integration/plc-signal-mapping.md` (signal addresses, protocol details)
- `operations/storage-calculations.md` (real frame sizes, disk specs)
- `operations/maintenance-procedures.md` (vendor-specific calibration steps)
- `guides/deployment.md` (site-specific IPs, credentials, network config)
- `handover/client-handover.md` (needs client review before finalizing)

---

## 6. Coding Conventions

### Python (Backend — FastAPI)
- **Formatter:** Black (line length 100)
- **Linter:** Ruff
- **Type hints:** Mandatory on all function signatures
- **Docstrings:** Google style on all public functions and classes
- **Naming:** snake_case for functions/variables, PascalCase for classes
- **Async:** Use async/await for all I/O operations
- **Error handling:** Never silently swallow exceptions. Log and re-raise or return meaningful errors.
- **Environment variables:** All config via `.env` files, validated through Pydantic Settings

### React (Frontend)
- **Language:** TypeScript (strict mode)
- **Components:** Functional components with hooks only
- **Naming:** PascalCase for components, camelCase for functions/variables
- **Styling:** Tailwind CSS
- **State management:** Document choice in ADR when decided
- **API calls:** Centralized API client, never raw fetch in components

### PostgreSQL (Database)
- **Migrations:** Alembic — every schema change goes through a migration
- **Naming:** snake_case for tables and columns
- **Timestamps:** Always include `created_at` and `updated_at` on every table
- **Soft delete:** Use `deleted_at` timestamp instead of hard deletes for critical data (heats, recordings, alerts)

### General
- **Commits:** Follow Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`)
- **No hardcoded values:** All thresholds, intervals, and limits go in config
- **Logging:** Structured logging with context (heat_number, ladle_id, camera_id)

---

## 7. Testing Strategy

- **Unit tests:** All business logic (threshold detection, alert rules, report generation)
- **Integration tests:** PLC data ingestion, database operations, SMS dispatch
- **API tests:** Every endpoint with valid, invalid, and edge case inputs
- **Framework:** pytest (backend), Vitest (frontend)
- **Coverage target:** Minimum 80% on business-critical services (thermal processing, alert engine, recording manager)
- **Test naming:** `test_{what_it_does}_{scenario}` (e.g., `test_threshold_breach_sends_sms_alert`)

---

## 8. Project Context for Claude Code

### What This System Does
InfraSense is a **camera-first, dynamically configurable** thermal monitoring platform for LHF (Ladle Heating Furnace) surface temperature monitoring at JSW Vijayanagar SMS. Operators add thermal cameras at runtime, optionally group them into logical monitoring areas (e.g., LHF-1, LHF-2), and configure stitched composite views, ROI zones, and smart alerts — all through the UI with zero hardcoded layouts.

### Hardware
- **Cameras:** Micro-Epsilon TIM 8 thermal imaging cameras
- **Connectivity:** Micro-Epsilon GigE server (Gigabit Ethernet)
- **Backend Interface:** Micro-Epsilon SDK → WebSocket push to browser
- **Deployment:** On-premise, 24/7 operation in harsh steel plant environment

### Architecture Philosophy
- **Cameras are atomic units** — each camera stores data independently, always
- **Groups are optional** — logical overlay for organizing cameras covering the same physical area
- **Dynamic configuration** — empty dashboard on first launch, user builds their monitoring setup
- **Data is always per-camera** — groups provide aggregated views, alerts reference group + camera location

### Process Flow
```
App Start → Empty Dashboard → Admin adds cameras → Cameras appear on dashboard
→ Admin optionally creates groups (LHF-1, LHF-2...) → Assigns cameras to groups
→ Configures stitched composite view (camera position mapping)
→ Draws ROI zones (point, line, box, circle, polygon) on feeds
→ Configures alert thresholds per ROI/zone

Operational Flow:
PLC Start Signal → Auto-start recording (all cameras in group)
→ Fetch Heat No., Ladle ID, Ladle Life from Level 1
→ Live monitoring with ROI overlay → Smart alerts (threshold + predictive)
→ PLC Stop Signal → Stop recording → Save with metadata
→ Generate summary → Update analytics → Daily report at 6:00 AM
```

### Core Features

#### Camera & Dashboard
- **Dynamic Camera Management** — Add/remove TIM 8 cameras at runtime via GigE discovery
- **Configurable Layout** — Auto-fit (responsive), grid (user picks columns), or custom drag-and-drop
- **Dashboard Presets** — Save/switch between multiple layout configurations
- **Hardware Health Bar** — Always visible: camera body temps, PLC status, server CPU/disk, network health

#### Groups & Stitching
- **Camera Groups** — Logical grouping (e.g., 4 cameras = LHF-1). Optional, not required
- **Stitched Composite View** — Merge grouped cameras into single view. User configures which camera maps to which quadrant (top-left, top-right, bottom-left, bottom-right)
- **Group-aware Alerts** — Alerts reference group name + camera location (e.g., "LHF-1 — Cam-3 South")

#### ROI System
- **5 Shape Types** — Point, Line, Box, Circle, Polygon
- **Per-ROI Stats** — Min, Max, Avg temperature. User toggles which stats to display per ROI
- **ROI Configuration** — Name, color, font size, alert binding
- **Persistent Data Logging** — ROI temperature data logged every configurable interval with timestamps
- **ROI in Playback** — ROIs visible during recording replay at saved positions
- **ROI in Analytics** — Plot any ROI's temperature trend over time, compare across heats
- **ROI in Reports** — Peak values, time-above-threshold per ROI included in reports

#### Smart Alert System (8 Alert Types)
1. **Temperature Breach** — ROI/zone exceeds max threshold
2. **Rapid Spike** — Temperature rises faster than configured rate (e.g., +50°C in <30sec)
3. **Cold Zone** — Temperature drops below minimum threshold
4. **Camera Offline** — No feed received for configurable duration
5. **Device Overheat** — Camera body temperature exceeds safe range
6. **Recording Failure** — Recording start failed or stream interrupted
7. **Disk Warning** — Storage below configured threshold
8. **PLC Disconnect** — PLC connection lost

- **Predictive Alerts** — Calculate time-to-breach based on current rate of change, warn 2-3 minutes BEFORE threshold breach
- **Zone-based Alerts** — Draw named zones on stitched view, each with independent alert rules and recipient lists
- **Delivery** — In-app notification (always) + SMS + Email (configurable per alert type)
- **Audio Alarm** — Configurable tone, mutable
- **Acknowledgment** — Alerts persist until operator acknowledges

#### Recording System
- **PLC-triggered Auto Recording** — Process start signal → auto-start all cameras in group
- **Manual Override** — Force Start / Force Stop buttons when PLC signal is missed
- **Heat Metadata** — Auto-fetch heat number, ladle ID, ladle life from Level 1. Manual entry fallback with validation
- **Playback** — Timeline scrubber, speed controls (0.5x–8x), frame-by-frame step, alert markers on timeline
- **Stitched Playback** — All cameras in group replay in sync as composite view
- **Heat Comparison** — Side-by-side synchronized playback of 2 heats, delta values on same-name ROIs
- **Annotations** — Timestamped operator notes during playback, persisted and searchable
- **Time-lapse** — Auto-generate 30-second summary of full 45-min heat

#### Analytics & Reports
- **Temperature Timeline** — Line chart of ROI temps over time, multiple ROIs overlaid
- **Heat Summary** — Bar chart of peak/avg temps per heat across date range
- **Alert Frequency** — Histogram of alert count per hour/day/week
- **Ladle Life Tracker** — Usage count per ladle, recurring hot spot locations
- **Camera Uptime** — Uptime percentage per camera over time
- **Group Comparison** — Side-by-side LHF performance comparison
- **Thermal Baseline Profiles** — Define expected temp curves, flag real-time deviations
- **Ladle Heat Map History** — Overlay recurring hot spots across multiple heats on ladle diagram
- **Filters** — Date range, group, camera, ROI, shift, heat number
- **Export** — PDF, Excel, CSV for any chart or dataset
- **Auto Reports** — Daily (6 AM), Weekly (Monday), Monthly (1st). Custom on-demand
- **Report Templates** — Admin configures which sections to include, email recipient lists

#### Operational Features
- **Snapshot Capture** — One-click still frame from live feed with ROI data, timestamp, heat number
- **Shift Handover Notes** — End-of-shift notes visible to next shift on login
- **Audit Log** — Full traceability: who changed thresholds, acknowledged alerts, added cameras
- **Incident Report Generator** — Auto-create report from critical alert with snapshots, ROI data, timeline, recording link
- **Manual Entry** — Heat number, ladle number, ladle life with validation (fallback when Level 1 unavailable)
- **Ladle OCR** — Attempt to read ladle number from thermal image, fallback to manual entry

#### Integration
- **PLC** — Process start/stop signals, Level 1 data fetch (heat number, ladle ID, ladle life)
- **REST API** — External systems (Level 2/MES) can query temperature data, alert history, heat records
- **SMS Gateway** — Configurable SMS delivery for alerts
- **Email/SMTP** — Report delivery, alert notifications

### User Roles
| Role | Access |
|------|--------|
| **Admin** | Full access: camera management, groups, users, thresholds, system settings |
| **Operator** | Dashboard, recordings, reports, analytics, alert acknowledgment, manual recording control, layout customization |
| **Viewer** | Read-only: dashboard, recordings, reports, analytics |

### UI Design Principles
- **High-contrast operational theme** — Designed for bright factory environments
- **Bold colors, large text, oversized controls** — Glanceable from 3+ meters away
- **Color coding** — Green (healthy), Yellow (warning), Red (critical)
- **Dark background** with high-contrast elements
- **Responsive** — Large monitor (24"+, full layout) → Tablet (collapsed sidebar, touch-friendly) → Wall-mounted TV (fullscreen, auto-rotate between groups)

### Key Constraints
- On-premise deployment (not cloud)
- PLC provides process start/end signals
- Micro-Epsilon TIM 8 cameras via GigE server
- Storage optimization is critical (N cameras × 45 min continuous per heat)
- System must run 24/7 in harsh steel plant environment
- OCR accuracy depends on thermal image resolution — fallback to manual entry always available

---

## 9. Application Structure

```
infrasense/
├── CLAUDE.md
├── README.md
├── docker-compose.yml
├── .env.example
│
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app entry
│   │   ├── config.py                  # Pydantic Settings
│   │   ├── models/                    # SQLAlchemy models
│   │   ├── schemas/                   # Pydantic request/response schemas
│   │   ├── api/
│   │   │   └── v1/                    # Versioned API routes
│   │   ├── services/                  # Business logic
│   │   │   ├── thermal_processor.py   # Camera frame processing (TIM 8 SDK interface)
│   │   │   ├── alert_engine.py        # Threshold detection + predictive alerts + SMS dispatch
│   │   │   ├── recording_manager.py   # PLC-triggered start/stop/store recordings
│   │   │   ├── report_generator.py    # Daily/weekly/monthly report generation
│   │   │   ├── plc_client.py          # PLC communication (start/stop signals, Level 1 data)
│   │   │   ├── ocr_service.py         # Ladle number OCR from thermal images
│   │   │   ├── roi_processor.py       # ROI temperature calculation (min/max/avg per shape)
│   │   │   ├── baseline_engine.py     # Thermal baseline profile comparison
│   │   │   └── timelapse_generator.py # Heat time-lapse video generation
│   │   ├── core/                      # Auth (JWT + RBAC), middleware, exceptions
│   │   └── utils/                     # Helpers, thermal color mapping, temp conversions
│   ├── alembic/                       # Database migrations
│   ├── tests/
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/                # Button, Input, Modal, Table, Badge, Card, Tooltip, StatusDot
│   │   │   ├── dashboard/             # CameraCard, StitchedView, HealthBar, AlertBanner, EmptyState
│   │   │   ├── roi/                   # ROIToolbar, DrawingCanvas, ROIOverlay, ROIConfigPanel
│   │   │   ├── recordings/            # Player, Timeline, Annotations, HeatComparison, TimeLapse
│   │   │   ├── analytics/             # TempChart, HeatSummary, AlertHistogram, LadleTracker, Filters
│   │   │   ├── alerts/                # AlertConfigForm, ZoneEditor, AlertHistoryTable, AlertBanner
│   │   │   ├── cameras/               # CameraDiscovery, CameraConfigForm, CameraStatusCard
│   │   │   ├── groups/                # GroupEditor, StitchConfigurator, GroupPreview
│   │   │   ├── layout/                # LayoutEditor, DragDropGrid, PresetManager
│   │   │   ├── reports/               # ReportViewer, ReportGenerator, TemplateConfig
│   │   │   ├── auth/                  # LoginForm, RoleGuard, UserManagement
│   │   │   └── system/                # SystemStatus, AuditLog, Settings, ShiftHandover
│   │   ├── pages/                     # One page component per route (13 pages)
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── CameraManagementPage.tsx
│   │   │   ├── GroupConfigPage.tsx
│   │   │   ├── LayoutEditorPage.tsx
│   │   │   ├── AlertConfigPage.tsx
│   │   │   ├── AlertHistoryPage.tsx
│   │   │   ├── RecordingsPage.tsx
│   │   │   ├── AnalyticsPage.tsx
│   │   │   ├── ReportsPage.tsx
│   │   │   ├── SystemStatusPage.tsx
│   │   │   ├── UserManagementPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── hooks/                     # useWebSocket, useROI, useAlerts, useCamera, useLayout
│   │   ├── services/                  # API client (axios), WebSocket manager
│   │   ├── stores/                    # Zustand: auth, cameras, groups, alerts, layout, recordings
│   │   ├── types/                     # TypeScript interfaces for all domain entities
│   │   └── utils/                     # Thermal palettes, temp formatting, date helpers, validators
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts             # High-contrast operational theme
│   └── vite.config.ts
│
├── docs/                              # As defined in Section 2
│
└── scripts/                           # Deployment, backup, utility scripts
```

### Frontend Pages & Access Control

| # | Page | Route | Admin | Operator | Viewer |
|---|------|-------|-------|----------|--------|
| 1 | Login | `/login` | - | - | - |
| 2 | Dashboard | `/` | ✅ | ✅ | ✅ |
| 3 | Camera Management | `/cameras` | ✅ | ❌ | ❌ |
| 4 | Group Configuration | `/groups` | ✅ | ❌ | ❌ |
| 5 | Layout Editor | `/layout` | ✅ | ✅ | ❌ |
| 6 | Alert Configuration | `/alerts/config` | ✅ | ❌ | ❌ |
| 7 | Alert History | `/alerts/history` | ✅ | ✅ | ✅ |
| 8 | Recordings | `/recordings` | ✅ | ✅ | ✅ |
| 9 | Analytics | `/analytics` | ✅ | ✅ | ✅ |
| 10 | Reports | `/reports` | ✅ | ✅ | ✅ |
| 11 | System Status | `/system` | ✅ | ✅ | ❌ |
| 12 | User Management | `/users` | ✅ | ❌ | ❌ |
| 13 | Settings | `/settings` | ✅ | ❌ | ❌ |

---

## 10. Before You Start Any Task

Every time Claude Code receives a task, follow this checklist:

1. ✅ Understand which modules are affected
2. ✅ Check if an ADR is needed (new tech, new approach, trade-off)
3. ✅ Write the code
4. ✅ Write/update tests
5. ✅ Update `CHANGELOG.md`
6. ✅ Update `docs/guidebook/` for affected modules
7. ✅ Update `docs/api/api-reference.md` if endpoints changed
8. ✅ Update `docs/architecture/erd.md` if schema changed
9. ✅ Update `docs/architecture/schema-changelog.md` if migrations added
10. ✅ Update `DEPENDENCIES.md` if new packages added
11. ✅ Update any other relevant doc from the table in Section 3
12. ✅ Verify all docs are in sync before marking task complete
