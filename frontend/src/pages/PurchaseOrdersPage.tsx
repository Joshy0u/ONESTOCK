import { useSearchParams } from "react-router-dom";
import { ClipboardList, Receipt, ShieldAlert, Truck } from "lucide-react";
import { api } from "../api/client";
import { useApi } from "../hooks/useApi";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { Tabs } from "../components/Tabs";
import { DataTable, type Column } from "../components/DataTable";
import { StatusChip } from "../components/StatusChip";
import { money, num, pct, qty, shortDate, statusLabel } from "../lib/format";
import type { PurchaseBacklogRow, SupplierScorecardRow, SupplyRiskRow, ThreeWayMatchRow } from "../types";

const TABS = [
  { id: "backlog", label: "Open backlog" },
  { id: "match", label: "Three-way match" },
  { id: "scorecard", label: "Supplier scorecard" },
  { id: "risk", label: "Supply risk" },
];

const backlogColumns: Column<PurchaseBacklogRow>[] = [
  { key: "po", header: "PO", render: (r) => <span className="mono">PO-{String(r.po_id).padStart(4, "0")}</span> },
  { key: "supplier", header: "Supplier", render: (r) => r.supplier },
  { key: "deliver_to", header: "Deliver to", render: (r) => r.deliver_to },
  { key: "status", header: "Status", render: (r) => <StatusChip status={r.po_status} label={statusLabel(r.po_status)} /> },
  { key: "expected", header: "Expected", render: (r) => shortDate(r.expected_date) },
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
  { key: "ordered", header: "Ordered", align: "right", render: (r) => qty(r.quantity_ordered) },
  { key: "received", header: "Received", align: "right", render: (r) => qty(r.qty_received) },
  { key: "outstanding", header: "Outstanding", align: "right", render: (r) => qty(r.qty_outstanding) },
  { key: "value", header: "Value open", align: "right", render: (r) => money(r.value_outstanding) },
  {
    key: "overdue",
    header: "Days overdue",
    align: "right",
    render: (r) => (r.days_overdue > 0 ? <span className="text-danger">{r.days_overdue}</span> : "—"),
  },
];

const matchColumns: Column<ThreeWayMatchRow>[] = [
  { key: "po", header: "PO", render: (r) => <span className="mono">PO-{String(r.po_id).padStart(4, "0")}</span> },
  { key: "supplier", header: "Supplier", render: (r) => r.supplier },
  { key: "status", header: "PO status", render: (r) => <StatusChip status={r.po_status} label={statusLabel(r.po_status)} /> },
  { key: "ordered", header: "Ordered", align: "right", render: (r) => money(r.value_ordered) },
  { key: "received", header: "Received", align: "right", render: (r) => money(r.value_received) },
  { key: "ledger", header: "Posted to ledger", align: "right", render: (r) => money(r.value_posted_to_ledger) },
  { key: "open", header: "Still open", align: "right", render: (r) => money(r.value_still_open) },
  { key: "match", header: "Match", render: (r) => <StatusChip status={r.match_status} /> },
];

const scorecardColumns: Column<SupplierScorecardRow>[] = [
  { key: "supplier", header: "Supplier", render: (r) => r.supplier },
  { key: "rating", header: "Rating", render: (r) => <StatusChip status={r.rating} /> },
  { key: "due", header: "POs due", align: "right", render: (r) => num(r.pos_due) },
  { key: "delivered", header: "Delivered", align: "right", render: (r) => num(r.pos_delivered) },
  { key: "on_time", header: "On time", align: "right", render: (r) => pct(r.on_time_pct) },
  { key: "fill", header: "Fill rate", align: "right", render: (r) => pct(r.fill_rate_pct) },
  { key: "promised", header: "Promised lead", align: "right", render: (r) => `${qty(r.promised_lead_days)} d` },
  { key: "actual", header: "Actual lead", align: "right", render: (r) => (r.actual_lead_days == null ? "—" : `${qty(r.actual_lead_days)} d`) },
  { key: "late", header: "Avg days late", align: "right", render: (r) => (r.avg_days_late == null ? "—" : qty(r.avg_days_late)) },
];

