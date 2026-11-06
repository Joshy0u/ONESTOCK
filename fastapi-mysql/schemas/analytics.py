from pydantic import BaseModel 
from typing import Optional, List


class NetworkPositionResponse(BaseModel):
    product_id: int
    product: str
    unit: str
    dc_on_hand: int
    store_on_hand: int
    in_transit: int
    network_total: int
    network_value: float
    stores_stocking_it: int

    class Config:
        from_attributes = True