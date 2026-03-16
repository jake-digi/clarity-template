import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Search,
  Tag,
  Building2,
  PoundSterling,
  Percent,
  ArrowLeft,
} from "lucide-react";

const db = supabase as any;

type PricingCustomer = {
  id: string;
  name: string;
  account_ref: string;
  price_list_id: string | null;
  price_list_ref: string | null;
  price_list_name: string | null;
};

type PriceListItemRow = {
  stock_code: string;
  description: string | null;
  base_price: number | null;
  list_price: number;
  currency: string;
};

type OverrideRow = {
  stock_code: string;
  description: string | null;
  base_price: number | null;
  list_price: number | null;
  override_price: number;
};

const money = (n: number | null | undefined) =>
  n == null
    ? "—"
    : `£${Number(n).toLocaleString("en-GB", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

const PricingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [customers, setCustomers] = useState<PricingCustomer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "with" | "without">("all");

  const [selected, setSelected] = useState<PricingCustomer | null>(null);
  const [items, setItems] = useState<PriceListItemRow[]>([]);
  const [overrides, setOverrides] = useState<OverrideRow[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Load base customer + price list associations
  useEffect(() => {
    const load = async () => {
      setLoadingCustomers(true);
      setError(null);
      try {
        const [{ data: custs, error: cErr }, { data: lists }] = await Promise.all([
          db.from("customers").select("id, name, account_ref, price_list_id, price_list_ref"),
          db.from("price_lists").select("id, name, external_ref"),
        ]);
        if (cErr) throw cErr;

        const listById: Record<string, string> = {};
        const listByRef: Record<string, string> = {};
        for (const pl of lists ?? []) {
          if (pl.id) listById[pl.id] = pl.name ?? pl.external_ref ?? pl.id;
          if (pl.external_ref) listByRef[pl.external_ref] = pl.name ?? pl.external_ref;
        }

        const mapped: PricingCustomer[] = (custs ?? []).map((c: any) => ({
          id: c.id,
          name: c.name,
          account_ref: c.account_ref,
          price_list_id: c.price_list_id,
          price_list_ref: c.price_list_ref,
          price_list_name:
            (c.price_list_id && listById[c.price_list_id]) ||
            (c.price_list_ref && listByRef[c.price_list_ref]) ||
            null,
        }));

        setCustomers(mapped);

        // Optional: preselect customer via ?account=XYZ
        const accountFromQuery = searchParams.get("account");
        if (accountFromQuery) {
          const found = mapped.find(
            (c) => c.account_ref === accountFromQuery
          );
          if (found) setSelected(found);
        }
      } catch (e: any) {
        setError(e.message ?? "Failed to load pricing data");
      } finally {
        setLoadingCustomers(false);
      }
    };
    load();
  }, [searchParams]);

  const filteredCustomers = useMemo(() => {
    const q = search.toLowerCase();
    return customers.filter((c) => {
      if (filter === "with" && !c.price_list_name) return false;
      if (filter === "without" && c.price_list_name) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.account_ref.toLowerCase().includes(q) ||
        (c.price_list_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [customers, search, filter]);

  // Load detailed price list/overrides when selection changes
  useEffect(() => {
    const loadDetail = async () => {
      if (!selected) {
        setItems([]);
        setOverrides([]);
        return;
      }
      setLoadingDetail(true);
      try {
        // Price list items (if any)
        let listItems: PriceListItemRow[] = [];
        if (selected.price_list_id) {
          const { data: rawItems } = await db
            .from("price_list_items")
            .select(
              "product_stock_code, price, currency, products(description, sales_price)"
            )
            .eq("price_list_id", selected.price_list_id)
            .order("product_stock_code", { ascending: true });

          listItems =
            rawItems?.map((row: any) => ({
              stock_code: row.product_stock_code,
              description: row.products?.description ?? null,
              base_price: row.products?.sales_price ?? null,
              list_price: Number(row.price ?? 0),
              currency: row.currency ?? "GBP",
            })) ?? [];
        }

        // Trade price overrides for this specific customer
        const { data: rawOverrides } = await db
          .from("trade_prices")
          .select("stock_code, price")
          .eq("account_ref", selected.account_ref);

        let overridesRows: OverrideRow[] = [];
        if (rawOverrides && rawOverrides.length) {
          // Join to products and (if available) price list items
          const stockCodes = rawOverrides.map((o: any) => o.stock_code);
          const [{ data: products }, { data: listItemsForOverrides }] =
            await Promise.all([
              db
                .from("products")
                .select("stock_code, description, sales_price")
                .in("stock_code", stockCodes),
              selected.price_list_id
                ? db
                    .from("price_list_items")
                    .select("product_stock_code, price")
                    .eq("price_list_id", selected.price_list_id)
                    .in("product_stock_code", stockCodes)
                : Promise.resolve({ data: [] }),
            ]);

          const prodByCode: Record<string, any> = {};
          for (const p of products ?? []) prodByCode[p.stock_code] = p;

          const listByCode: Record<string, number> = {};
          for (const li of listItemsForOverrides ?? []) {
            listByCode[li.product_stock_code] = Number(li.price ?? 0);
          }

          overridesRows = rawOverrides.map((o: any) => {
            const code = o.stock_code;
            const p = prodByCode[code];
            return {
              stock_code: code,
              description: p?.description ?? null,
              base_price: p?.sales_price ?? null,
              list_price:
                listByCode[code] != null ? Number(listByCode[code]) : null,
              override_price: Number(o.price ?? 0),
            };
          });
        }

        setItems(listItems);
        setOverrides(overridesRows);
      } finally {
        setLoadingDetail(false);
      }
    };
    loadDetail();
  }, [selected]);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Page header */}
          <div className="border-b border-border bg-card px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                    Pricing
                  </h1>
                  {!loadingCustomers && (
                    <span className="text-sm font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                      {customers.length} customers
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Customer-specific price lists and overrides.
                </p>
              </div>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => navigate("/catalogue")}
              >
                <Tag className="w-4 h-4" />
                Go to catalogue
              </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[280px] max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer, account ref, or price list…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={filter}
                onValueChange={(v: "all" | "with" | "without") => setFilter(v)}
              >
                <SelectTrigger className="w-[190px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All customers</SelectItem>
                  <SelectItem value="with">With price list</SelectItem>
                  <SelectItem value="without">Without price list</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 min-h-0">
            {/* Customers column */}
            <div className="bg-card border border-border rounded-lg flex flex-col min-h-0">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Customers
                </h2>
                {selected && (
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    onClick={() => setSelected(null)}
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Clear selection
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-auto">
                {loadingCustomers ? (
                  <div className="p-5 space-y-2.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <Skeleton key={i} className="h-9 w-full" />
                    ))}
                  </div>
                ) : error ? (
                  <div className="p-6 text-sm text-destructive text-center">
                    {error}
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="p-6 text-sm text-muted-foreground text-center">
                    No customers match your filters.
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-card">
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Price List</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((c) => {
                        const active = selected?.id === c.id;
                        return (
                          <TableRow
                            key={c.id}
                            className={`cursor-pointer hover:bg-muted/40 ${
                              active ? "bg-muted/60" : ""
                            }`}
                            onClick={() => setSelected(c)}
                          >
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {c.account_ref}
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {c.name}
                            </TableCell>
                            <TableCell className="text-xs">
                              {c.price_list_name ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium">
                                  {c.price_list_name}
                                </span>
                              ) : (
                                <span className="text-[11px] text-muted-foreground">
                                  None
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>

            {/* Detail column */}
            <div className="lg:col-span-2 bg-card border border-border rounded-lg flex flex-col min-h-0">
              {!selected ? (
                <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground px-6 text-center">
                  Choose a customer on the left to view their price list and any
                  customer-specific overrides.
                </div>
              ) : (
                <>
                  <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold text-foreground">
                          {selected.name}
                        </h2>
                        <span className="text-xs font-mono text-muted-foreground">
                          {selected.account_ref}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Price list:{" "}
                        {selected.price_list_name ? (
                          <span className="font-medium text-foreground">
                            {selected.price_list_name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/80">
                            none (uses base prices)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col min-h-0">
                    <Tabs defaultValue="list" className="flex-1 flex flex-col min-h-0">
                      <div className="px-5 pt-3 pb-2 border-b border-border flex items-center justify-between">
                        <TabsList className="h-8">
                          <TabsTrigger value="list" className="text-xs">
                            Price list
                          </TabsTrigger>
                          <TabsTrigger value="overrides" className="text-xs">
                            Customer overrides
                          </TabsTrigger>
                        </TabsList>
                        {loadingDetail && (
                          <span className="text-[11px] text-muted-foreground">
                            Loading…
                          </span>
                        )}
                      </div>

                      <TabsContent
                        value="list"
                        className="flex-1 flex flex-col min-h-0"
                      >
                        <div className="flex-1 overflow-auto">
                          {selected.price_list_name == null ? (
                            <div className="p-6 text-sm text-muted-foreground">
                              This customer is not assigned to a price list. They
                              will use base product prices plus any explicit
                              customer overrides.
                            </div>
                          ) : items.length === 0 ? (
                            <div className="p-6 text-sm text-muted-foreground">
                              No items found on this price list.
                            </div>
                          ) : (
                            <Table>
                              <TableHeader className="sticky top-0 z-10 bg-card">
                                <TableRow>
                                  <TableHead>Code</TableHead>
                                  <TableHead>Description</TableHead>
                                  <TableHead className="text-right">
                                    Base
                                  </TableHead>
                                  <TableHead className="text-right">
                                    List
                                  </TableHead>
                                  <TableHead className="text-right">
                                    Diff
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {items.map((row) => {
                                  const base = row.base_price ?? null;
                                  const list = row.list_price;
                                  const diff =
                                    base != null ? list - base : null;
                                  const pct =
                                    base && base !== 0
                                      ? (diff! / base) * 100
                                      : null;
                                  return (
                                    <TableRow
                                      key={row.stock_code}
                                      className="hover:bg-muted/40"
                                    >
                                      <TableCell className="font-mono text-xs text-muted-foreground">
                                        {row.stock_code}
                                      </TableCell>
                                      <TableCell className="text-xs">
                                        {row.description ?? "—"}
                                      </TableCell>
                                      <TableCell className="font-mono text-xs text-muted-foreground text-right">
                                        {money(base)}
                                      </TableCell>
                                      <TableCell className="font-mono text-xs text-foreground text-right">
                                        {money(list)}
                                      </TableCell>
                                      <TableCell className="text-xs text-right">
                                        {diff == null ? (
                                          "—"
                                        ) : (
                                          <span
                                            className={
                                              diff < 0
                                                ? "text-emerald-600"
                                                : diff > 0
                                                ? "text-red-500"
                                                : "text-muted-foreground"
                                            }
                                          >
                                            {diff < 0 ? "−" : diff > 0 ? "+" : ""}
                                            {money(Math.abs(diff))}
                                            {pct != null && (
                                              <>
                                                {" "}
                                                <span className="inline-flex items-center gap-0.5">
                                                  <Percent className="w-3 h-3 inline-block align-middle" />
                                                  {pct.toFixed(1)}%
                                                </span>
                                              </>
                                            )}
                                          </span>
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

                      <TabsContent
                        value="overrides"
                        className="flex-1 flex flex-col min-h-0"
                      >
                        <div className="flex-1 overflow-auto">
                          {overrides.length === 0 ? (
                            <div className="p-6 text-sm text-muted-foreground">
                              This customer has no explicit trade price
                              overrides.
                            </div>
                          ) : (
                            <Table>
                              <TableHeader className="sticky top-0 z-10 bg-card">
                                <TableRow>
                                  <TableHead>Code</TableHead>
                                  <TableHead>Description</TableHead>
                                  <TableHead className="text-right">
                                    Base
                                  </TableHead>
                                  <TableHead className="text-right">
                                    List
                                  </TableHead>
                                  <TableHead className="text-right">
                                    Override
                                  </TableHead>
                                  <TableHead className="text-right">
                                    Diff vs base
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {overrides.map((row) => {
                                  const base = row.base_price ?? null;
                                  const override = row.override_price;
                                  const diff =
                                    base != null ? override - base : null;
                                  const pct =
                                    base && base !== 0
                                      ? (diff! / base) * 100
                                      : null;
                                  return (
                                    <TableRow
                                      key={row.stock_code}
                                      className="hover:bg-muted/40"
                                    >
                                      <TableCell className="font-mono text-xs text-muted-foreground">
                                        {row.stock_code}
                                      </TableCell>
                                      <TableCell className="text-xs">
                                        {row.description ?? "—"}
                                      </TableCell>
                                      <TableCell className="font-mono text-xs text-muted-foreground text-right">
                                        {money(base)}
                                      </TableCell>
                                      <TableCell className="font-mono text-xs text-muted-foreground text-right">
                                        {row.list_price != null
                                          ? money(row.list_price)
                                          : "—"}
                                      </TableCell>
                                      <TableCell className="font-mono text-xs text-foreground text-right">
                                        {money(override)}
                                      </TableCell>
                                      <TableCell className="text-xs text-right">
                                        {diff == null ? (
                                          "—"
                                        ) : (
                                          <span
                                            className={
                                              diff < 0
                                                ? "text-emerald-600"
                                                : diff > 0
                                                ? "text-red-500"
                                                : "text-muted-foreground"
                                            }
                                          >
                                            {diff < 0 ? "−" : diff > 0 ? "+" : ""}
                                            {money(Math.abs(diff))}
                                            {pct != null && (
                                              <>
                                                {" "}
                                                <Percent className="w-3 h-3 inline-block align-middle" />
                                                {pct.toFixed(1)}%
                                              </>
                                            )}
                                          </span>
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
                    </Tabs>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PricingPage;

