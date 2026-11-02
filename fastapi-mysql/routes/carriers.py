from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from crud import get_carrier, create_carrier
from models import Carrier


router = APIRouter(
    prefix="/carriers",
    tags=["Carriers"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/")
async def create_carrier_endpoint(name: str, code: str, contact_phone: str, db: Session = Depends(get_db)):
    return create_carrier(db, name, code, contact_phone)

@router.get("/{carrier_id}")
async def get_carrier_endpoint(carrier_id: int, db: Session = Depends(get_db)):
    carrier = get_carrier(db, carrier_id)
    if carrier is None:
        raise HTTPException(status_code=404, detail="Carrier not found")
    return carrier

@router.put("/{carrier_id}")
async def update_carrier_endpoint(carrier_id: int, name: str, code: str, contact_phone: str, db: Session = Depends(get_db)):
    carrier = db.query(Carrier).filter(Carrier.carrier_id == carrier_id).first()
    if carrier is None:
        raise HTTPException(status_code=404, detail="Carrier not found")

    carrier.name = name
    carrier.code = code
    carrier.contact_phone = contact_phone
    db.commit()
    db.refresh(carrier)

    return carrier

@router.delete("/{carrier_id}")
async def delete_carrier_endpoint(carrier_id: int, db: Session = Depends(get_db)):
    carrier = db.query(Carrier).filter(Carrier.carrier_id == carrier_id).first()
    if carrier is None:
        raise HTTPException(status_code=404, detail="Carrier not found")

    db.delete(carrier)
    db.commit()

    return {"detail": "Carrier deleted"}