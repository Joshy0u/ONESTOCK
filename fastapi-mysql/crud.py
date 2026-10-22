from sqlalchemy.orm import Session
from models import Carrier, Product

def get_carrier(db: Session, carrier_id: int):
    return db.query(Carrier).filter(Carrier.carrier_id == carrier_id).first()
    # db.query = SELECT*FROM TABLE (Item is the table object)
    # Filter is the WHERE part in the statement, matching the requested to the db.
    # first is the LIMIT function. (just returns the first result.)


def create_carrier(db: Session, name: str, code: str, contact_phone: str):
    db_carrier = Carrier(name=name, code=code, contact_phone=contact_phone)
    db.add(db_carrier)
    db.commit()
    db.refresh(db_carrier)
    return db_carrier

def get_product(db: Session, product_id: int):
    return db.query(Product).filter(Product.product_id == product_id).first()

def create_product(db: Session, name: str, sku: str, uom_id: int, list_price: float=None):
    db_product = Product(name=name, sku=sku, uom_id=uom_id, list_price=list_price)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product