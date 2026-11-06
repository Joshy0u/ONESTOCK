from pydantic import BaseModel 
from typing import Optional, List


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