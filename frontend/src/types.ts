// Types mirror the FastAPI response models in fastapi-mysql/schemas/*.py

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
export type LocationType = "DC" | "STORE";

export interface InventoryPosition {
  inventory_id: number;
  product_id: number;
  product: string;
  sku: string;
  category: string;
  department: string;
  unit: string;
  location_id: number;
  location: string;
  location_type: LocationType;
  quantity_on_hand: number;
  reorder_point: number;
  reorder_quantity: number;
  unit_cost: number;
  list_price: number | null;
  value_at_cost: number;
  stock_status: StockStatus;
  last_updated: string;
}

export interface OverviewKpis {
  total_products: number;
  categories: number;
  locations: number;
  stocked_positions: number;
  stocked_products: number;
  inventory_value: number;
  units_on_hand: number;
  low_stock: number;
  out_of_stock: number;
  open_purchase_orders: number;
  transfers_in_transit: number;
  last_movement_at: string | null;
}

export interface ActivityItem {
  movement_id: number;
  movement_date: string;
  movement_type: string;
  direction: "IN" | "OUT";
  product_id: number;
  product: string;
  unit: string;
  location_id: number;
  location: string;
  quantity: number;
  reference_id: number | null;
}

export interface LocationSummary {
  location_id: number;
  name: string;
  location_type: LocationType;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  total_storage_space: number | null;
  skus_stocked: number;
  units_on_hand: number;
  value_on_hand: number;
  low_stock: number;
  out_of_stock: number;
}

export interface Carrier {
  carrier_id: number;
  name: string;
  code: string;
  contact_phone: string | null;
}

export interface Product {
  product_id: number;
  name: string;
  sku: string;
  category_id: number;
  uom_id: number;
  list_price: number | null;
  special_notes: string | null;
}

// ---- analytics (the ten core report queries) ----

export interface NetworkPositionRow {
  product_id: number;
  product: string;
  unit: string;
  dc_on_hand: number;
  store_on_hand: number;
  in_transit: number;
  network_total: number;
  network_value: number;
  stores_stocking_it: number;
}

export interface ReplenishmentRecommendation {
  location: string;
  product: string;
  unit: string;
  quantity_on_hand: number;
  reorder_point: number;
  inbound: number;
  recommended_action: string;
  suggested_qty: number;
  preferred_supplier: string | null;
  est_purchase_cost: number | null;
}

export interface AgingStockRow {
  location: string;
  product: string;
  unit: string;
  quantity_on_hand: number;
  last_received: string | null;
  last_sent_or_sold: string | null;
  days_without_movement: number;
  value_at_cost: number;
  pct_of_network_value: number;
}

export interface ProductDemandRow {
  abc_class: string;
  products: number;
  pct_of_products: number;
  spend: number;
  pct_of_spend: number;
}

export interface PurchaseBacklogRow {
  po_id: number;
  supplier: string;
  deliver_to: string;
  po_status: string;
  expected_date: string;
  product: string;
  unit: string;
  quantity_ordered: number;
  qty_received: number;
  qty_outstanding: number;
  value_outstanding: number;
  days_overdue: number;
}

export interface SellThroughRow {
  store: string;
  product: string;
  unit: string;
  units_in: number;
  units_sold: number;
  sell_through_pct: number | null;
  quantity_on_hand: number;
  revenue: number;
}

export interface SupplierScorecardRow {
  supplier: string;
  pos_due: number;
  pos_delivered: number;
  on_time_pct: number | null;
  fill_rate_pct: number;
  promised_lead_days: number;
  actual_lead_days: number | null;
  avg_days_late: number | null;
  rating: string;
}

export interface SupplyRiskRow {
  product_id: number;
  product: string;
  department: string;
  preferred_supplier: string;
  backup_supplier: string;
  backup_premium_pct: number | null;
  backup_extra_lead_days: number | null;
  backup_candidates_in_dept: number | null;
  received_spend: number;
  risk_level: string;
}

export interface ThreeWayMatchRow {
  po_id: number;
  supplier: string;
  po_status: string;
  value_ordered: number;
  value_received: number;
  value_posted_to_ledger: number;
  value_still_open: number;
  match_status: string;
}

export interface TransferPipelineRow {
  transfer_order_id: number;
  from_location: string;
  to_location: string;
  status: string;
  carrier: string | null;
  tracking_number: string | null;
  product_lines: number;
  lines_fully_received: number;
  value_shipped: number;
  ship_date: string | null;
  delivery_date: string | null;
  hours_on_road: number | null;
  delivery_check: string;
}
