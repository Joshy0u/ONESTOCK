# API ENDPOINTS TIME!!!

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, Carrier, Product
from crud import get_carrier, create_carrier
from crud import get_products, get_product, create_product
from crud import get_product_by_name

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# BELOW ARE THE ENDPOINTS FOR THE PRODUCTS TABLE. 

@app.post("/products/")
async def create_product_endpoint(name: str, sku: str, uom_id: int, list_price: float = None, db: Session = Depends(get_db)):
    return create_product(db=db, name=name, sku=sku, uom_id=uom_id, list_price=list_price)

@app.get("/products/{product_id}")
async def get_product_endpoint(product_id: int, db: Session = Depends(get_db)):
    product = get_product(db, product_id=product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.get("/products/search")
async def search_products_endpoint(q: str, db: Session = Depends(get_db)):
    results = get_product_by_name(db, query=q)
    return results

@app.get("/products")
async def list_products_endpoint(db: Session = Depends(get_db)):
    return get_products(db)