export type Persona = "hq" | "purchasing" | "dc" | "store";

export type LocationType = "DC" | "STORE";

export type Location = {
  location_id: number;
  name: string;
  location_type: LocationType;
  city: string;
  state: string;
};

export type Product = {
  product_id: number;
  name: string;
  sku: string;
  category: string;
  uom: string;
  list_price: number;
  special_notes?: string;
};

export type InventoryRow = {
  inventory_id: number;
  product_id: number;
  location_id: number;
  quantity_on_hand: number;
  reorder_point: number;
  reorder_quantity: number;
};

export type StockMovement = {
  movement_id: number;
  product_id: number;
  location_id: number;
  movement_type: string;
  direction: "IN" | "OUT";
  quantity: number;
  movement_date: string;
  reference_id: number | null;
};

export type Supplier = {
  supplier_id: number;
  name: string;
  country: string;
  contact_email: string;
};

export type ProductSupplier = {
  product_id: number;
  supplier_id: number;
  supplier_sku: string;
  lead_time_days: number;
  supplier_price: number;
  is_preferred: boolean;
};

export type PurchaseOrder = {
  po_id: number;
  supplier_id: number;
  dest_location_id: number;
  order_date: string;
  expected_date: string | null;
  status: string;
};

export type PoLine = {
  po_id: number;
  product_id: number;
  quantity_ordered: number;
  unit_cost: number;
  quantity_received: number;
};

export type TransferOrder = {
  transfer_order_id: number;
  from_location_id: number;
  to_location_id: number;
  status: string;
  order_date: string;
  ship_date: string | null;
  delivery_date: string | null;
};

export type TransferLine = {
  transfer_order_id: number;
  product_id: number;
  quantity_requested: number;
  quantity_shipped: number;
  quantity_received: number;
};

export type Shipment = {
  shipment_id: number;
  transfer_order_id: number | null;
  carrier: string;
  tracking_number: string;
  status: string;
  ship_date: string | null;
  estimated_arrival: string | null;
  actual_arrival: string | null;
};

export type StoreSale = {
  store_sale_id: number;
  location_id: number;
  cashier: string;
  sale_timestamp: string;
  total_amount: number;
};

export type StoreSaleLine = {
  store_sale_id: number;
  product_id: number;
  quantity_sold: number;
  unit_price: number;
  discount_applied: number;
};

export type SalesHistory = {
  product_id: number;
  location_id: number;
  period_start: string;
  period_end: string;
  units_sold: number;
};

export type DemandForecast = {
  forecast_id: number;
  product_id: number;
  location_id: number;
  forecast_date: string;
  forecast_quantity: number;
  confidence_level: number;
};

export type FinancialTransaction = {
  txn_id: number;
  txn_type: "REVENUE" | "EXPENSE";
  category: string;
  amount: number;
  txn_date: string;
  location_id: number | null;
  ref_doc_type: string | null;
  ref_doc_id: number | null;
  description: string;
};

export type Catalog = {
  locations: Location[];
  products: Product[];
  inventory: InventoryRow[];
  movements: StockMovement[];
  suppliers: Supplier[];
  productSuppliers: ProductSupplier[];
  purchaseOrders: PurchaseOrder[];
  poLines: PoLine[];
  transfers: TransferOrder[];
  transferLines: TransferLine[];
  shipments: Shipment[];
  sales: StoreSale[];
  saleLines: StoreSaleLine[];
  salesHistory: SalesHistory[];
  forecasts: DemandForecast[];
  finance: FinancialTransaction[];
};
