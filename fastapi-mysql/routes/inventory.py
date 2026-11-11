from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import SessionLocal
from schemas.operations import InventoryPosition
import crud

router = APIRouter(prefix="/inventory", tags=["Inventory"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=list[InventoryPosition])
def list_inventory_positions(db: Session = Depends(get_db)):
    """Every product x location stock position with its derived status."""
    return crud.get_inventory_positions(db)
