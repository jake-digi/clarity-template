import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, ChevronRight, ChevronDown, Building2, Copy, Download,
  RefreshCw, Activity, MapPin, Package, Receipt, AlertTriangle,
  CheckCircle2, Clock, RotateCcw, ClipboardList, Send, Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const db = supabase as any;

type SalesOrder = {
  id: string;
  order_number: string | null;
  order_date: string | null;
  customer_order_number: string | null;
  status: string;
  items_net: number | null;
  items_tax: number | null;
  items_gross: number | null;
  del_name: string | null;
  del_address_1: string | null;
  del_address_2: string | null;
  del_address_3: string | null;
  del_address_4: string | null;
  del_address_5: string | null;
  sage_error: string | null;
  last_injection_attempt: string | null;
  created_at: string;
  updated_at: string;
  account_ref: string | null;
  name: string | null;
  last_synced_at: string | null;
  method: string | null;
  customer_id: string | null;
};

type OrderItem = {
  id: string;
  stock_code: string | null;
  description: string | null;
  quantity: number | null;
  unit_price: number | null;
  qty_order: number | null;
  qty_allocated: number | null;
  qty_delivered: number | null;
  qty_yet_to_dispatch: number | null;
  net_amount: number | null;
  tax_amount: number | null;
  gross_amount: number | null;
  tax_rate: number | null;
  nominal_code: string | null;
};

type Activity = {
  id: string;
  timestamp: string;
  type: string;
  description: string;
};

const statusStyle = (status: string) => {
  switch (status?.toLowerCase()) {
    case "injected":   return "bg-emerald-500/10 text-emerald-700 border-emerald-200";
    case "processing": return "bg-blue-500/10 text-blue-700 border-blue-200";
    case "failed":     return "bg-red-500/10 text-red-700 border-red-200";
    case "pending":    return "bg-amber-500/10 text-amber-700 border-amber-200";
    default:           return "bg-muted text-muted-foreground border-border";
  }
};

const statusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case "injected":   return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    case "processing": return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
    case "failed":     return <AlertTriangle className="w-4 h-4 text-red-600" />;
    case "pending":    return <Clock className="w-4 h-4 text-amber-600" />;
    default:           return <Package className="w-4 h-4 text-muted-foreground" />;
  }
};

