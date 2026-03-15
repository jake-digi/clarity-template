

## API Gateway Gap Analysis & Plan

### Current State

The API gateway at `supabase/functions/api-gateway/index.ts` has these resources:

| Resource | GET list | GET by ID | POST | PATCH | DELETE |
|---|---|---|---|---|---|
| instances | Yes | Yes | Yes | Yes | Yes (soft) |
| participants | Yes | Yes | Yes | Yes | Yes (hard) |
| groups/supergroups | Yes | - | Yes | - | - |
| groups/subgroups | Yes | - | Yes | - | - |
| blocks | Yes | - | Yes | - | - |
| rooms | Yes | - | Yes | - | - |

### What's Missing

**1. Participant Instance Assignments (critical gap)**
No endpoints exist to manage the `participant_instance_assignments` table. This means:
- Cannot add a participant to an instance via API
- Cannot remove a participant from an instance
- Cannot move a participant between rooms/groups via API
- Cannot update arrival/departure, off-site status

**2. Groups — incomplete CRUD & wrong URL structure**
Current structure is `/api/v1/groups/supergroups` with `instance_id` as a query param. Groups are instance-scoped, so the URL should nest under instances. Also missing PATCH, DELETE, and GET-by-ID for both supergroups and subgroups.

**3. Blocks & Rooms — incomplete CRUD**
Only GET (list) and POST exist. Missing GET-by-ID, PATCH, DELETE, and filtering by instance/block.

### Proposed New URL Structure

```text
# ── Participant Instance Assignments ──
POST   /api/v1/instances/:instanceId/participants              (assign participant to instance)
GET    /api/v1/instances/:instanceId/participants              (list participants in instance)
PATCH  /api/v1/instances/:instanceId/participants/:assignmentId (update assignment: room, group, off-site)
DELETE /api/v1/instances/:instanceId/participants/:assignmentId (remove participant from instance)

# ── Supergroups (instance-scoped) ──
GET    /api/v1/instances/:instanceId/supergroups
POST   /api/v1/instances/:instanceId/supergroups
GET    /api/v1/instances/:instanceId/supergroups/:sgId
PATCH  /api/v1/instances/:instanceId/supergroups/:sgId
DELETE /api/v1/instances/:instanceId/supergroups/:sgId          (soft delete)

# ── Subgroups (nested under supergroup) ──
GET    /api/v1/instances/:instanceId/supergroups/:sgId/subgroups
POST   /api/v1/instances/:instanceId/supergroups/:sgId/subgroups
GET    /api/v1/instances/:instanceId/supergroups/:sgId/subgroups/:subId
PATCH  /api/v1/instances/:instanceId/supergroups/:sgId/subgroups/:subId
DELETE /api/v1/instances/:instanceId/supergroups/:sgId/subgroups/:subId  (soft delete)

# ── Blocks & Rooms (full CRUD, instance-filtered) ──
GET    /api/v1/blocks?instance_id=...
GET    /api/v1/blocks/:blockId
PATCH  /api/v1/blocks/:blockId
DELETE /api/v1/blocks/:blockId                                  (soft delete)

GET    /api/v1/rooms?block_id=...&instance_id=...
GET    /api/v1/rooms/:roomId
PATCH  /api/v1/rooms/:roomId
DELETE /api/v1/rooms/:roomId                                    (soft delete)
```

### Implementation Details

**File**: `supabase/functions/api-gateway/index.ts`

1. **Add instance-scoped participant assignments section** — New routing block that matches `segments[2] === "instances"` + `segments[4] === "participants"`. Queries the `participant_instance_assignments` table joined with `participants` for GET. POST creates a new assignment row. PATCH updates `sub_group_id`, `super_group_id`, `block_id`, `room_id`, `room_number`, `is_off_site`, `off_site_comment`, `arrival_date`, `departure_date`. DELETE hard-deletes the assignment row.

2. **Add instance-scoped supergroups/subgroups** — New routing block matching `segments[2] === "instances"` + `segments[4] === "supergroups"`. Full CRUD with soft-delete. Subgroups nest at `segments[6] === "subgroups"`. DELETE on a supergroup cascades soft-delete to child subgroups.

3. **Complete blocks CRUD** — Add GET-by-ID, PATCH, DELETE (soft) to existing blocks section. Add `instance_id` query filter.

4. **Complete rooms CRUD** — Add GET-by-ID, PATCH, DELETE (soft). Add `block_id` and `instance_id` query filters.

5. **Keep legacy `/groups/supergroups` and `/groups/subgroups`** routes working for backward compatibility but they will be secondary to the new instance-scoped routes.

6. **Redeploy** the edge function after changes.

### Scope

- Single file edit: `supabase/functions/api-gateway/index.ts`
- Deploy via `supabase--deploy_edge_functions`
- No frontend changes needed