const riskColumns: Column<SupplyRiskRow>[] = [
  {
    key: "product",
    header: "Product",
    render: (r) => (
      <div className="cell-stack">
        <span className="cell-title">{r.product}</span>
        <span className="cell-sub">{r.department}</span>
      </div>
    ),
  },
  { key: "risk", header: "Risk", render: (r) => <StatusChip status={r.risk_level} /> },
  { key: "preferred", header: "Preferred supplier", render: (r) => r.preferred_supplier },
  { key: "backup", header: "Backup supplier", render: (r) => r.backup_supplier },
  { key: "premium", header: "Backup premium", align: "right", render: (r) => (r.backup_premium_pct == null ? "—" : pct(r.backup_premium_pct)) },
  { key: "lead", header: "Extra lead days", align: "right", render: (r) => (r.backup_extra_lead_days == null ? "—" : num(r.backup_extra_lead_days)) },
  { key: "candidates", header: "Candidates in dept", align: "right", render: (r) => (r.backup_candidates_in_dept == null ? "—" : num(r.backup_candidates_in_dept)) },
  { key: "spend", header: "Received spend", align: "right", render: (r) => money(r.received_spend) },
];

function BacklogTab() {
  const q = useApi(() => api.purchaseBacklog());
  return (
    <Card title="Open purchase order lines" count={q.data?.length} subtitle="Submitted or partially received lines with quantity still outstanding, most overdue first.">
      <DataTable columns={backlogColumns} rows={q.data ?? []} rowKey={(r) => `${r.po_id}-${r.product}`} loading={q.loading} error={q.error} emptyText="No open purchase order lines." />
    </Card>
  );
}

function MatchTab() {
  const q = useApi(() => api.threeWayMatch());
  return (
    <Card title="Three-way match" count={q.data?.length} subtitle="Ordered vs received vs posted to the ledger. Mismatches sort to the top.">
      <DataTable columns={matchColumns} rows={q.data ?? []} rowKey={(r) => r.po_id} loading={q.loading} error={q.error} emptyText="No purchase orders found." />
    </Card>
  );
}

function ScorecardTab() {
  const q = useApi(() => api.supplierScorecard());
  return (
    <Card title="Supplier scorecard" count={q.data?.length} subtitle="On-time and fill-rate performance for every supplier with a PO due.">
      <DataTable columns={scorecardColumns} rows={q.data ?? []} rowKey={(r) => r.supplier} loading={q.loading} error={q.error} emptyText="No supplier activity yet." />
    </Card>
  );
}

function RiskTab() {
  const q = useApi(() => api.supplyRisk());
  return (
    <Card title="Supply risk" count={q.data?.length} subtitle="Highest-spend products ranked by how exposed they are to a single supplier.">
      <DataTable columns={riskColumns} rows={q.data ?? []} rowKey={(r) => r.product_id} loading={q.loading} error={q.error} emptyText="No purchased products found." />
    </Card>
  );
}

export function PurchaseOrdersPage() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get("tab")) ? (params.get("tab") as string) : "backlog";

  return (
    <>
      <PageHeader
        crumbs={["Operations", "Purchase orders"]}
        title="Purchase orders and Receiving"
        status={
          <span className="status-line">
            <span className="dot dot--ok" /> Backlog, receiving match, supplier performance and sourcing risk.
          </span>
        }
        actions={
          <div className="icon-row muted small">
            <ClipboardList size={16} /> <Receipt size={16} /> <Truck size={16} /> <ShieldAlert size={16} />
          </div>
        }
      />
      <Tabs tabs={TABS} active={tab} onChange={(id) => setParams({ tab: id })} />
      {tab === "backlog" ? <BacklogTab /> : null}
      {tab === "match" ? <MatchTab /> : null}
      {tab === "scorecard" ? <ScorecardTab /> : null}
      {tab === "risk" ? <RiskTab /> : null}
    </>
  );
}
