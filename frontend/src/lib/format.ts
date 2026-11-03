import type { InventoryRow, Location, Product } from "../types";

export function money(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function qty(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function locName(locations: Location[], id: number | null) {
  return locations.find((l) => l.location_id === id)?.name ?? "—";
}

export function productName(products: Product[], id: number) {
  return products.find((p) => p.product_id === id)?.name ?? `#${id}`;
}

export function stockStatus(row: InventoryRow) {
  if (row.quantity_on_hand <= 0) return "out" as const;
  if (row.quantity_on_hand <= row.reorder_point) return "low" as const;
  return "ok" as const;
}

export function statusTone(status: string) {
  const value = status.toUpperCase();
  if (["RECEIVED", "COMPLETED", "OK"].includes(value)) return "ok";
  if (["SUBMITTED", "IN_TRANSIT", "PARTIALLY_RECEIVED", "DRAFT", "LOW"].includes(value)) return "warn";
  if (["CANCELLED", "OUT", "OVERDUE"].includes(value)) return "danger";
  return "neutral";
}
