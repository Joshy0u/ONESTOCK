from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional

from database import SessionLocal
from schemas.analytics import (
    AgingStock,
    NetworkPositionResponse,
    ProductDemand,
    PurchaseBacklog,
    ReplenishmentRecommendations,
    StoreSellThrough,
    SupplierScorecard,
    SupplyRiskResponse,
    ThreeWayMatchResponse,
    TransferPipelineResponse,
)
from schemas.operations import ActivityItem, OverviewKpis
import crud

router = APIRouter(prefix="/analytics", tags=["Analytics & Reporting"])

# The seed data in the combined build is dated around late October 2026, so
# "today" for the date-sensitive reports defaults to that window. Callers can
# override it with ?as_of_date=YYYY-MM-DD.
DEFAULT_AS_OF_DATE = date(2026, 10, 28)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/network-position", response_model=list[NetworkPositionResponse])
def get_network_position(limit: int = 15, db: Session = Depends(get_db)):
    return crud.get_network_inventory_position(db, limit=limit)


@router.get("/replenishments", response_model=list[ReplenishmentRecommendations])
def get_replenishment_recommendations(
    as_of_date: Optional[date] = Query(default=DEFAULT_AS_OF_DATE),
    db: Session = Depends(get_db),
):
    return crud.get_replenishment_reccommendations(db, as_of_date=as_of_date)


@router.get("/aging-stock", response_model=list[AgingStock])
def get_aging_stock(
    as_of_date: Optional[date] = Query(default=DEFAULT_AS_OF_DATE),
    db: Session = Depends(get_db),
):
    return crud.get_aging_stock(db, as_of_date=as_of_date)


@router.get("/product-demand", response_model=list[ProductDemand])
def get_product_demand(db: Session = Depends(get_db)):
    return crud.get_product_demand(db)


@router.get("/purchase-backlog", response_model=list[PurchaseBacklog])
def get_purchase_backlog(
    as_of_date: Optional[date] = Query(default=DEFAULT_AS_OF_DATE),
    db: Session = Depends(get_db),
):
    return crud.get_backlog(db, as_of_date=as_of_date)


@router.get("/sell-through", response_model=list[StoreSellThrough])
def get_sell_through(db: Session = Depends(get_db)):
    return crud.get_sell_through(db)


@router.get("/supplier-scorecard", response_model=list[SupplierScorecard])
def get_supplier_scorecard(
    as_of_date: Optional[date] = Query(default=DEFAULT_AS_OF_DATE),
    db: Session = Depends(get_db),
):
    return crud.get_supplier_scorecard(db, as_of_date=as_of_date)


@router.get("/supply-risk", response_model=list[SupplyRiskResponse])
def get_supply_risk(db: Session = Depends(get_db)):
    return crud.get_supply_risk(db)


@router.get("/three-way-match", response_model=list[ThreeWayMatchResponse])
def get_three_way_match(db: Session = Depends(get_db)):
    return crud.get_three_way_match(db)


@router.get("/transfer-pipeline", response_model=list[TransferPipelineResponse])
def get_transfer_pipeline(
    as_of_date: Optional[date] = Query(default=DEFAULT_AS_OF_DATE),
    db: Session = Depends(get_db),
):
    return crud.get_transfer_pipeline(db, as_of_date=as_of_date)


@router.get("/overview", response_model=OverviewKpis)
def get_overview(db: Session = Depends(get_db)):
    return crud.get_overview_kpis(db)


@router.get("/recent-activity", response_model=list[ActivityItem])
def get_recent_activity(limit: int = Query(default=20, ge=1, le=200), db: Session = Depends(get_db)):
    return crud.get_recent_activity(db, limit=limit)
