# Checkpoint App Architecture & Supabase Setup Guide

## 1. Application Architecture
Checkpoint is a desktop-first management operating system built by Bridge Digital for JLGB operations.

### Tech Stack
- **Frameworks**: React 18, TypeScript, Vite, Electron
- **Styling & UI**: Tailwind CSS, Radix UI Primitives, lucide-react
- **State Management**: React Query (@tanstack/react-query), React Hook Form
- **Routing**: React Router (HashRouter for Electron, BrowserRouter for web)
- **Backend/BaaS**: Supabase (@supabase/supabase-js)
- **Mapping**: Leaflet & React-Leaflet (tracker and team mapping)

### Core Features
- **Navigation Rails & Sidebars**: Context-aware sidebars switching by active domain (Instances, Directory, Reports, Tasks, Orders, Quality, H&S, Risks, Team, Admin, Map)
- **Tabbed Workspace**: Multiple records as tabs with split-pane view
- **Auth & Onboarding**: Protected routes via AuthProvider

## 2. Core Data Models

### Key Entities
- **Instances**: Root operational event (camps, training weekends). Statuses: draft, upcoming, active, completed
- **Participants**: Individuals attending instances
- **Groups**: Hierarchy of Supergroups → Subgroups
- **Accommodation**: Blocks → Rooms
- **participant_instance_assignments**: Many-to-many link table (participant ↔ instance), tracking subgroup, block, room, off-site status, arrival/departure

### Stages & Task Tracking
- **global_stage_templates**: Cross-instance JSON templates (tenant-wide)
- **stage_templates**: Instance-specific checklists cloned from globals
- **stage_tasks**: Granular tasks with field_types: checkbox, text, textarea, multiple_choice, rating, number. Config in `field_config` JSONB
- **group_stage_progress**: Overall checkpoint status per group (in_progress, completed, locked)
- **group_stage_task_completions**: Responses per task (completed boolean, response_value TEXT, response_data JSONB)
- **group_stage_participant_status**: Individual attendance/welfare per stage. Implicit presence (only record outliers). UPSERT on (group_stage_progress_id, participant_id). Read-only when stage completed.

## 3. Hardware Trackers (Live Telemetry)

### Data Storage
Tracker associations stored in `instances.settings` JSONB at `settings->'tracker_associations'`:
```json
{
  "tracker_associations": {
    "DEVICE_SERIAL_123": {
      "type": "subgroup",
      "id": "uuid-of-subgroup",
      "name": "Patrol 01"
    }
  }
}
```

### Processing Workflow
1. Hydrate from `instances.settings.tracker_associations`
2. Poll external GPS API for telemetry (DeviceID, lat/lon, battery)
3. Reconcile: match DeviceID to association, fallback to raw serial

### Map Rendering
- Unselected trackers: dotted/stippled lines
- Selected tracker: solid trail (last 24h)
- Markers show: group name, hierarchy, battery, signal, lat/lon grid refs

## 4. Stage Locking Mechanism
- When `group_stage_progress.status = 'completed'`, all participant verifications become read-only
- Preserves audit log at exact completion point
