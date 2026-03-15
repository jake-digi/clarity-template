import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Copy, Check, ExternalLink, Key, Database, Code2,
  Plus, Trash2, AlertTriangle, Play, FileText,
  RefreshCw, Clock, Send, ChevronDown, ChevronRight,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "";
const API_BASE_URL = `${SUPABASE_URL}/functions/v1/api-gateway`;

interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  scopes: string[];
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
}

interface ApiLog {
  id: string;
  key_prefix: string | null;
  method: string;
  path: string;
  status_code: number;
  request_body: unknown;
  response_body: unknown;
  response_time_ms: number;
  ip_address: string | null;
  user_agent: string | null;
  error_message: string | null;
  created_at: string;
}

const AdminDeveloperTab = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState("keys");

  // Keys state
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["read"]);
  const [newKeyExpiry, setNewKeyExpiry] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Logs state
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilter, setLogFilter] = useState<{ method?: string; status?: string }>({});
  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null);

  // Playground state
  const [pgMethod, setPgMethod] = useState("GET");
  const [pgPath, setPgPath] = useState("/api/v1/instances");
  const [pgApiKey, setPgApiKey] = useState("");
  const [pgBody, setPgBody] = useState("");
  const [pgResponse, setPgResponse] = useState<string | null>(null);
  const [pgStatus, setPgStatus] = useState<number | null>(null);
  const [pgTime, setPgTime] = useState<number | null>(null);
  const [pgLoading, setPgLoading] = useState(false);

  // Reference state
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const CopyButton = ({ value, field }: { value: string; field: string }) => (
    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => copyToClipboard(value, field)}>
      {copiedField === field ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </Button>
  );

  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  };

  // --- Keys ---
  const fetchKeys = useCallback(async () => {
    setKeysLoading(true);
    try {
      const session = await getSession();
      if (!session) return;
      const res = await fetch(`${API_BASE_URL}/api/v1/api-keys/list`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.success) setKeys(data.data || []);
    } catch { /* silent */ } finally { setKeysLoading(false); }
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const session = await getSession();
      if (!session) return;
      const res = await fetch(`${API_BASE_URL}/api/v1/api-keys/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName || "Untitled", scopes: newKeyScopes, expires_at: newKeyExpiry || null }),
      });
      const data = await res.json();
      if (data.success) {
        setCreatedKey(data.data.key);
        setCreateOpen(false);
        setNewKeyName(""); setNewKeyScopes(["read"]); setNewKeyExpiry("");
        fetchKeys();
        toast({ title: "API key created" });
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch { toast({ title: "Error creating key", variant: "destructive" }); }
    finally { setCreating(false); }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      const session = await getSession();
      if (!session) return;
      const res = await fetch(`${API_BASE_URL}/api/v1/api-keys/revoke`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id: revokeTarget.id }),
      });
      const data = await res.json();
      if (!data.success) {
        toast({ title: "Error revoking key", description: data.error, variant: "destructive" });
        return;
      }
      setRevokeTarget(null);
      fetchKeys();
      toast({ title: "API key revoked" });
    } catch (e) {
      toast({ title: "Error revoking key", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    }
  };

  // --- Logs ---
  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const session = await getSession();
      if (!session) return;
      const params = new URLSearchParams({ limit: "100" });
      if (logFilter.method) params.set("method", logFilter.method);
      if (logFilter.status) params.set("status", logFilter.status);
      const res = await fetch(`${API_BASE_URL}/api/v1/logs?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.success) setLogs(data.data || []);
    } catch { /* silent */ } finally { setLogsLoading(false); }
  }, [logFilter]);

  // --- Playground ---
  const sendRequest = async () => {
    setPgLoading(true);
    setPgResponse(null);
    setPgStatus(null);
    setPgTime(null);
    try {
      const start = Date.now();
      const headers: Record<string, string> = { "X-API-Key": pgApiKey };
      if (pgBody && ["POST", "PATCH", "PUT"].includes(pgMethod)) {
        headers["Content-Type"] = "application/json";
      }
      const res = await fetch(`${API_BASE_URL}${pgPath}`, {
        method: pgMethod,
        headers,
        body: ["POST", "PATCH", "PUT"].includes(pgMethod) && pgBody ? pgBody : undefined,
      });
      const elapsed = Date.now() - start;
      const text = await res.text();
      setPgStatus(res.status);
      setPgTime(elapsed);
      try { setPgResponse(JSON.stringify(JSON.parse(text), null, 2)); } catch { setPgResponse(text); }
    } catch (e) {
      setPgResponse(`Error: ${e instanceof Error ? e.message : "Unknown error"}`);
      setPgStatus(0);
    } finally { setPgLoading(false); }
  };

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const toggleScope = (scope: string) => {
    setNewKeyScopes((prev) => prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]);
  };

  const getKeyStatus = (key: ApiKey) => {
    if (key.revoked_at) return { label: "Revoked", variant: "destructive" as const };
    if (key.expires_at && new Date(key.expires_at) < new Date()) return { label: "Expired", variant: "secondary" as const };
    return { label: "Active", variant: "default" as const };
  };

  const methodColor: Record<string, string> = {
    GET: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    POST: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    PATCH: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    DELETE: "bg-destructive/10 text-destructive border-destructive/20",
  };

  const statusColor = (code: number) => {
    if (code >= 200 && code < 300) return "text-emerald-600";
    if (code >= 400 && code < 500) return "text-amber-600";
    return "text-destructive";
  };

  const endpointGroups = [
    {
      title: "Instances",
      description: "Supports ?type=dofe or ?type=standard filtering. Responses include type, dofe_level, expedition_type.",
      endpoints: [
        { method: "GET", path: "/api/v1/instances", description: "List all instances",
          exampleResponse: `{\n  "success": true,\n  "data": [\n    {\n      "id": "inst-001",\n      "name": "Summer Camp 2025",\n      "status": "active",\n      "start_date": "2025-07-01",\n      "end_date": "2025-07-14",\n      "location": "Peak District",\n      "type": "dofe",\n      "dofe_level": "gold",\n      "expedition_type": "practice"\n    }\n  ],\n  "meta": { "total": 12, "limit": 50, "offset": 0 }\n}` },
        { method: "GET", path: "/api/v1/instances/:id", description: "Get instance by ID",
          exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "inst-001",\n    "name": "Summer Camp 2025",\n    "status": "active",\n    "start_date": "2025-07-01",\n    "end_date": "2025-07-14",\n    "location": "Peak District",\n    "type": "dofe",\n    "dofe_level": "gold"\n  }\n}` },
        { method: "POST", path: "/api/v1/instances", description: "Create instance",
          exampleBody: `{\n  "name": "Autumn Expedition",\n  "type": "dofe",\n  "dofe_level": "silver",\n  "start_date": "2025-10-01",\n  "end_date": "2025-10-05",\n  "location": "Lake District"\n}`,
          exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "inst-new",\n    "name": "Autumn Expedition",\n    "status": "upcoming",\n    "type": "dofe",\n    "dofe_level": "silver"\n  }\n}` },
        { method: "PATCH", path: "/api/v1/instances/:id", description: "Update instance",
          exampleBody: `{\n  "name": "Updated Name",\n  "status": "active"\n}`,
          exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "inst-001",\n    "name": "Updated Name",\n    "status": "active"\n  }\n}` },
        { method: "DELETE", path: "/api/v1/instances/:id", description: "Soft-delete instance",
          exampleResponse: `{\n  "success": true\n}` },
      ],
    },
    {
      title: "Participant Assignments",
      description: "Manage participant-to-instance assignments. Assign participants to instances, move rooms/groups, update off-site status.",
      endpoints: [
        { method: "GET", path: "/api/v1/instances/:instanceId/participants", description: "List participants assigned to instance (includes participant data)",
          exampleResponse: `{\n  "success": true,\n  "data": [\n    {\n      "id": "asgn-001",\n      "instance_id": "inst-001",\n      "participant_id": "p-001",\n      "room_id": "room-101",\n      "block_id": "block-a",\n      "super_group_id": "sg-01",\n      "sub_group_id": "sub-01",\n      "is_off_site": false,\n      "arrival_date": "2025-07-01T10:00:00Z",\n      "participants": {\n        "id": "p-001",\n        "first_name": "John",\n        "surname": "Smith",\n        "full_name": "John Smith"\n      }\n    }\n  ],\n  "meta": { "total": 45, "limit": 50, "offset": 0 }\n}` },
        { method: "GET", path: "/api/v1/instances/:instanceId/participants/:assignmentId", description: "Get assignment by ID",
          exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "asgn-001",\n    "instance_id": "inst-001",\n    "participant_id": "p-001",\n    "room_id": "room-101",\n    "is_off_site": false,\n    "participants": { "full_name": "John Smith" }\n  }\n}` },
        { method: "POST", path: "/api/v1/instances/:instanceId/participants", description: "Assign participant to instance (requires participant_id)",
          exampleBody: `{\n  "participant_id": "p-001",\n  "super_group_id": "sg-01",\n  "sub_group_id": "sub-01",\n  "room_id": "room-101",\n  "arrival_date": "2025-07-01T10:00:00Z",\n  "departure_date": "2025-07-14T14:00:00Z"\n}`,
          exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "asgn-new",\n    "instance_id": "inst-001",\n    "participant_id": "p-001",\n    "room_id": "room-101",\n    "participants": { "full_name": "John Smith" }\n  }\n}` },
        { method: "PATCH", path: "/api/v1/instances/:instanceId/participants/:assignmentId", description: "Update assignment (room, group, off-site, dates)",
          exampleBody: `{\n  "room_id": "room-202",\n  "block_id": "block-b",\n  "is_off_site": false\n}`,
          exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "asgn-001",\n    "room_id": "room-202",\n    "block_id": "block-b",\n    "is_off_site": false\n  }\n}` },
        { method: "DELETE", path: "/api/v1/instances/:instanceId/participants/:assignmentId", description: "Remove participant from instance",
          exampleResponse: `{\n  "success": true\n}` },
      ],
    },
    {
      title: "Participants (Global)",
      endpoints: [
        { method: "GET", path: "/api/v1/participants", description: "List participants (?instance_id=)",
          exampleResponse: `{\n  "success": true,\n  "data": [\n    {\n      "id": "p-001",\n      "first_name": "John",\n      "surname": "Smith",\n      "full_name": "John Smith",\n      "gender": "male",\n      "school_year": "12",\n      "status": "active"\n    }\n  ],\n  "meta": { "total": 150, "limit": 50, "offset": 0 }\n}` },
        { method: "GET", path: "/api/v1/participants/:id", description: "Get participant by ID",
          exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "p-001",\n    "first_name": "John",\n    "surname": "Smith",\n    "full_name": "John Smith",\n    "date_of_birth": "2008-03-15",\n    "gender": "male",\n    "status": "active"\n  }\n}` },
        { method: "POST", path: "/api/v1/participants", description: "Create participant",
          exampleBody: `{\n  "first_name": "Jane",\n  "surname": "Doe",\n  "date_of_birth": "2009-06-20",\n  "gender": "female",\n  "school_year": "11"\n}`,
          exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "p-new",\n    "first_name": "Jane",\n    "surname": "Doe",\n    "full_name": "Jane Doe",\n    "status": "active"\n  }\n}` },
        { method: "PATCH", path: "/api/v1/participants/:id", description: "Update participant",
          exampleBody: `{\n  "school_year": "12",\n  "status": "active"\n}`,
          exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "p-001",\n    "first_name": "John",\n    "surname": "Smith",\n    "school_year": "12"\n  }\n}` },
        { method: "DELETE", path: "/api/v1/participants/:id", description: "Delete participant",
          exampleResponse: `{\n  "success": true\n}` },
      ],
    },
    {
      title: "Supergroups (Instance-scoped)",
      description: "Groups are scoped to instances. Full CRUD with soft-delete. Deleting a supergroup cascades to its subgroups.",
      endpoints: [
        { method: "GET", path: "/api/v1/instances/:instanceId/supergroups", description: "List supergroups for instance",
          exampleResponse: `{\n  "success": true,\n  "data": [\n    {\n      "id": "sg-01",\n      "name": "Red House",\n      "instance_id": "inst-001",\n      "color": "#e74c3c"\n    }\n  ],\n  "meta": { "total": 4, "limit": 50, "offset": 0 }\n}` },
        { method: "GET", path: "/api/v1/instances/:instanceId/supergroups/:sgId", description: "Get supergroup by ID",
          exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "sg-01",\n    "name": "Red House",\n    "instance_id": "inst-001",\n    "color": "#e74c3c"\n  }\n}` },
        { method: "POST", path: "/api/v1/instances/:instanceId/supergroups", description: "Create supergroup",
          exampleBody: `{\n  "name": "Blue House",\n  "color": "#3498db"\n}`,
          exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "sg-new",\n    "name": "Blue House",\n    "instance_id": "inst-001",\n    "color": "#3498db"\n  }\n}` },
        { method: "PATCH", path: "/api/v1/instances/:instanceId/supergroups/:sgId", description: "Update supergroup",
          exampleBody: `{\n  "name": "Updated House Name"\n}`,
          exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "sg-01",\n    "name": "Updated House Name"\n  }\n}` },
        { method: "DELETE", path: "/api/v1/instances/:instanceId/supergroups/:sgId", description: "Soft-delete supergroup (cascades to subgroups)",
          exampleResponse: `{\n  "success": true\n}` },
      ],
    },
    {
      title: "Subgroups (Nested under Supergroup)",
      description: "Subgroups are nested under supergroups within an instance.",
      endpoints: [
        { method: "GET", path: "/api/v1/instances/:instanceId/supergroups/:sgId/subgroups", description: "List subgroups",
          exampleResponse: `{\n  "success": true,\n  "data": [\n    {\n      "id": "sub-01",\n      "name": "Team Alpha",\n      "supergroup_id": "sg-01",\n      "instance_id": "inst-001"\n    }\n  ],\n  "meta": { "total": 3, "limit": 50, "offset": 0 }\n}` },
        { method: "GET", path: "/api/v1/instances/:instanceId/supergroups/:sgId/subgroups/:subId", description: "Get subgroup by ID",
          exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "sub-01",\n    "name": "Team Alpha",\n    "supergroup_id": "sg-01"\n  }\n}` },
        { method: "POST", path: "/api/v1/instances/:instanceId/supergroups/:sgId/subgroups", description: "Create subgroup",
          exampleBody: `{\n  "name": "Team Bravo"\n}`,
          exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "sub-new",\n    "name": "Team Bravo",\n    "supergroup_id": "sg-01",\n    "instance_id": "inst-001"\n  }\n}` },
        { method: "PATCH", path: "/api/v1/instances/:instanceId/supergroups/:sgId/subgroups/:subId", description: "Update subgroup",
          exampleBody: `{\n  "name": "Team Charlie"\n}`,
          exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "sub-01",\n    "name": "Team Charlie"\n  }\n}` },
        { method: "DELETE", path: "/api/v1/instances/:instanceId/supergroups/:sgId/subgroups/:subId", description: "Soft-delete subgroup",
          exampleResponse: `{\n  "success": true\n}` },
      ],
    },
    {
      title: "Blocks",
      description: "Filter with ?instance_id= or ?site_id=. Full CRUD with soft-delete.",
      endpoints: [
        { method: "GET", path: "/api/v1/blocks", description: "List blocks (?instance_id=, ?site_id=)",
          exampleResponse: `{\n  "success": true,\n  "data": [\n    {\n      "id": "block-a",\n      "name": "Block A - Main Building",\n      "instance_id": "inst-001",\n      "description": "Main accommodation block"\n    }\n  ],\n  "meta": { "total": 3, "limit": 50, "offset": 0 }\n}` },
        { method: "GET", path: "/api/v1/blocks/:blockId", description: "Get block by ID",
          exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "block-a",\n    "name": "Block A - Main Building",\n    "description": "Main accommodation block"\n  }\n}` },
        { method: "POST", path: "/api/v1/blocks", description: "Create block",
          exampleBody: `{\n  "name": "Block C - Annexe",\n  "instance_id": "inst-001",\n  "description": "Overflow accommodation"\n}`,
          exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "block-new",\n    "name": "Block C - Annexe",\n    "instance_id": "inst-001"\n  }\n}` },
        { method: "PATCH", path: "/api/v1/blocks/:blockId", description: "Update block",
          exampleBody: `{\n  "name": "Block A - Updated"\n}`,
          exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "block-a",\n    "name": "Block A - Updated"\n  }\n}` },
        { method: "DELETE", path: "/api/v1/blocks/:blockId", description: "Soft-delete block",
          exampleResponse: `{\n  "success": true\n}` },
      ],
    },
    {
      title: "Rooms",
      description: "Filter with ?block_id=, ?instance_id=, or ?site_id=. Full CRUD with soft-delete.",
      endpoints: [
        { method: "GET", path: "/api/v1/rooms", description: "List rooms (?block_id=, ?instance_id=, ?site_id=)",
          exampleResponse: `{\n  "success": true,\n  "data": [\n    {\n      "id": "room-101",\n      "room_number": "101",\n      "name": "Room 101",\n      "block_id": "block-a",\n      "capacity": 4,\n      "room_type": "room"\n    }\n  ],\n  "meta": { "total": 20, "limit": 50, "offset": 0 }\n}` },
        { method: "GET", path: "/api/v1/rooms/:roomId", description: "Get room by ID",
          exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "room-101",\n    "room_number": "101",\n    "name": "Room 101",\n    "block_id": "block-a",\n    "capacity": 4,\n    "room_type": "room"\n  }\n}` },
        { method: "POST", path: "/api/v1/rooms", description: "Create room",
          exampleBody: `{\n  "room_number": "205",\n  "name": "Room 205",\n  "block_id": "block-a",\n  "capacity": 6,\n  "room_type": "room",\n  "instance_id": "inst-001"\n}`,
          exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "room-new",\n    "room_number": "205",\n    "name": "Room 205",\n    "block_id": "block-a",\n    "capacity": 6\n  }\n}` },
        { method: "PATCH", path: "/api/v1/rooms/:roomId", description: "Update room",
          exampleBody: `{\n  "capacity": 8,\n  "name": "Large Room 101"\n}`,
          exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "room-101",\n    "capacity": 8,\n    "name": "Large Room 101"\n  }\n}` },
        { method: "DELETE", path: "/api/v1/rooms/:roomId", description: "Soft-delete room",
          exampleResponse: `{\n  "success": true\n}` },
      ],
    },
    {
      title: "Groups (Legacy)",
      description: "Backward-compatible endpoints. Prefer instance-scoped routes above.",
      endpoints: [
        { method: "GET", path: "/api/v1/groups/supergroups", description: "List supergroups (?instance_id=)",
          exampleResponse: `{\n  "success": true,\n  "data": [...],\n  "meta": { "total": 4, "limit": 50, "offset": 0 }\n}` },
        { method: "POST", path: "/api/v1/groups/supergroups", description: "Create supergroup",
          exampleBody: `{\n  "name": "Green House",\n  "instance_id": "inst-001"\n}`,
          exampleResponse: `{\n  "success": true,\n  "data": { "id": "sg-new", "name": "Green House" }\n}` },
        { method: "GET", path: "/api/v1/groups/subgroups", description: "List subgroups (?instance_id=)",
          exampleResponse: `{\n  "success": true,\n  "data": [...],\n  "meta": { "total": 12, "limit": 50, "offset": 0 }\n}` },
        { method: "POST", path: "/api/v1/groups/subgroups", description: "Create subgroup",
          exampleBody: `{\n  "name": "Team Delta",\n  "supergroup_id": "sg-01",\n  "instance_id": "inst-001"\n}`,
          exampleResponse: `{\n  "success": true,\n  "data": { "id": "sub-new", "name": "Team Delta" }\n}` },
      ],
    },
  ];

  const tryEndpoint = (method: string, path: string, body?: string) => {
    setPgMethod(method);
    setPgPath(path);
    if (body) setPgBody(body);
    else setPgBody("");
    setActiveTab("playground");
  };

  const playgroundEndpoints = endpointGroups.flatMap((g) =>
    g.endpoints.map((ep) => ({ method: ep.method, path: ep.path, label: `${ep.method} ${ep.path}` }))
  );

  return (
    <div className="space-y-4 max-w-5xl">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="keys" className="flex items-center gap-1.5"><Key className="w-3.5 h-3.5" />Keys</TabsTrigger>
          <TabsTrigger value="playground" className="flex items-center gap-1.5"><Play className="w-3.5 h-3.5" />Playground</TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-1.5" onClick={() => { if (logs.length === 0) fetchLogs(); }}><FileText className="w-3.5 h-3.5" />Logs</TabsTrigger>
          <TabsTrigger value="reference" className="flex items-center gap-1.5"><Code2 className="w-3.5 h-3.5" />Reference</TabsTrigger>
        </TabsList>

        {/* ===== KEYS TAB ===== */}
        <TabsContent value="keys" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">API Keys</CardTitle>
                <CardDescription>Create and manage API keys for programmatic access</CardDescription>
              </div>
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="w-3.5 h-3.5 mr-1.5" />Create Key</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create API Key</DialogTitle>
                    <DialogDescription>The key will only be shown once after creation.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Name</Label>
                      <Input placeholder="e.g. Production, CI/CD" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Scopes</Label>
                      <div className="flex gap-4">
                        {["read", "write", "admin"].map((scope) => (
                          <label key={scope} className="flex items-center gap-2 text-sm">
                            <Checkbox checked={newKeyScopes.includes(scope)} onCheckedChange={() => toggleScope(scope)} />
                            <span className="capitalize">{scope}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Expiry (optional)</Label>
                      <Input type="datetime-local" value={newKeyExpiry} onChange={(e) => setNewKeyExpiry(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreate} disabled={creating}>{creating ? "Creating…" : "Create Key"}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {keysLoading ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Loading keys…</p>
              ) : keys.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No API keys yet. Create one to get started.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Key</TableHead>
                      <TableHead>Scopes</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keys.map((key) => {
                      const status = getKeyStatus(key);
                      return (
                        <TableRow key={key.id}>
                          <TableCell className="font-medium text-sm">{key.name}</TableCell>
                          <TableCell><code className="text-xs font-mono text-muted-foreground">{key.key_prefix}…</code></TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {key.scopes.map((s) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{new Date(key.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : "Never"}</TableCell>
                          <TableCell><Badge variant={status.variant} className="text-[10px]">{status.label}</Badge></TableCell>
                          <TableCell>
                            {!key.revoked_at && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRevokeTarget(key)}>
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Connection Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Database className="w-4 h-4" />Connection Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">API Base URL</Label>
                <div className="flex items-center gap-2">
                  <Input value={API_BASE_URL} readOnly className="font-mono text-xs h-9 bg-muted/50" />
                  <CopyButton value={API_BASE_URL} field="base_url" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== PLAYGROUND TAB ===== */}
        <TabsContent value="playground" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Play className="w-4 h-4" />API Playground</CardTitle>
              <CardDescription>Test API endpoints with your API key</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* API Key input */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">API Key</Label>
                <Input
                  type="password"
                  placeholder="chk_..."
                  value={pgApiKey}
                  onChange={(e) => setPgApiKey(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              {/* Method + Path */}
              <div className="flex gap-2">
                <Select value={pgMethod} onValueChange={setPgMethod}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["GET", "POST", "PATCH", "DELETE"].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={pgPath}
                  onChange={(e) => setPgPath(e.target.value)}
                  placeholder="/api/v1/instances"
                  className="font-mono text-xs flex-1"
                />
                <Button onClick={sendRequest} disabled={pgLoading || !pgApiKey} className="gap-1.5">
                  <Send className="w-3.5 h-3.5" />{pgLoading ? "Sending…" : "Send"}
                </Button>
              </div>

              {/* Quick endpoint selector */}
              <div className="flex flex-wrap gap-1">
                {playgroundEndpoints.slice(0, 8).map((ep, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-[10px] h-6 px-2"
                    onClick={() => { setPgMethod(ep.method); setPgPath(ep.path); }}
                  >
                    <Badge variant="outline" className={`text-[9px] font-mono mr-1 px-1 ${methodColor[ep.method] ?? ""}`}>{ep.method}</Badge>
                    {ep.path.replace("/api/v1/", "")}
                  </Button>
                ))}
              </div>

              {/* Request body */}
              {["POST", "PATCH", "PUT"].includes(pgMethod) && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Request Body (JSON)</Label>
                  <Textarea
                    value={pgBody}
                    onChange={(e) => setPgBody(e.target.value)}
                    placeholder='{"name": "Test Instance", "type": "dofe"}'
                    className="font-mono text-xs min-h-[80px]"
                  />
                </div>
              )}

              {/* Response */}
              {pgResponse !== null && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <Label className="text-xs text-muted-foreground">Response</Label>
                    {pgStatus !== null && (
                      <Badge variant="outline" className={`text-[10px] ${pgStatus >= 200 && pgStatus < 300 ? "border-emerald-500/30 text-emerald-600" : "border-destructive/30 text-destructive"}`}>
                        {pgStatus}
                      </Badge>
                    )}
                    {pgTime !== null && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{pgTime}ms</span>
                    )}
                  </div>
                  <ScrollArea className="h-[300px] rounded-md border">
                    <pre className="text-xs font-mono p-3 text-foreground whitespace-pre-wrap">{pgResponse}</pre>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== LOGS TAB ===== */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" />Request Logs</CardTitle>
                <CardDescription>View all API requests made with your keys</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchLogs} disabled={logsLoading}>
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${logsLoading ? "animate-spin" : ""}`} />Refresh
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Filters */}
              <div className="flex gap-2">
                <Select value={logFilter.method || "all"} onValueChange={(v) => { setLogFilter((f) => ({ ...f, method: v === "all" ? undefined : v })); }}>
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    {["GET", "POST", "PATCH", "DELETE"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={logFilter.status || "all"} onValueChange={(v) => { setLogFilter((f) => ({ ...f, status: v === "all" ? undefined : v })); }}>
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={fetchLogs}>Apply</Button>
              </div>

              {logsLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading logs…</p>
              ) : logs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No API request logs yet.</p>
              ) : (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Method</TableHead>
                        <TableHead>Path</TableHead>
                        <TableHead className="w-16">Status</TableHead>
                        <TableHead className="w-16">Time</TableHead>
                        <TableHead className="w-20">Key</TableHead>
                        <TableHead className="w-36">Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow
                          key={log.id}
                          className="cursor-pointer"
                          onClick={() => setSelectedLog(log)}
                        >
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] font-mono ${methodColor[log.method] ?? ""}`}>
                              {log.method}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs truncate max-w-[200px]">{log.path}</TableCell>
                          <TableCell>
                            <span className={`text-xs font-mono font-semibold ${statusColor(log.status_code)}`}>{log.status_code}</span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{log.response_time_ms}ms</TableCell>
                          <TableCell><code className="text-[10px] text-muted-foreground">{log.key_prefix || "—"}</code></TableCell>
                          <TableCell className="text-[10px] text-muted-foreground">{new Date(log.created_at).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Log detail dialog */}
          <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-mono text-sm">
                  <Badge variant="outline" className={`${methodColor[selectedLog?.method || ""] ?? ""}`}>{selectedLog?.method}</Badge>
                  {selectedLog?.path}
                  <span className={`ml-auto font-semibold ${statusColor(selectedLog?.status_code || 0)}`}>{selectedLog?.status_code}</span>
                </DialogTitle>
                <DialogDescription>
                  {selectedLog && new Date(selectedLog.created_at).toLocaleString()} · {selectedLog?.response_time_ms}ms
                  {selectedLog?.key_prefix && ` · Key: ${selectedLog.key_prefix}…`}
                  {selectedLog?.ip_address && ` · IP: ${selectedLog.ip_address}`}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                {selectedLog?.error_message && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2">
                    <p className="text-xs font-medium text-destructive">{selectedLog.error_message}</p>
                  </div>
                )}
                {selectedLog?.request_body && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Request Body</Label>
                    <pre className="text-xs font-mono bg-muted/50 rounded-md p-3 overflow-auto max-h-[200px]">
                      {JSON.stringify(selectedLog.request_body, null, 2)}
                    </pre>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Response Body</Label>
                  <pre className="text-xs font-mono bg-muted/50 rounded-md p-3 overflow-auto max-h-[300px]">
                    {selectedLog?.response_body ? JSON.stringify(selectedLog.response_body, null, 2) : "—"}
                  </pre>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ===== REFERENCE TAB ===== */}
        <TabsContent value="reference" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Code2 className="w-4 h-4" />API Reference</CardTitle>
              <CardDescription>
                All endpoints use <code className="text-xs font-mono bg-muted px-1 rounded">X-API-Key</code> header.
                Base URL: <code className="text-xs font-mono bg-muted px-1 rounded">{API_BASE_URL}</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {endpointGroups.map((group) => (
                <div key={group.title}>
                  <div className="mb-2">
                    <h4 className="text-sm font-semibold">{group.title}</h4>
                    {group.description && <p className="text-xs text-muted-foreground">{group.description}</p>}
                  </div>
                  <div className="space-y-0.5">
                    {group.endpoints.map((ep, i) => {
                      const epKey = `${group.title}-${i}`;
                      const isExpanded = expandedEndpoint === epKey;
                      return (
                        <div key={i} className="rounded-md border border-transparent hover:border-border transition-colors">
                          <div
                            className="flex items-center gap-3 py-1.5 px-3 cursor-pointer hover:bg-muted/30 rounded-md transition-colors"
                            onClick={() => setExpandedEndpoint(isExpanded ? null : epKey)}
                          >
                            {isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
                            <Badge variant="outline" className={`text-[10px] font-mono w-16 justify-center shrink-0 ${methodColor[ep.method] ?? ""}`}>
                              {ep.method}
                            </Badge>
                            <code className="text-xs font-mono text-foreground flex-1 truncate">{ep.path}</code>
                            <span className="text-xs text-muted-foreground hidden sm:block shrink-0">{ep.description}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[10px] shrink-0 ml-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                tryEndpoint(ep.method, ep.path, ep.exampleBody);
                              }}
                            >
                              <Play className="w-3 h-3 mr-1" />Try it
                            </Button>
                          </div>
                          {isExpanded && (
                            <div className="px-3 pb-3 pt-1 space-y-3 ml-6 border-t border-border/50">
                              <p className="text-xs text-muted-foreground">{ep.description}</p>

                              {/* cURL example */}
                              <div>
                                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">cURL</Label>
                                <div className="relative mt-1">
                                  <pre className="text-xs font-mono bg-muted/50 rounded-md p-2.5 overflow-x-auto text-muted-foreground">
{`curl '${API_BASE_URL}${ep.path}' \\
  -X ${ep.method} \\
  -H "X-API-Key: chk_your_key_here"${ep.exampleBody ? ` \\
  -H "Content-Type: application/json" \\
  -d '${ep.exampleBody.replace(/\n/g, "")}'` : ""}`}
                                  </pre>
                                  <Button
                                    variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6"
                                    onClick={() => copyToClipboard(
                                      `curl '${API_BASE_URL}${ep.path}' \\\n  -X ${ep.method} \\\n  -H "X-API-Key: chk_your_key_here"${ep.exampleBody ? ` \\\n  -H "Content-Type: application/json" \\\n  -d '${ep.exampleBody}'` : ""}`,
                                      `curl-${epKey}`
                                    )}
                                  >
                                    {copiedField === `curl-${epKey}` ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5" />}
                                  </Button>
                                </div>
                              </div>

                              {/* Request body example */}
                              {ep.exampleBody && (
                                <div>
                                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Request Body</Label>
                                  <pre className="text-xs font-mono bg-muted/50 rounded-md p-2.5 overflow-x-auto text-foreground/80 mt-1">
                                    {ep.exampleBody}
                                  </pre>
                                </div>
                              )}

                              {/* Response example */}
                              <div>
                                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Example Response</Label>
                                <pre className="text-xs font-mono bg-muted/50 rounded-md p-2.5 overflow-x-auto text-foreground/80 mt-1">
                                  {ep.exampleResponse}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><ExternalLink className="w-4 h-4" />Quick Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Dashboard", url: `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}` },
                  { label: "SQL Editor", url: `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new` },
                  { label: "Auth / Users", url: `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/auth/users` },
                  { label: "Table Editor", url: `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/editor` },
                  { label: "Storage", url: `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/storage/buckets` },
                  { label: "Edge Functions", url: `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/functions` },
                  { label: "API Docs", url: `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/api` },
                  { label: "Logs", url: `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/logs/explorer` },
                ].map((link) => (
                  <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-md border border-border text-sm hover:bg-muted/50 transition-colors">
                    <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />{link.label}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Created key display dialog */}
      <Dialog open={!!createdKey} onOpenChange={() => setCreatedKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" />Save Your API Key</DialogTitle>
            <DialogDescription>This key will only be shown once. Copy it now and store it securely.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input value={createdKey || ""} readOnly className="font-mono text-xs" />
            <CopyButton value={createdKey || ""} field="created_key" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatedKey(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke confirmation */}
      <AlertDialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently revoke <strong>{revokeTarget?.name}</strong> ({revokeTarget?.key_prefix}…). Any integrations using this key will stop working immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Revoke</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDeveloperTab;
