# API ENDPOINTS TIME!!!

from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, Carrier
from crud import get_carrier, create_carrier

app = FastAPI()

# Create tables? (i can skip this step, tables already exist)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/carriers")
async def create_carrier_endpoint(name: str, code: str, contact_phone: str, db: Session = Depends(get_db)):
    return create_carrier(db, name, code, contact_phone)

@app.get("/carriers/{carrier_id}")
async def get_carrier_endpoint(carrier_id: int, db: Session = Depends(get_db)):
    carrier = get_carrier(db, carrier_id)
    if carrier is None:
        raise HTTPException(status_code=404, detail="Carrier not found")
    return carrier

@app.put("/carriers/{carrier_id}")
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

@app.delete("/carriers/{carrier_id}")
async def delete_carrier_endpoint(carrier_id: int, db: Session = Depends(get_db)):
    carrier = db.query(Carrier).filter(Carrier.carrier_id == carrier_id).first()
    if carrier is None:
        raise HTTPException(status_code=404, detail="Carrier not found")

    db.delete(carrier)
    db.commit()

    return {"detail": "Carrier deleted"}

