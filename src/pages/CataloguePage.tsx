import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
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
  Search,
  Download,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type Product = {
  id: string;
  code: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  lastSync: string | null;
  imageUrl: string | null;
};

type SortField = "code" | "description" | "price" | "stock";
type SortDir = "asc" | "desc";

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const CataloguePage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("code");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, categoryFilter, pageSize]);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        q: debouncedSearch,
        category: categoryFilter,
      });

      const res = await fetch(
        `${baseUrl}/functions/v1/list-products?${params.toString()}`
      );
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error ?? "Failed to load products");
      }

      setProducts(json.products ?? []);
      setTotalCount(json.totalCount ?? 0);
      setCategories(json.categories ?? {});
    } catch (e: any) {
      setError(e.message ?? "Failed to load products");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch, categoryFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case "code":
        cmp = a.code.localeCompare(b.code);
        break;
      case "description":
        cmp = a.description.localeCompare(b.description);
        break;
      case "price":
        cmp = a.price - b.price;
        break;
      case "stock":
        cmp = a.stock - b.stock;
        break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const start = totalCount === 0 ? 0 : page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, totalCount);
  const totalPages = Math.ceil(totalCount / pageSize);

  const SortableHeader = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <TableHead>
      <button
        onClick={() => toggleSort(field)}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {children}
        <ArrowUpDown
          className={`w-3 h-3 ${
            sortField === field ? "text-primary" : "text-muted-foreground/50"
          }`}
        />
      </button>
    </TableHead>
  );

  const handleExport = async () => {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const params = new URLSearchParams({
      page: "0",
      pageSize: String(5000),
      q: debouncedSearch,
      category: categoryFilter,
    });
    const res = await fetch(
      `${baseUrl}/functions/v1/list-products?${params.toString()}`
    );
    const json = await res.json();
    if (!res.ok) return;
    const rows = [
      ["Code", "Description", "Category", "Price", "Stock"],
      ...(json.products ?? []).map((p: Product) => [
        p.code,
        p.description,
        p.category,
        p.price.toFixed(2),
        String(p.stock),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "catalogue.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b border-border bg-card px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                  Catalogue
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Product catalogue from the ordering platform
                </p>
              </div>
              <Button variant="outline" className="gap-2" onClick={handleExport}>
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[320px] max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by code or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={categoryFilter}
                onValueChange={(v) => setCategoryFilter(v)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {Object.entries(categories).map(([id, name]) => (
                    <SelectItem key={id} value={id}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="bg-card overflow-hidden">
              {isLoading ? (
                <div className="p-8 space-y-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : error ? (
                <div className="p-8 text-center text-destructive">
                  <p>Failed to load products.</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                      <SortableHeader field="code">Code</SortableHeader>
                      <SortableHeader field="description">
                        Description
                      </SortableHeader>
                      <TableHead>Category</TableHead>
                      <SortableHeader field="price">Price</SortableHeader>
                      <SortableHeader field="stock">Stock</SortableHeader>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedProducts.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No products found matching your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedProducts.map((p) => (
                        <TableRow
                          key={p.id}
                          className="hover:bg-muted/50 cursor-pointer"
                          onClick={() => navigate(`/products/${encodeURIComponent(p.code)}`)}
                        >
                          <TableCell className="font-mono text-sm">
                            {p.code}
                          </TableCell>
                          <TableCell className="text-sm">
                            {p.description}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {p.category}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            £{p.price.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {p.stock}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          {!error && (
            <div className="shrink-0 bg-card border-t border-border px-6 py-2.5 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {isLoading
                  ? "Loading…"
                  : `Showing ${start}–${end} of ${totalCount.toLocaleString()} products`}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Rows per page
                  </span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => {
                      setPageSize(Number(v));
                      setPage(0);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((s) => (
                        <SelectItem key={s} value={String(s)}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page === 0 || isLoading}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page >= totalPages - 1 || isLoading}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CataloguePage;

