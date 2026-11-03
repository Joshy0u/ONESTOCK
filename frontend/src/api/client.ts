import { catalog } from "../mocks/data";
import type { Catalog, Product } from "../types";

const useMocks = import.meta.env.VITE_USE_MOCKS !== "false";
const apiBase = import.meta.env.VITE_API_BASE ?? "/api";

async function tryLiveProducts(): Promise<Product[] | null> {
  try {
    const response = await fetch(`${apiBase}/products/`);
    if (!response.ok) return null;
    const rows = (await response.json()) as Array<Record<string, unknown>>;
    return rows.map((row, index) => ({
      product_id: Number(row.product_id ?? index + 1),
      name: String(row.name ?? "Unnamed"),
      sku: String(row.sku ?? ""),
      category: String(row.category ?? "Uncategorized"),
      uom: String(row.uom ?? "EA"),
      list_price: Number(row.list_price ?? 0),
      special_notes: row.special_notes ? String(row.special_notes) : undefined,
    }));
  } catch {
    return null;
  }
}

export async function loadCatalog(): Promise<Catalog> {
  if (useMocks) return catalog;
  const liveProducts = await tryLiveProducts();
  if (!liveProducts) return catalog;
  return { ...catalog, products: liveProducts };
}
