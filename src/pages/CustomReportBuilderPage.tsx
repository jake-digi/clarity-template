import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft, ArrowRight, Check, Database, Columns3, Filter, Play,
  Download, FileText, Users, Building2, Shield, BedDouble, AlertTriangle,
  ClipboardList, X, Plus, Trash2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { exportCSV, exportPDF } from "@/lib/reportExport";

/* ------------------------------------------------------------------ */
/*  Data source definitions                                           */
/* ------------------------------------------------------------------ */

interface DataSourceDef {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  table: string;
  columns: { key: string; label: string; type: "text" | "number" | "date" | "boolean" }[];
}

const DATA_SOURCES: DataSourceDef[] = [
  {
    id: "participants",
    label: "Participants",
    description: "All participants across instances with demographics and status.",
    icon: Users,
    table: "participants",
    columns: [
      { key: "full_name", label: "Full Name", type: "text" },
      { key: "first_name", label: "First Name", type: "text" },
      { key: "surname", label: "Surname", type: "text" },
      { key: "gender", label: "Gender", type: "text" },
      { key: "status", label: "Status", type: "text" },
      { key: "date_of_birth", label: "Date of Birth", type: "date" },
      { key: "school_institute", label: "School / Institute", type: "text" },
      { key: "school_year", label: "School Year", type: "text" },
      { key: "rank", label: "Rank", type: "text" },
      { key: "unit_name", label: "Unit Name", type: "text" },
      { key: "room_number", label: "Room Number", type: "text" },
      { key: "is_off_site", label: "Off-site", type: "boolean" },
      { key: "current_strike_count", label: "Strike Count", type: "number" },
      { key: "created_at", label: "Created At", type: "date" },
    ],
  },
  {
    id: "instances",
    label: "Instances",
    description: "All programme instances with dates, status, and location.",
    icon: Building2,
    table: "instances",
    columns: [
      { key: "name", label: "Name", type: "text" },
      { key: "status", label: "Status", type: "text" },
      { key: "location", label: "Location", type: "text" },
      { key: "start_date", label: "Start Date", type: "date" },
      { key: "end_date", label: "End Date", type: "date" },
      { key: "description", label: "Description", type: "text" },
      { key: "created_at", label: "Created At", type: "date" },
    ],
  },
  {
    id: "behavior_cases",
    label: "Behavior Cases",
    description: "Incident and behavior cases with severity, category, and assignment.",
    icon: Shield,
    table: "behavior_cases",
    columns: [
      { key: "category", label: "Category", type: "text" },
      { key: "severity_level", label: "Severity", type: "text" },
      { key: "status", label: "Status", type: "text" },
      { key: "overview", label: "Overview", type: "text" },
      { key: "location", label: "Location", type: "text" },
      { key: "privacy_level", label: "Privacy Level", type: "text" },
      { key: "assigned_to_name", label: "Assigned To", type: "text" },
      { key: "is_sensitive_safeguarding", label: "Safeguarding", type: "boolean" },
      { key: "requires_immediate_action", label: "Immediate Action", type: "boolean" },
      { key: "created_at", label: "Created At", type: "date" },
    ],
  },
  {
    id: "formal_warnings",
    label: "Formal Warnings",
    description: "Warning records with levels, reasons, and acknowledgement status.",
    icon: AlertTriangle,
    table: "formal_warnings",
    columns: [
      { key: "warning_level", label: "Warning Level", type: "number" },
      { key: "reason", label: "Reason", type: "text" },
      { key: "details", label: "Details", type: "text" },
      { key: "issued_by_name", label: "Issued By", type: "text" },
      { key: "acknowledged_by_participant", label: "Acknowledged", type: "boolean" },
      { key: "parent_notified", label: "Parent Notified", type: "boolean" },
      { key: "created_at", label: "Created At", type: "date" },
    ],
  },
  {
    id: "checkin_sessions",
    label: "Check-in Sessions",
    description: "Attendance check-in sessions with timing and completion data.",
    icon: ClipboardList,
    table: "checkin_sessions",
    columns: [
      { key: "session_name", label: "Session Name", type: "text" },
      { key: "session_type", label: "Session Type", type: "text" },
      { key: "started_at", label: "Started At", type: "date" },
      { key: "completed_at", label: "Completed At", type: "date" },
      { key: "notes", label: "Notes", type: "text" },
    ],
  },
  {
    id: "rooms",
    label: "Rooms / Accommodation",
    description: "Room inventory with types, capacity, and block assignments.",
    icon: BedDouble,
    table: "rooms",
    columns: [
      { key: "room_number", label: "Room Number", type: "text" },
      { key: "room_type", label: "Room Type", type: "text" },
      { key: "capacity", label: "Capacity", type: "number" },
      { key: "name", label: "Name", type: "text" },
      { key: "created_at", label: "Created At", type: "date" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Filter type                                                       */
/* ------------------------------------------------------------------ */

interface FilterRule {
  id: string;
  column: string;
  operator: "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "like" | "is_true" | "is_false";
  value: string;
}

const OPERATORS: { value: FilterRule["operator"]; label: string; forTypes: string[] }[] = [
  { value: "eq", label: "equals", forTypes: ["text", "number", "date"] },
  { value: "neq", label: "not equals", forTypes: ["text", "number", "date"] },
  { value: "like", label: "contains", forTypes: ["text"] },
  { value: "gt", label: "greater than", forTypes: ["number", "date"] },
  { value: "lt", label: "less than", forTypes: ["number", "date"] },
  { value: "gte", label: "≥", forTypes: ["number", "date"] },
  { value: "lte", label: "≤", forTypes: ["number", "date"] },
  { value: "is_true", label: "is true", forTypes: ["boolean"] },
  { value: "is_false", label: "is false", forTypes: ["boolean"] },
];

/* ------------------------------------------------------------------ */
/*  Steps                                                             */
/* ------------------------------------------------------------------ */

const STEPS = [
  { label: "Data Source", icon: Database },
  { label: "Columns", icon: Columns3 },
  { label: "Filters", icon: Filter },
  { label: "Preview & Run", icon: Play },
] as const;

/* ------------------------------------------------------------------ */
/*  Page component                                                    */
/* ------------------------------------------------------------------ */

const CustomReportBuilderPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [selectedCols, setSelectedCols] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [reportName, setReportName] = useState("");

  const source = DATA_SOURCES.find((s) => s.id === sourceId);

  // ---------- Step navigation ----------
  const canNext = useMemo(() => {
    if (step === 0) return !!sourceId;
    if (step === 1) return selectedCols.length > 0;
    return true;
  }, [step, sourceId, selectedCols]);

  const next = () => {
    if (step === 0 && source) {
      // Auto-select all columns the first time
      if (selectedCols.length === 0) setSelectedCols(source.columns.map((c) => c.key));
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  // ---------- Column toggle ----------
  const toggleCol = (key: string) =>
    setSelectedCols((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  const toggleAll = () => {
    if (!source) return;
    const allKeys = source.columns.map((c) => c.key);
    setSelectedCols(selectedCols.length === allKeys.length ? [] : allKeys);
  };

  // ---------- Filter management ----------
  const addFilter = () =>
    setFilters((f) => [
      ...f,
      { id: crypto.randomUUID(), column: source?.columns[0]?.key ?? "", operator: "eq", value: "" },
    ]);
  const removeFilter = (id: string) => setFilters((f) => f.filter((r) => r.id !== id));
  const updateFilter = (id: string, patch: Partial<FilterRule>) =>
    setFilters((f) => f.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  // ---------- Query (step 3) ----------
  const shouldRun = step === 3;
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["custom-report", sourceId, selectedCols, filters],
    enabled: shouldRun && !!source,
    queryFn: async () => {
      if (!source) throw new Error("No source");

      const selectStr = selectedCols.join(", ");
      let query = supabase.from(source.table as any).select(selectStr);

      // Apply filters
      for (const f of filters) {
        const col = source.columns.find((c) => c.key === f.column);
        if (!col) continue;
        switch (f.operator) {
          case "eq":
            query = query.eq(f.column, f.value);
            break;
          case "neq":
            query = query.neq(f.column, f.value);
            break;
          case "gt":
            query = query.gt(f.column, f.value);
            break;
          case "lt":
            query = query.lt(f.column, f.value);
            break;
          case "gte":
            query = query.gte(f.column, f.value);
            break;
          case "lte":
            query = query.lte(f.column, f.value);
            break;
          case "like":
            query = query.ilike(f.column, `%${f.value}%`);
            break;
          case "is_true":
            query = query.eq(f.column, true);
            break;
          case "is_false":
            query = query.eq(f.column, false);
            break;
        }
      }

      // Limit to 1000 for preview
      query = query.limit(1000);
      const { data: rows, error: err } = await query;
      if (err) throw err;
      return rows as Record<string, any>[];
    },
  });

  const columnLabels = useMemo(
    () => selectedCols.map((k) => source?.columns.find((c) => c.key === k)?.label ?? k),
    [selectedCols, source]
  );

  const tableRows = useMemo(() => {
    if (!data) return [];
    return data.map((row) =>
      selectedCols.map((k) => {
        const val = row[k];
        if (val === null || val === undefined) return "—";
        if (typeof val === "boolean") return val ? "Yes" : "No";
        if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}/.test(val))
          return new Date(val).toLocaleDateString();
        return String(val);
      })
    );
  }, [data, selectedCols]);

  // ---------- Export ----------
  const handleCSV = () => {
    const name = reportName || "custom-report";
    exportCSV(columnLabels, tableRows, `${name}-${Date.now()}`);
  };
  const handlePDF = () => {
    const name = reportName || "Custom Report";
    exportPDF(name, columnLabels, tableRows, [`${tableRows.length} rows`, `Source: ${source?.label}`], `${name}-${Date.now()}`);
  };

  // ---------- Render ----------
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div className="p-6 border-b bg-card">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/reports")} className="h-8 w-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Custom Report Builder</h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Build a report by selecting a data source, choosing columns, and applying filters.
                </p>
              </div>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mt-6">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const active = i === step;
                const done = i < step;
                return (
                  <div key={i} className="flex items-center gap-2">
                    {i > 0 && <div className={`h-px w-8 ${done ? "bg-primary" : "bg-border"}`} />}
                    <button
                      onClick={() => i < step && setStep(i)}
                      disabled={i > step}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : done
                          ? "bg-primary/10 text-primary cursor-pointer"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{s.label}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-auto p-6">
            {/* Step 0: Data Source */}
            {step === 0 && (
              <div className="max-w-4xl">
                <h2 className="text-lg font-semibold text-foreground mb-1">Choose a data source</h2>
                <p className="text-sm text-muted-foreground mb-6">Select the primary table your report will query.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {DATA_SOURCES.map((ds) => {
                    const Icon = ds.icon;
                    const selected = sourceId === ds.id;
                    return (
                      <button
                        key={ds.id}
                        onClick={() => {
                          setSourceId(ds.id);
                          setSelectedCols([]);
                          setFilters([]);
                        }}
                        className={`text-left p-5 rounded-xl border-2 transition-all ${
                          selected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border hover:border-primary/40 hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selected ? "bg-primary/10" : "bg-muted"}`}>
                            <Icon className={`w-5 h-5 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                          {selected && <Badge className="bg-primary/10 text-primary border-primary/20">Selected</Badge>}
                        </div>
                        <p className="font-semibold text-foreground">{ds.label}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ds.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 1: Columns */}
            {step === 1 && source && (
              <div className="max-w-3xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Select columns</h2>
                    <p className="text-sm text-muted-foreground">
                      Choose which fields to include in the report. {selectedCols.length} of {source.columns.length} selected.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={toggleAll}>
                    {selectedCols.length === source.columns.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {source.columns.map((col) => {
                    const checked = selectedCols.includes(col.key);
                    return (
                      <label
                        key={col.key}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          checked ? "border-primary/40 bg-primary/5" : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <Checkbox checked={checked} onCheckedChange={() => toggleCol(col.key)} />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-foreground">{col.label}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{col.type}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Filters */}
            {step === 2 && source && (
              <div className="max-w-3xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Add filters</h2>
                    <p className="text-sm text-muted-foreground">
                      Optionally narrow results. Filters are applied server-side.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={addFilter} className="gap-2">
                    <Plus className="w-3.5 h-3.5" /> Add Filter
                  </Button>
                </div>

                {filters.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <Filter className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="font-medium">No filters applied</p>
                      <p className="text-sm mt-1">All rows will be included. Click "Add Filter" to narrow results.</p>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-3">
                  {filters.map((f) => {
                    const col = source.columns.find((c) => c.key === f.column);
                    const colType = col?.type ?? "text";
                    const applicableOps = OPERATORS.filter((o) => o.forTypes.includes(colType));
                    const needsValue = !["is_true", "is_false"].includes(f.operator);

                    return (
                      <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                        <Select
                          value={f.column}
                          onValueChange={(v) => {
                            const newCol = source.columns.find((c) => c.key === v);
                            const newType = newCol?.type ?? "text";
                            const validOps = OPERATORS.filter((o) => o.forTypes.includes(newType));
                            const newOp = validOps.find((o) => o.value === f.operator) ? f.operator : validOps[0].value;
                            updateFilter(f.id, { column: v, operator: newOp });
                          }}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {source.columns.map((c) => (
                              <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={f.operator}
                          onValueChange={(v) => updateFilter(f.id, { operator: v as FilterRule["operator"] })}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {applicableOps.map((o) => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {needsValue && (
                          <Input
                            placeholder="Value…"
                            className="flex-1"
                            value={f.value}
                            onChange={(e) => updateFilter(f.id, { value: e.target.value })}
                          />
                        )}

                        <Button variant="ghost" size="icon" onClick={() => removeFilter(f.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>

                {/* Report name */}
                <div className="mt-8">
                  <Label className="text-sm font-medium text-foreground">Report Name (optional)</Label>
                  <Input
                    placeholder="e.g. Active Participants by Gender"
                    className="mt-2 max-w-md"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Preview & Run */}
            {step === 3 && source && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {reportName || "Custom Report"} — {source.label}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedCols.length} columns · {filters.length} filter{filters.length !== 1 ? "s" : ""} · Limited to 1,000 rows
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="h-9 gap-2" onClick={handleCSV} disabled={!data?.length}>
                      <Download className="w-4 h-4" /> CSV
                    </Button>
                    <Button variant="outline" className="h-9 gap-2" onClick={handlePDF} disabled={!data?.length}>
                      <FileText className="w-4 h-4" /> PDF
                    </Button>
                    <Button variant="outline" className="h-9 gap-2" onClick={() => refetch()}>
                      <Play className="w-4 h-4" /> Re-run
                    </Button>
                  </div>
                </div>

                {/* Summary badges */}
                {data && (
                  <div className="flex gap-3 mb-4">
                    <Badge variant="secondary" className="text-sm py-1 px-3">{data.length} rows</Badge>
                    <Badge variant="outline" className="text-sm py-1 px-3">Source: {source.label}</Badge>
                    {filters.length > 0 && (
                      <Badge variant="outline" className="text-sm py-1 px-3">{filters.length} filter{filters.length !== 1 ? "s" : ""} applied</Badge>
                    )}
                  </div>
                )}

                {isLoading && (
                  <div className="space-y-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                )}

                {error && (
                  <Card className="border-destructive/40 bg-destructive/5">
                    <CardContent className="py-8 text-center">
                      <p className="font-medium text-destructive">Query failed</p>
                      <p className="text-sm text-destructive/80 mt-1">{(error as Error).message}</p>
                      <Button variant="outline" className="mt-4" onClick={() => refetch()}>Retry</Button>
                    </CardContent>
                  </Card>
                )}

                {data && (
                  <div className="rounded-lg border overflow-hidden">
                    <div className="overflow-auto max-h-[60vh]">
                      <Table>
                        <TableHeader className="sticky top-0 bg-card z-10">
                          <TableRow>
                            <TableHead className="pl-4 w-12 text-muted-foreground">#</TableHead>
                            {columnLabels.map((col) => (
                              <TableHead key={col} className="text-muted-foreground font-medium">{col}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tableRows.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={columnLabels.length + 1} className="text-center py-16 text-muted-foreground">
                                No rows match your filters.
                              </TableCell>
                            </TableRow>
                          ) : (
                            tableRows.map((row, i) => (
                              <TableRow key={i}>
                                <TableCell className="pl-4 text-muted-foreground text-xs">{i + 1}</TableCell>
                                {row.map((cell, j) => (
                                  <TableCell key={j}>{cell}</TableCell>
                                ))}
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="border-t px-4 py-3 bg-card text-sm text-muted-foreground">
                      {tableRows.length} row{tableRows.length !== 1 ? "s" : ""} · Generated {new Date().toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom nav */}
          {step < 3 && (
            <div className="border-t bg-card px-6 py-4 flex items-center justify-between">
              <Button variant="outline" onClick={prev} disabled={step === 0} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button onClick={next} disabled={!canNext} className="gap-2">
                {step === 2 ? "Run Report" : "Next"} <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CustomReportBuilderPage;
