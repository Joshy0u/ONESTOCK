from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from database import get_db
import crud

router = APIRouter(prefix="/analytics", tags=["Analytics & Reporting"])

@router.get("/network-position", response_model=list)
def get_network_position(limit: int=15, db: Session = Depends(get_db)):
    return crud.get_network_inventory_position(db, limit=limit)

@router.get("/replenishments")
def get_replenishment_recommendations(
    as_of_date: Optional[date] = Query(default=date(2026,10,28)),
    db: Session = Depends(get_db)
):
    return crud.get_replenishment_reccommendations(db, as_of_date=as_of_date)