from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from crud import get_products, get_product, create_product, get_product_by_name

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
async def list_all_products(db: Session = Depends(get_db)):
    return get_products(db)

@router.get("/search")
async def search_products(q: str, db: Session = Depends(get_db)):
    return get_product_by_name(db, query=q)

# Im not sure about the use of this route yet. 
@router.get("/{product_id}")
async def get_product_endpoint(product_id: int, db: Session = Depends(get_db)):
    product = get_product(db, product_id=product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/")
async def create_new_product(name: str, sku: str, uom_id: int, list_price: float = None, db: Session = Depends(get_db)):
    return create_product(db=db, name=name, sku=sku, uom_id=uom_id, list_price=list_price)
