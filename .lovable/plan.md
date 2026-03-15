

# API Key Management System

## Addressing Your Points

**Instance type awareness**: The API endpoints will support filtering by instance type (DofE vs Standard) via query parameters like `?type=dofe` or `?type=standard`. The edge function will read `instances.settings` JSONB to determine type and include it in API responses.

**Key prefix**: You're right -- `cpk_` is arbitrary. We'll use `chk_` (short for Checkpoint) which is more brand-aligned. Format: `chk_` + 32 random hex chars.

## What Gets Built

### 1. Database: `api_keys` table

Migration creates the table with RLS scoped to tenant:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | varchar | FK to tenant |
| user_id | varchar | Who created it |
| key_hash | text | SHA-256 of raw key |
| key_prefix | varchar(12) | e.g. `chk_a1b2c3d4` for display |
| name | varchar | User label ("Production", "CI/CD") |
| scopes | text[] | `{read}`, `{read,write}`, `{read,write,admin}` |
| last_used_at | timestamptz | Updated on each API call |
| expires_at | timestamptz | Optional expiry |
| revoked_at | timestamptz | Null = active |
| created_at | timestamptz | |

### 2. Edge Function: `api-gateway`

Single edge function handling all `/api/v1/` routes. Auth via `X-API-Key` header.

**Instance-type-aware endpoints:**
- `GET /api/v1/instances` -- supports `?type=dofe` or `?type=standard` filter; response includes `type` field derived from `settings`
- `GET /api/v1/instances/:id` -- response includes `type`, `dofe_level`, `expedition_type` from settings
- `POST /api/v1/instances` -- accepts `type`, `dofe_level`, `expedition_type` in body, stores in settings JSONB
- `PATCH /api/v1/instances/:id` -- can update type/DofE fields

**Other endpoints (matching old docs):**
- `GET/POST /api/v1/participants` (filterable by `instance_id`)
- `GET/PATCH/DELETE /api/v1/participants/:id`
- `GET/POST /api/v1/groups/supergroups`
- `GET/POST /api/v1/groups/subgroups`
- `GET/POST /api/v1/blocks`
- `GET/POST /api/v1/rooms`
- `GET /health`

**Key management endpoints (self-service):**
- `POST /api/v1/api-keys/generate`
- `GET /api/v1/api-keys/list`
- `DELETE /api/v1/api-keys/revoke`

All responses use the old format: `{ success: true, data: ..., meta: { total, limit, offset } }`.

Flow: hash incoming key with SHA-256, lookup in `api_keys` where `revoked_at IS NULL` and not expired, resolve `tenant_id`, scope all queries to that tenant.

### 3. UI: Rewritten AdminDeveloperTab

Two sections:

**API Keys Management (top)**
- "Create Key" button opens dialog: name, scope checkboxes (read/write/admin), optional expiry date
- On create: calls `api-gateway` to generate key, shows raw key ONCE in a copy-to-clipboard modal
- Keys table: name, prefix (`chk_a1b2...****`), scopes as badges, created date, last used, status (active/expired/revoked), revoke action
- Revoke confirmation dialog

**API Reference (bottom)**
- Base URL shown as the edge function URL
- Endpoints grouped by resource: Instances (noting DofE type filtering), Participants, Groups, Blocks & Rooms
- Each row: method badge, path, description
- Instance endpoints specifically document the `type` query parameter and DofE fields
- Example cURL using `X-API-Key` header
- Existing connection details and quick links cards retained

### 4. Files

**New:**
- `supabase/functions/api-gateway/index.ts` -- Edge function
- Migration for `api_keys` table + RLS policies

**Modified:**
- `supabase/config.toml` -- Add `[functions.api-gateway]` with `verify_jwt = false`
- `src/components/admin/AdminDeveloperTab.tsx` -- Complete rewrite
- `src/integrations/supabase/types.ts` -- Add `api_keys` table types (will be regenerated)

