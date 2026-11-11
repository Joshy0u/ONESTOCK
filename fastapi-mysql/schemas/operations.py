from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class InventoryPosition(BaseModel):
    inventory_id: int
    product_id: int
    product: str
    sku: str
    category: str
    department: str
    unit: str
    location_id: int
    location: str
    location_type: str
    quantity_on_hand: float
    reorder_point: float
    reorder_quantity: float
    unit_cost: float
    list_price: Optional[float] = None
    value_at_cost: float
    stock_status: str                      # IN_STOCK | LOW_STOCK | OUT_OF_STOCK
    last_updated: datetime

    class Config:
        from_attributes = True


class OverviewKpis(BaseModel):
    total_products: int
    categories: int
    locations: int
    stocked_positions: int
    stocked_products: int
    inventory_value: float
    units_on_hand: float
    low_stock: int
    out_of_stock: int
    open_purchase_orders: int
    transfers_in_transit: int
    last_movement_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ActivityItem(BaseModel):
    movement_id: int
    movement_date: datetime
    movement_type: str                     # RECEIPT | SALE | TRANSFER_IN | TRANSFER_OUT | ADJUSTMENT_IN | ADJUSTMENT_OUT
    direction: str                         # IN | OUT
    product_id: int
    product: str
    unit: str
    location_id: int
    location: str
    quantity: float
    reference_id: Optional[int] = None

    class Config:
        from_attributes = True


class LocationSummary(BaseModel):
    location_id: int
    name: str
    location_type: str                     # DC | STORE
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    total_storage_space: Optional[float] = None
    skus_stocked: int
    units_on_hand: float
    value_on_hand: float
    low_stock: int
    out_of_stock: int

    class Config:
        from_attributes = True
