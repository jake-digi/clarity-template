import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Copy, Check, Eye, EyeOff, ExternalLink, Globe, Key, Database, Code2,
  Plus, Trash2, Shield, Clock, AlertTriangle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
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

const AdminDeveloperTab = () => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["read"]);
  const [newKeyExpiry, setNewKeyExpiry] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showAnonKey, setShowAnonKey] = useState(false);
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

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API_BASE_URL}/api/v1/api-keys/list`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (json.success) setKeys(json.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKeys(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API_BASE_URL}/api/v1/api-keys/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newKeyName || "Untitled",
          scopes: newKeyScopes,
          expires_at: newKeyExpiry || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreatedKey(json.data.key);
        setCreateOpen(false);
        setNewKeyName("");
        setNewKeyScopes(["read"]);
        setNewKeyExpiry("");
        fetchKeys();
        toast({ title: "API key created" });
      } else {
        toast({ title: "Error", description: json.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error creating key", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await fetch(`${API_BASE_URL}/api/v1/api-keys/revoke`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: revokeTarget.id }),
      });
      setRevokeTarget(null);
      fetchKeys();
      toast({ title: "API key revoked" });
    } catch {
      toast({ title: "Error revoking key", variant: "destructive" });
    }
  };

  const toggleScope = (scope: string) => {
    setNewKeyScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
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

  const endpointGroups = [
    {
      title: "Instances",
      description: "Supports ?type=dofe or ?type=standard filtering. Responses include type, dofe_level, expedition_type derived from settings.",
      endpoints: [
        { method: "GET", path: "/api/v1/instances", description: "List all instances (filterable by ?type=dofe|standard)" },
        { method: "GET", path: "/api/v1/instances/:id", description: "Get instance by ID" },
        { method: "POST", path: "/api/v1/instances", description: "Create instance (accepts type, dofe_level, expedition_type)" },
        { method: "PATCH", path: "/api/v1/instances/:id", description: "Update instance" },
        { method: "DELETE", path: "/api/v1/instances/:id", description: "Soft-delete instance" },
      ],
    },
    {
      title: "Participants",
      endpoints: [
        { method: "GET", path: "/api/v1/participants", description: "List participants (filterable by ?instance_id=)" },
        { method: "GET", path: "/api/v1/participants/:id", description: "Get participant by ID" },
        { method: "POST", path: "/api/v1/participants", description: "Create participant" },
        { method: "PATCH", path: "/api/v1/participants/:id", description: "Update participant" },
        { method: "DELETE", path: "/api/v1/participants/:id", description: "Delete participant" },
      ],
    },
    {
      title: "Groups",
      endpoints: [
        { method: "GET", path: "/api/v1/groups/supergroups", description: "List supergroups" },
        { method: "POST", path: "/api/v1/groups/supergroups", description: "Create supergroup" },
        { method: "GET", path: "/api/v1/groups/subgroups", description: "List subgroups" },
        { method: "POST", path: "/api/v1/groups/subgroups", description: "Create subgroup" },
      ],
    },
    {
      title: "Blocks & Rooms",
      endpoints: [
        { method: "GET", path: "/api/v1/blocks", description: "List blocks" },
        { method: "POST", path: "/api/v1/blocks", description: "Create block" },
        { method: "GET", path: "/api/v1/rooms", description: "List rooms" },
        { method: "POST", path: "/api/v1/rooms", description: "Create room" },
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* API Keys Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><Key className="w-4 h-4" />API Keys</CardTitle>
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
          {loading ? (
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
                          {key.scopes.map((s) => (
                            <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                          ))}
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

      {/* Connection Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Database className="w-4 h-4" />Connection Details</CardTitle>
          <CardDescription>API configuration and credentials</CardDescription>
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

      {/* API Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Code2 className="w-4 h-4" />API Reference</CardTitle>
          <CardDescription>
            All endpoints use <code className="text-xs font-mono bg-muted px-1 rounded">X-API-Key</code> header for authentication.
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
              <div className="space-y-1">
                {group.endpoints.map((ep, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5 px-3 rounded-md hover:bg-muted/30 transition-colors">
                    <Badge variant="outline" className={`text-[10px] font-mono w-16 justify-center ${methodColor[ep.method] ?? ""}`}>
                      {ep.method}
                    </Badge>
                    <code className="text-xs font-mono text-foreground flex-1">{ep.path}</code>
                    <span className="text-xs text-muted-foreground hidden sm:block">{ep.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Example cURL request</Label>
            <div className="relative">
              <pre className="text-xs font-mono bg-muted/50 rounded-md p-3 overflow-x-auto text-muted-foreground">
{`curl '${API_BASE_URL}/api/v1/instances?type=dofe' \\
  -H "X-API-Key: chk_your_api_key_here"`}
              </pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1.5 right-1.5 h-7 w-7"
                onClick={() => copyToClipboard(
                  `curl '${API_BASE_URL}/api/v1/instances?type=dofe' \\\n  -H "X-API-Key: chk_your_api_key_here"`,
                  "curl"
                )}
              >
                {copiedField === "curl" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Response format</Label>
            <pre className="text-xs font-mono bg-muted/50 rounded-md p-3 overflow-x-auto text-muted-foreground">
{`{
  "success": true,
  "data": [ ... ],
  "meta": { "total": 42, "limit": 50, "offset": 0 }
}`}
            </pre>
          </div>
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
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-md border border-border text-sm hover:bg-muted/50 transition-colors"
              >
                <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                {link.label}
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDeveloperTab;
