import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, ChevronDown, Columns3, Search, SlidersHorizontal } from "lucide-react";
import { Card } from "./Card";
import { DataTable, type Column } from "./DataTable";
import { Pagination } from "./Pagination";
import { StatusChip } from "./StatusChip";
import { money, qty, statusLabel } from "../lib/format";
import type { InventoryPosition, StockStatus } from "../types";

type SortKey = "product" | "quantity_on_hand" | "value_at_cost";
const OPTIONAL_COLUMNS = ["sku", "category", "location", "value"] as const;
type OptionalColumn = (typeof OPTIONAL_COLUMNS)[number];
const COLUMN_LABEL: Record<OptionalColumn, string> = { sku: "SKU", category: "Category", location: "Location", value: "Value at cost" };

export function InventoryTable({ rows, pageSize: initialPageSize = 7, title = "Inventory" }: { rows: InventoryPosition[]; pageSize?: number; title?: string }) {
  const [params] = useSearchParams();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [location, setLocation] = useState("all");
  const [status, setStatus] = useState<StockStatus | "all">((params.get("status") as StockStatus | null) ?? "all");
  const [sortKey, setSortKey] = useState<SortKey>("product");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [visible, setVisible] = useState<Set<OptionalColumn>>(new Set(["sku", "category", "location"]));
  const [columnsOpen, setColumnsOpen] = useState(false);

  const departments = useMemo(() => Array.from(new Set(rows.map((r) => r.department))).sort(), [rows]);
  const locations = useMemo(() => Array.from(new Set(rows.map((r) => r.location))).sort(), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = rows.filter(
      (r) =>
        (department === "all" || r.department === department) &&
        (location === "all" || r.location === location) &&
        (status === "all" || r.stock_status === status) &&
        (!q || r.product.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)),
    );
    out.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "product") return a.product.localeCompare(b.product) * dir;
      return (a[sortKey] - b[sortKey]) * dir;
    });
    return out;
  }, [rows, search, department, location, status, sortKey, sortDir]);

  useEffect(() => setPage(1), [search, department, location, status, pageSize, rows]);

  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const sortBy = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "product" ? "asc" : "desc");
    }
  };

  const columns: Column<InventoryPosition>[] = [
    {
      key: "product",
      header: "Product name",
      onSort: () => sortBy("product"),
      sorted: sortKey === "product" ? sortDir : undefined,
      render: (r) => (
        <div className="product-cell">
          <span className="product-cell__icon">
            <Box size={16} />
          </span>
          <div className="cell-stack">
            <span className="cell-title">{r.product}</span>
            <span className="cell-sub">
              {r.category} · {r.unit}
            </span>
          </div>
        </div>
      ),
    },
    ...(visible.has("sku") ? [{ key: "sku", header: "SKU", render: (r: InventoryPosition) => <span className="mono">{r.sku}</span> }] : []),
    ...(visible.has("category") ? [{ key: "category", header: "Category", render: (r: InventoryPosition) => r.department }] : []),
    {
      key: "available",
      header: "Available",
      onSort: () => sortBy("quantity_on_hand"),
      sorted: sortKey === "quantity_on_hand" ? sortDir : undefined,
      render: (r) => (
        <div className="cell-stack">
          <span className="cell-title">
            {qty(r.quantity_on_hand)} <span className="cell-unit">{r.unit === "EA" ? "units" : r.unit}</span>
          </span>
          <span className="cell-sub">Min. {qty(r.reorder_point)}</span>
        </div>
      ),
    },
    { key: "status", header: "Status", render: (r) => <StatusChip status={r.stock_status} label={statusLabel(r.stock_status)} /> },
    ...(visible.has("location") ? [{ key: "location", header: "Location", render: (r: InventoryPosition) => r.location }] : []),
    ...(visible.has("value")
      ? [
          {
            key: "value",
            header: "Value at cost",
            align: "right" as const,
            onSort: () => sortBy("value_at_cost"),
            sorted: sortKey === "value_at_cost" ? sortDir : undefined,
            render: (r: InventoryPosition) => money(r.value_at_cost),
          },
        ]
      : []),
  ];

  return (
    <Card className="inventory-card">
      <header className="card__head">
        <h3 className="card__title">
          {title}
          <span className="pill pill--neutral">{rows.length.toLocaleString("en-US")} positions</span>
        </h3>
        <div className="columns-menu">
          <button className="btn btn--secondary" type="button" onClick={() => setColumnsOpen((o) => !o)}>
            <Columns3 size={16} /> Manage columns
          </button>
          {columnsOpen ? (
            <div className="popover">
              {OPTIONAL_COLUMNS.map((c) => (
                <label key={c} className="popover__row">
                  <input
                    type="checkbox"
                    checked={visible.has(c)}
                    onChange={(e) => {
                      const next = new Set(visible);
                      if (e.target.checked) next.add(c);
                      else next.delete(c);
                      setVisible(next);
                    }}
                  />
                  {COLUMN_LABEL[c]}
                </label>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      <div className="toolbar">
        <label className="search">
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products or SKU…" />
        </label>
        <label className="select-pill">
          <ChevronDown size={14} />
          <select value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="all">All categories</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="select-pill">
          <ChevronDown size={14} />
          <select value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="all">All locations</option>
            {locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <button
          className="btn btn--secondary"
          type="button"
          onClick={() => {
            setSearch("");
            setDepartment("all");
            setLocation("all");
            setStatus("all");
          }}
        >
          <SlidersHorizontal size={16} /> Filters
        </button>
        <span className="toolbar__spacer" />
        <label className="select-pill">
          <ChevronDown size={14} />
          <select value={status} onChange={(e) => setStatus(e.target.value as StockStatus | "all")}>
            <option value="all">Stock status</option>
            <option value="IN_STOCK">In stock</option>
            <option value="LOW_STOCK">Low stock</option>
            <option value="OUT_OF_STOCK">Out of stock</option>
          </select>
        </label>
      </div>

      <DataTable columns={columns} rows={pageRows} rowKey={(r) => r.inventory_id} selectable emptyText="No positions match these filters." />
      <Pagination page={page} pageSize={pageSize} total={filtered.length} noun="products" onPage={setPage} onPageSize={setPageSize} />
    </Card>
  );
}
