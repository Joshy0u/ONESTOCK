import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  Download,
  Package,
  PackageX,
  Plus,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/PageHeader";
import { KpiCard } from "../components/KpiCard";
import { Card } from "../components/Card";
import { InventoryTable } from "../components/InventoryTable";
import { dateTime, money, num, qty, timeOfDay } from "../lib/format";
import type { ActivityItem } from "../types";

const ACTIVITY_LABEL: Record<string, string> = {
  RECEIPT: "Goods received",
  SALE: "Store sale",
  TRANSFER_IN: "Transfer received",
  TRANSFER_OUT: "Transfer shipped",
  ADJUSTMENT_IN: "Stock adjusted up",
  ADJUSTMENT_OUT: "Stock adjusted down",
};

function ActivityIcon({ type }: { type: string }) {
  if (type === "RECEIPT") return <ArrowDownLeft size={16} />;
  if (type === "SALE") return <ShoppingBag size={16} />;
  if (type.startsWith("TRANSFER")) return <ArrowLeftRight size={16} />;
  return <ArrowUpRight size={16} />;
}

function activityDetail(item: ActivityItem) {
  const ref = item.reference_id ? ` · ref ${item.reference_id}` : "";
  return `${item.product} · ${qty(item.quantity)} ${item.unit} at ${item.location}${ref}`;
}

export function OverviewPage() {
  const navigate = useNavigate();
  const { overview, scopedInventory, activity, locations, scope, syncedAt, loading, error } = useApp();

  const scopeLabel =
    scope === "all" ? "all locations" : (locations.find((l) => l.location_id === scope)?.name ?? "this location");

  const low = scopedInventory.filter((r) => r.stock_status === "LOW_STOCK").length;
  const out = scopedInventory.filter((r) => r.stock_status === "OUT_OF_STOCK").length;
  const value = scopedInventory.reduce((sum, r) => sum + r.value_at_cost, 0);
  const units = scopedInventory.reduce((sum, r) => sum + r.quantity_on_hand, 0);
  const products = new Set(scopedInventory.map((r) => r.product_id)).size;
  const categories = new Set(scopedInventory.map((r) => r.department)).size;

  return (
    <>
      <PageHeader
        crumbs={["Inventory", "Overview"]}
        title="Overview"
        status={
          error ? (
            <span className="status-line status-line--error">
              <span className="dot dot--danger" /> {error}
            </span>
          ) : (
            <span className="status-line">
              <span className="dot dot--ok" />
              {loading ? "Syncing with OneStock API…" : `Everything up to date. Last synced today at ${timeOfDay(syncedAt)}.`}
            </span>
          )
        }
        actions={
          <>
            <button className="btn btn--secondary" type="button" onClick={() => navigate("/purchase-orders")}>
              <Download size={16} /> Receive goods · Select PO
            </button>
            <button className="btn btn--primary" type="button" onClick={() => navigate("/reports?tab=sell-through")}>
              <Plus size={16} /> Record store sale
            </button>
          </>
        }
      />

      <section className="kpi-grid">
        <KpiCard
          icon={<Package size={18} />}
          label="Total products"
          value={num(scope === "all" ? (overview?.total_products ?? products) : products)}
          sub={`Across ${scope === "all" ? (overview?.categories ?? categories) : categories} categories`}
          aside={<span>{num(products)} stocked</span>}
        />
        <KpiCard
          icon={<Wallet size={18} />}
          label="Inventory value"
          value={money(value, 0)}
          sub="At current cost price"
          aside={<span>{num(Math.round(units))} units on hand</span>}
        />
        <KpiCard
          icon={<AlertTriangle size={18} />}
          label="Low stock"
          value={num(low)}
          sub="Below reorder point"
          tone={low > 0 ? "warn" : "default"}
          aside={
            <Link to="/reorder" className="link">
              Review items <ArrowRight size={14} />
            </Link>
          }
        />
        <KpiCard
          icon={<PackageX size={18} />}
          label="Out of stock"
          value={num(out)}
          sub="Replenishment needed"
          tone={out > 0 ? "danger" : "default"}
          aside={
            <Link to="/inventory?status=OUT_OF_STOCK" className="link">
              View products <ArrowRight size={14} />
            </Link>
          }
        />
      </section>

      <InventoryTable rows={scopedInventory} pageSize={7} title="Inventory" />

      <section className="two-col">
        <Card tone="beige" className="reorder-attention">
          <h3 className="card__title card__title--icon">
            <PackageX size={18} /> Reorder attention
          </h3>
          <p className="muted">
            {low} products are running low and {out} are out of stock across {scopeLabel}. Create a purchase order from
            the alert to replenish stock.
          </p>
          <div className="reorder-attention__footer">
            <button className="btn btn--secondary" type="button" onClick={() => navigate("/reorder")}>
              <ArrowUpRight size={16} /> Create PO from alert
            </button>
            <span className="muted small">{low + out} items need attention</span>
          </div>
        </Card>

        <Card
          title="Recent activity"
          actions={
            <Link to="/reports?tab=transfer-pipeline" className="link">
              View all activity <ArrowRight size={14} />
            </Link>
          }
        >
          <ul className="activity">
            {activity.length === 0 ? <li className="muted">No stock movements recorded yet.</li> : null}
            {activity.slice(0, 6).map((item) => (
              <li key={item.movement_id} className="activity__row">
                <span className={`activity__icon activity__icon--${item.direction.toLowerCase()}`}>
                  <ActivityIcon type={item.movement_type} />
                </span>
                <span className="activity__label">{ACTIVITY_LABEL[item.movement_type] ?? item.movement_type}</span>
                <span className="activity__detail">{activityDetail(item)}</span>
                <span className="activity__time">{dateTime(item.movement_date)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </>
  );
}
