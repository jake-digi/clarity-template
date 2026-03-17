import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ReportResult {
  columns: string[];
  rows: string[][];
  summary: { label: string; value: string | number }[];
}

async function runOrdersSummary(): Promise<ReportResult> {
  const { data: orders, error } = await supabase
    .from("sales_orders")
    .select("id, order_number, order_date, customer_order_number, status, items_gross, items_net, account_ref, name, del_name, created_at")
    .order("order_date", { ascending: false })
    .limit(2000);
  if (error) throw error;
  const rows = orders ?? [];

  const statusCounts: Record<string, number> = {};
  let totalGross = 0;
  let totalNet = 0;
  rows.forEach((r) => {
    statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;
    totalGross += Number(r.items_gross) || 0;
    totalNet += Number(r.items_net) || 0;
  });

  const fmt = (n: number) =>
    `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return {
    columns: ["Order Number", "Order Date", "Customer Ref", "Status", "Gross", "Net", "Account Ref", "Customer Name", "Delivery Name", "Created"],
    rows: rows.map((r) => [
      r.order_number ?? "—",
      r.order_date ? new Date(r.order_date).toLocaleDateString() : "—",
      r.customer_order_number ?? "—",
      r.status ?? "—",
      fmt(Number(r.items_gross) || 0),
      fmt(Number(r.items_net) || 0),
      r.account_ref ?? "—",
      r.name ?? "—",
      r.del_name ?? "—",
      r.created_at ? new Date(r.created_at).toLocaleString() : "—",
    ]),
    summary: [
      { label: "Total Orders", value: rows.length },
      ...Object.entries(statusCounts).map(([k, v]) => ({ label: `Status: ${k}`, value: v })),
      { label: "Total Gross", value: fmt(totalGross) },
      { label: "Total Net", value: fmt(totalNet) },
    ],
  };
}

async function runCustomerRevenueReport(): Promise<ReportResult> {
  const { data: customers, error } = await supabase
    .from("customer_stats")
    .select("name, account_ref, total_orders, total_spent, last_order_date")
    .order("total_spent", { ascending: false });
  if (error) throw error;
  const rows = customers ?? [];

  const fmt = (n: number) =>
    `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const totalSpent = rows.reduce((s, r) => s + (Number(r.total_spent) || 0), 0);
  const totalOrders = rows.reduce((s, r) => s + (Number(r.total_orders) || 0), 0);

  return {
    columns: ["Customer Name", "Account Ref", "Total Orders", "Total Spent", "Last Order Date"],
    rows: rows.map((r) => [
      r.name ?? "—",
      r.account_ref ?? "—",
      String(r.total_orders ?? 0),
      fmt(Number(r.total_spent) || 0),
      r.last_order_date ? new Date(r.last_order_date).toLocaleDateString() : "—",
    ]),
    summary: [
      { label: "Total Customers", value: rows.length },
      { label: "Total Orders (all customers)", value: totalOrders },
      { label: "Total Revenue", value: fmt(totalSpent) },
    ],
  };
}

async function runOrderLineItemsReport(): Promise<ReportResult> {
  const { data: items, error: itemsErr } = await supabase
    .from("sales_order_items")
    .select("order_id, stock_code, description, qty_order, qty_delivered, unit_price, net_amount, tax_amount, gross_amount")
    .order("order_id", { ascending: false })
    .limit(2000);
  if (itemsErr) throw itemsErr;
  const rows = items ?? [];

  const orderIds = [...new Set(rows.map((r) => r.order_id).filter(Boolean))];
  const { data: orders } = orderIds.length
    ? await supabase.from("sales_orders").select("id, order_number").in("id", orderIds)
    : { data: [] };
  const orderMap = Object.fromEntries((orders ?? []).map((o) => [o.id, o.order_number]));

  const fmt = (n: number) =>
    `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const totalGross = rows.reduce((s, r) => s + (Number(r.gross_amount) || 0), 0);
  const totalQty = rows.reduce((s, r) => s + (Number(r.qty_order) || 0), 0);

  return {
    columns: ["Order Number", "Stock Code", "Description", "Qty Ordered", "Qty Delivered", "Unit Price", "Net", "Tax", "Gross"],
    rows: rows.map((r) => [
      orderMap[r.order_id] ?? r.order_id ?? "—",
      r.stock_code ?? "—",
      (r.description ?? "—").slice(0, 50),
      String(r.qty_order ?? 0),
      String(r.qty_delivered ?? 0),
      fmt(Number(r.unit_price) || 0),
      fmt(Number(r.net_amount) || 0),
      fmt(Number(r.tax_amount) || 0),
      fmt(Number(r.gross_amount) || 0),
    ]),
    summary: [
      { label: "Total Line Items", value: rows.length },
      { label: "Total Qty Ordered", value: totalQty.toLocaleString("en-GB") },
      { label: "Total Gross Value", value: fmt(totalGross) },
    ],
  };
}

const reportRunners: Record<string, () => Promise<ReportResult>> = {
  r1: runOrdersSummary,
  r2: runCustomerRevenueReport,
  r3: runOrderLineItemsReport,
};

export function useReportData(reportId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["report-data", reportId],
    enabled: !!reportId && enabled,
    queryFn: async (): Promise<ReportResult> => {
      const runner = reportRunners[reportId!];
      if (!runner) throw new Error(`Unknown report: ${reportId}`);
      return runner();
    },
  });
}
