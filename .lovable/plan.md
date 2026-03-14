

## Problem

The current participants list reads `instance_id` directly from the `participants` table, treating each participant as belonging to a single instance. In reality, participants can belong to multiple instances via the `participant_instance_assignments` table. The search bar also needs to work properly — the user confirmed they want the **global header search** to find participants.

## Understanding

- `participant_instance_assignments` table links `participant_id` to `instance_id`, with optional `sub_group_id`, `super_group_id`, etc.
- The `participants` table has a legacy `instance_id` column that may represent a "primary" or "most recent" assignment
- The global search already queries participants by name — this was implemented previously

## Plan

### 1. Update `useParticipants` hook to use `participant_instance_assignments`

- Query `participant_instance_assignments` alongside participants to get all instance assignments per participant
- Join with `instances` table for instance names
- Return an array of instance names per participant (or show the assignment-based instance/subgroup/supergroup)
- Option A: Show one row per participant with multiple instance badges
- Option B: Show one row per assignment (a participant appears multiple times)

**Recommendation**: Option A — one row per participant, with instance names shown as comma-separated or badges. This avoids duplicating participants and is more intuitive for management.

Changes to `useParticipants.ts`:
- Fetch `participant_instance_assignments` with `participant_id, instance_id, sub_group_id, super_group_id`
- Build a map of `participant_id → assignment[]`
- Enrich each participant with their assignments and resolved instance/subgroup/supergroup names
- Update `ParticipantRow` interface to include `instances: { name: string; id: string }[]` alongside keeping `instance_name` for backward compatibility

### 2. Update Participants table to show multiple instances

In `Participants.tsx`:
- Update the Instance column to render multiple instance badges/chips when a participant has more than one
- Update the Instance filter to check if any of the participant's instances match
- Update the Subgroup column similarly if needed

### 3. Verify global header search works

The global search in `DashboardHeader.tsx` already queries participants by name via Supabase `ilike`. This should already be functional. No changes needed unless there's a bug to investigate.

## Files to modify

- `src/hooks/useParticipants.ts` — fetch from `participant_instance_assignments`, build multi-instance data
- `src/pages/Participants.tsx` — render multiple instances per participant, update filters

