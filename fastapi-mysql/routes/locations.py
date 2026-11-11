from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import SessionLocal
from schemas.operations import LocationSummary
import crud

router = APIRouter(prefix="/locations", tags=["Locations"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=list[LocationSummary])
def list_locations(db: Session = Depends(get_db)):
    """DCs and stores with their current stock summary."""
    return crud.get_locations(db)
