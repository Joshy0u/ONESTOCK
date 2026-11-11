import type {
  ActivityItem,
  AgingStockRow,
  Carrier,
  InventoryPosition,
  LocationSummary,
  NetworkPositionRow,
  OverviewKpis,
  Product,
  ProductDemandRow,
  PurchaseBacklogRow,
  ReplenishmentRecommendation,
  SellThroughRow,
  SupplierScorecardRow,
  SupplyRiskRow,
  ThreeWayMatchRow,
  TransferPipelineRow,
} from "../types";

// "/api" is proxied by Vite to FastAPI on 127.0.0.1:8000 (see vite.config.ts).
const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`OneStock API ${response.status} on ${path}`);
  }
  return (await response.json()) as T;
}

const withDate = (path: string, asOfDate?: string) => (asOfDate ? `${path}?as_of_date=${asOfDate}` : path);

export const api = {
  // operational data
  overview: () => get<OverviewKpis>("/analytics/overview"),
  inventory: () => get<InventoryPosition[]>("/inventory/"),
  locations: () => get<LocationSummary[]>("/locations/"),
  recentActivity: (limit = 12) => get<ActivityItem[]>(`/analytics/recent-activity?limit=${limit}`),
  carriers: () => get<Carrier[]>("/carriers/"),
  products: () => get<Product[]>("/products/"),

  // the ten core reports
  networkPosition: (limit = 15) => get<NetworkPositionRow[]>(`/analytics/network-position?limit=${limit}`),
  replenishments: (asOfDate?: string) => get<ReplenishmentRecommendation[]>(withDate("/analytics/replenishments", asOfDate)),
  agingStock: (asOfDate?: string) => get<AgingStockRow[]>(withDate("/analytics/aging-stock", asOfDate)),
  productDemand: () => get<ProductDemandRow[]>("/analytics/product-demand"),
  purchaseBacklog: (asOfDate?: string) => get<PurchaseBacklogRow[]>(withDate("/analytics/purchase-backlog", asOfDate)),
  sellThrough: () => get<SellThroughRow[]>("/analytics/sell-through"),
  supplierScorecard: (asOfDate?: string) => get<SupplierScorecardRow[]>(withDate("/analytics/supplier-scorecard", asOfDate)),
  supplyRisk: () => get<SupplyRiskRow[]>("/analytics/supply-risk"),
  threeWayMatch: () => get<ThreeWayMatchRow[]>("/analytics/three-way-match"),
  transferPipeline: (asOfDate?: string) => get<TransferPipelineRow[]>(withDate("/analytics/transfer-pipeline", asOfDate)),
};
