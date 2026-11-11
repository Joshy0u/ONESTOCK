from pydantic import BaseModel 
from typing import Optional, List
from datetime import date, datetime


class AgingStock(BaseModel):
    location: str
    product: str
    unit: str
    quantity_on_hand: float
    last_received: Optional[date] = None        # NULL when the item has never had an IN movement
    last_sent_or_sold: Optional[date] = None    # NULL when the item has never had an OUT movement
    days_without_movement: int
    value_at_cost: float
    pct_of_network_value: float

    class Config:
        from_attributes = True

class NetworkPositionResponse(BaseModel):
    product_id: int
    product: str
    unit: str
    dc_on_hand: float
    store_on_hand: float
    in_transit: float
    network_total: float
    network_value: float
    stores_stocking_it: int

    class Config:
        from_attributes = True


class ProductDemand(BaseModel):
    abc_class: str
    products: int
    pct_of_products: float
    spend: float
    pct_of_spend: float
    class Config:
        from_attributes = True



class PurchaseBacklog(BaseModel):
    po_id: int
    supplier: str
    deliver_to: str
    po_status: str
    expected_date: date
    product: str
    unit: str
    quantity_ordered: float
    qty_received: float
    qty_outstanding: float
    value_outstanding: float
    days_overdue: int

    class Config:
        from_attributes = True

class ReplenishmentRecommendations(BaseModel):
    location: str
    product: str
    unit: str
    quantity_on_hand: float
    reorder_point: float
    inbound: float
    recommended_action: str
    suggested_qty: float
    preferred_supplier: Optional[str] = None
    est_purchase_cost: Optional[float] = None

    class Config:
        from_attributes = True 

class StoreSellThrough(BaseModel):
    store: str
    product: str
    unit: str
    units_in: float
    units_sold: float
    sell_through_pct: Optional[float] = None    # NULL when units_in is 0 (division guarded by NULLIF)
    quantity_on_hand: float
    revenue: float

    class Config:
        from_attributes = True

class SupplierScorecard(BaseModel):
    supplier: str
    pos_due: int
    pos_delivered: int
    on_time_pct: Optional[float] = None         # NULL until the supplier has delivered at least one PO
    fill_rate_pct: float
    promised_lead_days: float
    actual_lead_days: Optional[float] = None    # NULL until the supplier has delivered at least one PO
    avg_days_late: Optional[float] = None       # NULL until the supplier has delivered at least one PO
    rating: str

    class Config:
        from_attributes = True

class SupplyRiskResponse(BaseModel):
    product_id: int
    product: str
    department: str
    preferred_supplier: str
    backup_supplier: str                  # Uses COALESCE(..., '(none)') so it defaults to string, not null
    backup_premium_pct: Optional[float] = None
    backup_extra_lead_days: Optional[int] = None
    backup_candidates_in_dept: Optional[int] = None # Only populated via CASE WHEN bk.product_id IS NULL
    received_spend: float
    risk_level: str

    class Config:
        from_attributes = True

class ThreeWayMatchResponse(BaseModel):
    po_id: int
    supplier: str
    po_status: str
    value_ordered: float
    value_received: float
    value_posted_to_ledger: float
    value_still_open: float
    match_status: str

    class Config:
        from_attributes = True

class TransferPipelineResponse(BaseModel):
    transfer_order_id: int
    from_location: str
    to_location: str
    status: str
    carrier: Optional[str] = None
    tracking_number: Optional[str] = None
    product_lines: int
    lines_fully_received: int
    value_shipped: float
    ship_date: Optional[datetime] = None        # ship_date / delivery_date carry a time of day, so datetime not date
    delivery_date: Optional[datetime] = None
    hours_on_road: Optional[float] = None
    delivery_check: str

    class Config:
        from_attributes = True
