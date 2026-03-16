import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Save, RotateCcw, Eye, Code2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_body: string;
  updated_at: string;
  updated_by: string | null;
}

const VARIABLES = [
  { key: "{{name}}", desc: "Recipient's full name" },
  { key: "{{reset_link}}", desc: "Password set / reset URL" },
  { key: "{{year}}", desc: "Current year (auto)" },
];

const db = supabase as any;

const AdminEmailTemplatesTab = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<EmailTemplate | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editHtml, setEditHtml] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const { data, error } = await db
      .from("email_templates")
      .select("*")
      .order("name", { ascending: true });
    if (error) {
      toast({ title: "Failed to load templates", description: error.message, variant: "destructive" });
    } else {
      setTemplates(data ?? []);
      if (!selected && data?.length) {
        selectTemplate(data[0]);
      }
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const selectTemplate = (t: EmailTemplate) => {
    setSelected(t);
    setEditSubject(t.subject);
    setEditHtml(t.html_body);
    setDirty(false);
    setSaveSuccess(false);
  };

  const handleSubjectChange = (v: string) => {
    setEditSubject(v);
    setDirty(true);
    setSaveSuccess(false);
  };

  const handleHtmlChange = (v: string) => {
    setEditHtml(v);
    setDirty(true);
    setSaveSuccess(false);
  };

  const handleReset = () => {
    if (!selected) return;
    setEditSubject(selected.subject);
    setEditHtml(selected.html_body);
    setDirty(false);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await db
      .from("email_templates")
      .update({
        subject: editSubject,
        html_body: editHtml,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selected.id);

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      const updated = { ...selected, subject: editSubject, html_body: editHtml, updated_at: new Date().toISOString() };
      setSelected(updated);
      setTemplates((prev) => prev.map((t) => (t.id === selected.id ? updated : t)));
      setDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    setSaving(false);
  };

  // Build a preview by substituting sample values for variables
  const previewHtml = editHtml
    .replace(/\{\{name\}\}/g, "Jane Smith")
    .replace(/\{\{reset_link\}\}/g, "https://orders.freemansindustrial.co.uk/reset-password?token_hash=example&type=recovery")
    .replace(/\{\{year\}\}/g, String(new Date().getFullYear()));

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Template list */}
      <div className="w-56 shrink-0 flex flex-col gap-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">Templates</p>
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => selectTemplate(t)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors w-full ${
              selected?.id === t.id
                ? "bg-accent text-foreground"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail className="w-4 h-4 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{t.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {new Date(t.updated_at).toLocaleDateString("en-GB", {
                  day: "numeric", month: "short", year: "2-digit",
                })}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Editor */}
      {selected ? (
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Header bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{selected.name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Last saved {new Date(selected.updated_at).toLocaleDateString("en-GB", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {dirty && (
                <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !dirty}
                className="gap-1.5"
              >
                {saveSuccess ? (
                  <><CheckCircle2 className="w-3.5 h-3.5" /> Saved</>
                ) : (
                  <><Save className="w-3.5 h-3.5" /> {saving ? "Saving…" : "Save"}</>
                )}
              </Button>
            </div>
          </div>

          {/* Subject line */}
          <div className="space-y-1.5">
            <Label htmlFor="subject" className="text-sm font-medium">Email subject</Label>
            <Input
              id="subject"
              value={editSubject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="font-medium"
              placeholder="Email subject line…"
            />
          </div>

          {/* Variables reference */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium">Available variables:</span>
            {VARIABLES.map((v) => (
              <span
                key={v.key}
                title={v.desc}
                className="inline-flex items-center px-2 py-0.5 rounded bg-muted border border-border text-xs font-mono text-foreground cursor-help"
              >
                {v.key}
              </span>
            ))}
          </div>

          {/* Code / Preview tabs */}
          <Tabs defaultValue="code" className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-fit h-8 p-0.5">
              <TabsTrigger value="code" className="h-7 px-3 text-xs gap-1.5">
                <Code2 className="w-3.5 h-3.5" /> HTML
              </TabsTrigger>
              <TabsTrigger value="preview" className="h-7 px-3 text-xs gap-1.5">
                <Eye className="w-3.5 h-3.5" /> Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="code" className="flex-1 mt-2 min-h-0">
              <textarea
                value={editHtml}
                onChange={(e) => handleHtmlChange(e.target.value)}
                spellCheck={false}
                className="w-full h-[560px] resize-none rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring leading-relaxed"
                placeholder="Paste your HTML here…"
              />
            </TabsContent>

            <TabsContent value="preview" className="flex-1 mt-2 min-h-0">
              <div className="rounded-lg border border-border overflow-hidden h-[560px]">
                <div className="bg-muted/40 border-b border-border px-4 py-2 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Preview uses sample data — variables are substituted with example values
                  </span>
                </div>
                <iframe
                  srcDoc={previewHtml}
                  title="Email preview"
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Select a template to edit
        </div>
      )}
    </div>
  );
};

export default AdminEmailTemplatesTab;
