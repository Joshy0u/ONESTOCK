import { Boxes, Package, Warehouse, Store } from "lucide-react";
import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/PageHeader";
import { KpiCard } from "../components/KpiCard";
import { InventoryTable } from "../components/InventoryTable";
import { money, num } from "../lib/format";

export function InventoryPage() {
  const { scopedInventory, locations, scope } = useApp();

  const dcRows = scopedInventory.filter((r) => r.location_type === "DC");
  const storeRows = scopedInventory.filter((r) => r.location_type === "STORE");
  const value = (rows: typeof scopedInventory) => rows.reduce((s, r) => s + r.value_at_cost, 0);
  const scopeName =
    scope === "all" ? "All locations" : (locations.find((l) => l.location_id === scope)?.name ?? "Location");

  return (
    <>
      <PageHeader
        crumbs={["Inventory", "Positions"]}
        title="Inventory"
        status={
          <span className="status-line">
            <span className="dot dot--ok" />
            {num(scopedInventory.length)} stock positions · {scopeName}
          </span>
        }
      />

      <section className="kpi-grid">
        <KpiCard
          icon={<Boxes size={18} />}
          label="Stock positions"
          value={num(scopedInventory.length)}
          sub="Product × location pairs"
          aside={<span>{num(new Set(scopedInventory.map((r) => r.product_id)).size)} products</span>}
        />
        <KpiCard
          icon={<Package size={18} />}
          label="Value at cost"
          value={money(value(scopedInventory), 0)}
          sub="Preferred supplier price"
        />
        <KpiCard
          icon={<Warehouse size={18} />}
          label="In distribution centres"
          value={money(value(dcRows), 0)}
          sub={`${num(dcRows.length)} positions`}
        />
        <KpiCard
          icon={<Store size={18} />}
          label="In stores"
          value={money(value(storeRows), 0)}
          sub={`${num(storeRows.length)} positions`}
        />
      </section>

      <InventoryTable rows={scopedInventory} pageSize={12} title="All positions" />
    </>
  );
}
