import { useMemo } from "react";
import { AlertTriangle, PackageX, Truck, Wallet } from "lucide-react";
import { api } from "../api/client";
import { useApi } from "../hooks/useApi";
import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/PageHeader";
import { KpiCard } from "../components/KpiCard";
import { Card } from "../components/Card";
import { DataTable, type Column } from "../components/DataTable";
import { StatusChip } from "../components/StatusChip";
import { money, num, qty, statusLabel } from "../lib/format";
import type { InventoryPosition, ReplenishmentRecommendation } from "../types";

const recColumns: Column<ReplenishmentRecommendation>[] = [
  { key: "location", header: "Location", render: (r) => r.location },
  {
    key: "product",
    header: "Product",
    render: (r) => (
      <div className="cell-stack">
        <span className="cell-title">{r.product}</span>
        <span className="cell-sub">{r.unit}</span>
      </div>
    ),
  },
  {
    key: "on_hand",
    header: "On hand",
    align: "right",
    render: (r) => (
      <div className="cell-stack cell-stack--right">
        <span className="cell-title">{qty(r.quantity_on_hand)}</span>
        <span className="cell-sub">Min. {qty(r.reorder_point)}</span>
      </div>
    ),
  },
  { key: "inbound", header: "Inbound", align: "right", render: (r) => qty(r.inbound) },
  { key: "action", header: "Recommended", render: (r) => <StatusChip status={r.recommended_action} /> },
  { key: "suggested", header: "Suggested qty", align: "right", render: (r) => qty(r.suggested_qty) },
  { key: "supplier", header: "Preferred supplier", render: (r) => r.preferred_supplier ?? "—" },
  {
    key: "cost",
    header: "Est. cost",
    align: "right",
    render: (r) => (r.est_purchase_cost == null ? "—" : money(r.est_purchase_cost)),
  },
];

const lowColumns: Column<InventoryPosition>[] = [
  {
    key: "product",
    header: "Product",
    render: (r) => (
      <div className="cell-stack">
        <span className="cell-title">{r.product}</span>
        <span className="cell-sub">{r.sku}</span>
      </div>
    ),
  },
  { key: "location", header: "Location", render: (r) => r.location },
  {
    key: "available",
    header: "Available",
    align: "right",
    render: (r) => (
      <div className="cell-stack cell-stack--right">
        <span className="cell-title">
          {qty(r.quantity_on_hand)} <span className="cell-unit">{r.unit}</span>
        </span>
        <span className="cell-sub">Min. {qty(r.reorder_point)}</span>
      </div>
    ),
  },
  { key: "reorder_qty", header: "Reorder qty", align: "right", render: (r) => qty(r.reorder_quantity) },
  {
    key: "status",
    header: "Status",
    render: (r) => <StatusChip status={r.stock_status} label={statusLabel(r.stock_status)} />,
  },
  { key: "cost", header: "Unit cost", align: "right", render: (r) => money(r.unit_cost) },
];

export function ReorderAlertsPage() {
  const { scopedInventory, scope, locations } = useApp();
  const recs = useApi(() => api.replenishments());

  const scopeName = scope === "all" ? null : (locations.find((l) => l.location_id === scope)?.name ?? null);
  const scopedRecs = useMemo(() => {
    const rows = recs.data ?? [];
    return scopeName ? rows.filter((r) => r.location === scopeName) : rows;
  }, [recs.data, scopeName]);

  const attention = useMemo(
    () =>
      scopedInventory
        .filter((r) => r.stock_status !== "IN_STOCK")
        .sort((a, b) => a.quantity_on_hand / a.reorder_point - b.quantity_on_hand / b.reorder_point),
    [scopedInventory],
  );
  const low = attention.filter((r) => r.stock_status === "LOW_STOCK").length;
  const out = attention.filter((r) => r.stock_status === "OUT_OF_STOCK").length;
  const inbound = scopedRecs.reduce((s, r) => s + r.inbound, 0);
  const estCost = scopedRecs.reduce((s, r) => s + (r.est_purchase_cost ?? 0), 0);

  return (
    <>
      <PageHeader
        crumbs={["Operations", "Reorder alerts"]}
        title="Reorder alerts"
        status={
          <span className="status-line">
            <span className={`dot ${attention.length ? "dot--warn" : "dot--ok"}`} />
            {attention.length} positions at or below their reorder point
          </span>
        }
      />

      <section className="kpi-grid">
        <KpiCard icon={<AlertTriangle size={18} />} label="Low stock" value={num(low)} sub="Below reorder point" tone={low ? "warn" : "default"} />
        <KpiCard icon={<PackageX size={18} />} label="Out of stock" value={num(out)} sub="Zero on hand" tone={out ? "danger" : "default"} />
        <KpiCard icon={<Truck size={18} />} label="Inbound already ordered" value={qty(inbound)} sub="Units on open POs" />
        <KpiCard icon={<Wallet size={18} />} label="Estimated purchase cost" value={money(estCost, 0)} sub="For recommended buys" />
      </section>

      <Card title="Replenishment recommendations" count={scopedRecs.length} subtitle="Top positions that need action, netting inbound purchase orders against the reorder point.">
        <DataTable
          columns={recColumns}
          rows={scopedRecs}
          rowKey={(r) => `${r.location}-${r.product}`}
          loading={recs.loading}
          error={recs.error}
          emptyText="Nothing to reorder right now."
        />
      </Card>

      <Card title="Positions below reorder point" count={attention.length}>
        <DataTable columns={lowColumns} rows={attention} rowKey={(r) => r.inventory_id} emptyText="Every position is above its reorder point." />
      </Card>
    </>
  );
}
