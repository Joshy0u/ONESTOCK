import { useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { useApi } from "../hooks/useApi";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { Tabs } from "../components/Tabs";
import { DataTable, type Column } from "../components/DataTable";
import { StatusChip } from "../components/StatusChip";
import { dateTime, money, num, pct, qty, shortDate, statusLabel } from "../lib/format";
import type { AgingStockRow, NetworkPositionRow, ProductDemandRow, SellThroughRow, TransferPipelineRow } from "../types";

const TABS = [
  { id: "network-position", label: "Network position" },
  { id: "aging-stock", label: "Aging stock" },
  { id: "abc", label: "ABC demand" },
  { id: "sell-through", label: "Store sell-through" },
  { id: "transfer-pipeline", label: "Transfer pipeline" },
];

const networkColumns: Column<NetworkPositionRow>[] = [
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
  { key: "dc", header: "DC on hand", align: "right", render: (r) => qty(r.dc_on_hand) },
  { key: "store", header: "Store on hand", align: "right", render: (r) => qty(r.store_on_hand) },
  { key: "transit", header: "In transit", align: "right", render: (r) => qty(r.in_transit) },
  { key: "total", header: "Network total", align: "right", render: (r) => qty(r.network_total) },
  { key: "value", header: "Network value", align: "right", render: (r) => money(r.network_value) },
  { key: "stores", header: "Stores stocking", align: "right", render: (r) => num(r.stores_stocking_it) },
];

const agingColumns: Column<AgingStockRow>[] = [
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
  { key: "qty", header: "On hand", align: "right", render: (r) => qty(r.quantity_on_hand) },
  { key: "received", header: "Last received", render: (r) => shortDate(r.last_received) },
  { key: "sent", header: "Last sent or sold", render: (r) => shortDate(r.last_sent_or_sold) },
  { key: "days", header: "Days idle", align: "right", render: (r) => <span className={r.days_without_movement >= 45 ? "text-danger" : ""}>{num(r.days_without_movement)}</span> },
  { key: "value", header: "Value at cost", align: "right", render: (r) => money(r.value_at_cost) },
  { key: "share", header: "Share of network", align: "right", render: (r) => pct(r.pct_of_network_value) },
];

const abcColumns: Column<ProductDemandRow>[] = [
  { key: "class", header: "Class", render: (r) => <StatusChip status={`CLASS_${r.abc_class}`} label={`Class ${r.abc_class}`} /> },
  { key: "products", header: "Products", align: "right", render: (r) => num(r.products) },
  { key: "pct_products", header: "Share of products", align: "right", render: (r) => pct(r.pct_of_products) },
  { key: "spend", header: "Spend", align: "right", render: (r) => money(r.spend) },
  { key: "pct_spend", header: "Share of spend", align: "right", render: (r) => pct(r.pct_of_spend) },
];

const sellColumns: Column<SellThroughRow>[] = [
  { key: "store", header: "Store", render: (r) => r.store },
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
  { key: "in", header: "Units in", align: "right", render: (r) => qty(r.units_in) },
  { key: "sold", header: "Units sold", align: "right", render: (r) => qty(r.units_sold) },
  { key: "pct", header: "Sell-through", align: "right", render: (r) => pct(r.sell_through_pct) },
  { key: "onhand", header: "On hand", align: "right", render: (r) => qty(r.quantity_on_hand) },
  { key: "revenue", header: "Revenue", align: "right", render: (r) => money(r.revenue) },
];

const transferColumns: Column<TransferPipelineRow>[] = [
  { key: "id", header: "Transfer", render: (r) => <span className="mono">TO-{String(r.transfer_order_id).padStart(4, "0")}</span> },
  { key: "route", header: "Route", render: (r) => `${r.from_location} → ${r.to_location}` },
  { key: "status", header: "Status", render: (r) => <StatusChip status={r.status} label={statusLabel(r.status)} /> },
  { key: "carrier", header: "Carrier", render: (r) => r.carrier ?? "—" },
  { key: "tracking", header: "Tracking", render: (r) => <span className="mono">{r.tracking_number ?? "—"}</span> },
  { key: "lines", header: "Lines", align: "right", render: (r) => `${r.lines_fully_received}/${r.product_lines}` },
  { key: "value", header: "Value shipped", align: "right", render: (r) => money(r.value_shipped) },
  { key: "shipped", header: "Shipped", render: (r) => dateTime(r.ship_date) },
  { key: "hours", header: "Hours on road", align: "right", render: (r) => (r.hours_on_road == null ? "—" : qty(r.hours_on_road)) },
  { key: "check", header: "Delivery", render: (r) => <StatusChip status={r.delivery_check} /> },
];

function NetworkTab() {
  const q = useApi(() => api.networkPosition(50));
  return (
    <Card title="Network inventory position" count={q.data?.length} subtitle="Where each product sits across DCs, stores and in-transit stock, highest network value first.">
      <DataTable columns={networkColumns} rows={q.data ?? []} rowKey={(r) => r.product_id} loading={q.loading} error={q.error} emptyText="No inventory found." />
    </Card>
  );
}
function AgingTab() {
  const q = useApi(() => api.agingStock());
  return (
    <Card title="Aging stock" count={q.data?.length} subtitle="Positions with no movement for 30+ days, by value tied up.">
      <DataTable columns={agingColumns} rows={q.data ?? []} rowKey={(r) => `${r.location}-${r.product}`} loading={q.loading} error={q.error} emptyText="Nothing is sitting idle." />
    </Card>
  );
}
function AbcTab() {
  const q = useApi(() => api.productDemand());
  return (
    <Card title="ABC demand classification" count={q.data?.length} subtitle="Products grouped by their share of purchase spend.">
      <DataTable columns={abcColumns} rows={q.data ?? []} rowKey={(r) => r.abc_class} loading={q.loading} error={q.error} emptyText="No purchase history." />
    </Card>
  );
}
function SellTab() {
  const q = useApi(() => api.sellThrough());
  return (
    <Card title="Store sell-through" count={q.data?.length} subtitle="Units sold against units received per store and product.">
      <DataTable columns={sellColumns} rows={q.data ?? []} rowKey={(r) => `${r.store}-${r.product}`} loading={q.loading} error={q.error} emptyText="No store sales recorded." />
    </Card>
  );
}
function TransferTab() {
  const q = useApi(() => api.transferPipeline());
  return (
    <Card title="Transfer pipeline" count={q.data?.length} subtitle="DC-to-store transfers with their shipment and carrier status.">
      <DataTable columns={transferColumns} rows={q.data ?? []} rowKey={(r) => r.transfer_order_id} loading={q.loading} error={q.error} emptyText="No transfers found." />
    </Card>
  );
}

export function ReportsPage() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get("tab")) ? (params.get("tab") as string) : "network-position";
  return (
    <>
      <PageHeader
        crumbs={["Insights", "Reports"]}
        title="Reports"
        status={
          <span className="status-line">
            <span className="dot dot--ok" /> Core analytics served live from the OneStock API.
          </span>
        }
      />
      <Tabs tabs={TABS} active={tab} onChange={(id) => setParams({ tab: id })} />
      {tab === "network-position" ? <NetworkTab /> : null}
      {tab === "aging-stock" ? <AgingTab /> : null}
      {tab === "abc" ? <AbcTab /> : null}
      {tab === "sell-through" ? <SellTab /> : null}
      {tab === "transfer-pipeline" ? <TransferTab /> : null}
    </>
  );
}
