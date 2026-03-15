

## Report Builder

Build a full Report Builder page at `/reports` with the standard app layout (header + sidebar + content), drawing from the reference design in `knowledge/electron/src/components/dashboard/ReportsContent.tsx` but adapted for this app's domain (participants, instances, cases, check-ins, accommodation).

### What gets built

**1. New page: `src/pages/ReportsPage.tsx`**
- Standard layout: `DashboardHeader` + `DashboardSidebar` + main content area
- Header with title, description, and "Create Custom Report" button
- Search bar and filter controls
- Tabs: All Reports | Templates | Custom | Scheduled
- Grid of report cards (pre-seeded with domain-relevant templates):
  - **Participant Summary** -- participant counts by instance, group, gender, status
  - **Attendance & Check-in Report** -- check-in session data across instances
  - **Cases & Incidents Report** -- behavior cases by severity, status, category
  - **Accommodation Occupancy** -- room/block utilization rates
  - **Formal Warnings Summary** -- warnings issued across instances
  - **Instance Comparison** -- cross-instance metrics comparison
- Each card shows: type badge (template/custom/real-time), description, last-run time, category, and Run/Download actions
- "Create Custom Report" card (dashed border placeholder) at the end of the grid
- Report type badges with color coding (blue for template, purple for custom, green for real-time)

**2. Add sidebar navigation**
- Add `FileBarChart` "Reports" item to the `opsItems` array in `DashboardSidebar.tsx`

**3. Add route**
- Add `/reports` protected route in `App.tsx`

### Design approach
- Follows existing page patterns (same header/sidebar shell as Participants, Instances, etc.)
- Uses existing UI primitives: Card, Badge, Button, Input, Tabs, DropdownMenu
- Dark-mode compatible via existing Tailwind dark classes
- Static/mock data for report definitions (no new DB tables needed -- reports are UI-only templates that query existing tables when "run")

### Files changed
| File | Action |
|------|--------|
| `src/pages/ReportsPage.tsx` | Create |
| `src/components/DashboardSidebar.tsx` | Add Reports nav item |
| `src/App.tsx` | Add `/reports` route |

