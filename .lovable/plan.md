

# Stages Management, Tracking & DofE Instance Support

## Current State

The web app already has:
- **Instance creation** with DofE type selection (standard/dofe, level, expedition type) -- fully working
- **Stages tab** that displays stage templates and tasks in read-only cards -- no CRUD operations
- **Tracking tab** using Leaflet that queries `tracker_logs` by subgroup IDs -- basic but functional
- All required DB tables exist: `stage_templates`, `stage_tasks`, `group_stage_progress`, `group_stage_task_completions`, `group_stage_participant_status`, `tracker_logs`

The Electron knowledge folder contains rich reference components for stages (StagesTable matrix, StageDetailsModal with task fields and participant attendance, StageTemplateManager for CRUD, TaskConfigurator for field types, InstanceMap with tracker assignment sidebar). These are the target feature parity.

## What Needs Building

### 1. Stages Tab -- Full CRUD & Progress Matrix

Replace the current read-only stages list with an interactive system:

**a) Stage Template Manager (new component)**
- Dialog to add/edit/delete stage templates for an instance
- Add tasks to each stage via TaskConfigurator dialog (checkbox, text, textarea, multiple_choice, rating, number field types)
- Save/load from global templates (`global_stage_templates` table)
- Wire to Supabase via direct queries (no service layer needed -- use `supabase` client directly)

**b) Stage Task Field component (new component)**
- Renders the correct input based on `field_type` (checkbox, text, textarea, multiple_choice, rating, number)
- Handles `field_config` for options, rating scales, number constraints

**c) Task Configurator (new component)**
- Dialog for creating/editing a task: description, field type selector, required toggle, placeholder, and type-specific config (options for multiple choice, max/labels for rating, min/max/step for number)

**d) Stages Progress Matrix (new component)**
- Grid: rows = subgroups, columns = stage templates
- Cells show progress status (locked/start/in-progress/completed) with progress bars
- Click a cell to open Stage Details modal

**e) Stage Details Modal (new component)**
- Shows all tasks with appropriate field inputs
- Participant attendance section (present/absent toggle per participant)
- Notes, incident flag toggle
- Save progress and "Mark Complete" actions
- Read-only when stage is completed (locking mechanism)

**Types file**: Create `src/types/stages.ts` mirroring the Electron version.

### 2. Tracking Tab -- Enhanced with Tracker Assignment

Upgrade the existing `InstanceTrackingTab`:

**a) Tracker Selection Modal (new component)**
- Lists all trackers from `tracker_logs` (deduplicated by `group_id`)
- Checkbox selection to assign trackers to the instance
- Saves selected tracker IDs to `instances.settings.assigned_trackers`

**b) Enhanced Map with Sidebar**
- Left sidebar listing assigned trackers with visibility toggles, battery, last-seen info
- Tracker-to-group association via `instances.settings.tracker_associations`
- Trail polylines (solid for selected, dotted for others)
- Auto-refresh polling (30s interval)
- Context menu on tracker items to assign to supergroup/subgroup

**c) User locations** (if `user_locations` table has data for the instance)

### 3. No Database Migrations Needed

All required tables already exist in Supabase:
- `stage_templates` (id, instance_id, tenant_id, stage_number, title, description, order_number, requires_previous_stage)
- `stage_tasks` (id, stage_template_id, field_type, field_config, description, order_number, required, placeholder)
- `group_stage_progress` (id, subgroup_id, stage_template_id, status, notes, incident_flag, completed_at)
- `group_stage_task_completions` (id, group_stage_progress_id, stage_task_id, completed, response_value, response_data)
- `group_stage_participant_status` (id, group_stage_progress_id, participant_id, is_present, comment)
- `tracker_logs` (id, group_id, subgroup_id, latitude, longitude, battery_level, device_desc, timestamp)
- `global_stage_templates` (for save/load templates)
- `instances.settings` JSONB already supports `assigned_trackers` and `tracker_associations`

### 4. Files to Create/Modify

**New files:**
- `src/types/stages.ts` -- Type definitions
- `src/components/instance/StageTemplateManager.tsx` -- CRUD for stages and tasks
- `src/components/instance/TaskConfigurator.tsx` -- Task field config dialog
- `src/components/instance/StageTaskField.tsx` -- Renders task input by field type
- `src/components/instance/StageDetailsModal.tsx` -- Progress tracking per group+stage
- `src/components/instance/StagesProgressMatrix.tsx` -- Matrix grid view
- `src/components/instance/TrackerSelectionModal.tsx` -- Assign trackers to instance

**Modified files:**
- `src/pages/InstanceDetailPage.tsx` -- Replace stages tab content with StagesProgressMatrix, upgrade tracking tab
- `src/components/instance/InstanceTrackingTab.tsx` -- Add tracker sidebar, assignment, polling, enhanced map

### 5. Implementation Approach

All components will use React Query for data fetching and direct Supabase client calls (matching existing app patterns). No new hooks needed -- queries will be inline in components. The Electron knowledge components serve as the design reference but will be adapted to use shadcn/ui components already in the project.

