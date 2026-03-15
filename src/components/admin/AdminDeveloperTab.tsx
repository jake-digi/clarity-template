import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
  Copy, Check, Key, Database, Code2,
  Plus, Trash2, AlertTriangle, Play, FileText,
  RefreshCw, Clock, Send, ChevronDown, ChevronRight,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const API_INTERNAL_URL = `${SUPABASE_URL}/functions/v1/api-gateway`;
const API_BASE_URL = "https://checkpoint.jlgb.org/functions/v1/api-gateway";

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

const methodColor: Record<string, string> = {
  GET: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  POST: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  PATCH: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  PUT: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  DELETE: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusColor = (code: number) => {
  if (code >= 200 && code < 300) return "text-emerald-600";
  if (code >= 400 && code < 500) return "text-amber-600";
  return "text-destructive";
};

// ── Endpoint data ──
const endpointGroups = [
  {
    title: "Instances",
    description: "Supports ?type=dofe or ?type=standard filtering.",
    endpoints: [
      { method: "GET", path: "/api/v1/instances", description: "List all instances", exampleResponse: `{"success":true,"data":[...],"meta":{"total":12}}`, },
      { method: "GET", path: "/api/v1/instances/:id", description: "Get instance by ID", exampleResponse: `{"success":true,"data":{...}}`, },
      { method: "POST", path: "/api/v1/instances", description: "Create instance", exampleBody: `{"name":"Autumn Expedition","type":"dofe","dofe_level":"silver","start_date":"2025-10-01"}`, exampleResponse: `{"success":true,"data":{...}}`, },
      { method: "PATCH", path: "/api/v1/instances/:id", description: "Update instance", exampleBody: `{"name":"Updated Name","status":"active"}`, exampleResponse: `{"success":true,"data":{...}}`, },
      { method: "DELETE", path: "/api/v1/instances/:id", description: "Soft-delete instance", exampleResponse: `{"success":true}`, },
    ],
  },
  {
    title: "Participant Assignments",
    description: "Manage participant-to-instance assignments.",
    endpoints: [
      { method: "GET", path: "/api/v1/instances/:instanceId/participants", description: "List participants assigned to instance", exampleResponse: `{"success":true,"data":[...],"meta":{"total":45}}`, },
      { method: "GET", path: "/api/v1/instances/:instanceId/participants/:assignmentId", description: "Get assignment by ID", exampleResponse: `{"success":true,"data":{...}}`, },
      { method: "POST", path: "/api/v1/instances/:instanceId/participants", description: "Assign participant to instance", exampleBody: `{"participant_id":"p-001","super_group_id":"sg-01","sub_group_id":"sub-01","room_id":"room-101"}`, exampleResponse: `{"success":true,"data":{...}}`, },
      { method: "PATCH", path: "/api/v1/instances/:instanceId/participants/:assignmentId", description: "Update assignment (room, group, off-site)", exampleBody: `{"room_id":"room-202","is_off_site":false}`, exampleResponse: `{"success":true,"data":{...}}`, },
      { method: "DELETE", path: "/api/v1/instances/:instanceId/participants/:assignmentId", description: "Remove participant from instance", exampleResponse: `{"success":true}`, },
    ],
  },
  {
    title: "Participants (Global)",
    description: "Global participant records.",
    endpoints: [
      { method: "GET", path: "/api/v1/participants", description: "List participants (?instance_id=)", exampleResponse: `{"success":true,"data":[...],"meta":{"total":150}}`, },
      { method: "GET", path: "/api/v1/participants/:id", description: "Get participant by ID", exampleResponse: `{"success":true,"data":{...}}`, },
      { method: "POST", path: "/api/v1/participants", description: "Create participant", exampleBody: `{"first_name":"Jane","surname":"Doe","date_of_birth":"2009-06-20","gender":"female"}`, exampleResponse: `{"success":true,"data":{...}}`, },
      { method: "PATCH", path: "/api/v1/participants/:id", description: "Update participant", exampleBody: `{"school_year":"12","status":"active"}`, exampleResponse: `{"success":true,"data":{...}}`, },
      { method: "DELETE", path: "/api/v1/participants/:id", description: "Delete participant", exampleResponse: `{"success":true}`, },
    ],
  },
  {
    title: "Supergroups",
    description: "Instance-scoped. Deleting cascades to subgroups.",
    endpoints: [
      { method: "GET", path: "/api/v1/instances/:instanceId/supergroups", description: "List supergroups for instance", exampleResponse: `{"success":true,"data":[...]}`, },
      { method: "GET", path: "/api/v1/instances/:instanceId/supergroups/:sgId", description: "Get supergroup by ID", exampleResponse: `{"success":true,"data":{...}}`, },
      { method: "POST", path: "/api/v1/instances/:instanceId/supergroups", description: "Create supergroup", exampleBody: `{"name":"Blue House","color":"#3498db"}`, exampleResponse: `{"success":true,"data":{...}}`, },
      { method: "PATCH", path: "/api/v1/instances/:instanceId/supergroups/:sgId", description: "Update supergroup", exampleBody: `{"name":"Updated House Name"}`, exampleResponse: `{"success":true,"data":{...}}`, },
      { method: "DELETE", path: "/api/v1/instances/:instanceId/supergroups/:sgId", description: "Soft-delete supergroup", exampleResponse: `{"success":true}`, },
    ],
  },
  {
    title: "Subgroups",
    description: "Nested under supergroups within an instance.",
    endpoints: [
      { method: "GET", path: "/api/v1/instances/:instanceId/supergroups/:sgId/subgroups", description: "List subgroups", exampleResponse: `{"success":true,"data":[...]}`, },
      { method: "GET", path: "/api/v1/instances/:instanceId/supergroups/:sgId/subgroups/:subId", description: "Get subgroup by ID", exampleResponse: `{"success":true,"data":{...}}`, },
      { method: "POST", path: "/api/v1/instances/:instanceId/supergroups/:sgId/subgroups", description: "Create subgroup", exampleBody: `{"name":"Team Bravo"}`, exampleResponse: `{"success":true,"data":{...}}`, },
      { method: "PATCH", path: "/api/v1/instances/:instanceId/supergroups/:sgId/subgroups/:subId", description: "Update subgroup", exampleBody: `{"name":"Team Charlie"}`, exampleResponse: `{"success":true,"data":{...}}`, },
      { method: "DELETE", path: "/api/v1/instances/:instanceId/supergroups/:sgId/subgroups/:subId", description: "Soft-delete subgroup", exampleResponse: `{"success":true}`, },
    ],
  },
  {
    title: "Blocks",
    description: "Filter with ?instance_id= or ?site_id=. Soft-delete.",
    endpoints: [
      { method: "GET", path: "/api/v1/blocks", description: "List blocks (?instance_id=, ?site_id=)", exampleResponse: `{"success":true,"data":[...]}`, },
      { method: "GET", path: "/api/v1/blocks/:blockId", description: "Get block by ID", exampleResponse: `{"success":true,"data":{...}}`, },
      { method: "POST", path: "/api/v1/blocks", description: "Create block", exampleBody: `{"name":"Block C","instance_id":"inst-001"}`, exampleResponse: `{"success":true,"data":{...}}`, },
      { method: "PATCH", path: "/api/v1/blocks/:blockId", description: "Update block", exampleBody: `{"name":"Block A - Updated"}`, exampleResponse: `{"success":true,"data":{...}}`, },
      { method: "DELETE", path: "/api/v1/blocks/:blockId", description: "Soft-delete block", exampleResponse: `{"success":true}`, },
    ],
  },
  {
    title: "Rooms",
    description: "Filter with ?block_id=, ?instance_id=, or ?site_id=.",
    endpoints: [
      { method: "GET", path: "/api/v1/rooms", description: "List rooms (?block_id=, ?instance_id=)", exampleResponse: `{"success":true,"data":[...]}`, },
      { method: "GET", path: "/api/v1/rooms/:roomId", description: "Get room by ID", exampleResponse: `{"success":true,"data":{...}}`, },
      { method: "POST", path: "/api/v1/rooms", description: "Create room", exampleBody: `{"room_number":"205","block_id":"block-a","capacity":6}`, exampleResponse: `{"success":true,"data":{...}}`, },
      { method: "PATCH", path: "/api/v1/rooms/:roomId", description: "Update room", exampleBody: `{"capacity":8}`, exampleResponse: `{"success":true,"data":{...}}`, },
      { method: "DELETE", path: "/api/v1/rooms/:roomId", description: "Soft-delete room", exampleResponse: `{"success":true}`, },
    ],
  },
  {
    title: "Groups (Legacy)",
    description: "Backward-compatible. Prefer instance-scoped routes.",
    endpoints: [
      { method: "GET", path: "/api/v1/groups/supergroups", description: "List supergroups (?instance_id=)", exampleResponse: `{"success":true,"data":[...]}`, },
      { method: "POST", path: "/api/v1/groups/supergroups", description: "Create supergroup", exampleBody: `{"name":"Green House","instance_id":"inst-001"}`, exampleResponse: `{"success":true,"data":{...}}`, },
      { method: "GET", path: "/api/v1/groups/subgroups", description: "List subgroups (?instance_id=)", exampleResponse: `{"success":true,"data":[...]}`, },
      { method: "POST", path: "/api/v1/groups/subgroups", description: "Create subgroup", exampleBody: `{"name":"Team Delta","supergroup_id":"sg-01","instance_id":"inst-001"}`, exampleResponse: `{"success":true,"data":{...}}`, },
    ],
  },
];

// ── Reference endpoint detail dialog ──
interface EndpointDetailProps {
  endpoint: { method: string; path: string; description: string; exampleBody?: string; exampleResponse?: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTryIt: (method: string, path: string, body?: string) => void;
}

const EndpointDetailDialog = ({ endpoint, open, onOpenChange, onTryIt }: EndpointDetailProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  if (!endpoint) return null;

  const copy = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const curlCmd = `curl '${API_BASE_URL}${endpoint.path}' \\\n  -X ${endpoint.method} \\\n  -H "X-API-Key: chk_your_key_here"${endpoint.exampleBody ? ` \\\n  -H "Content-Type: application/json" \\\n  -d '${endpoint.exampleBody}'` : ""}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant="outline" className={`font-mono text-xs ${methodColor[endpoint.method] ?? ""}`}>{endpoint.method}</Badge>
            <code className="text-sm font-mono">{endpoint.path}</code>
          </DialogTitle>
          <DialogDescription>{endpoint.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* cURL */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">cURL</Label>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copy(curlCmd, "curl")}>
                {copiedField === "curl" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
            <pre className="text-xs font-mono bg-muted/50 rounded-md p-3 overflow-x-auto text-muted-foreground">{curlCmd}</pre>
          </div>

          {/* Request body */}
          {endpoint.exampleBody && (
            <div>
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Request Body</Label>
              <pre className="text-xs font-mono bg-muted/50 rounded-md p-3 overflow-x-auto text-foreground/80 mt-1">
                {JSON.stringify(JSON.parse(endpoint.exampleBody), null, 2)}
              </pre>
            </div>
          )}

          {/* Response */}
          <div>
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Example Response</Label>
            <pre className="text-xs font-mono bg-muted/50 rounded-md p-3 overflow-x-auto text-foreground/80 mt-1">
              {JSON.stringify(JSON.parse(endpoint.exampleResponse || "{}"), null, 2)}
            </pre>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => { onTryIt(endpoint.method, endpoint.path, endpoint.exampleBody); onOpenChange(false); }}>
            <Play className="w-3.5 h-3.5 mr-1.5" />Try in Playground
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Main component ──
const AdminDeveloperTab = () => {
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
  const [pgParams, setPgParams] = useState<Record<string, string>>({});

  // Reference state
  const [detailEndpoint, setDetailEndpoint] = useState<typeof endpointGroups[0]["endpoints"][0] | null>(null);
  const [refSearch, setRefSearch] = useState("");

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
        method: "POST",
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
  const pgPathParams = (pgPath.match(/:([a-zA-Z_]+)/g) || []).map((p) => p.slice(1));
  const resolvedPath = pgPath.replace(/:([a-zA-Z_]+)/g, (_, name) => pgParams[name] || `:${name}`);
  const hasUnresolvedParams = pgPathParams.some((p) => !pgParams[p]);

  const updatePgPath = (newPath: string) => {
    setPgPath(newPath);
    const newParams = (newPath.match(/:([a-zA-Z_]+)/g) || []).map((p) => p.slice(1));
    setPgParams((prev) => {
      const next: Record<string, string> = {};
      newParams.forEach((p) => { if (prev[p]) next[p] = prev[p]; });
      return next;
    });
  };

  const sendRequest = async () => {
    if (hasUnresolvedParams) {
      toast({ title: "Missing parameters", description: "Please fill in all path parameters before sending.", variant: "destructive" });
      return;
    }
    setPgLoading(true); setPgResponse(null); setPgStatus(null); setPgTime(null);
    try {
      const start = Date.now();
      const headers: Record<string, string> = { "X-API-Key": pgApiKey };
      if (pgBody && ["POST", "PATCH", "PUT"].includes(pgMethod)) headers["Content-Type"] = "application/json";
      const res = await fetch(`${API_BASE_URL}${resolvedPath}`, {
        method: pgMethod, headers,
        body: ["POST", "PATCH", "PUT"].includes(pgMethod) && pgBody ? pgBody : undefined,
      });
      const elapsed = Date.now() - start;
      const text = await res.text();
      setPgStatus(res.status); setPgTime(elapsed);
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

  const tryEndpoint = (method: string, path: string, body?: string) => {
    setPgMethod(method);
    updatePgPath(path);
    if (body) setPgBody(body); else setPgBody("");
    setActiveTab("playground");
  };

  const playgroundEndpoints = endpointGroups.flatMap((g) =>
    g.endpoints.map((ep) => ({ method: ep.method, path: ep.path, label: `${ep.method} ${ep.path}` }))
  );

  // Filtered reference endpoints
  const filteredGroups = refSearch
    ? endpointGroups.map((g) => ({
        ...g,
        endpoints: g.endpoints.filter((ep) =>
          ep.path.toLowerCase().includes(refSearch.toLowerCase()) ||
          ep.description.toLowerCase().includes(refSearch.toLowerCase()) ||
          ep.method.toLowerCase().includes(refSearch.toLowerCase())
        ),
      })).filter((g) => g.endpoints.length > 0)
    : endpointGroups;

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="h-9 w-auto">
          <TabsTrigger value="keys" className="gap-1.5 text-xs"><Key className="w-3.5 h-3.5" />API Keys</TabsTrigger>
          <TabsTrigger value="playground" className="gap-1.5 text-xs"><Play className="w-3.5 h-3.5" />Playground</TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5 text-xs" onClick={() => { if (logs.length === 0) fetchLogs(); }}><FileText className="w-3.5 h-3.5" />Logs</TabsTrigger>
          <TabsTrigger value="reference" className="gap-1.5 text-xs"><Code2 className="w-3.5 h-3.5" />Reference</TabsTrigger>
        </TabsList>

        {/* ===== KEYS TAB ===== */}
        <TabsContent value="keys" className="space-y-4 mt-4">
          {/* Connection info bar */}
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <Database className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs text-muted-foreground mr-2">Base URL</span>
              <code className="text-xs font-mono text-foreground">{API_BASE_URL}</code>
            </div>
            <CopyButton value={API_BASE_URL} field="base_url" />
          </div>

          {/* Keys table */}
          <div className="rounded-lg border border-border">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div>
                <h3 className="text-sm font-semibold text-foreground">API Keys</h3>
                <p className="text-xs text-muted-foreground">Create and manage API keys for programmatic access</p>
              </div>
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8"><Plus className="w-3.5 h-3.5 mr-1.5" />Create Key</Button>
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
            </div>
            {keysLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Loading keys…</p>
            ) : keys.length === 0 ? (
              <div className="py-12 text-center">
                <Key className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No API keys yet</p>
                <p className="text-xs text-muted-foreground/60">Create one to get started with the API</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Scopes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Used</TableHead>
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
                        <TableCell><Badge variant={status.variant} className="text-[10px]">{status.label}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(key.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : "Never"}</TableCell>
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
          </div>
        </TabsContent>

        {/* ===== PLAYGROUND TAB ===== */}
        <TabsContent value="playground" className="mt-4">
          <div className="rounded-lg border border-border">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">API Playground</h3>
              <p className="text-xs text-muted-foreground">Test API endpoints with your API key</p>
            </div>
            <div className="p-4 space-y-4">
              {/* API Key input */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">API Key</Label>
                <Input type="password" placeholder="chk_..." value={pgApiKey} onChange={(e) => setPgApiKey(e.target.value)} className="font-mono text-xs" />
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
                <Input value={pgPath} onChange={(e) => updatePgPath(e.target.value)} placeholder="/api/v1/instances" className="font-mono text-xs flex-1" />
                <Button onClick={sendRequest} disabled={pgLoading || !pgApiKey} className="gap-1.5">
                  <Send className="w-3.5 h-3.5" />{pgLoading ? "Sending…" : "Send"}
                </Button>
              </div>

              {/* Path parameters */}
              {pgPathParams.length > 0 && (
                <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
                  <Label className="text-xs text-muted-foreground font-medium">Path Parameters</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {pgPathParams.map((param) => (
                      <div key={param} className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground font-mono">:{param}</Label>
                        <Input
                          value={pgParams[param] || ""}
                          onChange={(e) => setPgParams((prev) => ({ ...prev, [param]: e.target.value }))}
                          placeholder={`Enter ${param.replace(/_/g, " ")}`}
                          className="font-mono text-xs h-8"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground mt-1">
                    Resolved: <span className="text-foreground">{resolvedPath}</span>
                  </div>
                </div>
              )}

              {/* Quick endpoint selector */}
              <div className="flex flex-wrap gap-1">
                {playgroundEndpoints.slice(0, 10).map((ep, i) => (
                  <Button key={i} variant="outline" size="sm" className="text-[10px] h-6 px-2" onClick={() => { setPgMethod(ep.method); updatePgPath(ep.path); }}>
                    <Badge variant="outline" className={`text-[9px] font-mono mr-1 px-1 ${methodColor[ep.method] ?? ""}`}>{ep.method}</Badge>
                    {ep.path.replace("/api/v1/", "")}
                  </Button>
                ))}
              </div>

              {/* Request body */}
              {["POST", "PATCH", "PUT"].includes(pgMethod) && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Request Body (JSON)</Label>
                  <Textarea value={pgBody} onChange={(e) => setPgBody(e.target.value)} placeholder='{"name": "Test"}' className="font-mono text-xs min-h-[80px]" />
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
            </div>
          </div>
        </TabsContent>

        {/* ===== LOGS TAB ===== */}
        <TabsContent value="logs" className="mt-4">
          <div className="rounded-lg border border-border">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Request Logs</h3>
                <p className="text-xs text-muted-foreground">View all API requests made with your keys</p>
              </div>
              <Button variant="outline" size="sm" className="h-8" onClick={fetchLogs} disabled={logsLoading}>
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${logsLoading ? "animate-spin" : ""}`} />Refresh
              </Button>
            </div>
            <div className="p-4 space-y-3">
              {/* Filters */}
              <div className="flex gap-2">
                <Select value={logFilter.method || "all"} onValueChange={(v) => setLogFilter((f) => ({ ...f, method: v === "all" ? undefined : v }))}>
                  <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="Method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    {["GET", "POST", "PATCH", "DELETE"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={logFilter.status || "all"} onValueChange={(v) => setLogFilter((f) => ({ ...f, status: v === "all" ? undefined : v }))}>
                  <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
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
                <div className="py-12 text-center">
                  <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No API request logs yet</p>
                </div>
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
                        <TableRow key={log.id} className="cursor-pointer" onClick={() => setSelectedLog(log)}>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] font-mono ${methodColor[log.method] ?? ""}`}>{log.method}</Badge>
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
            </div>
          </div>

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
                    <pre className="text-xs font-mono bg-muted/50 rounded-md p-3 overflow-auto max-h-[200px]">{JSON.stringify(selectedLog.request_body, null, 2)}</pre>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Response Body</Label>
                  <pre className="text-xs font-mono bg-muted/50 rounded-md p-3 overflow-auto max-h-[300px]">{selectedLog?.response_body ? JSON.stringify(selectedLog.response_body, null, 2) : "—"}</pre>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ===== REFERENCE TAB ===== */}
        <TabsContent value="reference" className="mt-4 space-y-4">
          {/* Auth info bar */}
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <Key className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1 text-xs text-muted-foreground">
              All endpoints require <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">X-API-Key</code> header · Base URL: <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">{API_BASE_URL}</code>
            </div>
            <CopyButton value={API_BASE_URL} field="ref_base_url" />
          </div>

          {/* Search */}
          <div className="relative">
            <Input
              placeholder="Search endpoints…"
              value={refSearch}
              onChange={(e) => setRefSearch(e.target.value)}
              className="text-xs h-9 pl-8"
            />
            <Code2 className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Endpoint tables by group */}
          {filteredGroups.map((group) => (
            <div key={group.title} className="rounded-lg border border-border overflow-hidden">
              <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
                <h4 className="text-sm font-semibold text-foreground">{group.title}</h4>
                {group.description && <p className="text-[11px] text-muted-foreground mt-0.5">{group.description}</p>}
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-20">Method</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.endpoints.map((ep, i) => (
                    <TableRow
                      key={i}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => setDetailEndpoint(ep)}
                    >
                      <TableCell className="py-2">
                        <Badge variant="outline" className={`text-[10px] font-mono w-[52px] justify-center ${methodColor[ep.method] ?? ""}`}>
                          {ep.method}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <code className="text-xs font-mono text-foreground">{ep.path}</code>
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground hidden md:table-cell">
                        {ep.description}
                      </TableCell>
                      <TableCell className="py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px]"
                          onClick={(e) => { e.stopPropagation(); tryEndpoint(ep.method, ep.path, ep.exampleBody); }}
                        >
                          <Play className="w-3 h-3 mr-1" />Try
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Endpoint detail dialog */}
      <EndpointDetailDialog
        endpoint={detailEndpoint}
        open={!!detailEndpoint}
        onOpenChange={(open) => { if (!open) setDetailEndpoint(null); }}
        onTryIt={tryEndpoint}
      />

      {/* Created key display */}
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