const fmt = (n: number | null) => `£${(n ?? 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtQty = (n: number | null) => n == null ? "—" : n.toLocaleString("en-GB");

const DetailChip = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div className="flex items-center gap-1.5">
    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
    <span className="text-xs text-muted-foreground/70">{label}:</span>
    <span className="text-foreground text-xs font-medium">{value}</span>
  </div>
);

const OrderDetailPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);

  // Note dialog
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");

  // Status update
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: o, error: oErr } = await db
          .from("sales_orders")
          .select("*")
          .eq("id", orderId)
          .maybeSingle();
        if (oErr) throw oErr;
        if (!o) { setError("Order not found"); setLoading(false); return; }
        setOrder(o);

        // Order items
        const { data: lines } = await db
          .from("sales_order_items")
          .select("*")
          .eq("order_id", orderId)
          .order("item_id", { ascending: true });
        setItems(lines ?? []);

        // Customer name
        if (o.customer_id) {
          const { data: cust } = await db
            .from("customers")
            .select("name, account_ref")
            .eq("id", o.customer_id)
            .maybeSingle();
          if (cust) setCustomerName(cust.name);
        }

        // Build activity feed from order metadata
        const acts: Activity[] = [];
        if (o.created_at) acts.push({ id: "created", timestamp: o.created_at, type: "created", description: "Order created" });
        if (o.last_injection_attempt) acts.push({ id: "inject", timestamp: o.last_injection_attempt, type: "injection", description: o.sage_error ? `Injection attempt — failed: ${o.sage_error}` : "Injection attempted" });
        if (o.last_synced_at) acts.push({ id: "synced", timestamp: o.last_synced_at, type: "sync", description: "Order synced from Sage" });
        acts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivity(acts);
      } catch (e: any) {
        setError(e.message ?? "Failed to load order");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!order || newStatus === order.status) return;
    setUpdatingStatus(true);
    const { error: e } = await db
      .from("sales_orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", order.id);
    if (e) {
      toast({ title: "Failed to update status", description: e.message, variant: "destructive" });
    } else {
      setOrder({ ...order, status: newStatus });
      toast({ title: "Status updated", description: `Order status changed to ${newStatus}` });
    }
    setUpdatingStatus(false);
  };

  const handleCopyOrderNumber = () => {
    if (order?.order_number) {
      navigator.clipboard.writeText(order.order_number);
      toast({ title: "Copied", description: `Order number ${order.order_number} copied to clipboard` });
    }
  };

  const handleExportCSV = () => {
    if (!order || !items.length) return;
    const rows = [
      ["Stock Code", "Description", "Qty Ordered", "Qty Allocated", "Qty Delivered", "Yet to Dispatch", "Unit Price", "Net", "Tax", "Gross"],
      ...items.map((i) => [
        i.stock_code ?? "",
        i.description ?? "",
        fmtQty(i.qty_order),
        fmtQty(i.qty_allocated),
        fmtQty(i.qty_delivered),
        fmtQty(i.qty_yet_to_dispatch),
        fmt(i.unit_price),
        fmt(i.net_amount),
        fmt(i.tax_amount),
        fmt(i.gross_amount),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `order-${order.order_number ?? order.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    const newAct: Activity = {
      id: `note-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "note",
      description: `Note: ${noteText.trim()}`,
    };
    setActivity((prev) => [newAct, ...prev]);
    setNoteText("");
    setNoteOpen(false);
    toast({ title: "Note added" });
  };

  const quickActions = [
    {
      type: "copy",
      label: "Copy Order #",
      icon: Copy,
      variant: "default" as const,
      onClick: handleCopyOrderNumber,
    },
    {
      type: "customer",
      label: "View Customer",
      icon: Building2,
      variant: "default" as const,
      onClick: () => order?.account_ref && navigate(`/customers/${order.account_ref}`),
    },
    {
      type: "status",
      label: "Change Status",
      icon: RotateCcw,
      variant: "default" as const,
      isDropdown: true,
    },
    {
      type: "export",
      label: "Export CSV",
      icon: Download,
      variant: "default" as const,
      onClick: handleExportCSV,
    },
    {
      type: "note",
      label: "Add Note",
      icon: ClipboardList,
      variant: "default" as const,
      onClick: () => setNoteOpen(true),
    },
    ...(order?.status === "failed" ? [{
      type: "retry",
      label: "Retry Injection",
      icon: RefreshCw,
      variant: "warning" as const,
      onClick: () => handleStatusChange("pending"),
    }] : []),
  ];

  const deliveryAddress = order
    ? [order.del_address_1, order.del_address_2, order.del_address_3, order.del_address_4, order.del_address_5]
        .filter(Boolean)
        .join(", ")
    : null;

  if (loading) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="flex flex-1 min-h-0">
          <DashboardSidebar />
          <main className="flex-1 overflow-auto p-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-96 w-full" />
          </main>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="flex flex-1 min-h-0">
          <DashboardSidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center space-y-3">
              <p className="text-destructive font-medium">{error ?? "Order not found"}</p>
              <Button variant="outline" onClick={() => navigate("/orders")}>Back to Orders</Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">

          {/* Header */}
          <div className="bg-card border-b border-border px-6 py-5">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
              <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">Dashboard</button>
              <ChevronRight className="w-3 h-3" />
              <button onClick={() => navigate("/orders")} className="hover:text-foreground transition-colors">Orders</button>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground font-medium">{order.order_number ?? orderId}</span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                {/* Title row */}
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                    Order {order.order_number ?? "—"}
                  </h1>
                  {/* Status badge — clickable dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        disabled={updatingStatus}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize cursor-pointer hover:opacity-80 transition-opacity",
                          statusStyle(order.status),
                        )}
                      >
                        {statusIcon(order.status)}
                        {order.status}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {["pending", "processing", "injected", "failed"].map((s) => (
                        <DropdownMenuItem key={s} className="capitalize" onClick={() => handleStatusChange(s)}>
                          {s}
                          {s === order.status && <span className="ml-auto text-xs text-muted-foreground">current</span>}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Sub-info chips */}
                <div className="flex items-center gap-5 flex-wrap">
                  {customerName && (
                    <button
                      onClick={() => order.account_ref && navigate(`/customers/${order.account_ref}`)}
                      className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    >
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground/70">Customer:</span>
                      <span className="text-primary text-xs font-medium hover:underline">{customerName}</span>
                    </button>
                  )}
                  {order.account_ref && <DetailChip icon={Receipt} label="Account" value={order.account_ref} />}
                  {order.customer_order_number && <DetailChip icon={ClipboardList} label="PO Number" value={order.customer_order_number} />}
                  {order.order_date && (
                    <DetailChip
                      icon={Clock}
                      label="Order Date"
                      value={new Date(order.order_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    />
                  )}
                  {order.method && <DetailChip icon={Package} label="Method" value={order.method} />}
                  {order.del_name && <DetailChip icon={MapPin} label="Deliver To" value={order.del_name} />}
                </div>

                {/* Sage error banner */}
                {order.sage_error && (
                  <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-destructive/5 border border-destructive/20 rounded-lg max-w-2xl">
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive leading-relaxed">{order.sage_error}</p>
                  </div>
                )}
              </div>

              <Button variant="outline" onClick={() => navigate("/orders")} className="gap-2 shrink-0">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            </div>
          </div>

          {/* Body — two-column */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">

              {/* Quick Actions */}
              <div className="bg-card rounded-lg border border-border p-5">
                <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Quick Actions
                </h2>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action) =>
                    action.isDropdown ? (
                      <DropdownMenu key={action.type}>
                        <DropdownMenuTrigger asChild>
                          <button className="flex flex-col items-center gap-2 px-4 py-3 rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors min-w-[80px]">
                            <action.icon className="w-5 h-5" />
                            <span className="text-[11px] font-medium text-center leading-tight">{action.label}</span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {["pending", "processing", "injected", "failed"].map((s) => (
                            <DropdownMenuItem key={s} className="capitalize" onClick={() => handleStatusChange(s)}>
                              {s}
                              {s === order.status && <span className="ml-auto text-xs text-muted-foreground">current</span>}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <button
                        key={action.type}
                        onClick={action.onClick}
                        className={cn(
                          "flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-colors min-w-[80px]",
                          action.variant === "warning"
                            ? "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                            : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <action.icon className="w-5 h-5" />
                        <span className="text-[11px] font-medium text-center leading-tight">{action.label}</span>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Package className="w-4 h-4" /> Order Items
                    <span className="text-xs font-normal text-muted-foreground">({items.length} line{items.length !== 1 ? "s" : ""})</span>
                  </h2>
                </div>
                {items.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">No items found for this order.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="w-[120px]">Stock Code</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right w-[80px]">Ordered</TableHead>
                          <TableHead className="text-right w-[80px]">Allocated</TableHead>
                          <TableHead className="text-right w-[80px]">Delivered</TableHead>
                          <TableHead className="text-right w-[90px]">Outstanding</TableHead>
                          <TableHead className="text-right w-[90px]">Unit Price</TableHead>
                          <TableHead className="text-right w-[90px]">Net</TableHead>
                          <TableHead className="text-right w-[90px]">Gross</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => {
                          const outstanding = item.qty_yet_to_dispatch ?? ((item.qty_order ?? 0) - (item.qty_delivered ?? 0));
                          return (
                            <TableRow key={item.id} className="hover:bg-muted/30">
                              <TableCell className="font-mono text-xs text-muted-foreground">{item.stock_code ?? "—"}</TableCell>
                              <TableCell className="text-sm">{item.description ?? "—"}</TableCell>
                              <TableCell className="text-right font-mono text-sm">{fmtQty(item.qty_order)}</TableCell>
                              <TableCell className="text-right font-mono text-sm">{fmtQty(item.qty_allocated)}</TableCell>
                              <TableCell className="text-right font-mono text-sm">{fmtQty(item.qty_delivered)}</TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                <span className={outstanding > 0 ? "text-amber-700 font-semibold" : "text-muted-foreground"}>
                                  {fmtQty(outstanding)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm text-muted-foreground">{fmt(item.unit_price)}</TableCell>
                              <TableCell className="text-right font-mono text-sm">{fmt(item.net_amount)}</TableCell>
                              <TableCell className="text-right font-mono text-sm font-semibold">{fmt(item.gross_amount)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {/* Items total footer */}
                {items.length > 0 && (
                  <div className="px-5 py-3 border-t border-border bg-muted/30 flex justify-end gap-8 text-sm">
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">Net</span>
                      <span className="font-mono font-medium">{fmt(order.items_net)}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="font-mono font-medium">{fmt(order.items_tax)}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground font-semibold">Total</span>
                      <span className="font-mono font-bold text-foreground">{fmt(order.items_gross)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Activity */}
              <div className="bg-card rounded-lg border border-border p-5">
                <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Activity
                </h2>
                {activity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity recorded.</p>
                ) : (
                  <div className="space-y-4">
                    {activity.map((a) => (
                      <div key={a.id} className="flex gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                          a.type === "note" ? "bg-primary/10" : "bg-muted",
                        )}>
                          {a.type === "note" ? <ClipboardList className="w-3.5 h-3.5 text-primary" /> :
                           a.type === "injection" ? <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" /> :
                           a.type === "sync" ? <Activity className="w-3.5 h-3.5 text-muted-foreground" /> :
                           <Clock className="w-3.5 h-3.5 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm", a.type === "injection" && a.description.includes("failed") ? "text-destructive" : "text-foreground")}>
                            {a.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(a.timestamp).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-6">

              {/* Order Summary */}
              <div className="bg-card rounded-lg border border-border p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Receipt className="w-4 h-4" /> Order Summary
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Number</span>
                    <span className="font-mono font-medium">{order.order_number ?? "—"}</span>
                  </div>
                  {order.customer_order_number && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">PO Number</span>
                      <span className="font-mono font-medium">{order.customer_order_number}</span>
                    </div>
                  )}
                  {order.order_date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order Date</span>
                      <span>{new Date(order.order_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                  )}
                  {order.method && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Method</span>
                      <Badge variant="outline" className="text-xs capitalize">{order.method}</Badge>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full capitalize border", statusStyle(order.status))}>
                      {order.status}
                    </span>
                  </div>
                  <div className="border-t border-border pt-3 space-y-2">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Net</span>
                      <span className="font-mono">{fmt(order.items_net)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>VAT</span>
                      <span className="font-mono">{fmt(order.items_tax)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-foreground border-t border-border pt-2">
                      <span>Total</span>
                      <span className="font-mono text-base">{fmt(order.items_gross)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Details */}
              <div className="bg-card rounded-lg border border-border p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Delivery Details
                </h3>
                {order.del_name || deliveryAddress ? (
                  <div className="space-y-1 text-sm">
                    {order.del_name && <p className="font-medium text-foreground">{order.del_name}</p>}
                    {deliveryAddress && (
                      <p className="text-muted-foreground text-xs leading-relaxed">{deliveryAddress}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No delivery details recorded.</p>
                )}
              </div>

              {/* Injection Details */}
              {(order.last_injection_attempt || order.last_synced_at) && (
                <div className="bg-card rounded-lg border border-border p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Sage / Injection
                  </h3>
                  <div className="space-y-2 text-sm">
                    {order.last_injection_attempt && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-muted-foreground shrink-0">Last attempt</span>
                        <span className="text-right text-xs">
                          {new Date(order.last_injection_attempt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    )}
                    {order.last_synced_at && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-muted-foreground shrink-0">Last synced</span>
                        <span className="text-right text-xs">
                          {new Date(order.last_synced_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    )}
                    {order.sage_error && (
                      <div className="mt-2 p-2.5 bg-destructive/5 border border-destructive/20 rounded-lg">
                        <p className="text-xs text-destructive font-medium flex items-center gap-1 mb-1">
                          <AlertTriangle className="w-3 h-3" /> Injection Error
                        </p>
                        <p className="text-xs text-destructive/80 leading-relaxed">{order.sage_error}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Customer link */}
              {customerName && (
                <Button
                  variant="outline"
                  className="w-full gap-2 text-xs"
                  onClick={() => order.account_ref && navigate(`/customers/${order.account_ref}`)}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  View {customerName}
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Add Note Dialog */}
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Type your note here..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={4}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteOpen(false)}>Cancel</Button>
            <Button onClick={handleAddNote} disabled={!noteText.trim()} className="gap-1.5">
              <Send className="w-4 h-4" /> Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderDetailPage;
