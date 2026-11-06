from pydantic import BaseModel 
from typing import Optional, List
from datetime import date, datetime


class AgingStock(BaseModel):
    location: str
    product: str
    code: str
    quantity_on_hand: float
    last_received: date
    last_sent_or_sold: date
    value_at_cost: int
    pct_of_network_value: int 

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
    location: str
    status: str
    expected_date: date
    product: str
    unit: str
    quantity_ordered: int
    unit_cost: float
    qty_received: float
    class Config:
        from_attributes = True



class ReplentishmentRecomendations(BaseModel):
    location: str
    product: str
    unit: str
    quantity_on_hand: float
    reorder_point: float
    inbound: float
    recommended_action: str
    suggested_qty: float
    preferred_supplier: Optional[str]
    est_purchase_cost: Optional[float]

    class Config:
        from_attributes = True 