import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Copy, Check, Eye, EyeOff, ExternalLink, Globe, Key, Database, Code2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "";

const AdminDeveloperTab = () => {
  const [showAnonKey, setShowAnonKey] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const CopyButton = ({ value, field }: { value: string; field: string }) => (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0"
      onClick={() => copyToClipboard(value, field)}
    >
      {copiedField === field ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </Button>
  );

  const apiEndpoints = [
    { method: "GET", path: "/rest/v1/{table}", description: "List rows from a table" },
    { method: "POST", path: "/rest/v1/{table}", description: "Insert rows into a table" },
    { method: "PATCH", path: "/rest/v1/{table}?id=eq.{id}", description: "Update a row" },
    { method: "DELETE", path: "/rest/v1/{table}?id=eq.{id}", description: "Delete a row" },
    { method: "POST", path: "/auth/v1/token?grant_type=password", description: "Sign in with email/password" },
    { method: "POST", path: "/auth/v1/signup", description: "Register a new user" },
    { method: "GET", path: "/storage/v1/object/{bucket}/{path}", description: "Download a file from storage" },
  ];

  const methodColor: Record<string, string> = {
    GET: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    POST: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    PATCH: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    DELETE: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Connection Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Database className="w-4 h-4" />Connection Details</CardTitle>
          <CardDescription>Supabase project configuration and API credentials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Project ID</Label>
            <div className="flex items-center gap-2">
              <Input value={SUPABASE_PROJECT_ID} readOnly className="font-mono text-xs h-9 bg-muted/50" />
              <CopyButton value={SUPABASE_PROJECT_ID} field="project_id" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Globe className="w-3 h-3" />API URL
            </Label>
            <div className="flex items-center gap-2">
              <Input value={SUPABASE_URL} readOnly className="font-mono text-xs h-9 bg-muted/50" />
              <CopyButton value={SUPABASE_URL} field="url" />
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
                <a href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Key className="w-3 h-3" />Anon / Publishable Key
            </Label>
            <div className="flex items-center gap-2">
              <Input
                value={showAnonKey ? SUPABASE_ANON_KEY : "•".repeat(40)}
                readOnly
                className="font-mono text-xs h-9 bg-muted/50"
              />
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setShowAnonKey(!showAnonKey)}>
                {showAnonKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </Button>
              <CopyButton value={SUPABASE_ANON_KEY} field="anon_key" />
            </div>
            <p className="text-[10px] text-muted-foreground">This is the public anon key — safe to use in client-side code. It only grants access permitted by RLS policies.</p>
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

      {/* API Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Code2 className="w-4 h-4" />API Endpoints</CardTitle>
          <CardDescription>Common REST API endpoints — base URL: <code className="text-xs font-mono bg-muted px-1 rounded">{SUPABASE_URL}</code></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {apiEndpoints.map((ep, i) => (
              <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted/30 transition-colors">
                <Badge variant="outline" className={`text-[10px] font-mono w-16 justify-center ${methodColor[ep.method] ?? ""}`}>
                  {ep.method}
                </Badge>
                <code className="text-xs font-mono text-foreground flex-1">{ep.path}</code>
                <span className="text-xs text-muted-foreground hidden sm:block">{ep.description}</span>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Example cURL request</Label>
            <div className="relative">
              <pre className="text-xs font-mono bg-muted/50 rounded-md p-3 overflow-x-auto text-muted-foreground">
{`curl '${SUPABASE_URL}/rest/v1/instances?select=*' \\
  -H "apikey: ${SUPABASE_ANON_KEY.slice(0, 20)}..." \\
  -H "Authorization: Bearer <user_token>"`}
              </pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1.5 right-1.5 h-7 w-7"
                onClick={() => copyToClipboard(
                  `curl '${SUPABASE_URL}/rest/v1/instances?select=*' \\\n  -H "apikey: ${SUPABASE_ANON_KEY}" \\\n  -H "Authorization: Bearer <user_token>"`,
                  "curl"
                )}
              >
                {copiedField === "curl" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDeveloperTab;
